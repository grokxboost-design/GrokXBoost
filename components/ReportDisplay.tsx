"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AnalysisType, ANALYSIS_TYPE_LABELS } from "@/lib/types";

interface ReportDisplayProps {
  handle: string;
  report: string;
  analysisType: AnalysisType;
  competitorHandle?: string;
  createdAt?: string;
}

export default function ReportDisplay({
  handle,
  report,
  analysisType,
  competitorHandle,
  createdAt,
}: ReportDisplayProps) {
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const generatedAt = createdAt ? new Date(createdAt) : new Date();

  useEffect(() => {
    // Use the full current URL for sharing
    setShareUrl(window.location.href);
  }, []);

  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleShareOnX = () => {
    const shareText = generateShareText(handle, report);
    const tweetText = encodeURIComponent(shareText);
    const tweetUrl = encodeURIComponent(shareUrl);
    window.open(
      `https://twitter.com/intent/tweet?text=${tweetText}&url=${tweetUrl}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in">
      {/* Report Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                @
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  {handle}
                </h1>
                <p className="text-gray-400 text-sm">
                  {ANALYSIS_TYPE_LABELS[analysisType]}
                  {competitorHandle && (
                    <span className="text-gray-500"> vs @{competitorHandle}</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className={`copy-button ${linkCopied ? "copy-button-success" : ""}`}
            >
              {linkCopied ? (
                <>
                  <CheckIcon />
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <LinkIcon />
                  <span>Copy Link</span>
                </>
              )}
            </button>
            <button
              onClick={handleCopyReport}
              className={`copy-button ${copied ? "copy-button-success" : ""}`}
            >
              {copied ? (
                <>
                  <CheckIcon />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <CopyIcon />
                  <span>Copy</span>
                </>
              )}
            </button>
            <button onClick={handlePrint} className="copy-button">
              <PrintIcon />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>

        {/* Report Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <ClockIcon />
            <span>
              Generated {generatedAt.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })} at {generatedAt.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <SparkleIcon />
            <span>Powered by Grok</span>
          </div>
        </div>
      </div>

      {/* Report Content Card */}
      <div className="report-card mb-8">
        <div className="markdown-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
        <button
          onClick={handleShareOnX}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-black font-semibold
                   py-3 px-8 rounded-full hover:bg-gray-100 transition-all duration-200 hover:scale-105"
        >
          <XIcon />
          Share on X
        </button>

        <a
          href="/"
          className="w-full sm:w-auto flex items-center justify-center gap-2 btn-secondary font-semibold
                   py-3 px-8 rounded-full"
        >
          <RefreshIcon />
          New Analysis
        </a>
      </div>

      {/* Footer */}
      <div className="text-center py-6 border-t border-gray-800">
        <p className="text-gray-500 text-sm">
          Analysis based on Grok AI. Results may vary based on available data.
        </p>
        <p className="text-gray-600 text-xs mt-2">
          GrokXBoost is not affiliated with X Corp.
        </p>
      </div>
    </div>
  );
}

function generateShareText(handle: string, report: string): string {
  const lines = report.split("\n").filter((line) => line.trim());
  let insight = "";
  let inWorkingSection = false;

  for (const line of lines) {
    if (line.includes("Working") || line.includes("Strengths") || line.includes("Key")) {
      inWorkingSection = true;
      continue;
    }
    if (inWorkingSection && (line.startsWith("-") || line.startsWith("*") || line.startsWith("1"))) {
      insight = line.replace(/^[-*\d.]\s*/, "").slice(0, 100);
      break;
    }
    if (inWorkingSection && line.startsWith("##")) {
      break;
    }
  }

  if (!insight) {
    insight = `Growth insights for @${handle}`;
  }

  return `Just analyzed my X presence with GrokXBoost!\n\n"${insight}"\n\nGet your free analysis:`;
}

// Icons
function CopyIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  );
}

function PrintIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}
