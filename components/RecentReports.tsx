"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AnalysisType, ANALYSIS_TYPE_LABELS } from "@/lib/types";

interface RecentReport {
  handle: string;
  analysisType: AnalysisType;
  competitorHandle?: string;
  createdAt: string;
}

export default function RecentReports() {
  const [reports, setReports] = useState<RecentReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/recent-reports")
      .then((res) => res.json())
      .then((data) => {
        setReports(data.reports || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return null;
  }

  if (reports.length === 0) {
    return null;
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-16 animate-fade-in">
      <h2 className="text-lg font-semibold text-gray-300 mb-4 text-center">
        Recent Reports
      </h2>
      <div className="grid gap-3">
        {reports.slice(0, 6).map((report, index) => (
          <Link
            key={`${report.handle}-${index}`}
            href={`/report/${report.handle}`}
            className="group flex items-center justify-between bg-gray-900/50 border border-gray-800
                     rounded-xl px-4 py-3 hover:border-gray-700 hover:bg-gray-900/70 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-600/20
                            border border-gray-700 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-300">@</span>
              </div>
              <div>
                <p className="font-medium text-white group-hover:text-blue-400 transition-colors">
                  @{report.handle}
                </p>
                <p className="text-sm text-gray-500">
                  {ANALYSIS_TYPE_LABELS[report.analysisType]}
                  {report.competitorHandle && ` vs @${report.competitorHandle}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {formatTimeAgo(report.createdAt)}
              </span>
              <svg
                className="w-4 h-4 text-gray-600 group-hover:text-blue-400 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
