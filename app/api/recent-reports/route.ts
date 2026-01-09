import { NextResponse } from "next/server";
import { getRecentReports, isKVConfigured } from "@/lib/kv";

export async function GET() {
  if (!isKVConfigured()) {
    return NextResponse.json({ reports: [] });
  }

  try {
    const reports = await getRecentReports();
    return NextResponse.json({ reports });
  } catch (error) {
    console.error("Failed to fetch recent reports:", error);
    return NextResponse.json({ reports: [] });
  }
}
