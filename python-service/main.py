"""
GrokXBoost Real-Time Analysis Service

A lightweight FastAPI service that uses xAI Python SDK with x_search tool
for real-time X/Twitter data analysis.

Deploy to Render.com (free tier) or Fly.io
"""

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI

app = FastAPI(title="GrokXBoost Analysis Service")

# CORS for Vercel frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://grok-x-boost.vercel.app",
        "https://*.vercel.app",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# xAI client (OpenAI-compatible)
client = OpenAI(
    api_key=os.getenv("XAI_API_KEY"),
    base_url="https://api.x.ai/v1",
)

SYSTEM_PROMPT = """You are an expert X/Twitter growth strategist and analytics specialist.
You have access to real-time X search to analyze accounts.

When analyzing an account:
1. ALWAYS use x_search to get recent posts and engagement data
2. Look at posting patterns, content themes, engagement rates
3. Identify what's working and what needs improvement
4. Provide specific, actionable recommendations

Format your response in clean markdown with clear sections:
- Executive Summary
- Profile Analysis
- Content Performance
- Engagement Insights
- Growth Opportunities
- 30-Day Action Plan

Be specific with numbers and examples from their actual posts."""


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
        "full-growth-audit": f"""Perform a comprehensive growth audit for X account @{handle}.

Search for their recent posts, analyze engagement patterns, and provide:
1. Profile optimization recommendations
2. Content strategy analysis
3. Engagement rate assessment
4. Audience growth opportunities
5. Specific 30-day action plan with weekly goals""",

        "content-strategy": f"""Analyze the content strategy of X account @{handle}.

Search for their recent posts and analyze:
1. Content themes and topics
2. Post formats that perform best
3. Posting frequency and timing
4. Hashtag and keyword usage
5. Recommendations for content improvement""",

        "engagement-analysis": f"""Deep dive into engagement metrics for X account @{handle}.

Search for their posts and analyze:
1. Average engagement rates
2. Top performing posts and why
3. Reply and conversation patterns
4. Audience interaction quality
5. Strategies to boost engagement""",

        "competitor-comparison": f"""Compare X accounts @{handle} and @{competitor_handle or 'competitor'}.

Search for recent posts from both accounts and compare:
1. Content strategies
2. Engagement rates
3. Posting patterns
4. Audience response
5. What @{handle} can learn from the comparison""",
    }
    return prompts.get(analysis_type, prompts["full-growth-audit"])


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok", "service": "grokxboost-analysis"}


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest):
    """
    Analyze an X account using real-time search.

    Uses xAI's grok-3 model with x_search tool for live data.
    """
    if not os.getenv("XAI_API_KEY"):
        raise HTTPException(status_code=500, detail="XAI_API_KEY not configured")

    try:
        prompt = build_prompt(
            request.handle,
            request.analysis_type,
            request.competitor_handle
        )

        # Call xAI with search tools enabled
        response = client.chat.completions.create(
            model="grok-3-fast",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            tools=[
                {
                    "type": "function",
                    "function": {
                        "name": "x_search",
                        "description": "Search X/Twitter for posts, profiles, and engagement data",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "query": {
                                    "type": "string",
                                    "description": "Search query (e.g., 'from:username', hashtags, keywords)"
                                }
                            },
                            "required": ["query"]
                        }
                    }
                }
            ],
            tool_choice="auto",
            max_tokens=4096,
        )

        content = response.choices[0].message.content

        if not content:
            return AnalyzeResponse(
                success=False,
                error="No analysis generated. Please try again."
            )

        return AnalyzeResponse(success=True, content=content)

    except Exception as e:
        return AnalyzeResponse(
            success=False,
            error=f"Analysis failed: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
