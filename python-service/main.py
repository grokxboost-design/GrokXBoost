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

XAI_API_URL = "https://api.x.ai/v1/chat/completions"
XAI_MODEL = "grok-3-fast"

SYSTEM_PROMPT = """You are an expert X/Twitter growth strategist and analytics specialist.

When analyzing an account:
1. Look at posting patterns, content themes, engagement rates
2. Identify what's working and what needs improvement
3. Provide specific, actionable recommendations

Format your response in clean markdown with clear sections:
- Executive Summary
- Profile Analysis
- Content Performance
- Engagement Insights
- Growth Opportunities
- 30-Day Action Plan

Be specific with examples and actionable advice."""


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

Analyze and provide:
1. Profile optimization recommendations
2. Content strategy analysis
3. Engagement rate assessment
4. Audience growth opportunities
5. Specific 30-day action plan with weekly goals""",

        "content-strategy": f"""Analyze the content strategy of X account @{handle}.

Analyze:
1. Content themes and topics that would work best
2. Post formats that perform best on X
3. Optimal posting frequency and timing
4. Hashtag and keyword strategy
5. Recommendations for content improvement""",

        "engagement-analysis": f"""Deep dive into engagement optimization for X account @{handle}.

Analyze:
1. Engagement rate optimization strategies
2. Types of posts that drive engagement
3. Reply and conversation strategies
4. Audience interaction techniques
5. Strategies to boost engagement""",

        "competitor-comparison": f"""Compare X accounts @{handle} and @{competitor_handle or 'competitor'}.

Compare:
1. Content strategies
2. Engagement approaches
3. Posting patterns
4. Audience engagement tactics
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
    Analyze an X account using xAI Grok API.
    """
    api_key = os.getenv("XAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="XAI_API_KEY not configured")

    try:
        prompt = build_prompt(
            request.handle,
            request.analysis_type,
            request.competitor_handle
        )

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                XAI_API_URL,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": XAI_MODEL,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": prompt},
                    ],
                    "max_tokens": 4096,
                },
            )

        if response.status_code != 200:
            return AnalyzeResponse(
                success=False,
                error=f"API error: {response.status_code}"
            )

        data = response.json()
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "")

        if not content:
            return AnalyzeResponse(
                success=False,
                error="No analysis generated. Please try again."
            )

        return AnalyzeResponse(success=True, content=content)

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
