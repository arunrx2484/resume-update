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
  const browser = await browserType.launch({ headless: config.headless });
  const context = await browser.newContext();
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
