"""
GrokXBoost Real-Time Analysis Service

Uses the official xAI SDK for reliable real-time X/Twitter data analysis.
The SDK handles the full agent loop internally and ensures tool results
are properly incorporated into the final synthesis.
"""

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from xai_sdk import Client
from xai_sdk.tools import x_search, web_search

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


# Initialize xAI client at module level
xai_client = None

def get_xai_client():
    """Get or create the xAI client."""
    global xai_client
    if xai_client is None:
        api_key = os.getenv("XAI_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="XAI_API_KEY not configured")
        xai_client = Client(api_key=api_key)
    return xai_client


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest):
    """
    Analyze an X account using xAI SDK with real-time tools.
    The SDK handles the full agent loop and ensures tool results
    are properly incorporated into the final synthesis.
    """
    try:
        client = get_xai_client()

        prompt = build_prompt(
            request.handle,
            request.analysis_type,
            request.competitor_handle
        )

        # Create chat with real-time tools
        # x_search() handles user profiles, keyword searches, threads, etc. internally
        chat = client.chat.create(
            model=XAI_MODEL,
            tools=[x_search(), web_search()],
        )

        # Add messages using SDK's append method
        chat.append({"role": "system", "content": SYSTEM_PROMPT})
        chat.append({"role": "user", "content": prompt})

        # SDK handles the full agent loop internally and returns final text
        # with tool results properly incorporated
        response = chat.sample()

        if response.content:
            return AnalyzeResponse(success=True, content=response.content)
        else:
            return AnalyzeResponse(
                success=False,
                error="Analysis completed but no content returned. Please try again."
            )

    except Exception as e:
        print(f"Analysis error: {e}")
        return AnalyzeResponse(success=False, error=f"Analysis failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
