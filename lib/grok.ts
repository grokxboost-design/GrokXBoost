import { GrokAPIRequest, GrokAPIResponse, AnalysisType } from "./types";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompts";

const GROK_API_URL = "https://api.x.ai/v1/chat/completions";
const GROK_MODEL = "grok-4-1-fast-reasoning";
const API_TIMEOUT = 120000; // 120 seconds for agentic calls

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

export async function analyzeXHandle(
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

  const requestBody: GrokAPIRequest = {
    model: GROK_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    tools: [
      {
        type: "live_search",
        sources: ["x", "web"],
      },
    ],
  };

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
        // Show actual error for debugging
        try {
          const parsed = JSON.parse(errorText);
          errorMessage += parsed.error?.message || errorText.slice(0, 200);
        } catch {
          errorMessage += errorText.slice(0, 200);
        }
      }

      throw new GrokAPIError(errorMessage, response.status, errorText);
    }

    const data: GrokAPIResponse = await response.json();

    if (!data.choices || data.choices.length === 0) {
      throw new GrokAPIError("No response received from Grok API");
    }

    const content = data.choices[0].message.content;

    if (!content) {
      throw new GrokAPIError("Empty response received from Grok API");
    }

    return content;
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

export function validateHandle(handle: string): {
  valid: boolean;
  cleanHandle: string;
  error?: string;
} {
  // Remove @ if present
  let cleanHandle = handle.trim();
  if (cleanHandle.startsWith("@")) {
    cleanHandle = cleanHandle.slice(1);
  }

  // Check if empty
  if (!cleanHandle) {
    return { valid: false, cleanHandle: "", error: "Please enter an X handle" };
  }

  // Check length (X handles are 1-15 characters)
  if (cleanHandle.length > 15) {
    return {
      valid: false,
      cleanHandle,
      error: "X handles cannot be longer than 15 characters",
    };
  }

  // Check format (alphanumeric and underscores only)
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
