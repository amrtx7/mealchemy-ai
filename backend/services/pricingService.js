import storeData from "../data/storeData.json" with { type: "json" };

export function getIngredientPricing(ingredient) {
  const normalized = String(ingredient).trim().toLowerCase();
  const offers = Object.entries(storeData)
    .filter(([, items]) => typeof items[normalized] === "number")
    .map(([storeName, items]) => ({
      store: storeName,
      price: items[normalized],
    }));

  return offers;
}
