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
}

export interface GrokMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GrokTool {
  type: "live_search";
  search_parameters: {
    mode: string;
    return_citations: boolean;
    sources: { type: string }[];
  };
}

export interface GrokAPIRequest {
  model: string;
  messages: GrokMessage[];
  tools: GrokTool[];
}

export interface GrokAPIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export const ANALYSIS_TYPE_LABELS: Record<AnalysisType, string> = {
  "full-growth-audit": "Full Growth Audit",
  "content-strategy": "Content Strategy",
  "engagement-analysis": "Engagement Analysis",
  "competitor-comparison": "Competitor Comparison",
};
