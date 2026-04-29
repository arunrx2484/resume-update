import path from "node:path";
import { Frame, Locator, Page } from "playwright";

export class NaukriProfilePage {
  private loginFrame: Frame | null = null;

  constructor(private readonly page: Page) {}

  /** GitHub Actions + optional local override: open /nlogin directly (more reliable than homepage modal). */
  private isCiPreferDirectLogin(): boolean {
    return process.env.CI === "true" || process.env.NAUKRI_FORCE_DIRECT_LOGIN === "true";
  }

  private directLoginUrlCandidates(): string[] {
    return [
      "https://www.naukri.com/nlogin/login",
      "https://www.naukri.com/nlogin/login?URL=https%3A%2F%2Fwww.naukri.com%2Fnlogin%2Flogin",
    ];
  }

  /** Broad login-field selector list (Naukri often A/B tests DOM / mobile email field). */
  private usernameFieldSelectorList(): string {
    return [
      "input#usernameField",
      "input#usernameFieldTop",
      "input[name='email']",
      "input[name='username']",
      "input[type='email']",
      "input[autocomplete='username']",
      "input[placeholder*='Email' i]",
      "input[placeholder*='Mobile' i]",
      "input[placeholder*='Username' i]",
      "input[type='text'][name*='email' i]",
      "input[id*='username' i]",
      "input[formcontrolname*='user' i]",
      "input[data-testid*='user' i]",
    ].join(", ");
  }


  private async throwIfAccessDeniedByWaf(): Promise<void> {
    const text = (await this.page.evaluate(() => document.body?.innerText ?? "")).toLowerCase();
    const blocked =
      text.includes("access denied") ||
      text.includes("you don't have permission to access") ||
      text.includes("errors.edgesuite.net") ||
      text.includes("akamai") ||
      text.includes("reference #");
    if (blocked) {
      throw new Error(
        `Naukri denied access from this runner/network (likely WAF/IP block). url=${this.safePageUrl()}`
      );
    }
  }

  private loginContext(): Page | Frame {
    return this.loginFrame ?? this.page;
  }

  private loginTrigger(): Locator {
    return this.page.getByRole("link", { name: /login/i }).first();
  }

  private usernameInput(): Locator {
    return this.loginContext().locator(this.usernameFieldSelectorList()).first();
  }

  private passwordInput(): Locator {
    return this.loginContext()
      .locator("input[type='password'], input[placeholder*='Password'], input[name*='password' i], input[id*='password' i]")
      .first();
  }

  private loginSubmitButton(): Locator {
    return this.loginContext()
      .locator("button:has-text('Login'), button[type='submit']:has-text('Login'), .loginButton, [data-ga-track*='login']")
      .first();
  }

  private profileWidget(): Locator {
    return this.page.locator(
      "[data-ga-track*='MyNaukri'], [title*='View profile'], [class*='nI-gNb-drawer__icon'], [class*='nI-gNb-drawer'], a:has-text('My Naukri')"
    ).first();
  }

  private viewAndUpdateProfileItem(): Locator {
    return this.page.getByRole("link", { name: /view.*update profile/i }).first();
  }

  private updateResumeButton(): Locator {
    return this.page.getByRole("button", { name: /update resume/i }).first();
  }

  private resumeFileInput(): Locator {
    return this.page.locator("input[type='file']").first();
  }

  private resumeHeadline(): Locator {
    return this.page.getByText(/resume/i).first();
  }

  private lastUpdatedLabel(): Locator {
    return this.page
      .locator(
        [
          "text=/Last updated|last updated|updated on|resume updated/i",
          "[class*='update' i]:has-text('updated')",
          "[class*='resume' i]:has-text('updated')",
          "[data-test*='updated' i]",
        ].join(", ")
      )
      .first();
  }

