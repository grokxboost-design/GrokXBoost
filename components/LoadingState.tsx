"use client";

interface LoadingStateProps {
  handle: string;
}

export default function LoadingState({ handle }: LoadingStateProps) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header Skeleton */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">
          Analyzing @{handle}
        </h1>
        <p className="text-gray-400">
          Grok is searching X for real-time insights...
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="flex justify-center mb-8">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-gray-700 border-t-blue-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl">🔍</span>
          </div>
        </div>
      </div>

      {/* Steps Progress */}
      <div className="space-y-4 mb-8">
        <ProgressStep
          step={1}
          label="Searching recent posts"
          status="complete"
        />
        <ProgressStep
          step={2}
          label="Analyzing engagement patterns"
          status="active"
        />
        <ProgressStep
          step={3}
          label="Identifying growth opportunities"
          status="pending"
        />
        <ProgressStep
          step={4}
          label="Generating recommendations"
          status="pending"
        />
      </div>

      {/* Skeleton Content */}
      <div className="space-y-6">
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="skeleton h-6 w-48 rounded mb-4" />
          <div className="space-y-2">
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-5/6 rounded" />
            <div className="skeleton h-4 w-4/6 rounded" />
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="skeleton h-6 w-40 rounded mb-4" />
          <div className="space-y-2">
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-3/4 rounded" />
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="skeleton h-6 w-52 rounded mb-4" />
          <div className="space-y-2">
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-5/6 rounded" />
            <div className="skeleton h-4 w-2/3 rounded" />
          </div>
        </div>
      </div>

      {/* Estimated Time */}
      <p className="text-center text-sm text-gray-500 mt-8">
        Estimated time: 15-30 seconds
      </p>
    </div>
  );
}

interface ProgressStepProps {
  step: number;
  label: string;
  status: "complete" | "active" | "pending";
}

function ProgressStep({ step, label, status }: ProgressStepProps) {
  return (
    <div className="flex items-center gap-4">
      <div
        className={`
        w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
        ${status === "complete" ? "bg-green-500 text-white" : ""}
        ${status === "active" ? "bg-blue-500 text-white loading-glow" : ""}
        ${status === "pending" ? "bg-gray-700 text-gray-400" : ""}
      `}
      >
        {status === "complete" ? (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        ) : (
          step
        )}
      </div>
      <span
        className={`
        ${status === "complete" ? "text-green-400" : ""}
        ${status === "active" ? "text-white" : ""}
        ${status === "pending" ? "text-gray-500" : ""}
      `}
      >
        {label}
        {status === "active" && (
          <span className="ml-2 inline-flex">
            <span className="animate-pulse">.</span>
            <span className="animate-pulse animation-delay-200">.</span>
            <span className="animate-pulse animation-delay-400">.</span>
          </span>
        )}
      </span>
    </div>
  );
}
