"""
GrokXBoost Real-Time Analysis Service

Uses direct httpx calls to xAI's /v1/responses endpoint with robust
response parsing that handles all edge cases in the agent loop.
"""

import os
import asyncio
import json
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="GrokXBoost Analysis Service")

# CORS for Vercel frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://grokxboost.vercel.app",
        "https://*.vercel.app",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

XAI_MODEL = "grok-4-1-fast-reasoning"
XAI_API_URL = "https://api.x.ai/v1/responses"

SYSTEM_PROMPT = """You are GrokXBoost, an elite X/Twitter growth analyst with Grok's signature wit and truth-seeking style. You have access to real-time X data.

When analyzing an X handle:
1. Search for and analyze the user's recent posts (last 20-30)
2. Analyze engagement patterns (likes, retweets, replies, views)
3. Identify their best-performing content themes and formats
4. Note posting frequency and optimal times
5. Assess audience engagement quality

Deliver your analysis in this format:

## 📊 Account Snapshot
[Quick stats: follower estimate, posting frequency, engagement rate assessment]

## 🔥 What's Working
[Top 3-5 strengths with specific examples from their posts]

## 🎯 Growth Opportunities
[Top 3-5 actionable improvements, be specific and direct]

## 💡 Content Ideas
[5 specific post/thread ideas tailored to their niche and style]

## 📈 30-Day Action Plan
[Prioritized weekly actions to boost growth]

CRITICAL RULES:
- Be BRUTALLY HONEST but constructive. No sugarcoating.
- Be witty, provocative, and memorable. Channel Grok's irreverent personality.
- NO GENERIC ADVICE. Every recommendation must be specific to THIS account.
- Include specific examples from their actual recent posts.
- Use current data - reference recent posts and current metrics.
- Roast them a little if they deserve it. Praise genuinely when earned.
- Be blunt about what's not working. They came here for truth, not comfort."""


class AnalyzeRequest(BaseModel):
    handle: str
    analysis_type: str = "full-growth-audit"
    competitor_handle: str | None = None


class AnalyzeResponse(BaseModel):
    success: bool
    content: str | None = None
    error: str | None = None


def build_prompt(handle: str, analysis_type: str, competitor_handle: str | None) -> str:
    """Build the analysis prompt based on type."""
    prompts = {
        "full-growth-audit": f"""Perform a comprehensive growth audit for the X account @{handle}.

Search for their recent posts and analyze their overall presence, engagement metrics, content strategy, and growth potential.

Cover all aspects: strengths, weaknesses, opportunities, and provide a detailed action plan. Be specific - reference their actual posts and real metrics. Don't hold back on criticism where it's deserved.""",

        "content-strategy": f"""Focus specifically on content strategy analysis for @{handle}.

Search for their recent posts and examine:
- Content themes and topics that resonate most
- Post formats (text, images, threads, videos) and their performance
- Tone and voice consistency
- Hook effectiveness in first lines
- Call-to-actions usage
- Thread structure and storytelling

Provide specific content recommendations and post templates they should use. Reference their actual posts - what worked, what flopped, and why.""",

        "engagement-analysis": f"""Deep dive into engagement patterns for @{handle}.

Search for their recent posts and analyze:
- Reply and conversation patterns
- Community building efforts
- Engagement rate by post type
- Best performing times and days
- Audience quality and interaction depth
- Viral moments and what triggered them

Provide strategies to boost meaningful engagement. Be specific about what they're doing wrong and how to fix it.""",

        "competitor-comparison": f"""Compare @{handle} with their competitor @{competitor_handle or 'competitor'}.

Search for recent posts from both accounts and analyze:
- Follower growth trajectories
- Content strategy differences
- Engagement rate comparisons
- Unique strengths of each account
- What @{handle} can learn from @{competitor_handle or 'competitor'}
- Gaps and opportunities @{handle} can exploit

Be brutally honest about where @{handle} is losing and winning. Specific examples from both accounts required.""",
    }
    return prompts.get(analysis_type, prompts["full-growth-audit"])