  async openHome(): Promise<void> {
    const timeout = this.isCiPreferDirectLogin() ? 60_000 : 120_000;
    await this.page.goto("https://www.naukri.com", { waitUntil: "domcontentloaded", timeout });
    await this.throwIfAccessDeniedByWaf();
    // networkidle often never settles on CI (analytics); only wait for it locally.
    if (!this.isCiPreferDirectLogin()) {
      await this.page.waitForLoadState("networkidle").catch(() => {});
    } else {
      await this.page.waitForTimeout(1500);
    }
    await this.dismissBlockingUi();
    await this.maybeAcceptConsent();
  }

  async openLoginPanel(): Promise<void> {
    this.loginFrame = null;

    if (this.isCiPreferDirectLogin()) {
      for (const url of this.directLoginUrlCandidates()) {
        try {
          await this.page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
          await this.throwIfAccessDeniedByWaf();
          await this.throwIfAccessDeniedByWaf();
          await this.page.waitForTimeout(2000);
          await this.dismissBlockingUi();
          await this.maybeAcceptConsent();
          await this.waitForAntiBotOrChallengeToSettle();
          if (await this.findLoginContextByFields(20_000)) {
            return;
          }
          await this.clickExtraLoginTriggers();
          if (await this.findLoginContextByFields(20_000)) {
            return;
          }
        } catch {
          // try next URL
        }
      }
    }

    let openedFromHeader = false;
    try {
      await this.dismissBlockingUi();
      await this.maybeAcceptConsent();
      await this.loginTrigger().click({ timeout: 8000 });
      await this.page.waitForLoadState("domcontentloaded");
      openedFromHeader = true;
    } catch {
      // Ignore and fall back to direct login URL.
    }

    if (!openedFromHeader) {
      openedFromHeader = await this.tryOpenLoginFromFrames();
    }

    if (!openedFromHeader) {
      await this.page.goto("https://www.naukri.com/nlogin/login", {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      });
      await this.throwIfAccessDeniedByWaf();
      await this.dismissBlockingUi();
      await this.maybeAcceptConsent();
      await this.waitForAntiBotOrChallengeToSettle();
    }
    await this.ensureLoginFormVisible();
  }

  private async maybeAcceptConsent(): Promise<void> {
    const candidates = [
      "#onetrust-accept-btn-handler",
      "button[id*='accept' i][class*='onetrust' i]",
      "button:has-text('Accept')",
      "button:has-text('I Accept')",
      "button:has-text('Got it')",
      "button:has-text('Allow all')",
    ];
    for (const sel of candidates) {
      await this.page.locator(sel).first().click({ timeout: 2000 }).catch(() => {});
    }
  }

  /** Best-effort wait when Naukri / edge shows a short challenge interstitial. */
  private async waitForAntiBotOrChallengeToSettle(): Promise<void> {
    const deadline = Date.now() + 20_000;
    while (Date.now() < deadline) {
      const text = ((await this.page.evaluate(() => document.body?.innerText ?? "")) || "").toLowerCase();
      const stuck =
        text.includes("just a moment") ||
        text.includes("checking your browser") ||
        text.includes("needs to review") ||
        text.includes("verifying") ||
        text.includes("enable javascript");
      if (!stuck) break;
      await this.page.waitForTimeout(1800);
    }
  }

  private async dismissBlockingUi(): Promise<void> {
    await this.page.keyboard.press("Escape").catch(() => {});
    await this.page
      .locator("button[aria-label*='close' i], button[title*='close' i], .crossIcon, .close, .close-btn")
      .first()
      .click({ timeout: 2000 })
      .catch(() => {});
    await this.page
      .locator("iframe[title*='ad' i], iframe[id*='google_ads' i], iframe[src*='doubleclick' i]")
      .evaluateAll((frames) => frames.forEach((f) => ((f as HTMLElement).style.display = "none")))
      .catch(() => {});
  }

