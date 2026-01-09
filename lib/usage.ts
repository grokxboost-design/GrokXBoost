import { kv } from "@vercel/kv";
import { isKVConfigured } from "./kv";

const DAILY_LIMIT = 5;

// Get today's date key in UTC (YYYY-MM-DD)
function getTodayKey(): string {
  return new Date().toISOString().split("T")[0];
}

// Generate usage key for IP + date
function getUsageKey(ip: string): string {
  const sanitizedIp = ip.replace(/[^a-zA-Z0-9.:]/g, "_");
  return `usage:${sanitizedIp}:${getTodayKey()}`;
}

export interface UsageResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: string; // UTC midnight
}

// Check if IP can generate a report
export async function checkUsage(ip: string): Promise<UsageResult> {
  // If KV not configured, allow unlimited (for local dev)
  if (!isKVConfigured()) {
    return {
      allowed: true,
      remaining: DAILY_LIMIT,
      limit: DAILY_LIMIT,
      resetAt: getNextMidnightUTC(),
    };
  }

  const key = getUsageKey(ip);
  const count = (await kv.get<number>(key)) || 0;
  const remaining = Math.max(0, DAILY_LIMIT - count);

  return {
    allowed: count < DAILY_LIMIT,
    remaining,
    limit: DAILY_LIMIT,
    resetAt: getNextMidnightUTC(),
  };
}

// Increment usage count for IP
export async function incrementUsage(ip: string): Promise<void> {
  if (!isKVConfigured()) {
    return;
  }

  const key = getUsageKey(ip);
  const count = (await kv.get<number>(key)) || 0;

  // Set with TTL until end of day (max 24 hours)
  const secondsUntilMidnight = getSecondsUntilMidnightUTC();
  await kv.set(key, count + 1, { ex: secondsUntilMidnight });
}

// Get seconds until UTC midnight
function getSecondsUntilMidnightUTC(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setUTCDate(midnight.getUTCDate() + 1);
  midnight.setUTCHours(0, 0, 0, 0);
  return Math.ceil((midnight.getTime() - now.getTime()) / 1000);
}

// Get next UTC midnight as ISO string
function getNextMidnightUTC(): string {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setUTCDate(midnight.getUTCDate() + 1);
  midnight.setUTCHours(0, 0, 0, 0);
  return midnight.toISOString();
}

export { DAILY_LIMIT };
