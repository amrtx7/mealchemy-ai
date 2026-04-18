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

async function generateWithGemini(prompt) {
  const baseUrl = env.aiBaseUrl || "https://generativelanguage.googleapis.com/v1beta";
  const response = await axios.post(
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
      timeout: 20000,
    }
  );

  return {
    text: extractGeminiText(response),
    status: response.status,
  };
}

async function generateWithOpenAICompatible(prompt) {
  const baseUrl = env.aiBaseUrl || "https://api.openai.com/v1";
  const response = await axios.post(
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
      timeout: 20000,
    }
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