  private async clickExtraLoginTriggers(): Promise<void> {
    await this.page.getByRole("button", { name: /login/i }).first().click({ timeout: 4000 }).catch(() => {});
    await this.page.getByRole("link", { name: /login/i }).first().click({ timeout: 4000 }).catch(() => {});
    await this.page.locator("[data-ga-track*='login'], .loginButton").first().click({ timeout: 4000 }).catch(() => {});
  }

  private async tryOpenLoginFromFrames(): Promise<boolean> {
    for (const frame of this.page.frames()) {
      try {
        await frame.getByRole("link", { name: /login/i }).first().click({ timeout: 2000 });
        return true;
      } catch {
        // try next frame
      }
      try {
        await frame.getByRole("button", { name: /login/i }).first().click({ timeout: 2000 });
        return true;
      } catch {
        // try next frame
      }
    }
    return false;
  }

  private async findLoginContextByFields(timeoutMs = 5000): Promise<boolean> {
    const deadline = Date.now() + timeoutMs;
    const selector = this.usernameFieldSelectorList();

    while (Date.now() < deadline) {
      const frames = this.page.frames().filter(Boolean);
      for (const frame of frames) {
        const group = frame.locator(selector);
        const count = await group.count().catch(() => 0);
        for (let i = 0; i < Math.min(count, 12); i++) {
          const field = group.nth(i);
          await field.scrollIntoViewIfNeeded().catch(() => {});
          const visible =
            (await field.isVisible().catch(() => false)) ||
            (await field
              .evaluate((el: Element) => {
                const h = el as HTMLElement;
                const s = window.getComputedStyle(h);
                return !!h.offsetParent && s.visibility !== "hidden" && s.display !== "none" && Number(s.opacity) > 0;
              })
              .catch(() => false));

          const box = await field.boundingBox().catch(() => null);
          const sized = box !== null && box.width > 2 && box.height > 2;
          if (visible || sized) {
            this.loginFrame = frame;
            return true;
          }
        }
      }
      await this.page.waitForTimeout(450);
    }
    return false;
  }

  private async ensureLoginFormVisible(): Promise<void> {
    const firstPassMs = this.isCiPreferDirectLogin() ? 8_000 : 5_000;
    let usernameReady = await this.findLoginContextByFields(firstPassMs);
    if (usernameReady) {
      return;
    }

    await this.maybeAcceptConsent();
    await this.waitForAntiBotOrChallengeToSettle();
    await this.clickExtraLoginTriggers();

    usernameReady = await this.findLoginContextByFields(20_000);
    if (usernameReady) {
      return;
    }

    if (this.isCiPreferDirectLogin()) {
      for (const url of this.directLoginUrlCandidates()) {
        try {
          await this.page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
          await this.throwIfAccessDeniedByWaf();
          await this.throwIfAccessDeniedByWaf();
          await this.dismissBlockingUi();
          await this.maybeAcceptConsent();
          await this.waitForAntiBotOrChallengeToSettle();
          usernameReady = await this.findLoginContextByFields(20_000);
          if (usernameReady) return;
          await this.clickExtraLoginTriggers();
          usernameReady = await this.findLoginContextByFields(20_000);
          if (usernameReady) return;
        } catch {
          //
        }
      }
    }

    throw new Error(`Login form fields were not visible in page or any iframe (url=${this.safePageUrl()}).`);
  }

