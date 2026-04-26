import { closeBrowserSession, createBrowserSession } from "./shared.js";

const BLINKIT_PINCODE = process.env.BLINKIT_PINCODE || "110044";
const MAX_PRODUCTS_PER_STORE = 12;

const SELECTORS = {
  locationInput: '//input[@placeholder="search delivery location"]',
  locationChoice: '//div[contains(@class,"LocationSearchList__LocationDetailContainer")]',
  searchLauncher: '//div[contains(@class,"SearchBar__AnimationWrapper-sc-16lps2d-1")]',
  searchInput: '//input[contains(@class,"SearchBarContainer__Input-sc-hl8pft-3")]',
  resultsWrapper: '//div[contains(@class,"categories-table has-less-products search-wrapper")]',
  productCards: '//div[contains(@class,"categories-table has-less-products search-wrapper")]/div/div',
};

async function ensureBlinkitSessionReady(session, page, effectivePincode) {
  if (session.__blinkitReady) {
    return;
  }

  if (!session.__blinkitBootstrapPromise) {
    session.__blinkitBootstrapPromise = (async () => {
      await page.goto("https://blinkit.com/", { waitUntil: "domcontentloaded", timeout: 45000 });
      console.log("[LiveScrape][Blinkit] opened homepage");

      const locationBox = page.locator(SELECTORS.locationInput).first();
      await locationBox.waitFor({ state: "visible", timeout: 15000 });
      await locationBox.clear();
      await locationBox.fill(effectivePincode);
      console.log(`[LiveScrape][Blinkit] entered pincode=${effectivePincode}`);

      await page.waitForTimeout(2000);

      const locationContainer = page.locator(SELECTORS.locationChoice).first();
      await locationContainer.waitFor({ state: "visible", timeout: 15000 });
      await locationContainer.click();
      console.log("[LiveScrape][Blinkit] location selected");

      await page.waitForTimeout(4000);
      session.__blinkitReady = true;
    })();
  }

  await session.__blinkitBootstrapPromise;
}

export async function scrapeBlinkit(ingredient, _pincode, options = {}) {
  const ownsSession = !options.session;
  const session = options.session || await createBrowserSession(options);
  const page = options.page || session.page;
  const effectivePincode = BLINKIT_PINCODE;

  console.log(
    `[LiveScrape][Blinkit] start ingredient="${ingredient}" pincode="${effectivePincode}" requested="${_pincode}"`
  );
  console.log(`[LiveScrape][Blinkit] options headless=${options.headless !== false}`);

  try {
    await ensureBlinkitSessionReady(session, page, effectivePincode);

    await page.goto(`https://blinkit.com/s/?q=${encodeURIComponent(ingredient)}`, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    console.log(`[LiveScrape][Blinkit] opened search page ingredient="${ingredient}"`);

    await page.waitForSelector(SELECTORS.resultsWrapper, { timeout: 20000 });
    await page.evaluate(() => window.scrollBy(0, 600));
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.scrollBy(0, 600));
    await page.waitForTimeout(1500);
    await page.locator(SELECTORS.resultsWrapper).first().waitFor({ state: "visible", timeout: 15000 });
    await page.waitForTimeout(3000);

    const cards = await page.locator(SELECTORS.productCards).all();
    const limitedCards = cards.slice(0, MAX_PRODUCTS_PER_STORE);
    console.log(`[LiveScrape][Blinkit] raw cards found=${cards.length} processingTop=${limitedCards.length}`);

    const products = [];

    for (const [index, card] of limitedCards.entries()) {
      try {
        const fullText = (await card.innerText()).trim();
        if (!fullText.includes("ADD")) continue;

        const lines = fullText
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);

        let img = "";
        try {
          img = (await card.locator("img").first().getAttribute("src")) || "";
        } catch {
          // ignore
        }

        let startIdx = 0;
        if (lines.length > 0 && (lines[0].includes("OFF") || lines[0].includes("%"))) {
          startIdx = 1;
        }

        const delivery_time = lines[startIdx] || "";
        const name = lines[startIdx + 1] || "";
        const quantity = lines[startIdx + 2] || "";
        const price = lines[startIdx + 3] || "";

        let url = "";
        try {
          const innerDiv = card.locator("//div[@role='button' and @id]").first();
          const productId = await innerDiv.getAttribute("id");
          if (productId && /^\d+$/.test(productId)) {
            const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
            url = `https://blinkit.com/prn/${slug}/prid/${productId}`;
          }
        } catch {
          // ignore
        }

        const product = {
          delivery_time,
          name,
          quantity,
          price,
          image: img,
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
        console.warn(`[LiveScrape][Blinkit] card parse failed index=${index}: ${error.message}`);
      }
    }

    console.log(`[LiveScrape][Blinkit] parsed products=${products.length}`);
    return products;
  } catch (error) {
    console.error(`[LiveScrape][Blinkit] failed: ${error.message}`);
    if (String(error.message || "").toLowerCase().includes("location")) {
      session.__blinkitReady = false;
      session.__blinkitBootstrapPromise = null;
    }
    throw error;
  } finally {
    if (ownsSession) {
      await closeBrowserSession(session);
      console.log("[LiveScrape][Blinkit] browser session closed");
    }
  }
}
