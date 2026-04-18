import { getIngredientPricing, normalizeIngredientName } from "./pricingService.js";

function estimateWeight(name, count) {
  const key = normalizeIngredientName(name);
  const tinySpices = ["cardamom", "cloves", "cinnamon", "nutmeg", "saffron", "mace"];
  const spiceItems = ["salt", "turmeric", "chili powder", "cumin", "coriander powder", "garam masala", "pepper", "mustard seeds", "baking powder", "baking soda"];
  const freshHerbs = ["coriander leaves", "mint leaves", "curry leaves", "cilantro"];
  const liquidItems = ["oil", "vinegar", "sauce", "milk"];
  const stapleItems = ["rice", "flour", "atta", "dal", "lentil", "beans", "chana", "rajma", "masoor"];
  const dairyProteinItems = ["paneer", "tofu", "curd", "yogurt", "cheese", "butter"];
  const smallFreshItems = ["ginger", "garlic", "green chili", "lemon", "lime"];
  const nutsItems = ["peanut", "peanuts", "almond", "cashew", "walnut"];

  if (freshHerbs.some((item) => key.includes(item))) {
    return { amount: 250 * count, unit: "g" };
  }

  if (tinySpices.some((item) => key.includes(item))) {
    return { amount: 25 * count, unit: "g" };
  }

  if (spiceItems.some((item) => key.includes(item))) {
    return { amount: 100 * count, unit: "g" };
  }

  if (liquidItems.some((item) => key.includes(item))) {
    return { amount: 500 * count, unit: "ml" };
  }

  if (stapleItems.some((item) => key.includes(item))) {
    return { amount: 1000 * count, unit: "g" };
  }

  if (dairyProteinItems.some((item) => key.includes(item))) {
    return { amount: 500 * count, unit: "g" };
  }

  if (nutsItems.some((item) => key.includes(item))) {
    return { amount: 500 * count, unit: "g" };
  }

  if (smallFreshItems.some((item) => key.includes(item))) {
    return { amount: 250 * count, unit: "g" };
  }

  return { amount: 500 * count, unit: "g" };
}

function normalizeIngredients(ingredients) {
  const map = new Map();
  for (const value of ingredients) {
    const name = normalizeIngredientName(value);
    if (!name) continue;
    map.set(name, (map.get(name) || 0) + 1);
  }
  return Array.from(map.entries()).map(([name, quantity]) => ({ name, quantity }));
}

function getIngredientRole(name) {
  const key = normalizeIngredientName(name);
  const essentialTerms = [
    "flour",
    "whole wheat flour",
    "atta",
    "maida",
    "rice",
    "dal",
    "lentil",
    "milk",
    "curd",
    "egg",
    "paneer",
    "potato",
    "onion",
    "tomato",
    "besan",
    "sugar",
    "jaggery",
  ];
  const optionalTerms = [
    "cardamom",
    "saffron",
    "cloves",
    "cinnamon",
    "cashew",
    "almond",
    "pistachio",
    "raisin",
    "maple syrup",
    "honey",
    "vanilla",
    "cream",
    "cheese",
    "butter",
    "ghee",
    "coriander leaves",
    "mint leaves",
  ];

  if (essentialTerms.some((term) => key.includes(term))) return "essential";
  if (optionalTerms.some((term) => key.includes(term))) return "optional";
  return "supporting";
}

function optionalRank(item, budget, averagePrice) {
  const role = getIngredientRole(item.name);
  let score = 0;

  if (!item.available) return 1000;
  if (role === "optional") score += 80;
  if (role === "supporting") score += 35;
  if (budget && item.price > budget * 0.35) score += 45;
  if (averagePrice && item.price > averagePrice * 1.7) score += 25;
  score += Math.min(item.price / 10, 40);
  return score;
}

