import { chromium } from "playwright";

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function createBrowserSession({ headless = true } = {}) {
  console.log(`[LiveScrape][Shared] launching chromium headless=${headless}`);
  const browser = await chromium.launch({
    headless,
    args: [
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--disable-blink-features=AutomationControlled",
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
  });

  const page = await context.newPage();
  return { browser, context, page };
}

export async function closeBrowserSession(session) {
  if (!session) return;
  try {
    await session.context?.close();
  } catch {
    // ignore
  }
  try {
    await session.browser?.close();
  } catch {
    // ignore
  }
}

export async function clickFirstVisible(page, selectors = [], label = "selector", timeoutMs = 12000) {
  for (const selector of selectors) {
    try {
      console.log(`[LiveScrape][Shared] waiting for ${label} selector=${selector}`);
      const locator = page.locator(selector).first();
      await locator.waitFor({ state: "visible", timeout: timeoutMs });
      await locator.click();
      console.log(`[LiveScrape][Shared] clicked ${label} selector=${selector}`);
      return selector;
    } catch {
      // try next
    }
  }

  throw new Error(`No visible selector found for ${label}`);
}

export async function fillFirstVisible(page, selectors = [], value = "", label = "selector", timeoutMs = 12000) {
  for (const selector of selectors) {
    try {
      console.log(`[LiveScrape][Shared] waiting for ${label} selector=${selector}`);
      const locator = page.locator(selector).first();
      await locator.waitFor({ state: "visible", timeout: timeoutMs });
      await locator.fill(value);
      console.log(`[LiveScrape][Shared] filled ${label} selector=${selector} value="${value}"`);
      return selector;
    } catch {
      // try next
    }
  }

  throw new Error(`No visible selector found for ${label}`);
}

export async function safeText(locator) {
  try {
    return (await locator.innerText()).trim();
  } catch {
    return "";
  }
}

export async function safeAttr(locator, name) {
  try {
    return ((await locator.getAttribute(name)) || "").trim();
  } catch {
    return "";
  }
}

export async function waitForStableLocatorCount(
  page,
  selector,
  { timeoutMs = 15000, pollMs = 500, stableRounds = 3, minCount = 1 } = {}
) {
  const start = Date.now();
  let previousCount = -1;
  let stableCount = 0;
  let currentCount = 0;

  while (Date.now() - start < timeoutMs) {
    currentCount = await page.locator(selector).count().catch(() => 0);

    if (currentCount === previousCount) {
      stableCount += 1;
    } else {
      stableCount = 0;
      previousCount = currentCount;
    }

    if (currentCount >= minCount && stableCount >= stableRounds) {
      return currentCount;
    }

    await sleep(pollMs);
  }

  return currentCount;
}
