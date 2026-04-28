import path from "node:path";
import { Locator, Page } from "playwright";

export class NaukriProfilePage {
  constructor(private readonly page: Page) {}

  private loginTrigger(): Locator {
    return this.page.getByRole("link", { name: /login/i }).first();
  }

  private usernameInput(): Locator {
    return this.page
      .locator(
        "input[placeholder*='Email ID'], input[placeholder*='Username'], input[type='text'][name*='email' i], input[id*='username' i]"
      )
      .first();
  }

  private passwordInput(): Locator {
    return this.page
      .locator("input[type='password'], input[placeholder*='Password'], input[name*='password' i], input[id*='password' i]")
      .first();
  }

  private loginSubmitButton(): Locator {
    return this.page
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
    return this.page.locator("text=/Last updated|last updated/i").first();
  }

  async openHome(): Promise<void> {
    await this.page.goto("https://www.naukri.com", { waitUntil: "domcontentloaded" });
    await this.page.waitForLoadState("networkidle");
  }

  async openLoginPanel(): Promise<void> {
    let openedFromHeader = false;
    try {
      await this.loginTrigger().click({ timeout: 5000 });
      await this.page.waitForLoadState("domcontentloaded");
      openedFromHeader = true;
    } catch {
      // Ignore and fall back to direct login URL.
    }

    if (!openedFromHeader) {
      // CI/headless often hides or overlays the top-right login CTA.
      await this.page.goto("https://www.naukri.com/nlogin/login", { waitUntil: "domcontentloaded" });
    }
    await this.usernameInput().waitFor({ state: "visible", timeout: 30000 });
  }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput().waitFor({ state: "visible", timeout: 30000 });
    await this.usernameInput().fill(username);
    await this.passwordInput().waitFor({ state: "visible", timeout: 30000 });
    await this.passwordInput().fill(password);
    await this.loginSubmitButton().click();
    await this.page.waitForLoadState("networkidle");
  }

  async isProfileWidgetVisible(): Promise<boolean> {
    await this.page.waitForLoadState("networkidle");
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

    return this.page
      .waitForFunction(() => {
        const body = document.body.innerText.toLowerCase();
        return (
          body.includes("my naukri") ||
          body.includes("view & update profile") ||
          body.includes("view profile")
        );
      }, undefined, { timeout: 30000 })
      .then(() => true)
      .catch(() => false);
  }

  async navigateToProfileFromMenu(): Promise<void> {
    await this.profileWidget().click();
    await this.viewAndUpdateProfileItem().waitFor({ state: "visible", timeout: 30000 });
    await Promise.all([
      this.page.waitForURL(/\/mnjuser\/profile|\/profile/i, { timeout: 30000 }).catch(() => {}),
      this.viewAndUpdateProfileItem().click()
    ]);
    await this.page.waitForLoadState("domcontentloaded");
    await this.resumeHeadline().waitFor({ state: "visible", timeout: 30000 });
  }

  async getResumeLastUpdatedText(): Promise<string> {
    const text = (await this.lastUpdatedLabel().textContent()) ?? "";
    return text.trim();
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
