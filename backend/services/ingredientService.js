import { generateText, isAiConfigured } from "./aiProviderService.js";

/**
 * Fallback ingredient map when AI is unavailable.
 */
function fallbackIngredients(dishes) {
  const map = {};
  for (const dish of dishes) {
    map[dish] = ["oil", "salt", "spices"];
  }
  return map;
}

const HINDI_TO_ENGLISH = new Map([
  ["\u092a\u094d\u092f\u093e\u091c", "onion"],
  ["\u091f\u092e\u093e\u091f\u0930", "tomato"],
  ["\u0906\u0932\u0942", "potato"],
  ["\u0932\u0939\u0938\u0941\u0928", "garlic"],
  ["\u0905\u0926\u0930\u0915", "ginger"],
  ["\u092e\u093f\u0930\u094d\u091a", "green chili"],
  ["\u0939\u0932\u094d\u0926\u0940", "turmeric powder"],
  ["\u091c\u0940\u0930\u093e", "cumin seeds"],
  ["\u0927\u0928\u093f\u092f\u093e", "coriander"],
  ["\u092a\u093e\u0932\u0915", "spinach"],
  ["\u092e\u0947\u0925\u0940", "fenugreek"],
  ["\u091a\u093e\u0935\u0932", "rice"],
  ["\u0906\u091f\u093e", "whole wheat flour"],
  ["\u0926\u0939\u0940", "curd"],
  ["\u092a\u0928\u0940\u0930", "paneer"],
  ["\u0928\u092e\u0915", "salt"],
]);

function toEnglishIngredientName(value) {
  let normalized = String(value || "").trim().toLowerCase();

  for (const [hindi, english] of HINDI_TO_ENGLISH.entries()) {
    normalized = normalized.replaceAll(hindi, english);
  }

  return normalized
    .replace(/[\u0900-\u097F]/g, "")
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Use Gemini to convert an array of dish names into raw grocery ingredients.
 * Returns a map: { "Dish Name": ["ingredient1", "ingredient2", ...] }
 */
export async function convertDishesToIngredients(dishes) {
  if (!Array.isArray(dishes) || dishes.length === 0) {
    return {};
  }

  if (!isAiConfigured()) {
    return fallbackIngredients(dishes);
  }

  console.log("[ING-DEBUG] Converting dishes using configured AI provider");
  const dishList = dishes.map((d) => `* ${d}`).join("\n");

  const prompt = `Convert the following dishes into raw grocery ingredients.

Rules:
- Return ONLY raw grocery items (no cooked dishes, no prepared foods)
- Use English grocery names only
- Do NOT use Hindi, Devanagari script, translations, or regional-language names
- Prefer names that can match supermarket products, such as "onion", "tomato", "paneer", "basmati rice", "turmeric powder"
- Keep ingredient list realistic and minimal (5-8 items per dish max)
- Do NOT include dish names as ingredients

Dishes:
${dishList}

Return STRICT JSON only (no markdown, no explanation):
{
  "DishName": ["ingredient1", "ingredient2", "ingredient3"]
}`;

  try {
    const response = await generateText(prompt);

    const raw = response.text || "{}";
    console.log(`[ING-DEBUG] Conversion success. Status: ${response.status}`);
    const cleaned = raw.replace(/```json|```/gi, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    const jsonText =
      start !== -1 && end !== -1 && end > start
        ? cleaned.slice(start, end + 1)
        : cleaned;

    const parsed = JSON.parse(jsonText);

    // Validate structure: ensure each value is an array of strings
    const validated = {};
    for (const dish of dishes) {
      const key = Object.keys(parsed).find(
        (k) => k.trim().toLowerCase() === dish.trim().toLowerCase()
      );
      validated[dish] = Array.isArray(parsed[key])
        ? parsed[key].map(toEnglishIngredientName).filter(Boolean)
        : ["oil", "salt", "spices"];
    }

    return validated;
  } catch (error) {
    const message =
      error?.response?.data?.error?.message ||
      error?.message ||
      "Ingredient conversion failed";
    console.error(`[ING-ERROR] ${message}`);
    if (error.response) {
      console.error(`[ING-ERROR-DETAILS] Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
    }
    throw new Error(message);
  }
}

/**
 * Merge ingredients from all dishes and remove duplicates.
 * Returns a sorted, deduplicated array of ingredient strings.
 */
export function mergeIngredients(dishIngredientMap) {
  const seen = new Set();
  const merged = [];

  for (const ingredients of Object.values(dishIngredientMap)) {
    if (!Array.isArray(ingredients)) continue;
    for (const item of ingredients) {
      const normalized = toEnglishIngredientName(item);
      if (normalized && !seen.has(normalized)) {
        seen.add(normalized);
        merged.push(normalized);
      }
    }
  }

  return merged.sort();
}
