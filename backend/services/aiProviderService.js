import axios from "axios";
import { env } from "../config/env.js";

function assertConfigured() {
  if (!env.aiApiKey) {
    throw new Error(`Missing API key for AI provider "${env.aiProvider}"`);
  }
}

function extractGeminiText(response) {
  return response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

function extractOpenAIText(response) {
  return response.data?.choices?.[0]?.message?.content || "";
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(error) {
  const status = error?.response?.status;
  return (
    error?.code === "ECONNABORTED" ||
    status === 429 ||
    (typeof status === "number" && status >= 500)
  );
}

async function withRetry(task, { retries = 2, label = "AI request" } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      if (attempt === retries || !isRetryableError(error)) {
        throw error;
      }
      const waitMs = 1000 * (attempt + 1);
      console.warn(`[AI-RETRY] ${label} failed (attempt ${attempt + 1}/${retries + 1}). Retrying in ${waitMs}ms...`);
      await sleep(waitMs);
    }
  }
  throw lastError;
}

async function generateWithGemini(prompt) {
  const baseUrl = env.aiBaseUrl || "https://generativelanguage.googleapis.com/v1beta";
  const response = await withRetry(
    () =>
      axios.post(
        `${baseUrl}/models/${env.aiModel}:generateContent`,
        {
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        },
        {
          headers: {
            "x-goog-api-key": env.aiApiKey,
          },
          timeout: env.aiTimeoutMs,
        }
      ),
    { retries: env.aiMaxRetries, label: "Gemini request" }
  );

  return {
    text: extractGeminiText(response),
    status: response.status,
  };
}

async function generateWithOpenAICompatible(prompt) {
  const baseUrl = env.aiBaseUrl || "https://api.openai.com/v1";
  const response = await withRetry(
    () =>
      axios.post(
        `${baseUrl}/chat/completions`,
        {
          model: env.aiModel,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.4,
        },
        {
          headers: {
            Authorization: `Bearer ${env.aiApiKey}`,
            "Content-Type": "application/json",
          },
          timeout: env.aiTimeoutMs,
        }
      ),
    { retries: env.aiMaxRetries, label: "OpenAI-compatible request" }
  );

  return {
    text: extractOpenAIText(response),
    status: response.status,
  };
}

export function isAiConfigured() {
  return Boolean(env.aiApiKey);
}

export async function generateText(prompt) {
  assertConfigured();

  if (env.aiProvider === "gemini") {
    return generateWithGemini(prompt);
  }

  if (env.aiProvider === "openai" || env.aiProvider === "openai-compatible") {
    return generateWithOpenAICompatible(prompt);
  }

  throw new Error(
    `Unsupported AI_PROVIDER "${env.aiProvider}". Use "gemini", "openai", or "openai-compatible".`
  );
}
