import AnalysisForm from "@/components/AnalysisForm";
import RecentReports from "@/components/RecentReports";
import ProBanner from "@/components/ProBanner";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="text-center mb-12 max-w-2xl animate-fade-in">
          {/* Logo/Brand */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center loading-glow">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
              GrokXBoost
            </h1>
          </div>

          {/* Tagline */}
          <p className="text-xl md:text-2xl text-gray-200 mb-4 font-medium">
            AI-Powered X/Twitter Growth Analytics
          </p>

          {/* Description */}
          <p className="text-gray-400 max-w-lg mx-auto leading-relaxed">
            Get instant insights for any X account. Discover what&apos;s working,
            what needs improvement, and actionable strategies to grow your presence.
          </p>
        </div>

        {/* Features Pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-10 animate-fade-in stagger-1">
          <FeaturePill icon={<SearchIcon />} text="Profile Analysis" highlight />
          <FeaturePill icon={<ChartIcon />} text="Engagement Metrics" />
          <FeaturePill icon={<LightbulbIcon />} text="Content Ideas" />
          <FeaturePill icon={<TrendingIcon />} text="Growth Strategies" />
        </div>

        {/* Analysis Form */}
        <div className="w-full max-w-md animate-slide-up">
          <AnalysisForm />
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 text-center animate-fade-in stagger-2">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500 mb-6">
            <div className="flex items-center gap-2">
              <CheckCircleIcon />
              <span>No login required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircleIcon />
              <span>5 free reports/day</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircleIcon />
              <span>Results in seconds</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-gray-500">
            <span>Powered by</span>
            <a
              href="https://x.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-gray-300 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span className="font-medium">Grok AI</span>
            </a>
          </div>
        </div>

        {/* Recent Reports */}
        <RecentReports />

        {/* Pro Banner with Waitlist */}
        <div className="mt-16 w-full animate-fade-in stagger-3">
          <ProBanner />
        </div>
      </div>
    </div>
  );
}

interface FeaturePillProps {
  icon: React.ReactNode;
  text: string;
  highlight?: boolean;
}

function FeaturePill({ icon, text, highlight }: FeaturePillProps) {
  return (
    <div className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-all duration-200 ${
      highlight
        ? "bg-blue-500/20 border border-blue-500/40 text-blue-300"
        : "bg-gray-900 border border-gray-800 text-gray-300 hover:border-gray-700"
    }`}>
      <span className={highlight ? "text-blue-400" : "text-gray-500"}>{icon}</span>
      <span>{text}</span>
    </div>
  );
}

// Icons
function SearchIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function LightbulbIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
}

function TrendingIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
