import {
  closeBrowserSession,
  createBrowserSession,
  fillFirstVisible,
  safeAttr,
  sleep,
  waitForStableLocatorCount,
} from "./shared.js";

const SELECTORS = {
  locationInput: ['input[placeholder="search delivery location"]'],
  locationChoice: [
    'div[class*="LocationSearchList__LocationDetailContainer"]',
    'ul[class*="LocationSearchList"] li:first-child',
  ],
  searchLauncher: ['div[class*="SearchBar__AnimationWrapper-sc-16lps2d-1"]'],
  searchInput: [
    'input[class*="SearchBarContainer__Input-sc-hl8pft-3"]',
    'input#search-input',
    'input[type="search"]',
    'input[placeholder*="Search"]',
  ],
  productCards: 'div[class*="categories-table"][class*="search-wrapper"] > div > div',
};
const MAX_PRODUCTS_PER_STORE = 3;

export async function scrapeBlinkit(ingredient, pincode, options = {}) {
  const session = await createBrowserSession(options);
  const { page } = session;
  const products = [];

  console.log(`[LiveScrape][Blinkit] start ingredient="${ingredient}" pincode="${pincode}"`);
  console.log(`[LiveScrape][Blinkit] options headless=${options.headless !== false}`);

  try {
    await page.goto("https://blinkit.com/", { waitUntil: "domcontentloaded", timeout: 45000 });
    console.log("[LiveScrape][Blinkit] opened homepage");
    // await sleep(2500);

    console.log("[LiveScrape][Blinkit] Reloading page to clear warnings/popups...");
    await page.reload({ waitUntil: "domcontentloaded", timeout: 30000 });
    await sleep(3000);   // Important: wait after reload

    await fillFirstVisible(page, SELECTORS.locationInput, pincode, "location input");
    console.log(`[LiveScrape][Blinkit] entered pincode=${pincode}`);
    await sleep(1800);

    for (const selector of SELECTORS.locationChoice) {
      try {
        const choice = page.locator(selector).first();
        await choice.waitFor({ state: "visible", timeout: 12000 });
        await choice.click();
        console.log(`[LiveScrape][Blinkit] location selected selector=${selector}`);
        break;
      } catch {
        // try next
      }
    }
    await sleep(3000);

    const launcher = page.locator(SELECTORS.searchLauncher[0]).first();
    await launcher.waitFor({ state: "visible", timeout: 12000 });
    await launcher.click();
    console.log("[LiveScrape][Blinkit] search launcher clicked");
    await sleep(1200);

    const usedSearchSelector = await fillFirstVisible(
      page,
      SELECTORS.searchInput,
      ingredient,
      "search input"
    );
    console.log(`[LiveScrape][Blinkit] submitted search ingredient="${ingredient}" selector=${usedSearchSelector}`);
    await page.keyboard.press("Enter");
    const stableCount = await waitForStableLocatorCount(page, SELECTORS.productCards, {
      timeoutMs: 18000,
      pollMs: 500,
      stableRounds: 3,
      minCount: 1,
    });
    console.log(`[LiveScrape][Blinkit] product cards stabilized count=${stableCount}`);
    await sleep(1200);

    const cards = await page.locator(SELECTORS.productCards).all();
    console.log(
      `[LiveScrape][Blinkit] raw cards found=${cards.length} processingTop=${Math.min(cards.length, MAX_PRODUCTS_PER_STORE)}`
    );

    let skippedWithoutAdd = 0;
    let parseErrors = 0;

    for (const [index, card] of cards.slice(0, MAX_PRODUCTS_PER_STORE).entries()) {
      try {
        const text = (await card.innerText()).trim();
        if (!text.includes("ADD")) {
          skippedWithoutAdd += 1;
          continue;
        }

        const lines = text
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);

        let startIdx = 0;
        if (lines[0] && (lines[0].includes("OFF") || lines[0].includes("%"))) {
          startIdx = 1;
        }

        const image = await safeAttr(card.locator("img").first(), "src");

        let url = await safeAttr(card.locator("a").first(), "href");
        if (!url) {
          const productId = await safeAttr(card.locator('div[role="button"][id]').first(), "id");
          const productName = lines[startIdx + 1] || "";
          if (productId) {
            const slug = productName
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-+|-+$/g, "");
            url = `https://blinkit.com/prn/${slug}/prid/${productId}`;
          }
        }

        const product = {
          delivery_time: lines[startIdx] || "",
          name: lines[startIdx + 1] || "",
          quantity: lines[startIdx + 2] || "",
          price: lines[startIdx + 3] || "",
          image,
          url,
        };

        if (product.name) {
          products.push(product);
          if (products.length <= 3) {
            console.log(
              `[LiveScrape][Blinkit] sample product ${products.length}: ${product.name} | ${product.price} | ${product.quantity} | ${product.delivery_time || "no-eta"}`
            );
          }
        }
      } catch (error) {
        parseErrors += 1;
        if (parseErrors <= 3) {
          console.warn(`[LiveScrape][Blinkit] card parse failed index=${index}: ${error.message}`);
        }
      }
    }

    console.log(
      `[LiveScrape][Blinkit] parsed products=${products.length} skippedWithoutAdd=${skippedWithoutAdd} parseErrors=${parseErrors}`
    );
    return products;
  } catch (error) {
    console.error(`[LiveScrape][Blinkit] failed: ${error.message}`);
    throw error;
  } finally {
    await closeBrowserSession(session);
    console.log("[LiveScrape][Blinkit] browser session closed");
  }
}
