"use server";

import { analyzeXHandle, validateHandle, GrokAPIError } from "@/lib/grok";
import { AnalysisResult, AnalysisType } from "@/lib/types";

export async function analyzeHandle(
  formData: FormData
): Promise<AnalysisResult> {
  const handle = formData.get("handle") as string;
  const analysisType = formData.get("analysisType") as AnalysisType;
  const competitorHandle = formData.get("competitorHandle") as string | null;

  // Validate main handle
  const validation = validateHandle(handle);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
      handle: handle || "",
      analysisType,
    };
  }

  // Validate competitor handle if provided for competitor comparison
  let cleanCompetitorHandle: string | undefined;
  if (analysisType === "competitor-comparison") {
    if (!competitorHandle) {
      return {
        success: false,
        error: "Please enter a competitor handle for comparison",
        handle: validation.cleanHandle,
        analysisType,
      };
    }

    const competitorValidation = validateHandle(competitorHandle);
    if (!competitorValidation.valid) {
      return {
        success: false,
        error: `Competitor handle error: ${competitorValidation.error}`,
        handle: validation.cleanHandle,
        analysisType,
      };
    }
    cleanCompetitorHandle = competitorValidation.cleanHandle;
  }

  try {
    const report = await analyzeXHandle(
      validation.cleanHandle,
      analysisType,
      cleanCompetitorHandle
    );

    return {
      success: true,
      report,
      handle: validation.cleanHandle,
      analysisType,
    };
  } catch (error) {
    if (error instanceof GrokAPIError) {
      return {
        success: false,
        error: error.message,
        handle: validation.cleanHandle,
        analysisType,
      };
    }

    // Handle other errors with more detail
    const errorMessage = error instanceof Error
      ? error.message
      : String(error);

    return {
      success: false,
      error: `Error: ${errorMessage}`,
      handle: validation.cleanHandle,
      analysisType,
    };
  }
}
