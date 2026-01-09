# GrokXBoost

Real-time X/Twitter growth analytics powered by Grok's agentic capabilities.

## Features

- **Full Growth Audit**: Comprehensive analysis of your X presence, engagement, and growth potential
- **Content Strategy**: Deep dive into what content performs best and recommendations
- **Engagement Analysis**: Analyze reply patterns, community building, and interaction quality
- **Competitor Comparison**: Compare your account with a competitor's strategy

## Tech Stack

- Next.js 14 with App Router
- TypeScript (strict mode)
- Tailwind CSS
- Server Actions for API calls
- xAI Grok API with x_search tool

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- xAI API key from [console.x.ai](https://console.x.ai)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd GrokXBoost
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Add your xAI API key to `.env`:
```
XAI_API_KEY=your_xai_api_key_here
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `XAI_API_KEY` | Your xAI API key from console.x.ai | Yes |

## Project Structure

```
/app
  /page.tsx              # Landing page with input form
  /report/[handle]/page.tsx  # Report display page
  /actions/analyze.ts    # Server action for Grok API calls
/components
  /AnalysisForm.tsx      # Handle input + analysis type selector
  /ReportDisplay.tsx     # Formatted markdown report renderer
  /LoadingState.tsx      # Skeleton/spinner during analysis
/lib
  /grok.ts               # Grok API client wrapper
  /prompts.ts            # System prompts for different analysis types
  /types.ts              # TypeScript interfaces
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project on [Vercel](https://vercel.com)
3. Add `XAI_API_KEY` to environment variables
4. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

## How It Works

1. User enters an X handle and selects an analysis type
2. Server action calls the Grok API with x_search tool enabled
3. Grok searches real-time X data for the user's posts and engagement
4. Analysis is rendered as a formatted markdown report
5. Users can share their insights on X

## API Usage

The app uses the xAI chat completions endpoint with agentic tools:

```typescript
const response = await fetch('https://api.x.ai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'grok-4-1-fast',
    messages: [...],
    tools: [{
      type: 'x_search',
      x_search: { enabled: true }
    }]
  })
});
```

## License

MIT
