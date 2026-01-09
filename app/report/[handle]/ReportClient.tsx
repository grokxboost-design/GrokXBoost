"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ReportDisplay from "@/components/ReportDisplay";
import LoadingState from "@/components/LoadingState";
import { AnalysisType, ANALYSIS_TYPE_LABELS } from "@/lib/types";
import { analyzeHandle } from "@/app/actions/analyze";

interface ReportClientProps {
  handle: string;
  cachedReport?: string;
  cachedAnalysisType?: AnalysisType;
  cachedCompetitorHandle?: string;
  cachedCreatedAt?: string;
}

export default function ReportClient({
  handle,
  cachedReport,
  cachedAnalysisType,
  cachedCompetitorHandle,
  cachedCreatedAt,
}: ReportClientProps) {
  const router = useRouter();
  const [report, setReport] = useState<string | undefined>(cachedReport);
  const [analysisType, setAnalysisType] = useState<AnalysisType>(
    cachedAnalysisType || "full-growth-audit"
  );
  const [competitorHandle, setCompetitorHandle] = useState<string | undefined>(
    cachedCompetitorHandle
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<AnalysisType>("full-growth-audit");
  const [newCompetitor, setNewCompetitor] = useState("");

  // Check sessionStorage for recently generated report (fallback for non-KV flow)
  useEffect(() => {
    if (!report) {
      const storedData = sessionStorage.getItem(`report-${handle}`);
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData);
          setReport(parsed.report);
          setAnalysisType(parsed.analysisType);
          setCompetitorHandle(parsed.competitorHandle);
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, [handle, report]);

  const handleGenerateReport = async () => {
    setError(null);
    setIsGenerating(true);

    const formData = new FormData();
    formData.append("handle", handle);
    formData.append("analysisType", selectedType);
    if (selectedType === "competitor-comparison" && newCompetitor) {
      formData.append("competitorHandle", newCompetitor);
    }

    try {
      const result = await analyzeHandle(formData);

      if (result.success && result.report) {
        setReport(result.report);
        setAnalysisType(result.analysisType);
        setCompetitorHandle(
          selectedType === "competitor-comparison" ? newCompetitor : undefined
        );
        // Also store in sessionStorage as backup
        sessionStorage.setItem(
          `report-${handle}`,
          JSON.stringify({
            report: result.report,
            analysisType: result.analysisType,
            competitorHandle:
              selectedType === "competitor-comparison" ? newCompetitor : undefined,
          })
        );
      } else {
        setError(result.error || "Failed to generate report");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  // Show loading state while generating
  if (isGenerating) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <LoadingState handle={handle} />
      </div>
    );
  }

  // Show report if available
  if (report) {
    return (
      <div className="min-h-screen px-4 py-12">
        {/* Back Link */}
        <div className="max-w-3xl mx-auto mb-6">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Home
          </button>
        </div>

        {/* Report */}
        <ReportDisplay
          handle={handle}
          report={report}
          analysisType={analysisType}
          competitorHandle={competitorHandle}
          createdAt={cachedCreatedAt}
        />

        {/* Generate New Analysis Button */}
        <div className="max-w-4xl mx-auto mt-8 pt-8 border-t border-gray-800">
          <p className="text-center text-gray-400 mb-4">
            Want a different analysis type?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as AnalysisType)}
              className="bg-gray-900/50 border border-gray-700 rounded-xl py-2 px-4
                       text-white appearance-none cursor-pointer
                       focus:outline-none focus:border-blue-500"
            >
              {Object.entries(ANALYSIS_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value} className="bg-gray-900">
                  {label}
                </option>
              ))}
            </select>
            {selectedType === "competitor-comparison" && (
              <input
                type="text"
                value={newCompetitor}
                onChange={(e) => setNewCompetitor(e.target.value)}
                placeholder="Competitor @handle"
                className="bg-gray-900/50 border border-gray-700 rounded-xl py-2 px-4
                         text-white placeholder-gray-500
                         focus:outline-none focus:border-blue-500"
              />
            )}
            <button
              onClick={handleGenerateReport}
              disabled={selectedType === "competitor-comparison" && !newCompetitor}
              className="btn-secondary font-semibold py-2 px-6 rounded-xl
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Generate New Analysis
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show "no report found" with option to generate
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <span className="text-3xl font-bold text-white">@</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">@{handle}</h1>
        <p className="text-gray-400 mb-8">
          No report found for this account. Generate one now!
        </p>

        {error && (
          <div className="mb-6 flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-left">
            <svg
              className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Analysis Type Selection */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Analysis Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as AnalysisType)}
              className="w-full bg-gray-900/50 border border-gray-700 rounded-xl py-3 px-4
                       text-white appearance-none cursor-pointer
                       focus:outline-none focus:border-blue-500"
            >
              {Object.entries(ANALYSIS_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value} className="bg-gray-900">
                  {label}
                </option>
              ))}
            </select>
          </div>

          {selectedType === "competitor-comparison" && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Competitor Handle
              </label>
              <input
                type="text"
                value={newCompetitor}
                onChange={(e) => setNewCompetitor(e.target.value)}
                placeholder="@competitor"
                className="w-full bg-gray-900/50 border border-gray-700 rounded-xl py-3 px-4
                         text-white placeholder-gray-500
                         focus:outline-none focus:border-blue-500"
              />
            </div>
          )}
        </div>

        <button
          onClick={handleGenerateReport}
          disabled={selectedType === "competitor-comparison" && !newCompetitor}
          className="w-full btn-gradient text-white font-semibold py-4 px-8 rounded-xl
                   hover:shadow-lg hover:shadow-blue-500/25 transition-all
                   disabled:opacity-50 disabled:cursor-not-allowed
                   flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          Generate Report
        </button>

        <button
          onClick={() => router.push("/")}
          className="mt-4 text-gray-400 hover:text-white transition-colors"
        >
          or analyze a different account
        </button>
      </div>
    </div>
  );
}
