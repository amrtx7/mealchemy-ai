import { getAiConfigFingerprint } from "../config/env.js";
import { generateText, isAiConfigured } from "./aiProviderService.js";

function fallbackMeals() {
  return [
    { meal: "Vegetable Rice Bowl", mealName: "Vegetable Rice Bowl", ingredients: ["rice", "onion", "tomato"], estimatedCost: 120, proteinLevel: "medium", cookingTime: "25 minutes" },
    { meal: "Paneer Stir Fry", mealName: "Paneer Stir Fry", ingredients: ["paneer", "onion", "tomato"], estimatedCost: 180, proteinLevel: "high", cookingTime: "20 minutes" },
    { meal: "Tomato Rice", mealName: "Tomato Rice", ingredients: ["rice", "tomato", "onion"], estimatedCost: 100, proteinLevel: "low", cookingTime: "30 minutes" },
  ];
}

function label(value) {
  if (!value) return "None";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "None";
  return String(value).replace(/_/g, " ");
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
  const prompt = `Generate exactly ${maxCount} meal options based on the following requirements:

User Request: ${text}
Meal Type: ${label(filters.mealType)}
Diet: ${label(filters.diet)}
Cuisine Preferences: ${label(filters.cuisine)}
Budget: ${filters.budget ? `Under ₹${filters.budget}` : "No fixed budget"}
Protein Preference: ${label(filters.protein)}
Cooking Time: ${label(filters.cookingTime)}
User Goal: ${label(filters.goal)}
Allergies: ${label(filters.allergies)}

Rules:
- Each meal must match the diet and cuisine
- Keep total ingredient cost within budget when a budget is provided
- Prioritize high-protein ingredients when protein preference is high
- Respect cooking time constraint
- Avoid allergens completely
- Meals should be realistic and commonly cooked
- Use common English grocery ingredient names only
- The "ingredients" array must contain the full raw grocery list needed to cook the dish, not just a short highlight list
- Do not omit supporting items like oils, sauces, herbs, aromatics, chutney components, or seasoning when they are part of the recipe
- Keep separately listed ingredients separate, for example "ginger" and "garlic" instead of merging them into one label

Return STRICT JSON array only:
[
  {
    "mealName": "",
    "meal": "",
    "cuisine": "",
    "mealType": "",
    "ingredients": [],
    "estimatedCost": 0,
    "proteinLevel": "high",
    "cookingTime": "string"
  }
]`;

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
    const meals = JSON.parse(jsonText).map((meal) => ({
      ...meal,
      meal: meal.meal || meal.mealName,
      mealName: meal.mealName || meal.meal,
    }));

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
