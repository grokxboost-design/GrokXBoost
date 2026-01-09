import { kv } from "@vercel/kv";
import { AnalysisType } from "./types";

export interface StoredReport {
  handle: string;
  report: string;
  analysisType: AnalysisType;
  competitorHandle?: string;
  createdAt: string;
}

// Generate a unique key for a report based on handle and analysis type
function getReportKey(
  handle: string,
  analysisType: AnalysisType,
  competitorHandle?: string
): string {
  const normalizedHandle = handle.toLowerCase().replace(/^@/, "");
  const base = `report:${normalizedHandle}:${analysisType}`;
  if (competitorHandle) {
    const normalizedCompetitor = competitorHandle.toLowerCase().replace(/^@/, "");
    return `${base}:vs:${normalizedCompetitor}`;
  }
  return base;
}

// Store a report in KV
export async function storeReport(
  handle: string,
  report: string,
  analysisType: AnalysisType,
  competitorHandle?: string
): Promise<void> {
  const key = getReportKey(handle, analysisType, competitorHandle);
  const data: StoredReport = {
    handle,
    report,
    analysisType,
    competitorHandle,
    createdAt: new Date().toISOString(),
  };

  // Store with 90-day TTL (7776000 seconds)
  await kv.set(key, data, { ex: 7776000 });

  // Also store a simple handle -> latest report mapping for easy lookup
  const latestKey = `latest:${handle.toLowerCase().replace(/^@/, "")}`;
  await kv.set(latestKey, { key, analysisType, competitorHandle }, { ex: 7776000 });
}

// Get a specific report from KV
export async function getReport(
  handle: string,
  analysisType: AnalysisType,
  competitorHandle?: string
): Promise<StoredReport | null> {
  const key = getReportKey(handle, analysisType, competitorHandle);
  return await kv.get<StoredReport>(key);
}

// Get the latest report for a handle (any analysis type)
export async function getLatestReport(
  handle: string
): Promise<StoredReport | null> {
  const normalizedHandle = handle.toLowerCase().replace(/^@/, "");
  const latestKey = `latest:${normalizedHandle}`;
  const latest = await kv.get<{
    key: string;
    analysisType: AnalysisType;
    competitorHandle?: string;
  }>(latestKey);

  if (!latest) {
    return null;
  }

  return await kv.get<StoredReport>(latest.key);
}

// Check if KV is configured (for graceful fallback)
export function isKVConfigured(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}
