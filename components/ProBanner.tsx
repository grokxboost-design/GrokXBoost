import WaitlistForm from "./WaitlistForm";

interface ProBannerProps {
  variant?: "full" | "compact";
  showWaitlist?: boolean;
}

export default function ProBanner({ variant = "full", showWaitlist = true }: ProBannerProps) {
  if (variant === "compact") {
    return (
      <div className="text-center p-4 bg-gradient-to-r from-purple-900/20 to-pink-900/20
                    border border-purple-500/20 rounded-xl">
        <p className="text-sm text-gray-300">
          <span className="text-green-400 font-medium">Free forever</span>
          <span className="text-gray-500 mx-2">|</span>
          <span className="text-purple-400 font-medium">Pro: </span>
          <span className="text-gray-400">Unlimited + Private Reports + PDF Export</span>
          <span className="text-gray-500 mx-2">|</span>
          <span className="text-pink-400 font-medium">$19/mo</span>
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30
                    border border-purple-500/30 rounded-2xl p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          <span className="text-purple-300 font-semibold">GrokXBoost Pro</span>
        </div>

        <p className="text-gray-300 mb-4">
          <span className="text-green-400 font-medium">Free (5 reports/day)</span>
          <span className="text-gray-600 mx-2">&bull;</span>
          <span className="text-purple-300">Pro: Unlimited + Private Reports + PDF Export</span>
          <span className="text-gray-600 mx-2">&bull;</span>
          <span className="text-pink-400 font-medium">$19/mo</span>
        </p>

        {showWaitlist && (
          <div className="mt-4">
            <p className="text-sm text-gray-400 mb-3">Join the waitlist for early access & launch discount</p>
            <WaitlistForm />
          </div>
        )}
      </div>
    </div>
  );
}
