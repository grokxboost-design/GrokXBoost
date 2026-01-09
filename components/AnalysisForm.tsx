"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnalysisType, ANALYSIS_TYPE_LABELS } from "@/lib/types";
import { analyzeHandle } from "@/app/actions/analyze";

export default function AnalysisForm() {
  const router = useRouter();
  const [handle, setHandle] = useState("");
  const [competitorHandle, setCompetitorHandle] = useState("");
  const [analysisType, setAnalysisType] =
    useState<AnalysisType>("full-growth-audit");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData();
    formData.append("handle", handle);
    formData.append("analysisType", analysisType);
    if (analysisType === "competitor-comparison" && competitorHandle) {
      formData.append("competitorHandle", competitorHandle);
    }

    try {
      const result = await analyzeHandle(formData);

      if (result.success && result.report) {
        // Store report in sessionStorage for the report page
        sessionStorage.setItem(
          `report-${result.handle}`,
          JSON.stringify({
            report: result.report,
            analysisType: result.analysisType,
            competitorHandle:
              analysisType === "competitor-comparison"
                ? competitorHandle
                : undefined,
          })
        );
        router.push(`/report/${result.handle}`);
      } else {
        setError(result.error || "Failed to analyze handle");
        setIsLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Error: ${errorMessage}`);
      setIsLoading(false);
    }
  };

  const showCompetitorInput = analysisType === "competitor-comparison";

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
      {/* Handle Input */}
      <div>
        <label
          htmlFor="handle"
          className="block text-sm font-medium text-gray-300 mb-2"
        >
          X Handle
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
            @
          </span>
          <input
            type="text"
            id="handle"
            name="handle"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="username"
            disabled={isLoading}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl py-3 pl-10 pr-4
                     text-white placeholder-gray-500 focus:outline-none focus:border-blue-500
                     focus:ring-1 focus:ring-blue-500 transition-colors disabled:opacity-50"
          />
        </div>
      </div>

      {/* Analysis Type Selector */}
      <div>
        <label
          htmlFor="analysisType"
          className="block text-sm font-medium text-gray-300 mb-2"
        >
          Analysis Type
        </label>
        <select
          id="analysisType"
          name="analysisType"
          value={analysisType}
          onChange={(e) => setAnalysisType(e.target.value as AnalysisType)}
          disabled={isLoading}
          className="w-full bg-gray-900 border border-gray-700 rounded-xl py-3 px-4
                   text-white focus:outline-none focus:border-blue-500
                   focus:ring-1 focus:ring-blue-500 transition-colors disabled:opacity-50
                   appearance-none cursor-pointer"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 1rem center",
            backgroundSize: "1.5rem",
          }}
        >
          {Object.entries(ANALYSIS_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Competitor Handle Input (conditional) */}
      {showCompetitorInput && (
        <div className="animate-in slide-in-from-top-2 duration-200">
          <label
            htmlFor="competitorHandle"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Competitor Handle
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
              @
            </span>
            <input
              type="text"
              id="competitorHandle"
              name="competitorHandle"
              value={competitorHandle}
              onChange={(e) => setCompetitorHandle(e.target.value)}
              placeholder="competitor"
              disabled={isLoading}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl py-3 pl-10 pr-4
                       text-white placeholder-gray-500 focus:outline-none focus:border-blue-500
                       focus:ring-1 focus:ring-blue-500 transition-colors disabled:opacity-50"
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || !handle.trim()}
        className="w-full btn-gradient text-white font-semibold py-4 px-6 rounded-xl
                 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98]"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Analyzing...
          </span>
        ) : (
          "Analyze My Account"
        )}
      </button>

      {/* Estimated Time */}
      {isLoading && (
        <p className="text-center text-sm text-gray-500">
          This may take 15-30 seconds for real-time analysis
        </p>
      )}
    </form>
  );
}
