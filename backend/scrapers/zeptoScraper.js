import {
  closeBrowserSession,
  createBrowserSession,
  fillFirstVisible,
  safeAttr,
  safeText,
  sleep,
  waitForStableLocatorCount,
  withTimeout,
} from "./shared.js";

const SELECTORS = {
  locationLauncher: ["header div.a0Ppr", "header div[class*='a0Ppr']"],
  locationInput: ["input.text-sm", "input[class*='text-sm']"],
  locationChoice: ["div.cGWaaV", "div[class*='cGWaaV']", "div[class*='suggestion']"],
  productCards: "a[href*='/pn/']",
};
const MAX_PRODUCTS_PER_STORE = 3;

async function ensureZeptoSessionReady(session, page, pincode) {
  if (session.__zeptoReady) {
    return;
  }

  if (!session.__zeptoBootstrapPromise) {
    session.__zeptoBootstrapPromise = (async () => {
      await page.goto("https://www.zeptonow.com/", { waitUntil: "domcontentloaded", timeout: 45000 });
      console.log("[LiveScrape][Zepto] opened homepage");
      await sleep(3500);

      for (const selector of SELECTORS.locationLauncher) {
        try {
          const launcher = page.locator(selector).first();
          await launcher.waitFor({ state: "visible", timeout: 15000 });
          await launcher.click();
          console.log(`[LiveScrape][Zepto] location launcher clicked selector=${selector}`);
          break;
        } catch {
          // try next
        }
      }
      await sleep(2200);

      await fillFirstVisible(page, SELECTORS.locationInput, pincode, "location input", 15000);
      console.log(`[LiveScrape][Zepto] entered pincode=${pincode}`);
      await sleep(2200);

      for (const selector of SELECTORS.locationChoice) {
        try {
          const choice = page.locator(selector).first();
          await choice.waitFor({ state: "visible", timeout: 15000 });
          await choice.click();
          console.log(`[LiveScrape][Zepto] location selected selector=${selector}`);
          break;
        } catch {
          // try next
        }
      }
      await sleep(3000);
      session.__zeptoReady = true;
    })();
  }

  await session.__zeptoBootstrapPromise;
}

export async function scrapeZepto(ingredient, pincode, options = {}) {
  const ownsSession = !options.session;
  const session = options.session || await createBrowserSession(options);
  const page = options.page || session.page;
  const products = [];

  console.log(`[LiveScrape][Zepto] start ingredient="${ingredient}" pincode="${pincode}"`);
  console.log(`[LiveScrape][Zepto] options headless=${options.headless !== false}`);

  try {
    await ensureZeptoSessionReady(session, page, pincode);

    await page.goto(`https://www.zeptonow.com/search?query=${encodeURIComponent(ingredient)}`, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    console.log(`[LiveScrape][Zepto] opened search page ingredient="${ingredient}"`);
    await page.locator(SELECTORS.productCards).first().waitFor({ state: "visible", timeout: 20000 });
    const stableCount = await waitForStableLocatorCount(page, SELECTORS.productCards, {
      timeoutMs: 18000,
      pollMs: 500,
      stableRounds: 3,
      minCount: 1,
    });
    console.log(`[LiveScrape][Zepto] product cards stabilized count=${stableCount}`);
    await sleep(1200);

    const cards = await page.locator(SELECTORS.productCards).all();
    console.log(
      `[LiveScrape][Zepto] raw cards found=${cards.length} processingTop=${Math.min(cards.length, MAX_PRODUCTS_PER_STORE)}`
    );

    let parseErrors = 0;

    for (const [index, card] of cards.slice(0, MAX_PRODUCTS_PER_STORE).entries()) {
      try {
        console.log(`[LiveScrape][Zepto] parsing card index=${index}`);
        const product = await withTimeout(
          (async () => {
            const nextProduct = {
              url: await safeAttr(card, "href"),
              image: await safeAttr(card.locator("img").first(), "src"),
              name: "",
              quantity: "",
              price: "",
              mrp: "",
              discount: "",
              delivery_time: "",
            };

            nextProduct.name =
              (await safeText(card.locator("[data-slot-id='ProductName'] span").first())) ||
              (await safeText(card.locator("[data-slot-id='ProductName']").first())) ||
              (await safeAttr(card.locator("img").first(), "alt"));

            nextProduct.quantity = await safeText(card.locator("[data-slot-id='PackSize']").first());

            const priceNodes = await card.locator("span").all();
            for (const node of priceNodes) {
              const text = await node.innerText().catch(() => "");
              if (!text.includes("₹") && !text.includes("Rs") && !text.includes("MRP")) continue;
              if (!nextProduct.price) nextProduct.price = text.trim();
              else if (!nextProduct.mrp) nextProduct.mrp = text.trim();
            }

            nextProduct.discount =
              (await safeText(card.locator("div[class*='cYCsFo']").first())) ||
              (await safeText(card.locator('span:has-text("OFF")').first()));

            nextProduct.delivery_time = await safeText(card.locator("[data-slot-id='EtaInformation']").first());
            return nextProduct;
          })(),
          6000,
          `Zepto card ${index}`
        );

        if (product.name) {
          products.push(product);
          console.log(`[LiveScrape][Zepto] parsed card index=${index} name="${product.name}"`);
          if (products.length <= 3) {
            console.log(
              `[LiveScrape][Zepto] sample product ${products.length}: ${product.name} | ${product.price} | ${product.quantity} | ${product.delivery_time || "no-eta"}`
            );
          }
        }
      } catch (error) {
        parseErrors += 1;
        if (parseErrors <= 3) {
          console.warn(`[LiveScrape][Zepto] card parse failed index=${index}: ${error.message}`);
        }
      }
    }

    console.log(`[LiveScrape][Zepto] parsed products=${products.length} parseErrors=${parseErrors}`);
    return products;
  } catch (error) {
    const meta = {
      url: "",
      title: "",
    };
    try {
      meta.url = page.url();
    } catch {
      // ignore
    }
    try {
      meta.title = await page.title();
    } catch {
      // ignore
    }

    console.error(`[LiveScrape][Zepto] failed: ${error.message}`);
    console.error(`[LiveScrape][Zepto] meta url=${meta.url} title=${meta.title}`);
    if (String(error.message || "").toLowerCase().includes("location")) {
      session.__zeptoReady = false;
      session.__zeptoBootstrapPromise = null;
    }
    throw error;
  } finally {
    if (ownsSession) {
      await closeBrowserSession(session);
      console.log("[LiveScrape][Zepto] browser session closed");
    }
  }
}
