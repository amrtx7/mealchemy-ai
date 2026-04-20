import "dotenv/config";

const aiProvider = process.env.AI_PROVIDER?.trim().toLowerCase() || "gemini";
const aiApiKey =
  process.env.AI_API_KEY?.trim() ||
  process.env.GEMINI_API_KEY?.trim() ||
  process.env.OPENAI_API_KEY?.trim() ||
  "";

export const env = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI?.trim() || "",
  jwtSecret: process.env.JWT_SECRET?.trim() || "",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET?.trim() || "",
  aiProvider,
  aiApiKey,
  aiModel:
    process.env.AI_MODEL?.trim() ||
    process.env.GEMINI_MODEL?.trim() ||
    "gemini-2.0-flash",
  aiBaseUrl: process.env.AI_BASE_URL?.trim() || "",
  geminiApiKey: process.env.GEMINI_API_KEY?.trim() || "",
  geminiModel: process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash",
  aiTimeoutMs: Number(process.env.AI_TIMEOUT_MS || 45000),
  aiMaxRetries: Number(process.env.AI_MAX_RETRIES || 2),
};

export function getAiConfigFingerprint() {
  if (!env.aiApiKey) {
    return {
      provider: env.aiProvider,
      model: env.aiModel,
      configured: false,
    };
  }

  return {
    provider: env.aiProvider,
    model: env.aiModel,
    configured: true,
    keyLength: env.aiApiKey.length,
    keyPrefix: env.aiApiKey.slice(0, 6),
    keySuffix: env.aiApiKey.slice(-4),
  };
}

export function getGeminiKeyFingerprint() {
  if (!env.geminiApiKey) {
    return { configured: false };
  }

  return {
    configured: true,
    length: env.geminiApiKey.length,
    prefix: env.geminiApiKey.slice(0, 6),
    suffix: env.geminiApiKey.slice(-4),
  };
}

export function validateStartupEnv() {
  const missing = [];

  if (!env.mongoUri) missing.push("MONGODB_URI");
  if (!env.jwtSecret) missing.push("JWT_SECRET");
  if (!env.jwtRefreshSecret) missing.push("JWT_REFRESH_SECRET");

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  if (env.jwtSecret === env.jwtRefreshSecret) {
    throw new Error("JWT_SECRET and JWT_REFRESH_SECRET must be different values");
  }
}
