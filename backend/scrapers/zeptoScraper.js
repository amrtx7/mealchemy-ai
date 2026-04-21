import { By, until } from "selenium-webdriver";
import { createChromeDriver, firstWorkingElement, safeAttr, sleep } from "./shared.js";

const SELECTORS = {
  locationLauncher: [
    () => until.elementLocated(By.xpath("//header//div[contains(@class,'a0Ppr')]")),
  ],
  locationInput: [
    () => until.elementLocated(By.xpath("//input[contains(@class,'text-sm')]")),
  ],
  locationChoice: [
    () =>
      until.elementLocated(
        By.xpath("//div[contains(@class,'cGWaaV') or contains(@class,'suggestion')][1]")
      ),
  ],
  productCards: By.xpath("//a[contains(@href,'/pn/')]"),
};

export async function scrapeZepto(ingredient, pincode, options = {}) {
  const driver = await createChromeDriver(options);
  const products = [];
  console.log(`[LiveScrape][Zepto] start ingredient="${ingredient}" pincode="${pincode}"`);
  console.log(`[LiveScrape][Zepto] options headless=${options.headless !== false}`);

  try {
    await driver.get("https://www.zeptonow.com/");
    console.log("[LiveScrape][Zepto] opened homepage");
    await sleep(3500);

    const launcher = await firstWorkingElement(driver, SELECTORS.locationLauncher, 15000);
    console.log("[LiveScrape][Zepto] found location launcher");
    await launcher.click();
    await sleep(2200);

    const locationInput = await firstWorkingElement(driver, SELECTORS.locationInput, 15000);
    console.log("[LiveScrape][Zepto] found location input");
    await locationInput.clear();
    await locationInput.sendKeys(pincode);
    console.log(`[LiveScrape][Zepto] entered pincode=${pincode}`);
    await sleep(2200);

    const locationChoice = await firstWorkingElement(driver, SELECTORS.locationChoice, 15000);
    console.log("[LiveScrape][Zepto] found location choice");
    await locationChoice.click();
    console.log("[LiveScrape][Zepto] location selected");
    await sleep(3000);

    await driver.get(`https://www.zeptonow.com/search?query=${encodeURIComponent(ingredient)}`);
    console.log(`[LiveScrape][Zepto] opened search page ingredient="${ingredient}"`);
    await driver.wait(until.elementLocated(SELECTORS.productCards), 20000);
    await sleep(4500);

    const cards = await driver.findElements(SELECTORS.productCards);
    console.log(`[LiveScrape][Zepto] raw cards found=${cards.length}`);

    let parseErrors = 0;

    for (const [index, card] of cards.slice(0, 24).entries()) {
      try {
        const product = {
          url: await safeAttr(card, "href"),
          image: "",
          name: "",
          quantity: "",
          price: "",
          mrp: "",
          discount: "",
          delivery_time: "",
        };

        try {
          const image = await card.findElement(By.tagName("img"));
          product.image = await safeAttr(image, "src");
        } catch {
          // ignore
        }

        try {
          const nameSpan = await card.findElement(
            By.xpath(".//div[@data-slot-id='ProductName']//span")
          );
          product.name = (await nameSpan.getAttribute("innerText"))?.trim() || "";
        } catch {
          try {
            const nameDiv = await card.findElement(By.xpath(".//div[@data-slot-id='ProductName']"));
            product.name = (await nameDiv.getAttribute("innerText"))?.trim() || "";
          } catch {
            try {
              const image = await card.findElement(By.tagName("img"));
              product.name = (await image.getAttribute("alt"))?.trim() || "";
            } catch {
              // ignore
            }
          }
        }

        try {
          const qty = await card.findElement(By.xpath(".//div[@data-slot-id='PackSize']"));
          product.quantity = (await qty.getAttribute("innerText"))?.trim() || "";
        } catch {
          // ignore
        }

        try {
          const priceElements = await card.findElements(By.xpath(".//span[contains(text(),'₹')]"));
          if (priceElements[0]) {
            product.price = ((await priceElements[0].getText()) || "").trim();
          }
          if (priceElements[1]) {
            product.mrp = ((await priceElements[1].getText()) || "").trim();
          }
        } catch {
          // ignore
        }

        try {
          const discount = await card.findElement(
            By.xpath(".//div[contains(@class,'cYCsFo')] | .//span[contains(text(),'OFF')]")
          );
          product.discount = (await discount.getAttribute("innerText"))?.trim() || "";
        } catch {
          // ignore
        }

        try {
          const eta = await card.findElement(By.xpath(".//div[@data-slot-id='EtaInformation']"));
          product.delivery_time = (await eta.getAttribute("innerText"))?.trim() || "";
        } catch {
          // ignore
        }

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
        // skip broken cards
      }
    }

    console.log(`[LiveScrape][Zepto] parsed products=${products.length} parseErrors=${parseErrors}`);
    return products;
  } catch (error) {
    console.error(`[LiveScrape][Zepto] failed: ${error.message}`);
    throw error;
  } finally {
    await driver.quit();
    console.log("[LiveScrape][Zepto] driver closed");
  }
}
