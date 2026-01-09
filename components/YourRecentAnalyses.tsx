"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AnalysisType, ANALYSIS_TYPE_LABELS } from "@/lib/types";

interface PersonalReport {
  handle: string;
  analysisType: AnalysisType;
  competitorHandle?: string;
  timestamp: number;
}

const STORAGE_KEY = "grokxboost_personal_history";
const MAX_HISTORY = 10;

// Save a report to personal history
export function saveToPersonalHistory(
  handle: string,
  analysisType: AnalysisType,
  competitorHandle?: string
): void {
  if (typeof window === "undefined") return;

  try {
    const existing = getPersonalHistory();
    const normalizedHandle = handle.toLowerCase().replace(/^@/, "");

    // Remove any existing entry for this handle to avoid duplicates
    const filtered = existing.filter((r) => r.handle !== normalizedHandle);

    // Add new entry at the beginning
    filtered.unshift({
      handle: normalizedHandle,
      analysisType,
      competitorHandle,
      timestamp: Date.now(),
    });

    // Keep only the most recent entries
    const trimmed = filtered.slice(0, MAX_HISTORY);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage might be unavailable
  }
}

// Get personal history from localStorage
export function getPersonalHistory(): PersonalReport[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Clear personal history
export function clearPersonalHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore errors
  }
}

export default function YourRecentAnalyses() {
  const [history, setHistory] = useState<PersonalReport[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setHistory(getPersonalHistory());
  }, []);

  // Don't render until mounted (avoid hydration mismatch)
  if (!mounted || history.length === 0) {
    return null;
  }

  const formatTimeAgo = (timestamp: number) => {
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const handleClear = () => {
    clearPersonalHistory();
    setHistory([]);
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-12 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-300">
          Your Recent Analyses
        </h2>
        <button
          onClick={handleClear}
          className="text-xs text-gray-500 hover:text-gray-400 transition-colors"
        >
          Clear history
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {history.map((report, index) => (
          <Link
            key={`${report.handle}-${index}`}
            href={`/report/${report.handle}`}
            className="group inline-flex items-center gap-2 bg-gray-900/50 border border-gray-800
                     rounded-full px-3 py-1.5 hover:border-blue-500/50 hover:bg-gray-900/70 transition-all"
          >
            <span className="text-sm text-gray-400 group-hover:text-blue-400 transition-colors">
              @{report.handle}
            </span>
            <span className="text-xs text-gray-600">
              {formatTimeAgo(report.timestamp)}
            </span>
          </Link>
        ))}
      </div>

      <p className="mt-3 text-xs text-gray-600">
        Stored locally in your browser
      </p>
    </div>
  );
}
