import { getIngredientPricing, normalizeIngredientName } from "./pricingService.js";

const MAX_HIGH_PRIORITY_ITEMS = 6;

function estimateWeight(name, count) {
  const key = normalizeIngredientName(name);
  const tinySpices = ["cardamom", "cloves", "cinnamon", "nutmeg", "saffron", "mace"];
  const spiceItems = ["salt", "turmeric", "chili powder", "cumin", "coriander powder", "garam masala", "pepper", "mustard seeds", "baking powder", "baking soda"];
  const freshHerbs = ["coriander leaves", "mint leaves", "curry leaves", "cilantro"];
  const liquidItems = ["oil", "vinegar", "sauce", "milk"];
  const stapleItems = ["rice", "flour", "atta", "dal", "lentil", "beans", "chana", "rajma", "masoor"];
  const dairyProteinItems = ["paneer", "tofu", "curd", "yogurt", "cheese", "butter"];
  const smallFreshItems = ["ginger", "garlic", "green chili", "lemon", "lime"];
  const nutsItems = ["peanut", "almond", "cashew", "walnut"];
  const breadItems = ["pav", "bun", "roll", "bread"];
  const pantryItems = ["water"];

  if (pantryItems.includes(key)) return { amount: count, unit: "pc" };
  if (breadItems.some((item) => key.includes(item))) return { amount: 6 * count, unit: "pc" };

  if (freshHerbs.some((item) => key.includes(item))) return { amount: 250 * count, unit: "g" };
  if (tinySpices.some((item) => key.includes(item))) return { amount: 25 * count, unit: "g" };
  if (spiceItems.some((item) => key.includes(item))) return { amount: 100 * count, unit: "g" };
  if (liquidItems.some((item) => key.includes(item))) return { amount: 500 * count, unit: "ml" };
  if (stapleItems.some((item) => key.includes(item))) return { amount: 1000 * count, unit: "g" };
  if (dairyProteinItems.some((item) => key.includes(item))) return { amount: 500 * count, unit: "g" };
  if (nutsItems.some((item) => key.includes(item))) return { amount: 500 * count, unit: "g" };
  if (smallFreshItems.some((item) => key.includes(item))) return { amount: 250 * count, unit: "g" };
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
    "chicken",
    "mince",
    "pav",
    "bun",
    "bread",
    "cucumber",
    "lemon",
    "oil",
    "noodle",
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
    "vanilla",
    "cream",
    "coriander leaves",
    "mint leaves",
    "peppercorn",
  ];

  if (essentialTerms.some((term) => key.includes(term))) return "essential";
  if (optionalTerms.some((term) => key.includes(term))) return "optional";
  return "supporting";
}

function derivePriorityIngredients(meals = []) {
  const ordered = [];
  const seen = new Set();

  for (const meal of meals) {
    const mealIngredients = Array.isArray(meal.ingredients) ? meal.ingredients : [];
    for (const ingredient of mealIngredients) {
      const normalized = normalizeIngredientName(ingredient);
      if (!normalized || seen.has(normalized)) continue;
      seen.add(normalized);
      ordered.push(normalized);
      if (ordered.length >= MAX_HIGH_PRIORITY_ITEMS) {
        return new Set(ordered);
      }
    }
  }

  return new Set(ordered);
}

function optionalRank(item, budget, averagePrice, priorityIngredients) {
  const role = getIngredientRole(item.name);
  let score = 0;

  if (priorityIngredients.has(normalizeIngredientName(item.name))) return -1000;
  if (role === "optional") score += 80;
  if (role === "supporting") score += 35;
  if (budget && item.price > budget * 0.35) score += 45;
  if (averagePrice && item.price > averagePrice * 1.7) score += 25;
  score += Math.min(item.price / 10, 40);
  return score;
}

