import { scrapeBlinkit } from "../scrapers/blinkitScraper.js";
import { scrapeZepto } from "../scrapers/zeptoScraper.js";
import { closeBrowserSession, createBrowserSession } from "../scrapers/shared.js";
import { optimizeCart } from "./optimizationService.js";
import { normalizeIngredientName } from "./pricingService.js";

const SCRAPER_MODE = (process.env.LIVE_STORE_MODE || "selenium").toLowerCase();
const DEFAULT_PINCODE = process.env.LIVE_STORE_PINCODE || "201301";
const MAX_PRIORITY_INGREDIENTS = Number(process.env.LIVE_MAX_PRIORITY_INGREDIENTS || 3);
const LIVE_HEADLESS = process.env.LIVE_STORE_HEADLESS !== "false";

const STORE_META = {
  Blinkit: { slug: "blinkit", color: "yellow" },
  Zepto: { slug: "zepto", color: "purple" },
};

const PRIORITY_PROFILES = [
  { key: "bread", match: ["bread", "bun", "pav", "loaf"], searchTerms: ["bread", "whole wheat bread", "brown bread"], mustHaveAny: ["bread"], exclude: ["crumb", "rusk", "cake", "garlic", "pizza base"], preferred: ["whole wheat", "brown"] },
  { key: "milk", match: ["milk"], searchTerms: ["milk", "toned milk", "full cream milk"], mustHaveAny: ["milk"], exclude: ["milkshake", "powder", "condensed", "soy", "almond"], preferred: ["toned", "full cream"] },
  { key: "paneer", match: ["paneer"], searchTerms: ["paneer"], mustHaveAny: ["paneer"], exclude: ["tofu", "cheese spread"], preferred: ["fresh"] },
  { key: "eggs", match: ["egg"], searchTerms: ["eggs"], mustHaveAny: ["egg"], exclude: ["eggless", "mayonnaise", "liquid egg"], preferred: [] },
  { key: "rice", match: ["rice"], searchTerms: ["rice", "basmati rice"], mustHaveAny: ["rice"], exclude: ["poha", "puffed", "flour", "batter"], preferred: ["basmati"] },
  { key: "onion", match: ["onion"], searchTerms: ["onion"], mustHaveAny: ["onion"], exclude: ["powder", "fried", "spring onion"], preferred: [] },
  { key: "tomato", match: ["tomato"], searchTerms: ["tomato"], mustHaveAny: ["tomato"], exclude: ["ketchup", "puree", "sauce"], preferred: [] },
  { key: "potato", match: ["potato", "aloo"], searchTerms: ["potato"], mustHaveAny: ["potato"], exclude: ["chips", "flakes", "fries"], preferred: [] },
  { key: "curd", match: ["curd", "dahi", "yogurt"], searchTerms: ["curd", "dahi"], mustHaveAny: ["curd", "dahi"], exclude: ["flavored", "greek"], preferred: ["plain"] },
  { key: "chicken", match: ["chicken", "mince"], searchTerms: ["chicken breast", "chicken"], mustHaveAny: ["chicken"], exclude: ["sausage", "salami", "nugget", "pickle"], preferred: ["breast", "boneless"] },
];

function parsePrice(value) {
  if (typeof value === "number") return value;
  const match = String(value || "").replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}

function profileForIngredient(ingredient) {
  const normalized = normalizeIngredientName(ingredient);
  return PRIORITY_PROFILES.find((profile) =>
    profile.match.some((term) => normalized.includes(term))
  );
}

function createFallbackProfile(ingredient) {
  const normalized = normalizeIngredientName(ingredient);
  return {
    key: normalized,
    match: [normalized],
    searchTerms: [ingredient],
    mustHaveAny: normalized.split(" ").filter(Boolean),
    exclude: [],
    preferred: [],
  };
}

function getPriorityIngredients(ingredients = [], meals = []) {
  const seen = new Set();
  const picked = [];

  // Primary source: first ingredients from selected meal recipes (in order).
  for (const meal of meals) {
    const mealIngredients = Array.isArray(meal.ingredients) ? meal.ingredients : [];
    for (const ingredient of mealIngredients) {
      const normalized = normalizeIngredientName(ingredient);
      if (!normalized || seen.has(normalized)) continue;
      seen.add(normalized);
      const profile = profileForIngredient(normalized) || createFallbackProfile(ingredient);
      picked.push({ ingredient, normalizedIngredient: normalized, profile });
      if (picked.length >= MAX_PRIORITY_INGREDIENTS) return picked;
    }
  }

  // Fallback source when meal ingredient lists are missing.
  for (const ingredient of ingredients) {
    const normalized = normalizeIngredientName(ingredient);
    if (!normalized || seen.has(normalized)) continue;
    const profile = profileForIngredient(normalized) || createFallbackProfile(ingredient);
    seen.add(normalized);
    picked.push({ ingredient, normalizedIngredient: normalized, profile });
    if (picked.length >= MAX_PRIORITY_INGREDIENTS) break;
  }

  return picked;
}

