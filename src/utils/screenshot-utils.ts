import fs from "node:fs/promises";
import path from "node:path";
import { Page } from "playwright";
import { getReportsArtifactRoot } from "./artifacts-paths";

export async function captureFailureScreenshot(page: Page, scenarioName: string): Promise<{ filePath: string; bytes: Buffer }> {
  const safeName = scenarioName.replace(/[^a-zA-Z0-9-_]/g, "_");
  const filePath = path.join(
    getReportsArtifactRoot(),
    "screenshots",
    `${safeName}_${Date.now()}.png`
  );
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await page.screenshot({ path: filePath, fullPage: true });
  const bytes = await fs.readFile(filePath);
  return { filePath, bytes };
}
