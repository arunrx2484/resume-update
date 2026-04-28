import fs from "node:fs/promises";
import path from "node:path";
import { Page } from "playwright";
import { FRAMEWORK_CONSTANTS } from "../constants/framework-constants";

export async function captureFailureScreenshot(page: Page, scenarioName: string): Promise<{ filePath: string; bytes: Buffer }> {
  const safeName = scenarioName.replace(/[^a-zA-Z0-9-_]/g, "_");
  const filePath = path.resolve(
    process.cwd(),
    FRAMEWORK_CONSTANTS.SCREENSHOT_DIR,
    `${safeName}_${Date.now()}.png`
  );
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await page.screenshot({ path: filePath, fullPage: true });
  const bytes = await fs.readFile(filePath);
  return { filePath, bytes };
}
