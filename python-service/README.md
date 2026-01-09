# GrokXBoost Real-Time Analysis Service

FastAPI service that provides real-time X/Twitter analysis using xAI's search tools.

## Deploy to Render (Free Tier)

1. Go to [render.com](https://render.com) and sign up
2. Click **New** → **Web Service**
3. Connect your GitHub repo
4. Set **Root Directory** to `python-service`
5. Render will auto-detect Python and use `render.yaml`
6. Add environment variable:
   - `XAI_API_KEY` = your xAI API key
7. Click **Deploy**

Your service URL will be: `https://grokxboost-api.onrender.com`

## Local Development

```bash
cd python-service
pip install -r requirements.txt
export XAI_API_KEY=your_key
uvicorn main:app --reload
```

## API Endpoints

### Health Check
```
GET /health
```

### Analyze Account
```
POST /analyze
Content-Type: application/json

{
  "handle": "elonmusk",
  "analysis_type": "full-growth-audit",
  "competitor_handle": null
}
```

## Analysis Types

- `full-growth-audit` - Complete account analysis
- `content-strategy` - Content and posting analysis
- `engagement-analysis` - Deep engagement metrics
- `competitor-comparison` - Compare two accounts
