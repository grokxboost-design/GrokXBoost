"""
GrokXBoost Real-Time Analysis Service

Uses the official xAI SDK for reliable real-time X/Twitter data analysis.
The SDK handles the full agent loop internally and returns final text.
"""

import os
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


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest):
    """
    Analyze an X account using xAI SDK with real-time tools.
    """
    api_key = os.getenv("XAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="XAI_API_KEY not configured")

    prompt = build_prompt(
        request.handle,
        request.analysis_type,
        request.competitor_handle
    )

    # Try SDK first, fall back to httpx
    try:
        from xai_sdk import Client
        from xai_sdk.tools import x_search, web_search

        client = Client(api_key=api_key)

        # Create chat with tools
        chat = client.chat.create(
            model=XAI_MODEL,
            tools=[x_search(), web_search()],
        )

        # Add messages using SDK's expected format
        chat.add_system_message(SYSTEM_PROMPT)
        chat.add_user_message(prompt)

        # SDK handles the full agent loop and returns final text
        response = chat.sample()

        if response.content:
            return AnalyzeResponse(success=True, content=response.content)
        else:
            return AnalyzeResponse(success=False, error="SDK returned no content")

    except ImportError:
        print("xai-sdk not available, using httpx fallback")
        return await analyze_with_httpx(request, api_key, prompt)
    except AttributeError as e:
        # SDK API might be different, try alternative methods
        print(f"SDK method error: {e}, trying alternative")
        return await analyze_with_sdk_alt(request, api_key, prompt)
    except Exception as e:
        print(f"SDK error: {e}, using httpx fallback")
        return await analyze_with_httpx(request, api_key, prompt)


async def analyze_with_sdk_alt(request: AnalyzeRequest, api_key: str, prompt: str) -> AnalyzeResponse:
    """Try alternative SDK methods."""
    try:
        from xai_sdk import Client

        client = Client(api_key=api_key)

        # Try different SDK interface patterns
        response = client.chat.completions.create(
            model=XAI_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            tools=[
                {"type": "x_search"},
                {"type": "web_search"}
            ],
            tool_choice="auto"
        )

        content = response.choices[0].message.content if response.choices else None
        if content:
            return AnalyzeResponse(success=True, content=content)
        else:
            return await analyze_with_httpx(request, api_key, prompt)

    except Exception as e:
        print(f"SDK alt error: {e}")
        return await analyze_with_httpx(request, api_key, prompt)


async def analyze_with_httpx(request: AnalyzeRequest, api_key: str, prompt: str) -> AnalyzeResponse:
    """Fallback to httpx without real-time tools."""
    import httpx

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            # Simple request without tools - just use model's knowledge
            response = await client.post(
                "https://api.x.ai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": XAI_MODEL,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": prompt}
                    ],
                    "max_tokens": 4096
                },
            )

        if response.status_code != 200:
            return AnalyzeResponse(
                success=False,
                error=f"API error ({response.status_code}): {response.text[:300]}"
            )

        data = response.json()
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "")

        if content:
            return AnalyzeResponse(success=True, content=content)
        else:
            return AnalyzeResponse(success=False, error="No content in response")

    except Exception as e:
        return AnalyzeResponse(success=False, error=f"Request failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
