import { Browser, BrowserContext, BrowserType, Page, chromium, firefox, webkit } from "playwright";
import { getConfig } from "./config-reader";

export type BrowserSession = {
  browser: Browser;
  context: BrowserContext;
  page: Page;
};

export async function startBrowserSession(): Promise<BrowserSession> {
  const config = getConfig();
  const browserType = resolveBrowserType(config.browser);
  const ci = process.env.CI === "true";
  const launchOpts: Parameters<BrowserType["launch"]>[0] = { headless: config.headless };
  if (ci) {
    launchOpts.args = [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-blink-features=AutomationControlled",
    ];
  }
  const browser = await browserType.launch(launchOpts);
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    locale: "en-IN",
    timezoneId: "Asia/Kolkata",
    ...(ci
      ? {
          userAgent:
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        }
      : {}),
  });
  const page = await context.newPage();
  return { browser, context, page };
}

export async function stopBrowserSession(session: BrowserSession): Promise<void> {
  await session.context.close();
  await session.browser.close();
}

function resolveBrowserType(browserName: string): BrowserType {
  switch (browserName) {
    case "chrome":
    case "chromium":
      return chromium;
    case "firefox":
      return firefox;
    case "safari":
    case "webkit":
      return webkit;
    default:
      return chromium;
  }
}