function buildCartItems(unique) {
  let totalCost = 0;

  const cartItems = unique.map(({ name, quantity }) => {
    const desired = estimateWeight(name, quantity);
    const allOffers = getIngredientPricing(name, desired);
    const offers = allOffers;

    if (!offers.length) {
      return {
        name,
        amount: desired.amount,
        unit: desired.unit,
        price: 0,
        store: "Unavailable",
        available: false,
        priority: "optional",
        priorityLabel: "Optional",
        reason: "No matching product was found in the store database.",
        unavailableReason: "No matching product found in store database",
      };
    }

    const selected = offers[0];
    const linePrice = Number(selected.price.toFixed(2));
    totalCost += linePrice;

    return {
      name: selected.baseName,
      amount: selected.packageAmount || desired.amount,
      unit: selected.packageUnit || desired.unit,
      price: linePrice,
      store: selected.store,
      productName: selected.productName,
      packageLabel: selected.packageLabel,
      available: true,
      priority: "high",
      priorityLabel: "High priority",
      reason: "Needed for the selected meals and included in the recommended cart.",
    };
  });

  const availableCount = cartItems.filter((item) => item.available).length;

  return {
    cartItems,
    totalCost: Number(totalCost.toFixed(2)),
    availableCount,
    unavailableCount: cartItems.length - availableCount,
  };
}

function applyBudgetPriorities(cartItems, budget) {
  const availableItems = cartItems.filter((item) => item.available);
  const fullCartTotal = availableItems.reduce((sum, item) => sum + item.price, 0);
  const averagePrice = availableItems.length ? fullCartTotal / availableItems.length : 0;
  let highPriorityTotal = fullCartTotal;

  for (const item of cartItems) {
    if (!item.available) continue;
    item.priority = "high";
    item.priorityLabel = "High priority";
    item.reason = "Needed for the selected meals and included in the recommended cart.";
  }

  if (!budget || fullCartTotal <= budget) {
    return {
      cartItems,
      fullCartTotal: Number(fullCartTotal.toFixed(2)),
      highPriorityTotal: Number(fullCartTotal.toFixed(2)),
      optionalTotal: 0,
      budgetReason:
        budget && fullCartTotal <= budget
          ? `The selected products fit within the ₹${budget} budget.`
          : "No budget was provided, so all matched products are included.",
    };
  }

  const candidates = availableItems
    .map((item) => ({ item, score: optionalRank(item, budget, averagePrice) }))
    .filter(({ item }) => getIngredientRole(item.name) !== "essential")
    .sort((a, b) => b.score - a.score || b.item.price - a.item.price);

  for (const { item } of candidates) {
    if (highPriorityTotal <= budget) break;
    item.priority = "optional";
    item.priorityLabel = "Optional";
    item.reason =
      item.price > budget * 0.35
        ? `Optional because this single product takes a large share of the ₹${budget} budget.`
        : "Optional add-on; remove it first if you want to stay closer to budget.";
    highPriorityTotal -= item.price;
  }

  const optionalTotal = cartItems
    .filter((item) => item.available && item.priority === "optional")
    .reduce((sum, item) => sum + item.price, 0);

  return {
    cartItems,
    fullCartTotal: Number(fullCartTotal.toFixed(2)),
    highPriorityTotal: Number(Math.max(highPriorityTotal, 0).toFixed(2)),
    optionalTotal: Number(optionalTotal.toFixed(2)),
    budgetReason:
      highPriorityTotal <= budget
        ? `The full cart was ₹${fullCartTotal.toFixed(2)}, so expensive/non-core items were marked optional to target the ₹${budget} budget.`
        : `Even after marking non-core expensive items optional, the high-priority products are ₹${highPriorityTotal.toFixed(2)}, above the ₹${budget} budget.`,
  };
}

export function optimizeCart(ingredients, constraints = {}) {
  const unique = normalizeIngredients(ingredients);
  const builtCart = buildCartItems(unique);
  const budget = Number(constraints.budget || 0);
  const prioritized = applyBudgetPriorities(builtCart.cartItems, budget);
  const { cartItems, fullCartTotal, highPriorityTotal, optionalTotal, budgetReason } = prioritized;
  const storesUsed = Array.from(
    new Set(cartItems.filter((item) => item.available).map((item) => item.store))
  );

  const availableCount = cartItems.filter((item) => item.available).length;
  const unavailableCount = cartItems.length - availableCount;

  return {
    cartItems,
    selectedStore: storesUsed.length === 1 ? storesUsed[0] : "Best price mix",
    storesUsed,
    totalCost: highPriorityTotal,
    fullCartTotal,
    highPriorityTotal,
    optionalTotal,
    availableCount,
    unavailableCount,
    withinBudget: !budget || highPriorityTotal <= budget,
    budget,
    budgetReason,
  };
}
