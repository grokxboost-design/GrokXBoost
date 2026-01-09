"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AnalysisType, ANALYSIS_TYPE_LABELS } from "@/lib/types";

interface ReportDisplayProps {
  handle: string;
  report: string;
  analysisType: AnalysisType;
  competitorHandle?: string;
}

export default function ReportDisplay({
  handle,
  report,
  analysisType,
  competitorHandle,
}: ReportDisplayProps) {
  const shareText = generateShareText(handle, report);
  const shareUrl = typeof window !== "undefined" ? window.location.origin : "";

  const handleShareOnX = () => {
    const tweetText = encodeURIComponent(shareText);
    const tweetUrl = encodeURIComponent(shareUrl);
    window.open(
      `https://twitter.com/intent/tweet?text=${tweetText}&url=${tweetUrl}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleGenerateAnother = () => {
    window.location.href = "/";
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Analysis for @{handle}
        </h1>
        <p className="text-gray-400">
          {ANALYSIS_TYPE_LABELS[analysisType]}
          {competitorHandle && ` vs @${competitorHandle}`}
        </p>
      </div>

      {/* Report Content */}
      <div className="bg-gray-900 rounded-2xl p-6 md:p-8 border border-gray-800 mb-8">
        <div className="markdown-content text-gray-300">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={handleShareOnX}
          className="flex items-center justify-center gap-2 bg-white text-black font-semibold
                   py-3 px-6 rounded-full hover:bg-gray-200 transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          Share on X
        </button>

        <button
          onClick={handleGenerateAnother}
          className="flex items-center justify-center gap-2 bg-gray-800 text-white font-semibold
                   py-3 px-6 rounded-full hover:bg-gray-700 transition-colors border border-gray-700"
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
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Generate Another Report
        </button>
      </div>

      {/* Timestamp */}
      <p className="text-center text-sm text-gray-500 mt-8">
        Report generated on {new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
    </div>
  );
}

function generateShareText(handle: string, report: string): string {
  // Extract a key insight from the report for the tweet
  const lines = report.split("\n").filter((line) => line.trim());

  // Try to find a notable line from "What's Working" or similar section
  let insight = "";
  let inWorkingSection = false;

  for (const line of lines) {
    if (line.includes("Working") || line.includes("Strengths")) {
      inWorkingSection = true;
      continue;
    }
    if (inWorkingSection && line.startsWith("-")) {
      insight = line.replace(/^-\s*/, "").slice(0, 100);
      break;
    }
    if (inWorkingSection && line.startsWith("##")) {
      break;
    }
  }

  if (!insight) {
    insight = `Key insights for growing @${handle}'s X presence`;
  }

  return `Just got my X growth report from GrokXBoost 🔥\n\n"${insight}"\n\nGet yours free:`;
}