def extract_text_content(data: dict) -> str:
    """
    Robustly extract text content from xAI response.
    Handles all response formats and gracefully skips unknown types.
    """
    content_parts = []

    def safe_string(val) -> str:
        if isinstance(val, str):
            return val.strip()
        return ""

    # Direct text fields
    for field in ["output_text", "text"]:
        if data.get(field):
            content_parts.append(safe_string(data[field]))

    # Output array - ONLY process known safe types
    if "output" in data and isinstance(data["output"], list):
        for item in data["output"]:
            if not isinstance(item, dict):
                # Fallback: if item is pure string (rare but possible)
                if isinstance(item, str):
                    content_parts.append(safe_string(item))
                continue

            item_type = item.get("type")

            # Explicitly skip all tool-related types
            if item_type in ["custom_tool_call", "tool_call", "function_call", "tool", "x_search_call", "web_search_call"]:
                continue

            # Known good: text block
            if item_type == "text":
                text = safe_string(item.get("text", ""))
                if text:
                    content_parts.append(text)

            # Known good: assistant message
            if item_type == "message" and item.get("role") == "assistant":
                content = item.get("content", [])
                if isinstance(content, list):
                    for block in content:
                        if isinstance(block, dict) and block.get("type") == "text":
                            text = safe_string(block.get("text", ""))
                            if text:
                                content_parts.append(text)
                elif isinstance(content, str):
                    content_parts.append(safe_string(content))

    return "\n\n".join([p for p in content_parts if p])


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok", "service": "grokxboost-analysis"}


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest):
    """
    Analyze an X account using xAI's /v1/responses endpoint.
    Implements robust agent loop with proper response parsing.
    """
    api_key = os.getenv("XAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="XAI_API_KEY not configured")

    prompt = build_prompt(
        request.handle,
        request.analysis_type,
        request.competitor_handle
    )

    # Initial request with tools
    payload = {
        "model": XAI_MODEL,
        "instructions": SYSTEM_PROMPT,
        "input": prompt,
        "tools": [
            {"type": "x_search"},
            {"type": "web_search"}
        ]
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    max_iterations = 20
    previous_response_id = None
    tool_types = {"custom_tool_call", "tool_call", "function_call", "tool", "x_search_call", "web_search_call"}

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            for iteration in range(max_iterations):
                print(f"[Iteration {iteration + 1}] Calling xAI API...")

                # For continuation, use previous_response_id
                if previous_response_id:
                    payload = {
                        "model": XAI_MODEL,
                        "previous_response_id": previous_response_id
                    }

                response = await client.post(XAI_API_URL, headers=headers, json=payload)

                if response.status_code != 200:
                    error_text = response.text
                    print(f"[Error] API returned {response.status_code}: {error_text}")
                    return AnalyzeResponse(
                        success=False,
                        error=f"API error ({response.status_code}): {error_text[:200]}"
                    )

                data = response.json()
                previous_response_id = data.get("id")

                # Debug: log response structure
                print(f"[Iteration {iteration + 1}] Status: {data.get('status')}, Output items: {len(data.get('output', []))}")

                # Try to extract text content
                final_content = extract_text_content(data)
                if final_content.strip():
                    print(f"[Success] Extracted {len(final_content)} chars of content")
                    return AnalyzeResponse(success=True, content=final_content)

                # Check if response contains ONLY tool calls (intermediate state)
                output_items = data.get("output", [])
                if output_items and all(
                    isinstance(item, dict) and item.get("type") in tool_types
                    for item in output_items
                ):
                    print(f"[Iteration {iteration + 1}] Tool-only response, continuing...")
                    await asyncio.sleep(0.5)
                    continue

                # Check status for completion
                status = data.get("status")
                if status == "completed":
                    # Completed but no text - try synthesis prompt
                    print("[Warning] Completed but no text content, requesting synthesis...")
                    payload = {
                        "model": XAI_MODEL,
                        "previous_response_id": previous_response_id,
                        "input": "Based on all the data you gathered, provide your complete analysis now."
                    }
                    continue

                if status == "failed":
                    error_msg = data.get("error", {}).get("message", "Unknown error")
                    return AnalyzeResponse(success=False, error=f"Analysis failed: {error_msg}")

                if status in ["in_progress", "queued"]:
                    print(f"[Iteration {iteration + 1}] Status: {status}, waiting...")
                    await asyncio.sleep(1.0)
                    continue

                # Unknown status or empty output - continue loop
                await asyncio.sleep(0.5)

            # Max iterations reached
            return AnalyzeResponse(
                success=False,
                error="Analysis timed out after maximum iterations. Please try again."
            )

    except httpx.TimeoutException:
        return AnalyzeResponse(success=False, error="Request timed out. Please try again.")
    except Exception as e:
        print(f"[Error] Unexpected exception: {e}")
        return AnalyzeResponse(success=False, error=f"Analysis failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
