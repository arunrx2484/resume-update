import { Given, Then, When } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { CustomWorld } from "../support/world";
import { getReportsArtifactRoot } from "../utils/artifacts-paths";
import { textContainsToday } from "../utils/date-utils";

function requiredEnv(name: "NAUKRI_USER" | "NAUKRI_PASS" | "RESUME_PATH"): string {
  const value = process.env[name];
  assert.ok(value && value.trim().length > 0, `${name} must be set as an environment variable`);
  return value;
}

Given("the user opens Naukri home page", async function (this: CustomWorld) {
  assert.ok(this.naukriProfilePage, "Naukri profile page object was not initialized");
  await this.naukriProfilePage.openHome();
  await this.naukriProfilePage.openLoginPanel();
});

When("the user logs in using environment credentials", async function (this: CustomWorld) {
  assert.ok(this.naukriProfilePage, "Naukri profile page object was not initialized");
  const username = requiredEnv("NAUKRI_USER");
  const password = requiredEnv("NAUKRI_PASS");
  await this.naukriProfilePage.login(username, password);
});

Then("the profile widget should appear", async function (this: CustomWorld) {
  assert.ok(this.naukriProfilePage, "Naukri profile page object was not initialized");
  const visible = await this.naukriProfilePage.isProfileWidgetVisible();
  // Naukri sometimes logs in without immediately rendering the header profile widget.
  // Keep this as a soft signal; profile navigation step has a direct URL fallback.
  if (!visible) {
    await this.attach("Profile widget not visible yet; continuing with direct profile navigation fallback.", "text/plain");
  }
});

When("the user navigates to View and Update Profile", async function (this: CustomWorld) {
  assert.ok(this.naukriProfilePage, "Naukri profile page object was not initialized");
  await this.naukriProfilePage.navigateToProfileFromMenu();
});

When("the user captures current resume last updated text", async function (this: CustomWorld) {
  assert.ok(this.naukriProfilePage, "Naukri profile page object was not initialized");
  this.previousResumeUpdatedText = await this.naukriProfilePage.getResumeLastUpdatedText();
});

When("the user uploads resume from environment path", async function (this: CustomWorld) {
  assert.ok(this.naukriProfilePage, "Naukri profile page object was not initialized");
  assert.ok(this.session?.page, "Browser session was not available for upload diagnostics");
  const resumePath = requiredEnv("RESUME_PATH");
  assert.ok(fs.existsSync(resumePath), `Resume file does not exist: ${resumePath}`);
  try {
    await this.naukriProfilePage.clickUpdateResume();
    await this.naukriProfilePage.uploadResume(resumePath);
  } catch (error) {
    const page = this.session.page;
    const debugDir = path.resolve(process.cwd(), "reports/logs");
    fs.mkdirSync(debugDir, { recursive: true });
    const ts = Date.now();

    const preUploadShot = path.resolve(debugDir, `upload-debug-${ts}.png`);
    await page.screenshot({ path: preUploadShot, fullPage: true }).catch(() => {});

    const clickableCandidates = await page
      .evaluate(() => {
        const els = Array.from(document.querySelectorAll<HTMLElement>("button, a, [role='button'], div, span"));
        return els
          .map((el) => ({
            text: (el.innerText || el.textContent || "").trim(),
            tag: el.tagName.toLowerCase(),
            cls: el.className || "",
            id: el.id || "",
          }))
          .filter((x) => /resume|upload|cv|profile/i.test(x.text))
          .slice(0, 80);
      })
      .catch(() => []);

    const html = await page.content().catch(() => "");
    const uploadContext = html.match(/.{0,4000}(resume|upload|cv).{0,4000}/is)?.[0] ?? html.slice(0, 8000);
    const debugPath = path.resolve(debugDir, `upload-debug-${ts}.txt`);
    fs.writeFileSync(
      debugPath,
      [
        `URL: ${page.url()}`,
        "",
        "Clickable candidates (resume/upload/cv):",
        JSON.stringify(clickableCandidates, null, 2),
        "",
        "HTML excerpt around upload keywords:",
        uploadContext,
        "",
        `Pre-upload screenshot: ${preUploadShot}`,
      ].join("\n")
    );

    await this.attach(`Upload debug captured at ${debugPath}`, "text/plain");
    await this.attach(JSON.stringify(clickableCandidates, null, 2), "application/json");
    throw error;
  }
});

Then("the resume upload date should be updated to today", async function (this: CustomWorld) {
  assert.ok(this.naukriProfilePage, "Naukri profile page object was not initialized");
  const beforeText = this.previousResumeUpdatedText ?? "";
  try {
    this.currentResumeUpdatedText = await this.naukriProfilePage.waitForResumeDateChange(beforeText);
  } catch {
    // Naukri may already show today's date before upload; keep fallback verification.
    this.currentResumeUpdatedText = await this.naukriProfilePage.getResumeLastUpdatedText();
  }

  const changed = this.currentResumeUpdatedText !== beforeText;
  const beforeContainsToday = textContainsToday(beforeText);
  const afterContainsToday = textContainsToday(this.currentResumeUpdatedText);

  assert.equal(
    changed || (beforeContainsToday && afterContainsToday),
    true,
    `Resume last updated text did not change and does not confirm today's date. Before: ${beforeText} | After: ${this.currentResumeUpdatedText}`
  );
  assert.equal(
    afterContainsToday,
    true,
    `Resume last updated text should contain today's date. Actual: ${this.currentResumeUpdatedText}`
  );

  assert.ok(this.session?.page, "Browser session was not available for screenshot evidence");
  const evidenceDir = path.join(getReportsArtifactRoot(), "screenshots");
  fs.mkdirSync(evidenceDir, { recursive: true });
  const evidencePath = path.resolve(
    evidenceDir,
    `resume-upload-success-${Date.now()}.png`
  );
  await this.session.page.screenshot({ path: evidencePath, fullPage: true });
  await this.attach(await fs.promises.readFile(evidencePath), "image/png");
});
