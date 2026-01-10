import { AnalysisType } from "./types";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompts";

// xAI API using modern /v1/responses endpoint with agent tools
const GROK_API_URL = "https://api.x.ai/v1/responses";
const GROK_MODEL = "grok-4-1-fast-reasoning";
const API_TIMEOUT = 120000; // 120 seconds

// Real-time Python service URL (set in Vercel env vars after deploying to Render)
const REALTIME_API_URL = process.env.REALTIME_API_URL;

export class GrokAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: string
  ) {
    super(message);
    this.name = "GrokAPIError";
  }
}

/**
 * Analyze X handle using real-time Python service (if configured)
 * Falls back to direct xAI API if service not available
 */
export async function analyzeXHandle(
  handle: string,
  analysisType: AnalysisType,
  competitorHandle?: string
): Promise<string> {
  // Use real-time service if configured
  if (REALTIME_API_URL) {
    return analyzeWithRealtimeService(handle, analysisType, competitorHandle);
  }

  // Fallback to direct xAI API
  return analyzeWithDirectAPI(handle, analysisType, competitorHandle);
}

/**
 * Real-time analysis via Python service with x_search
 */
async function analyzeWithRealtimeService(
  handle: string,
  analysisType: AnalysisType,
  competitorHandle?: string
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(`${REALTIME_API_URL}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        handle,
        analysis_type: analysisType,
        competitor_handle: competitorHandle || null,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new GrokAPIError(
        `Real-time service error (${response.status}): ${errorText}`,
        response.status
      );
    }

    const data = await response.json();

    if (!data.success) {
      throw new GrokAPIError(data.error || "Analysis failed");
    }

    return data.content;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof GrokAPIError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new GrokAPIError(
          "Analysis timed out. Please try again."
        );
      }
      // Fallback to direct API if real-time service fails
      console.error("Real-time service failed, falling back to direct API:", error.message);
      return analyzeWithDirectAPI(handle, analysisType, competitorHandle);
    }

    throw new GrokAPIError("An unexpected error occurred");
  }
}

/**
 * Direct xAI API analysis with agent loop for real-time search
 */
async function analyzeWithDirectAPI(
  handle: string,
  analysisType: AnalysisType,
  competitorHandle?: string
): Promise<string> {
  const apiKey = process.env.XAI_API_KEY;

  if (!apiKey) {
    throw new GrokAPIError(
      "XAI_API_KEY is not configured. Please add it to your environment variables."
    );
  }

  const userPrompt = buildUserPrompt(handle, analysisType, competitorHandle);

  let currentResponseId: string | null = null;
  let finalContent = "";
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    attempts++;

    const requestBody: Record<string, unknown> = {
      model: GROK_MODEL,
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      tools: [
        { type: "x_search" },
        { type: "web_search" },
      ],
      tool_choice: "auto",
    };

    // Continue from previous response if in a loop
    if (currentResponseId) {
      requestBody.previous_response_id = currentResponseId;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
      const response = await fetch(GROK_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `API Error (${response.status}): `;

        if (response.status === 401) {
          errorMessage += "Invalid API key. Please check your XAI_API_KEY.";
        } else if (response.status === 429) {
          errorMessage += "Rate limit exceeded. Please wait a moment and try again.";
        } else if (response.status === 404) {
          errorMessage += "Model or endpoint not found.";
        } else if (response.status >= 500) {
          errorMessage += "Grok API is temporarily unavailable. Please try again.";
        } else {
          try {
            const parsed = JSON.parse(errorText);
            errorMessage += parsed.error?.message || errorText.slice(0, 200);
          } catch {
            errorMessage += errorText.slice(0, 200);
          }
        }

        throw new GrokAPIError(errorMessage, response.status, errorText);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await response.json();

      // Update response ID for next iteration
      currentResponseId = data.id;

      // Helper to safely get string value
      const safeString = (val: unknown): string =>
        typeof val === "string" ? val : "";

      // Check for final text output in the output array
      if (Array.isArray(data.output)) {
        for (const item of data.output) {
          if (item.type === "text" && typeof item.text === "string") {
            finalContent = item.text;
            break;
          }
          // Also check message format
          if (item.type === "message" && item.role === "assistant") {
            if (Array.isArray(item.content)) {
              for (const block of item.content) {
                if (block.type === "text" && typeof block.text === "string") {
                  finalContent = block.text;
                  break;
                }
              }
            } else if (typeof item.content === "string") {
              finalContent = item.content;
            }
          }
          if (finalContent) break;
        }
      }

      // Check output_text as fallback (ensure it's a string)
      if (!finalContent && data.output_text) {
        finalContent = safeString(data.output_text);
      }

      // Check text field as fallback (ensure it's a string)
      if (!finalContent && data.text) {
        finalContent = safeString(data.text);
      }

      // If we have content, we're done
      if (finalContent) {
        break;
      }

      // If status is completed but no content, break to avoid infinite loop
      if (data.status === "completed") {
        break;
      }

      // Small delay before next iteration to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof GrokAPIError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new GrokAPIError(
            "Analysis timed out. The request took too long to complete. Please try again."
          );
        }
        throw new GrokAPIError(`Network error: ${error.message}`);
      }

      throw new GrokAPIError("An unexpected error occurred during analysis");
    }
  }

  if (!finalContent) {
    throw new GrokAPIError(
      `Agent did not produce final output after ${maxAttempts} attempts. Please try again.`
    );
  }

  return finalContent;
}

export function validateHandle(handle: string): {
  valid: boolean;
  cleanHandle: string;
  error?: string;
} {
  let cleanHandle = handle.trim();
  if (cleanHandle.startsWith("@")) {
    cleanHandle = cleanHandle.slice(1);
  }

  if (!cleanHandle) {
    return { valid: false, cleanHandle: "", error: "Please enter an X handle" };
  }

  if (cleanHandle.length > 15) {
    return {
      valid: false,
      cleanHandle,
      error: "X handles cannot be longer than 15 characters",
    };
  }

  const handleRegex = /^[a-zA-Z0-9_]+$/;
  if (!handleRegex.test(cleanHandle)) {
    return {
      valid: false,
      cleanHandle,
      error: "X handles can only contain letters, numbers, and underscores",
    };
  }

  return { valid: true, cleanHandle };
}
