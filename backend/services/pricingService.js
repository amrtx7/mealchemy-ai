import storeData from "../data/storeData.json" with { type: "json" };

const QUANTITY_PATTERN =
  /\b(\d+(?:\.\d+)?)\s*(kg|g|mg|l|ml|pc|pcs|piece|pieces|doz|dozen|tabs|caps|sachets?)\b/i;

const ALIASES = new Map([
  ["\u092a\u094d\u092f\u093e\u091c", "onion"],
  ["\u091f\u092e\u093e\u091f\u0930", "tomato"],
  ["\u0906\u0932\u0942", "potato"],
  ["\u0932\u0939\u0938\u0941\u0928", "garlic"],
  ["\u0905\u0926\u0930\u0915", "ginger"],
  ["\u092e\u093f\u0930\u094d\u091a", "chili"],
  ["\u0939\u0932\u094d\u0926\u0940", "turmeric"],
  ["\u091c\u0940\u0930\u093e", "cumin"],
  ["\u0927\u0928\u093f\u092f\u093e", "coriander"],
  ["\u092a\u093e\u0932\u0915", "spinach"],
  ["\u092e\u0947\u0925\u0940", "fenugreek"],
  ["\u091a\u093e\u0935\u0932", "rice"],
  ["\u0906\u091f\u093e", "whole wheat flour"],
  ["\u0926\u0939\u0940", "curd"],
  ["\u092a\u0928\u0940\u0930", "paneer"],
  ["\u0928\u092e\u0915", "salt"],
  ["aloo", "potato"],
  ["pyaz", "onion"],
  ["pyaaz", "onion"],
  ["tamatar", "tomato"],
  ["mirchi", "chili"],
  ["chilly", "chili"],
  ["chilli", "chili"],
  ["haldi", "turmeric"],
  ["jeera", "cumin"],
  ["dhania", "coriander"],
  ["palak", "spinach"],
  ["methi", "fenugreek"],
  ["atta", "whole wheat flour"],
  ["dahi", "curd"],
  ["chaawal", "rice"],
  ["chawal", "rice"],
  ["cilantro", "coriander leaves"],
  ["yogurt", "curd"],
  ["green chilli", "green chili"],
  ["red chilli", "red chili"],
  ["chicken mince", "minced chicken"],
  ["chicken keema", "minced chicken"],
  ["pav buns", "pav dinner rolls"],
  ["pav bun", "pav dinner rolls"],
  ["lemon juice", "lemon"],
  ["lime juice", "lime"],
  ["cooking oil", "vegetable oil"],
  ["vegetable oil", "vegetable oil blend"],
  ["red bell pepper", "capsicum red"],
  ["yellow bell pepper", "capsicum yellow"],
  ["green bean", "beans green"],
  ["broccoli floret", "broccoli florets"],
  ["broccoli floret", "broccoli"],
  ["dried red chily", "red chili dried"],
  ["fresh red chily", "red chili fresh"],
  ["whole wheat hakka noodle", "hakka noodles whole wheat"],
  ["whole wheat hakka noodles", "hakka noodles whole wheat"],
]);

function singularizeToken(token) {
  if (!token || token.length <= 3) return token;
  if (token.endsWith("ies")) return `${token.slice(0, -3)}y`;
  if (token.endsWith("oes")) return token.slice(0, -2);
  if (token.endsWith("sses")) return token.slice(0, -2);
  if (token.endsWith("s") && !token.endsWith("ss")) return token.slice(0, -1);
  return token;
}

const STOP_WORDS = new Set([
  "fresh",
  "raw",
  "whole",
  "premium",
  "organic",
  "powder",
  "seeds",
  "seed",
  "leaves",
  "leaf",
  "split",
]);

const PREPARED_PRODUCT_WORDS = new Set([
  "ready",
  "ladoo",
  "chutney",
  "pickle",
  "paste",
  "flavored",
  "frozen",
  "capsules",
  "capsule",
  "tablet",
  "tabs",
  "mix",
]);

const GENERIC_QUERY_TOKENS = new Set([
  "rice",
  "oil",
  "flour",
  "atta",
  "milk",
  "paneer",
  "curd",
  "yogurt",
  "vinegar",
  "sauce",
  "sugar",
  "salt",
  "onion",
  "tomato",
  "bean",
  "beans",
  "chili",
  "pepper",
  "bread",
  "noodle",
  "noodles",
]);

const PREFERRED_PRODUCT_WORDS = new Map([
  ["masoor dal", ["organic", "red", "split", "whole"]],
  ["peanuts", ["raw"]],
  ["paneer", ["fresh"]],
]);

function normalizeUnit(unit) {
  const normalized = String(unit).toLowerCase();
  if (normalized === "kg") return "g";
  if (normalized === "l") return "ml";
  if (["pieces", "piece", "pcs"].includes(normalized)) return "pc";
  if (normalized === "dozen") return "doz";
  if (normalized === "sachets") return "sachet";
  return normalized;
}

function toBaseAmount(amount, unit) {
  const value = Number(amount);
  const normalized = String(unit).toLowerCase();
  if (normalized === "kg") return value * 1000;
  if (normalized === "l") return value * 1000;
  if (normalized === "dozen") return value;
  return value;
}

function formatAmount(amount, unit) {
  const value = Number(amount);
  const normalized = String(unit).toLowerCase();
  if (normalized === "kg") return `${value}kg`;
  if (normalized === "l") return `${value}L`;
  if (normalized === "dozen") return `${value}doz`;
  return `${value}${normalized}`;
}

