export function parseConstraints(query) {
  const lower = query.toLowerCase();
  const budgetMatch = lower.match(/(?:under|below|max|budget)\s*₹?\$?\s*(\d+)/i);
  const servingsMatch = lower.match(/(\d+)\s*(?:people|persons|servings|meals)/i);

  let dietType = "balanced";
  if (lower.includes("vegan")) dietType = "vegan";
  else if (lower.includes("vegetarian") || lower.includes("veg")) dietType = "vegetarian";
  else if (lower.includes("keto")) dietType = "keto";
  else if (lower.includes("high protein")) dietType = "high-protein";

  return {
    budget: budgetMatch ? Number(budgetMatch[1]) : null,
    servings: servingsMatch ? Number(servingsMatch[1]) : 1,
    dietType,
  };
}

const CUISINES = [
  "North Indian",
  "South Indian",
  "Punjabi",
  "Gujarati",
  "Bengali",
  "Maharashtrian",
  "Chinese",
  "Italian",
  "Mexican",
  "Mediterranean",
  "Fast Food",
];

export function parseMealQuery(query = "") {
  const lower = String(query).toLowerCase();
  const parsed = {};

  const budgetMatch = lower.match(/(?:under|below|max|budget|within|less than)\s*(?:₹|rs\.?|inr)?\s*(\d+)/i);
  if (budgetMatch) parsed.budget = Number(budgetMatch[1]);

  if (/\bnon[-\s]?veg|chicken|fish|mutton|meat\b/i.test(lower)) parsed.diet = "non-veg";
  else if (/\bvegan\b/i.test(lower)) parsed.diet = "vegan";
  else if (/\beggetarian|egg\b/i.test(lower)) parsed.diet = "eggetarian";
  else if (/\bvegetarian|veg\b/i.test(lower)) parsed.diet = "veg";

  if (/\bhigh protein|protein rich|build muscle\b/i.test(lower)) parsed.protein = "high";
  else if (/\blow protein\b/i.test(lower)) parsed.protein = "low";
  else if (/\bmoderate protein\b/i.test(lower)) parsed.protein = "moderate";

  const cuisines = CUISINES.filter((cuisine) => lower.includes(cuisine.toLowerCase()));
  if (cuisines.length) parsed.cuisine = cuisines;

  if (/\bunder 15|15 min|quick\b/i.test(lower)) parsed.cookingTime = "15min";
  else if (/\b30 min|half hour\b/i.test(lower)) parsed.cookingTime = "30min";
  else if (/\b60 min|1 hour\b/i.test(lower)) parsed.cookingTime = "60min";

  return parsed;
}

export function mergeMealConstraints({ userPreferences = {}, queryOverrides = {}, requestBody = {} }) {
  const requestCuisine = requestBody.cuisine
    ? Array.isArray(requestBody.cuisine)
      ? requestBody.cuisine
      : [requestBody.cuisine]
    : null;

  return {
    mealType: requestBody.mealType || queryOverrides.mealType || "",
    diet: queryOverrides.diet || requestBody.diet || userPreferences.diet || "",
    cuisine: queryOverrides.cuisine || requestCuisine || userPreferences.cuisine || [],
    budget: queryOverrides.budget || requestBody.budget || userPreferences.budget || null,
    protein: queryOverrides.protein || (requestBody.protein ? "high" : "") || userPreferences.protein || "",
    cookingTime: queryOverrides.cookingTime || userPreferences.cookingTime || "",
    allergies: userPreferences.allergies || [],
    goal: userPreferences.goal || "",
    age: userPreferences.age || null,
    gender: userPreferences.gender || "",
  };
}
