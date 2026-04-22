import { scrapeBlinkit } from "../scrapers/blinkitScraper.js";
import { scrapeZepto } from "../scrapers/zeptoScraper.js";

function parseCli(rawArgs) {
  const args = rawArgs.map((arg) => String(arg).trim()).filter(Boolean);
  const defaultStore = "blinkit";
  const defaultIngredient = "paneer";
  const defaultPincode = "201301";

  let store = defaultStore;
  const first = args[0];
  if (first && !first.startsWith("--")) {
    store = first;
    args.shift();
  }

  let pincode = "";
  const pincodeFlagIndex = args.findIndex((arg) => arg === "--pincode" || arg === "-p");
  if (pincodeFlagIndex >= 0 && args[pincodeFlagIndex + 1]) {
    pincode = args[pincodeFlagIndex + 1];
    args.splice(pincodeFlagIndex, 2);
  }

  let ingredient = "";
  const ingredientFlagIndex = args.findIndex((arg) => arg === "--product" || arg === "--ingredient" || arg === "-i");
  if (ingredientFlagIndex >= 0 && args[ingredientFlagIndex + 1]) {
    ingredient = args[ingredientFlagIndex + 1];
    args.splice(ingredientFlagIndex, 2);
  }

  // Backward-compatible positional parsing:
  // <store> <product words...> <pincode>
  if (!pincode && args.length > 0) {
    const lastArg = args[args.length - 1];
    if (/^\d{4,10}$/.test(lastArg)) {
      pincode = lastArg;
      args.pop();
    }
  }

  if (!ingredient) {
    ingredient = args.join(" ").trim();
  }

  return {
    store: store || defaultStore,
    ingredient: ingredient || defaultIngredient,
    pincode: pincode || defaultPincode,
  };
}

const { store, ingredient, pincode } = parseCli(process.argv.slice(2));

console.log(`[DebugScript] store=${store} ingredient=${ingredient} pincode=${pincode}`);

if (store === "noop") {
  console.log("[DebugScript] noop exit");
  process.exit(0);
}

const scraper = store === "zepto" ? scrapeZepto : scrapeBlinkit;
const products = await scraper(ingredient, pincode, { headless: true });

console.log(`[DebugScript] productCount=${products.length}`);
console.log("[DebugScript] firstProduct=", JSON.stringify(products[0] || null, null, 2));