export function normalizeIngredientName(value) {
  let normalized = String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\(.*?\)/g, " ")
    .replace(/\be\.?\s*g\.?\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  for (const [from, to] of ALIASES.entries()) {
    if (/[\u0900-\u097F]/.test(from)) {
      normalized = normalized.replaceAll(from, to);
    } else {
      normalized = normalized.replace(new RegExp(`\\b${from}\\b`, "g"), to);
    }
  }

  return normalized
    .replace(/[^\w\s]/g, " ")
    .split(" ")
    .map(singularizeToken)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(value) {
  return normalizeIngredientName(value)
    .split(" ")
    .filter((token) => token && !STOP_WORDS.has(token));
}

function hasPreparedProductMismatch(query, product) {
  const queryTokens = tokens(query);
  const productTokens = tokens(product.normalizedBaseName);
  return productTokens.some(
    (token) => PREPARED_PRODUCT_WORDS.has(token) && !queryTokens.includes(token)
  );
}

function hasSpecificTokenMismatch(query, product) {
  const queryTokens = tokens(query);
  const productTokens = tokens(product.normalizedBaseName);
  if (queryTokens.length <= 1) return false;

  const specificTokens = queryTokens.filter((token) => !GENERIC_QUERY_TOKENS.has(token));
  if (!specificTokens.length) {
    return !queryTokens.every((token) => productTokens.includes(token));
  }

  return !specificTokens.every((token) => productTokens.includes(token));
}

function parseProduct(productName, store, price) {
  const match = String(productName).match(QUANTITY_PATTERN);
  const packageAmount = match ? toBaseAmount(match[1], match[2]) : null;
  const packageUnit = match ? normalizeUnit(match[2]) : "";
  const packageLabel = match ? formatAmount(match[1], match[2]) : "";
  const baseName = match
    ? productName.replace(match[0], "").replace(/\s+/g, " ").trim()
    : productName;

  return {
    store,
    productName,
    baseName,
    normalizedBaseName: normalizeIngredientName(baseName),
    packageAmount,
    packageUnit,
    packageLabel,
    price,
  };
}

const catalog = Object.entries(storeData).flatMap(([storeName, items]) =>
  Object.entries(items).map(([productName, price]) =>
    parseProduct(productName, storeName, price)
  )
);

function preferenceBonus(query, product) {
  const normalizedQuery = normalizeIngredientName(query);
  const productTokens = tokens(product.normalizedBaseName);

  for (const [pattern, preferredTokens] of PREFERRED_PRODUCT_WORDS.entries()) {
    if (!normalizedQuery.includes(pattern)) continue;
    if (preferredTokens.some((token) => productTokens.includes(token))) {
      return 6;
    }
  }

  return 0;
}

function matchScore(query, product) {
  const normalizedQuery = normalizeIngredientName(query);
  const normalizedProduct = product.normalizedBaseName;
  const bonus = preferenceBonus(normalizedQuery, product);

  if (!normalizedQuery || !normalizedProduct) return 0;
  if (normalizedProduct === normalizedQuery) return 100 + bonus;
  if (normalizedProduct.startsWith(`${normalizedQuery} `)) return 90 + bonus;
  if (normalizedProduct.includes(` ${normalizedQuery} `)) return 80 + bonus;
  if (normalizedProduct.endsWith(` ${normalizedQuery}`)) return 75 + bonus;
  if (normalizedProduct.includes(normalizedQuery)) return 65 + bonus;

  const queryTokens = tokens(normalizedQuery);
  const productTokens = tokens(normalizedProduct);
  if (queryTokens.length === 0 || productTokens.length === 0) return 0;

  const matched = queryTokens.filter((token) => productTokens.includes(token)).length;
  if (matched === queryTokens.length) return 60 + bonus;
  if (matched > 0) return 25 + matched * 10;
  return 0;
}

function unitMatches(product, desired) {
  if (!desired?.unit || !product.packageUnit) return true;
  return product.packageUnit === desired.unit;
}

function packageDistance(product, desired) {
  if (!desired?.amount || !product.packageAmount) return 0;
  if (product.packageAmount >= desired.amount) {
    return product.packageAmount - desired.amount;
  }
  return desired.amount - product.packageAmount + desired.amount;
}

function packagePenalty(product, desired) {
  if (!desired?.amount || !product.packageAmount) return 0;
  const ratio = product.packageAmount / desired.amount;

  if (ratio >= 4) return 18;
  if (ratio >= 2) return 8;
  if (ratio < 0.5) return 10;
  return 0;
}

export function getIngredientPricing(ingredient, desired = {}) {
  const offers = catalog
    .map((product) => ({
      ...product,
      score: matchScore(ingredient, product),
    }))
    .filter(
      (product) =>
        product.score >= 60 &&
        unitMatches(product, desired) &&
        !hasPreparedProductMismatch(ingredient, product) &&
        !hasSpecificTokenMismatch(ingredient, product)
    )
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const aScore = a.score - packagePenalty(a, desired);
      const bScore = b.score - packagePenalty(b, desired);
      if (bScore !== aScore) return bScore - aScore;
      const distance = packageDistance(a, desired) - packageDistance(b, desired);
      if (distance !== 0) return distance;
      return a.price - b.price;
    })
    .slice(0, 12)
    .map(({ score, ...product }) => product);

  return offers;
}

export function getAvailableStoreNames() {
  return Object.keys(storeData);
}