function normalizeScrapedProduct(storeName, query, raw) {
  const productName = String(
    raw.name || raw.product_name || raw.productName || raw.title || raw["Product Name"] || ""
  ).trim();

  const rawUrl = String(raw.url || raw.product_url || raw.productUrl || raw.href || "").trim();
  const productUrl = rawUrl
    ? rawUrl.startsWith("http")
      ? rawUrl
      : storeName === "Blinkit"
        ? `https://blinkit.com${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`
        : storeName === "Zepto"
          ? `https://www.zeptonow.com${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`
          : rawUrl
    : "";

  return {
    store: storeName,
    storeSlug: STORE_META[storeName]?.slug || normalizeIngredientName(storeName),
    query,
    productName,
    normalizedProductName: normalizeIngredientName(productName),
    quantity: String(raw.quantity || raw.qty || raw.pack || raw.size || raw.variant || raw.Quantity || "").trim(),
    price: parsePrice(raw.price || raw.Price || raw.selling_price || raw.offerPrice),
    mrp: parsePrice(raw.mrp || raw.MRP || raw.original_price || raw.originalPrice),
    imageUrl: String(raw.image || raw.image_url || raw.imageUrl || raw.Image || "").trim(),
    productUrl,
    deliveryTime: String(raw.delivery_time || raw.deliveryTime || raw.eta || raw["Delivery Time"] || "").trim(),
  };
}

function scoreProduct(profile, ingredient, product) {
  const normalizedIngredient = normalizeIngredientName(ingredient);
  const haystack = product.normalizedProductName;
  if (!haystack || !product.price) return -1000;

  if (profile.exclude.some((token) => haystack.includes(normalizeIngredientName(token)))) {
    return -1000;
  }

  let score = 0;
  if (haystack === normalizedIngredient) score += 60;
  if (haystack.includes(normalizedIngredient)) score += 30;
  if (profile.mustHaveAny.some((token) => haystack.includes(normalizeIngredientName(token)))) score += 25;
  score += profile.preferred.reduce(
    (sum, token) => sum + (haystack.includes(normalizeIngredientName(token)) ? 12 : 0),
    0
  );
  if (product.quantity) score += 8;
  if (product.imageUrl) score += 4;
  if (product.productUrl) score += 5;
  if (product.deliveryTime) score += 3;

  return score;
}

async function fetchRawStoreProducts(storeName, query, pincode, options = {}) {
  console.log(`[LivePricing] fetch store=${storeName} query="${query}" pincode="${pincode}" mode=${SCRAPER_MODE}`);
  if (SCRAPER_MODE !== "selenium") {
    return {
      products: [],
      debug: { store: storeName, mode: SCRAPER_MODE, status: "unsupported-mode" },
    };
  }

  try {
    const rawProducts =
      storeName === "Blinkit"
        ? await scrapeBlinkit(query, pincode, { headless: LIVE_HEADLESS, session: options.session })
        : await scrapeZepto(query, pincode, { headless: LIVE_HEADLESS, session: options.session });

    return {
      products: rawProducts,
      debug: {
        store: storeName,
        mode: "selenium",
        status: "ok",
        rawCount: rawProducts.length,
      },
    };
  } catch (error) {
    console.error(`[LivePricing] store=${storeName} failed query="${query}": ${error.message}`);
    return {
      products: [],
      debug: {
        store: storeName,
        mode: "selenium",
        status: "failed",
        message: error.message,
      },
    };
  }
}

async function getBestStoreProduct(storeName, ingredientEntry, pincode, options = {}) {
  const query = ingredientEntry.ingredient;
  const { products: rawProducts, debug } = await fetchRawStoreProducts(storeName, query, pincode, options);
  console.log(`[LivePricing] store=${storeName} rawProducts=${rawProducts.length} query="${query}"`);
  const products = rawProducts
    .map((item) => normalizeScrapedProduct(storeName, query, item))
    .filter((product) => product.productName);

  const scored = products
    .map((product) => ({
      ...product,
      score: scoreProduct(ingredientEntry.profile, ingredientEntry.ingredient, product),
    }))
    .filter((product) => product.score > 0)
    .sort((a, b) => b.score - a.score || a.price - b.price);

  return {
    product: scored[0] || null,
    debug: {
      ...debug,
      topProduct: scored[0]?.productName || "",
      matchedCount: scored.length,
    },
  };
}

