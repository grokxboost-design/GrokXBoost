import AnalysisForm from "@/components/AnalysisForm";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-12 max-w-2xl">
        {/* Logo/Brand */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="text-4xl">⚡</div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            GrokXBoost
          </h1>
        </div>

        {/* Tagline */}
        <p className="text-xl md:text-2xl text-gray-300 mb-4">
          Real-time X/Twitter Growth Analytics
        </p>

        {/* Description */}
        <p className="text-gray-500 max-w-md mx-auto">
          Get instant AI-powered insights for any X account. Powered by Grok&apos;s
          real-time search and analysis.
        </p>
      </div>

      {/* Features Pills */}
      <div className="flex flex-wrap justify-center gap-3 mb-10">
        <FeaturePill icon="🔍" text="Real-time X Search" />
        <FeaturePill icon="📊" text="Engagement Analysis" />
        <FeaturePill icon="💡" text="Content Ideas" />
        <FeaturePill icon="📈" text="Action Plans" />
      </div>

      {/* Analysis Form */}
      <AnalysisForm />

      {/* Trust Indicators */}
      <div className="mt-12 text-center">
        <p className="text-gray-500 text-sm mb-4">
          No login required • Free to use • Results in seconds
        </p>
        <div className="flex items-center justify-center gap-2 text-gray-600">
          <span>Powered by</span>
          <a
            href="https://x.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-400 hover:underline"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Grok
          </a>
        </div>
      </div>
    </div>
  );
}

function FeaturePill({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-full px-4 py-2 text-sm text-gray-300">
      <span>{icon}</span>
      <span>{text}</span>
    </div>
  );
}