  private safePageUrl(): string {
    try {
      return this.page.url();
    } catch {
      return "unknown";
    }
  }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput().waitFor({ state: "visible", timeout: 30000 });
    await this.usernameInput().fill(username);
    await this.passwordInput().waitFor({ state: "visible", timeout: 30000 });
    await this.passwordInput().fill(password);
    await this.loginSubmitButton().click();
    await this.page.waitForLoadState("networkidle").catch(async () => {
      await this.page.waitForLoadState("load").catch(() => {});
    });
  }

  async isProfileWidgetVisible(): Promise<boolean> {
    await this.page.waitForLoadState("networkidle").catch(() => {});
    const quickVisible = await this.profileWidget().isVisible().catch(() => false);
    if (quickVisible) {
      return true;
    }

    const authMarker = this.page
      .locator("text=/My Naukri|View profile|View & Update Profile|Complete profile/i")
      .first();
    const authMarkerVisible = await authMarker.isVisible().catch(() => false);
    if (authMarkerVisible) {
      return true;
    }

    // Some logged-in variants do not render the header drawer immediately.
    // Treat known authenticated URLs / logout markers as successful login.
    const url = this.safePageUrl().toLowerCase();
    if (
      url.includes("/mnjuser/") ||
      url.includes("/naukriuser/") ||
      url.includes("/my-profile") ||
      url.includes("/dashboard") ||
      url.includes("/jobseeker")
    ) {
      return true;
    }

    const logoutVisible = await this.page
      .locator("a:has-text('Logout'), button:has-text('Logout'), [data-ga-track*='logout' i]")
      .first()
      .isVisible()
      .catch(() => false);
    if (logoutVisible) {
      return true;
    }

    return this.page
      .waitForFunction(() => {
        const body = document.body.innerText.toLowerCase();
        return (
          body.includes("my naukri") ||
          body.includes("view & update profile") ||
          body.includes("view profile") ||
          body.includes("logout") ||
          body.includes("complete profile")
        );
      }, undefined, { timeout: 30000 })
      .then(() => true)
      .catch(() => false);
  }

  async navigateToProfileFromMenu(): Promise<void> {
    const clickedMenu = await this.profileWidget()
      .click({ timeout: 5000 })
      .then(() => true)
      .catch(() => false);

    if (clickedMenu) {
      const itemVisible = await this.viewAndUpdateProfileItem()
        .waitFor({ state: "visible", timeout: 10000 })
        .then(() => true)
        .catch(() => false);
      if (itemVisible) {
        await Promise.all([
          this.page.waitForURL(/\/mnjuser\/profile|\/profile/i, { timeout: 30000 }).catch(() => {}),
          this.viewAndUpdateProfileItem().click()
        ]);
      } else {
        await this.page.goto("https://www.naukri.com/mnjuser/profile", { waitUntil: "domcontentloaded", timeout: 60000 });
      }
    } else {
      // Some sessions log in successfully but do not show the header drawer immediately.
      await this.page.goto("https://www.naukri.com/mnjuser/profile", { waitUntil: "domcontentloaded", timeout: 60000 });
    }

    await this.page.waitForLoadState("domcontentloaded");
    await this.resumeHeadline().waitFor({ state: "visible", timeout: 30000 });
  }

  async getResumeLastUpdatedText(): Promise<string> {
    const locatorText = await this.lastUpdatedLabel()
      .textContent({ timeout: 10000 })
      .catch(() => null);
    const fromLocator = (locatorText ?? "").trim();
    if (fromLocator) {
      return fromLocator;
    }

    // Fallback for layout variants where label is plain text near resume section.
    const bodyText = await this.page.evaluate(() => document.body?.innerText ?? "");
    const match = bodyText.match(/(?:profile|resume)?\s*last\s*updated[^\n]*/i) || bodyText.match(/updated on[^\n]*/i);
    return (match?.[0] ?? "").trim();
  }

  async clickUpdateResume(): Promise<void> {
    await this.updateResumeButton().click();
  }

  async uploadResume(resumePath: string): Promise<void> {
    const absolutePath = path.resolve(resumePath);
    await this.resumeFileInput().setInputFiles(absolutePath);
  }

  async waitForResumeDateChange(previousDateText: string): Promise<string> {
    await this.page.waitForFunction(
      ({ previous }) => {
        const text = document.body.innerText;
        const match = text.match(/last updated[^\n]*/i);
        const current = match ? match[0].trim() : "";
        return current.length > 0 && current !== previous;
      },
      { previous: previousDateText },
      { timeout: 45000 }
    );
    return this.getResumeLastUpdatedText();
  }
}