function buildCartItems(unique, priorityIngredients, preselectedProducts = {}) {
  let totalCost = 0;

  const cartItems = unique.map(({ name, quantity }) => {
    const desired = estimateWeight(name, quantity);
    const liveSelection = preselectedProducts[name];
    const offers = liveSelection ? [] : getIngredientPricing(name, desired);
    const isCore = priorityIngredients.has(name);

    if (name === "water") {
      return {
        name,
        amount: desired.amount,
        unit: desired.unit,
        price: 0,
        store: "Pantry",
        available: true,
        priority: "optional",
        priorityLabel: "Optional",
        reason: "Recipe ingredient noted for cooking, but treated as a pantry staple with no store pricing.",
        isCore,
      };
    }

    if (!liveSelection && !offers.length) {
      return {
        name,
        amount: desired.amount,
        unit: desired.unit,
        price: 0,
        store: "Unavailable",
        available: false,
        priority: isCore ? "high" : "optional",
        priorityLabel: isCore ? "High priority" : "Optional",
        reason: isCore
          ? `One of the top ${MAX_HIGH_PRIORITY_ITEMS} recipe-driving ingredients, but no matching product was found.`
          : "No matching product was found in the store database.",
        unavailableReason: "No matching product found in store database",
        isCore,
      };
    }

    const selected = liveSelection || offers[0];
    const linePrice = Number(selected.price.toFixed(2));
    totalCost += linePrice;

    return {
      name,
      amount: selected.packageAmount || desired.amount,
      unit: selected.packageUnit || desired.unit,
      price: linePrice,
      store: selected.store,
      productName: selected.productName,
      packageLabel: selected.packageLabel,
      imageUrl: selected.imageUrl || "",
      productUrl: selected.productUrl || "",
      deliveryTime: selected.deliveryTime || "",
      source: selected.source || (liveSelection ? "live" : "catalog"),
      storeSlug: selected.storeSlug || normalizeIngredientName(selected.store),
      available: true,
      priority: isCore ? "high" : "optional",
      priorityLabel: isCore ? "High priority" : "Optional",
      reason: isCore
        ? `One of the top ${MAX_HIGH_PRIORITY_ITEMS} recipe-driving ingredients, so it stays high priority.`
        : "Included in the recipe, but placed in optional items outside the top-priority set.",
      isCore,
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

function applyBudgetPriorities(cartItems, budget, priorityIngredients) {
  const availableItems = cartItems.filter((item) => item.available);
  const fullCartTotal = availableItems.reduce((sum, item) => sum + item.price, 0);
  const averagePrice = availableItems.length ? fullCartTotal / availableItems.length : 0;
  const baseHighPriorityTotal = cartItems
    .filter((item) => item.available && item.priority === "high")
    .reduce((sum, item) => sum + item.price, 0);
  let highPriorityTotal = baseHighPriorityTotal;

  if (!budget || fullCartTotal <= budget) {
    const optionalTotalWithinBudget = cartItems
      .filter((item) => item.available && item.priority === "optional")
      .reduce((sum, item) => sum + item.price, 0);

    return {
      cartItems,
      fullCartTotal: Number(fullCartTotal.toFixed(2)),
      highPriorityTotal: Number(highPriorityTotal.toFixed(2)),
      optionalTotal: Number(optionalTotalWithinBudget.toFixed(2)),
      budgetReason:
        budget && fullCartTotal <= budget
          ? `The selected products fit within the Rs ${budget} budget, with only the top ${MAX_HIGH_PRIORITY_ITEMS} ingredients marked high priority.`
          : `No budget was provided, so all matched products are shown, with only the top ${MAX_HIGH_PRIORITY_ITEMS} ingredients marked high priority.`,
    };
  }

  const optionalItems = availableItems
    .filter((item) => !item.isCore)
    .map((item) => ({ item, score: optionalRank(item, budget, averagePrice, priorityIngredients) }))
    .sort((a, b) => b.score - a.score || b.item.price - a.item.price);

  const optionalTotal = optionalItems.reduce((sum, { item }) => sum + item.price, 0);

  return {
    cartItems,
    fullCartTotal: Number(fullCartTotal.toFixed(2)),
    highPriorityTotal: Number(Math.max(highPriorityTotal, 0).toFixed(2)),
    optionalTotal: Number(optionalTotal.toFixed(2)),
    budgetReason:
      highPriorityTotal <= budget
        ? `The top ${MAX_HIGH_PRIORITY_ITEMS} high-priority ingredients fit within the Rs ${budget} budget.`
        : `The top ${MAX_HIGH_PRIORITY_ITEMS} high-priority ingredients total Rs ${highPriorityTotal.toFixed(2)}, above the Rs ${budget} budget. Optional items remain visible separately.`,
  };
}

export function optimizeCart(ingredients, constraints = {}, context = {}) {
  const unique = normalizeIngredients(ingredients);
  const priorityIngredients = derivePriorityIngredients(context.meals || []);
  const builtCart = buildCartItems(unique, priorityIngredients, context.preselectedProducts || {});
  const budget = Number(constraints.budget || 0);
  const prioritized = applyBudgetPriorities(builtCart.cartItems, budget, priorityIngredients);
  const { cartItems, fullCartTotal, highPriorityTotal, optionalTotal, budgetReason } = prioritized;
  const storesUsed = Array.from(new Set(cartItems.filter((item) => item.available).map((item) => item.store)));

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
