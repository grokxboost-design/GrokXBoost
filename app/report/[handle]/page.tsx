"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ReportDisplay from "@/components/ReportDisplay";
import LoadingState from "@/components/LoadingState";
import { AnalysisType } from "@/lib/types";

interface StoredReport {
  report: string;
  analysisType: AnalysisType;
  competitorHandle?: string;
}

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const handle = params.handle as string;

  const [reportData, setReportData] = useState<StoredReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Retrieve report from sessionStorage
    const storedData = sessionStorage.getItem(`report-${handle}`);

    if (storedData) {
      try {
        const parsed = JSON.parse(storedData) as StoredReport;
        setReportData(parsed);
      } catch {
        setError("Failed to load report data");
      }
    } else {
      setError("No report found. Please generate a new analysis.");
    }

    setLoading(false);
  }, [handle]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <LoadingState handle={handle} />
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">😕</div>
          <h1 className="text-2xl font-bold text-white mb-4">Report Not Found</h1>
          <p className="text-gray-400 mb-8">
            {error || "The report you're looking for doesn't exist or has expired."}
          </p>
          <button
            onClick={() => router.push("/")}
            className="btn-gradient text-white font-semibold py-3 px-8 rounded-xl
                     hover:shadow-lg hover:shadow-blue-500/25 transition-all"
          >
            Generate New Report
          </button>
        </div>
      </div>
    );
  }

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
        report={reportData.report}
        analysisType={reportData.analysisType}
        competitorHandle={reportData.competitorHandle}
      />
    </div>
  );
}
