import { NextResponse } from "next/server";
import { isKVConfigured } from "@/lib/kv";

export async function GET() {
  const kvConfigured = isKVConfigured();

  return NextResponse.json({
    status: "ok",
    storage: {
      configured: kvConfigured,
      message: kvConfigured
        ? "Upstash Redis is connected! Reports will be persisted."
        : "Upstash Redis NOT configured. Set KV_REST_API_URL and KV_REST_API_TOKEN in Vercel."
    },
    timestamp: new Date().toISOString()
  });
}
