import { Locator } from "playwright";

export async function waitForVisible(locator: Locator): Promise<void> {
  await locator.waitFor({ state: "visible", timeout: 15000 });
}
