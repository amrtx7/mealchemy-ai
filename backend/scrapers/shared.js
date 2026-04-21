import { Builder } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function createChromeDriver({ headless = true } = {}) {
  const options = new chrome.Options();

  if (headless) {
    options.addArguments("--headless=new");
  }

  options.addArguments("--no-sandbox");
  options.addArguments("--disable-dev-shm-usage");
  options.addArguments("--disable-blink-features=AutomationControlled");
  options.addArguments("--window-size=1366,768");
  options.addArguments(
    "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36"
  );

  return new Builder().forBrowser("chrome").setChromeOptions(options).build();
}

export async function firstWorkingElement(driver, locatorFactories = [], timeoutMs = 10000) {
  for (const factory of locatorFactories) {
    try {
      return await driver.wait(factory(), timeoutMs);
    } catch {
      // try next selector
    }
  }

  throw new Error("No matching selector found");
}

export async function safeText(element) {
  try {
    return (await element.getText()).trim();
  } catch {
    return "";
  }
}

export async function safeAttr(element, name) {
  try {
    return (await element.getAttribute(name))?.trim() || "";
  } catch {
    return "";
  }
}
