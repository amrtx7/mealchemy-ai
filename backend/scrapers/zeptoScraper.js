import { closeBrowserSession, createBrowserSession, fillFirstVisible, safeAttr, safeText, sleep } from "./shared.js";

const SELECTORS = {
  locationLauncher: ["header div.a0Ppr", "header div[class*='a0Ppr']"],
  locationInput: ["input.text-sm", "input[class*='text-sm']"],
  locationChoice: ["div.cGWaaV", "div[class*='cGWaaV']", "div[class*='suggestion']"],
  productCards: "a[href*='/pn/']",
};
const MAX_PRODUCTS_PER_STORE = 3;

export async function scrapeZepto(ingredient, pincode, options = {}) {
  const session = await createBrowserSession(options);
  const { page } = session;
  const products = [];

  console.log(`[LiveScrape][Zepto] start ingredient="${ingredient}" pincode="${pincode}"`);
  console.log(`[LiveScrape][Zepto] options headless=${options.headless !== false}`);

  try {
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

    await page.goto(`https://www.zeptonow.com/search?query=${encodeURIComponent(ingredient)}`, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    console.log(`[LiveScrape][Zepto] opened search page ingredient="${ingredient}"`);
    await page.locator(SELECTORS.productCards).first().waitFor({ state: "visible", timeout: 20000 });
    await sleep(4500);

    const cards = await page.locator(SELECTORS.productCards).all();
    console.log(
      `[LiveScrape][Zepto] raw cards found=${cards.length} processingTop=${Math.min(cards.length, MAX_PRODUCTS_PER_STORE)}`
    );

    let parseErrors = 0;

    for (const [index, card] of cards.slice(0, MAX_PRODUCTS_PER_STORE).entries()) {
      try {
        const product = {
          url: await safeAttr(card, "href"),
          image: await safeAttr(card.locator("img").first(), "src"),
          name: "",
          quantity: "",
          price: "",
          mrp: "",
          discount: "",
          delivery_time: "",
        };

        product.name =
          (await safeText(card.locator("[data-slot-id='ProductName'] span").first())) ||
          (await safeText(card.locator("[data-slot-id='ProductName']").first())) ||
          (await safeAttr(card.locator("img").first(), "alt"));

        product.quantity = await safeText(card.locator("[data-slot-id='PackSize']").first());

        const priceNodes = await card.locator("span").all();
        for (const node of priceNodes) {
          const text = await node.innerText().catch(() => "");
          if (!text.includes("₹")) continue;
          if (!product.price) product.price = text.trim();
          else if (!product.mrp) product.mrp = text.trim();
        }

        product.discount =
          (await safeText(card.locator("div[class*='cYCsFo']").first())) ||
          (await safeText(card.locator('span:has-text("OFF")').first()));

        product.delivery_time = await safeText(
          card.locator("[data-slot-id='EtaInformation']").first(),
        );

        if (product.name) {
          products.push(product);
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
    console.error(`[LiveScrape][Zepto] failed: ${error.message}`);
    throw error;
  } finally {
    await closeBrowserSession(session);
    console.log("[LiveScrape][Zepto] browser session closed");
  }
}
