import { getIngredientPricing } from "./pricingService.js";

function estimateWeight(name, count) {
  const key = String(name).toLowerCase();
  const mgItems = new Set(["salt", "turmeric", "chili powder", "cumin", "coriander"]);
  if (mgItems.has(key)) {
    return { amount: 500 * count, unit: "mg", multiplier: 0.01 * count };
  }
  return { amount: 250 * count, unit: "g", multiplier: 0.25 * count };
}

function normalizeIngredients(ingredients) {
  const map = new Map();
  for (const value of ingredients) {
    const name = String(value).trim().toLowerCase();
    if (!name) continue;
    map.set(name, (map.get(name) || 0) + 1);
  }
  return Array.from(map.entries()).map(([name, quantity]) => ({ name, quantity }));
}

export function optimizeCart(ingredients, constraints = {}) {
  const unique = normalizeIngredients(ingredients);
  let totalCost = 0;

  const cartItems = unique.map(({ name, quantity }) => {
    const offers = getIngredientPricing(name);
    const { amount, unit, multiplier } = estimateWeight(name, quantity);

    if (!offers.length) {
      return { name, amount, unit, price: 0, store: "Unavailable" };
    }

    const cheapest = offers.reduce((min, curr) => (curr.price < min.price ? curr : min));
    const linePrice = Number((cheapest.price * multiplier).toFixed(2));
    totalCost += linePrice;
    return { name, amount, unit, price: linePrice, store: cheapest.store };
  });

  if (constraints.budget && totalCost > constraints.budget) {
    // Important signal for UI: current optimized cart still exceeds budget.
    return { cartItems, totalCost: Number(totalCost.toFixed(2)), withinBudget: false };
  }

  return { cartItems, totalCost: Number(totalCost.toFixed(2)), withinBudget: true };
}