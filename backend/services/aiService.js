import axios from "axios";

function fallbackMeals() {
  return [
    { meal: "Vegetable Rice Bowl", ingredients: ["rice", "onion", "tomato"] },
    { meal: "Paneer Stir Fry", ingredients: ["paneer", "onion", "tomato"] },
    { meal: "Tomato Rice", ingredients: ["rice", "tomato", "onion"] },
  ];
}

export async function generateMeals(userQuery, options = { min: 3, max: 5 }) {
  if (!userQuery || typeof userQuery !== "string") {
    throw new Error("Missing or invalid query");
  }

  if (!process.env.GEMINI_API_KEY) {
    return fallbackMeals();
  }

  const minCount = options.min || 3;
  const maxCount = options.max || 5;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        contents: [
          {
            parts: [
              {
                text: `You are a meal planning assistant.
User query: ${userQuery}
Generate ${minCount} to ${maxCount} meal options.
Return strict JSON array only.
Format:
[{"meal":"Meal Name","ingredients":["item1","item2"]}]`,
              },
            ],
          },
        ],
      },
      {
        params: { key: process.env.GEMINI_API_KEY },
      }
    );

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    const normalized = text.replace(/```json|```/gi, "").trim();
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
    throw new Error(message);
  }
}