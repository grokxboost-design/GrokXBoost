export type AnalysisType =
  | "full-growth-audit"
  | "content-strategy"
  | "engagement-analysis"
  | "competitor-comparison";

export interface AnalysisRequest {
  handle: string;
  analysisType: AnalysisType;
  competitorHandle?: string;
}

export interface AnalysisResult {
  success: boolean;
  report?: string;
  error?: string;
  handle: string;
  analysisType: AnalysisType;
  rateLimited?: boolean;
  remaining?: number;
}

export interface GrokMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// Agent tools for /v1/responses endpoint
export interface GrokAgentTool {
  type: "x_search" | "web_search";
}

export interface GrokAPIRequest {
  model: string;
  input: GrokMessage[];
  tools: GrokAgentTool[];
  tool_choice: "auto" | "required" | "none";
}

export interface GrokAPIResponse {
  id: string;
  output_text: string;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export const ANALYSIS_TYPE_LABELS: Record<AnalysisType, string> = {
  "full-growth-audit": "Full Growth Audit",
  "content-strategy": "Content Strategy",
  "engagement-analysis": "Engagement Analysis",
  "competitor-comparison": "Competitor Comparison",
};
