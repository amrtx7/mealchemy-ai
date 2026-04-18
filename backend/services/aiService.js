import { getAiConfigFingerprint } from "../config/env.js";
import { generateText, isAiConfigured } from "./aiProviderService.js";

function fallbackMeals() {
  return [
    { meal: "Vegetable Rice Bowl", ingredients: ["rice", "onion", "tomato"] },
    { meal: "Paneer Stir Fry", ingredients: ["paneer", "onion", "tomato"] },
    { meal: "Tomato Rice", ingredients: ["rice", "tomato", "onion"] },
  ];
}

/**
 * @param {string} queryText  - The user's free-text query
 * @param {object} filters    - { cuisine, mealType, diet, budget, protein }
 * @param {object} options    - { min, max }
 */
export async function generateMeals(queryText, filters = {}, options = { min: 3, max: 5 }) {
  // Handle both string and legacy object call shapes gracefully
  const text = typeof queryText === "object"
    ? String(queryText.query || "").trim()
    : String(queryText || "").trim();

  if (!text || text.length < 2) {
    throw new Error("Missing or invalid query");
  }

  if (!isAiConfigured()) {
    return fallbackMeals();
  }

  const minCount = options.min || 3;
  const maxCount = options.max || 5;

  console.log(`[AI-DEBUG] Starting generation for: "${text}"`);
  console.log("[AI-DEBUG] AI config:", getAiConfigFingerprint());

  // Build context-aware filter lines
  const filterLines = [
    filters.cuisine  ? `- Cuisine style: ${filters.cuisine}` : "",
    filters.mealType ? `- Meal type: ${filters.mealType}` : "",
    filters.diet     ? `- Dietary preference: ${filters.diet}` : "",
    filters.budget   ? `- Budget: ₹${filters.budget}` : "",
    filters.protein  ? `- Prioritize high-protein ingredients` : "",
  ].filter(Boolean).join("\n");

  const prompt = `You are an expert meal planning assistant.

User request: "${text}"
${filterLines ? `\nConstraints:\n${filterLines}` : ""}

Generate ${minCount} to ${maxCount} meal options that match the request and constraints.
Each meal must have 4-6 realistic raw grocery ingredient names (not cooked items).

Return STRICT JSON array only (no markdown, no explanation):
[{"meal":"Meal Name","cuisine":"CuisineType","mealType":"Breakfast/Lunch/Dinner/Snack","ingredients":["item1","item2","item3"]}]`;

  try {
    const response = await generateText(prompt);

    console.log(`[AI-DEBUG] Success! Status: ${response.status}`);
    console.log(`[AI-DEBUG] Response received successfully. Status: ${response.status}`);
    const raw = response.text || "[]";
    const normalized = raw.replace(/```json|```/gi, "").trim();
    const start = normalized.indexOf("[");
    const end = normalized.lastIndexOf("]");
    const jsonText =
      start !== -1 && end !== -1 && end > start
        ? normalized.slice(start, end + 1)
        : normalized;
    const meals = JSON.parse(jsonText);

    if (!Array.isArray(meals) || meals.length === 0) {
      return fallbackMeals();
    }
    return meals.slice(0, maxCount);
  } catch (error) {
    const message =
      error?.response?.data?.error?.message ||
      error?.message ||
      "AI generation failed";
    console.error(`[AI-ERROR] ${message}`);
    if (error.response) {
      console.error(`[AI-ERROR-DETAILS] Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
    }
    throw new Error(message);
  }
}
