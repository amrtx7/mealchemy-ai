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
