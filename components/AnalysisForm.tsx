"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnalysisType, ANALYSIS_TYPE_LABELS } from "@/lib/types";
import { analyzeHandle } from "@/app/actions/analyze";
import ProBanner from "./ProBanner";
import { saveToPersonalHistory } from "./YourRecentAnalyses";

export default function AnalysisForm() {
  const router = useRouter();
  const [handle, setHandle] = useState("");
  const [competitorHandle, setCompetitorHandle] = useState("");
  const [analysisType, setAnalysisType] =
    useState<AnalysisType>("full-growth-audit");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setRateLimited(false);
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
        // Save to sessionStorage for immediate page load
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
        // Save to personal history (localStorage)
        saveToPersonalHistory(
          result.handle,
          result.analysisType,
          analysisType === "competitor-comparison" ? competitorHandle : undefined
        );
        router.push(`/report/${result.handle}`);
      } else {
        setError(result.error || "Failed to analyze handle");
        if (result.rateLimited) {
          setRateLimited(true);
        }
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
    <form onSubmit={handleSubmit} className="w-full space-y-5">
      {/* Form Card */}
      <div className="report-card space-y-5">
        {/* Handle Input */}
        <div>
          <label
            htmlFor="handle"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            X Handle
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
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
              className="w-full bg-gray-900/50 border border-gray-700 rounded-xl py-3.5 pl-10 pr-4
                       text-white placeholder-gray-500
                       focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                       transition-all duration-200 disabled:opacity-50"
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
          <div className="relative">
            <select
              id="analysisType"
              name="analysisType"
              value={analysisType}
              onChange={(e) => setAnalysisType(e.target.value as AnalysisType)}
              disabled={isLoading}
              className="w-full bg-gray-900/50 border border-gray-700 rounded-xl py-3.5 px-4
                       text-white appearance-none cursor-pointer
                       focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                       transition-all duration-200 disabled:opacity-50"
            >
              {Object.entries(ANALYSIS_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value} className="bg-gray-900">
                  {label}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Competitor Handle Input (conditional) */}
        {showCompetitorInput && (
          <div className="animate-fade-in">
            <label
              htmlFor="competitorHandle"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Competitor Handle
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
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
                className="w-full bg-gray-900/50 border border-gray-700 rounded-xl py-3.5 pl-10 pr-4
                         text-white placeholder-gray-500
                         focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                         transition-all duration-200 disabled:opacity-50"
              />
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4 animate-fade-in">
          <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Rate Limit - Show Pro Banner */}
      {rateLimited && (
        <div className="animate-fade-in">
          <ProBanner />
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || !handle.trim()}
        className="w-full btn-gradient text-white font-semibold py-4 px-6 rounded-xl
                 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98]
                 flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
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
            <span>Analyzing...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Analyze Account</span>
          </>
        )}
      </button>

      {/* Loading Message */}
      {isLoading && (
        <p className="text-center text-sm text-gray-500 animate-pulse">
          This may take 15-30 seconds...
        </p>
      )}
    </form>
  );
}
