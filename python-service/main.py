"""
GrokXBoost Real-Time Analysis Service

A lightweight FastAPI service that calls xAI API with search tools
for real-time X/Twitter data analysis.

Uses httpx directly to avoid openai SDK compatibility issues.
"""

import os
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

XAI_API_URL = "https://api.x.ai/v1/responses"
XAI_MODEL = "grok-4-1-fast-reasoning"

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


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok", "service": "grokxboost-analysis"}


def extract_text_content(data: dict) -> str:
    """Ultra-robust extraction with debug logging for empty cases."""
    content_parts = []

    # Helper to safely get string value
    def safe_string(val) -> str:
        if isinstance(val, str):
            return val.strip()
        return ""

    # Known direct fields (check multiple possible locations)
    for field in ["output_text", "text", "response", "message", "content", "reasoning", "result", "answer"]:
        if data.get(field):
            text = safe_string(data[field])
            if text:
                content_parts.append(text)

    # Check reasoning object (might have content inside)
    if "reasoning" in data and isinstance(data["reasoning"], dict):
        reasoning = data["reasoning"]
        for rfield in ["content", "text", "summary"]:
            if reasoning.get(rfield):
                text = safe_string(reasoning[rfield])
                if text:
                    content_parts.append(text)

    # Deep dive into output array (most common)
    if "output" in data and isinstance(data["output"], list):
        for item in data["output"]:
            # Handle string items directly
            if isinstance(item, str):
                content_parts.append(safe_string(item))
                continue

            if not isinstance(item, dict):
                continue

            # Direct text item
            if item.get("type") == "text":
                text = safe_string(item.get("text", ""))
                if text:
                    content_parts.append(text)

            # Reasoning type
            if item.get("type") == "reasoning":
                for rfield in ["content", "text", "summary"]:
                    if item.get(rfield):
                        text = safe_string(item[rfield])
                        if text:
                            content_parts.append(text)

            # Message format (assistant role)
            if item.get("type") == "message" and item.get("role") == "assistant":
                item_content = item.get("content", [])
                if isinstance(item_content, list):
                    for block in item_content:
                        if isinstance(block, dict) and block.get("type") == "text":
                            text = safe_string(block.get("text", ""))
                            if text:
                                content_parts.append(text)
                elif isinstance(item_content, str):
                    content_parts.append(safe_string(item_content))

    final = "\n\n".join(filter(None, content_parts))

    # Debug log if empty (helps diagnose issues)
    if not final:
        import json
        print("DEBUG: No text extracted. Raw keys:", list(data.keys()))
        print("DEBUG: Full response:", json.dumps(data, default=str)[:2000])

    return final


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest):
    """
    Analyze an X account using xAI Grok API with agent loop.
    """
    import asyncio

    api_key = os.getenv("XAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="XAI_API_KEY not configured")

    try:
        prompt = build_prompt(
            request.handle,
            request.analysis_type,
            request.competitor_handle
        )

        current_response_id = None
        final_content = ""
        max_attempts = 15

        async with httpx.AsyncClient(timeout=120.0) as client:
            for attempt in range(max_attempts):
                # Build request body - only include input on first request
                request_body = {
                    "model": XAI_MODEL,
                    "tools": [
                        {"type": "x_search"},
                        {"type": "web_search"}
                    ],
                    "tool_choice": "auto"
                }

                # First request: include input messages
                # Subsequent requests: only include previous_response_id
                if current_response_id:
                    request_body["previous_response_id"] = current_response_id
                else:
                    request_body["input"] = [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": prompt},
                    ]

                response = await client.post(
                    XAI_API_URL,
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    json=request_body,
                )

                if response.status_code != 200:
                    error_detail = response.text[:500] if response.text else "No details"
                    return AnalyzeResponse(
                        success=False,
                        error=f"API error ({response.status_code}): {error_detail}"
                    )

                data = response.json()

                # Update response ID for next iteration
                current_response_id = data.get("id")

                # Try to extract text content
                final_content = extract_text_content(data)

                # If we have content, we're done
                if final_content.strip():
                    break

                # If tools completed but no text, force a final synthesis
                if data.get("status") == "completed" or attempt >= 2:
                    # Add a final prompt to force text output
                    synthesis_body = {
                        "model": XAI_MODEL,
                        "input": [
                            {"role": "user", "content": "Using all the tool results and data fetched, provide the complete X/Twitter growth analysis now in the structured format: Account Snapshot, What's Working, Growth Opportunities, Content Ideas, 30-Day Action Plan. Be specific with examples from the actual posts."}
                        ],
                        "previous_response_id": current_response_id,
                        "tools": [],
                        "tool_choice": "none"
                    }

                    synthesis_response = await client.post(
                        XAI_API_URL,
                        headers={
                            "Authorization": f"Bearer {api_key}",
                            "Content-Type": "application/json",
                        },
                        json=synthesis_body,
                    )

                    if synthesis_response.status_code == 200:
                        synthesis_data = synthesis_response.json()
                        final_content = extract_text_content(synthesis_data)
                        if final_content.strip():
                            break

                    # If still no content after synthesis, return error with debug
                    if not final_content.strip():
                        import json
                        debug_info = json.dumps(data, default=str)[:800]
                        return AnalyzeResponse(
                            success=False,
                            error=f"No text after synthesis. Response: {debug_info}"
                        )

                # Small delay before next iteration
                await asyncio.sleep(0.5)

        if not final_content:
            return AnalyzeResponse(
                success=False,
                error=f"Agent did not produce final output after {max_attempts} attempts."
            )

        return AnalyzeResponse(success=True, content=final_content)

    except httpx.TimeoutException:
        return AnalyzeResponse(
            success=False,
            error="Analysis timed out. Please try again."
        )
    except Exception as e:
        return AnalyzeResponse(
            success=False,
            error=f"Analysis failed: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
