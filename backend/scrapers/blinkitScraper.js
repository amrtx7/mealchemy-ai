import { By, Key, until } from "selenium-webdriver";
import { createChromeDriver, firstWorkingElement, safeAttr, sleep } from "./shared.js";

const SELECTORS = {
  locationInput: [
    () => until.elementLocated(By.xpath('//input[@placeholder="search delivery location"]')),
  ],
  locationChoice: [
    () =>
      until.elementLocated(
        By.xpath('//div[contains(@class,"LocationSearchList__LocationDetailContainer")]')
      ),
    () => until.elementLocated(By.xpath('//ul[contains(@class,"LocationSearchList")]//li[1]')),
  ],
  searchLauncher: [
    () =>
      until.elementLocated(
        By.xpath('//div[contains(@class,"SearchBar__AnimationWrapper-sc-16lps2d-1")]')
      ),
  ],
  searchInput: [
    () =>
      until.elementLocated(
        By.xpath('//input[contains(@class,"SearchBarContainer__Input-sc-hl8pft-3")]')
      ),
    () => until.elementLocated(By.xpath('//input[@id="search-input"]')),
    () => until.elementLocated(By.xpath('//input[@type="search"]')),
    () => until.elementLocated(By.xpath('//input[contains(@placeholder,"Search")]')),
  ],
  productCards: By.xpath(
    '//div[contains(@class,"categories-table") and contains(@class,"search-wrapper")]/div/div'
  ),
};

export async function scrapeBlinkit(ingredient, pincode, options = {}) {
  const driver = await createChromeDriver(options);
  const products = [];
  console.log(`[LiveScrape][Blinkit] start ingredient="${ingredient}" pincode="${pincode}"`);
  console.log(`[LiveScrape][Blinkit] options headless=${options.headless !== false}`);

  try {
    await driver.get("https://blinkit.com/");
    console.log("[LiveScrape][Blinkit] opened homepage");
    await sleep(2500);

    const locationBox = await firstWorkingElement(driver, SELECTORS.locationInput, 12000);
    console.log("[LiveScrape][Blinkit] found location input");
    await locationBox.clear();
    await locationBox.sendKeys(pincode);
    console.log(`[LiveScrape][Blinkit] entered pincode=${pincode}`);
    await sleep(1800);

    const locationChoice = await firstWorkingElement(driver, SELECTORS.locationChoice, 12000);
    console.log("[LiveScrape][Blinkit] found location choice");
    await locationChoice.click();
    console.log("[LiveScrape][Blinkit] location selected");
    await sleep(3000);

    const launcher = await firstWorkingElement(driver, SELECTORS.searchLauncher, 12000);
    console.log("[LiveScrape][Blinkit] found search launcher");
    await launcher.click();
    console.log("[LiveScrape][Blinkit] search launcher clicked");
    await sleep(1200);

    const searchInput = await firstWorkingElement(driver, SELECTORS.searchInput, 12000);
    console.log("[LiveScrape][Blinkit] found search input");
    await searchInput.clear();
    await searchInput.sendKeys(ingredient, Key.ENTER);
    console.log(`[LiveScrape][Blinkit] submitted search ingredient="${ingredient}"`);
    await sleep(4500);

    const cards = await driver.findElements(SELECTORS.productCards);
    console.log(`[LiveScrape][Blinkit] raw cards found=${cards.length}`);

    let skippedWithoutAdd = 0;
    let parseErrors = 0;

    for (const [index, card] of cards.slice(0, 24).entries()) {
      try {
        const text = await card.getText();
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

        let image = "";
        try {
          const imageElement = await card.findElement(By.tagName("img"));
          image = await safeAttr(imageElement, "src");
        } catch {
          // ignore
        }

        let url = "";
        try {
          const anchor = await card.findElement(By.tagName("a"));
          url = await safeAttr(anchor, "href");
        } catch {
          try {
            const button = await card.findElement(By.xpath(".//div[@role='button' and @id]"));
            const productId = await safeAttr(button, "id");
            const productName = lines[startIdx + 1] || "";
            if (productId) {
              const slug = productName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "");
              url = `https://blinkit.com/prn/${slug}/prid/${productId}`;
            }
          } catch {
            // ignore
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
        // skip broken cards
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
    await driver.quit();
    console.log("[LiveScrape][Blinkit] driver closed");
  }
}