function chooseWinningProduct(products = []) {
  const available = products.filter(Boolean);
  if (!available.length) return null;
  return [...available].sort((a, b) => a.price - b.price || b.score - a.score)[0];
}

function buildLiveProductSelection(results = []) {
  const map = {};
  for (const result of results) {
    if (!result.selectedProduct) continue;
    map[result.normalizedIngredient] = {
      store: result.selectedProduct.store,
      storeSlug: result.selectedProduct.storeSlug,
      productName: result.selectedProduct.productName,
      packageLabel: result.selectedProduct.quantity,
      price: result.selectedProduct.price,
      imageUrl: result.selectedProduct.imageUrl,
      productUrl: result.selectedProduct.productUrl,
      deliveryTime: result.selectedProduct.deliveryTime,
      source: "live",
    };
  }
  return map;
}

export async function buildLiveComparison(payload = {}) {
  const ingredients = Array.isArray(payload.ingredients) ? payload.ingredients : [];
  const meals = Array.isArray(payload.meals) ? payload.meals : [];
  const constraints = payload.constraints || {};
  const pincode = String(payload.pincode || DEFAULT_PINCODE);
  const priorityIngredients = getPriorityIngredients(ingredients, meals);
  console.log(
    `[LivePricing] start totalIngredients=${ingredients.length} priorityIngredients=${priorityIngredients.length} maxAllowed=${MAX_PRIORITY_INGREDIENTS} pincode=${pincode}`
  );
  console.log(
    `[LivePricing] priority list=${priorityIngredients.map((entry) => entry.normalizedIngredient).join(", ") || "none"}`
  );

  let blinkitSession = null;
  let zeptoSession = null;

  try {
    if (SCRAPER_MODE === "selenium" && priorityIngredients.length) {
      [blinkitSession, zeptoSession] = await Promise.all([
        createBrowserSession({ headless: LIVE_HEADLESS }),
        createBrowserSession({ headless: LIVE_HEADLESS }),
      ]);
      console.log("[LivePricing] reusing one browser session per store for this live-check run");
    }

    const results = [];

    for (const entry of priorityIngredients) {
      const [blinkitResult, zeptoResult] = await Promise.all([
        getBestStoreProduct("Blinkit", entry, pincode, { session: blinkitSession }),
        getBestStoreProduct("Zepto", entry, pincode, { session: zeptoSession }),
      ]);

      const blinkit = blinkitResult.product;
      const zepto = zeptoResult.product;
      const selectedProduct = chooseWinningProduct([blinkit, zepto]);
      console.log(
        `[LivePricing] ingredient="${entry.ingredient}" blinkit=${blinkit?.productName || "none"} zepto=${zepto?.productName || "none"} selected=${selectedProduct?.store || "none"}`
      );

      results.push({
        ingredient: entry.ingredient,
        normalizedIngredient: entry.normalizedIngredient,
        searchQuery: entry.profile.searchTerms[0] || entry.ingredient,
        selectedStore: selectedProduct?.store || "",
        selectedProduct,
        storeProducts: [
          {
            store: "Blinkit",
            storeSlug: STORE_META.Blinkit.slug,
            accent: STORE_META.Blinkit.color,
            product: blinkit,
            debug: blinkitResult.debug,
          },
          {
            store: "Zepto",
            storeSlug: STORE_META.Zepto.slug,
            accent: STORE_META.Zepto.color,
            product: zepto,
            debug: zeptoResult.debug,
          },
        ],
        hasAnyResult: Boolean(selectedProduct),
      });
    }

    const preselectedProducts = buildLiveProductSelection(results);
    const cartPreview = optimizeCart(ingredients, constraints, {
      meals,
      preselectedProducts,
    });

    return {
      pincode,
      mode: SCRAPER_MODE,
      maxPriorityIngredients: MAX_PRIORITY_INGREDIENTS,
      priorityIngredients: priorityIngredients.map((entry) => entry.ingredient),
      results,
      hasLiveResults: results.some((result) => result.hasAnyResult),
      cartPreview,
    };
  } finally {
    await Promise.all([
      closeBrowserSession(blinkitSession),
      closeBrowserSession(zeptoSession),
    ]);
  }
}
