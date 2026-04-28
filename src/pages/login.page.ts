import { Page } from "playwright";
import { waitForVisible } from "../utils/wait-utils";

export class LoginPage {
  private readonly page: Page;

  // TODO: Replace with app-specific locators.
  private readonly usernameSelector = "#username";
  private readonly passwordSelector = "#password";
  private readonly loginButtonSelector = "#loginBtn";
  private readonly dashboardSelector = "[data-test='dashboard']";
  private readonly loginErrorSelector = "[data-test='login-error']";

  constructor(page: Page) {
    this.page = page;
  }

  async open(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: "domcontentloaded" });
  }

  async enterUsername(username: string): Promise<void> {
    const usernameInput = this.page.locator(this.usernameSelector);
    await waitForVisible(usernameInput);
    await usernameInput.fill(username);
  }

  async enterPassword(password: string): Promise<void> {
    const passwordInput = this.page.locator(this.passwordSelector);
    await waitForVisible(passwordInput);
    await passwordInput.fill(password);
  }

  async clickLogin(): Promise<void> {
    const loginButton = this.page.locator(this.loginButtonSelector);
    await waitForVisible(loginButton);
    await loginButton.click();
  }

  async isDashboardVisible(): Promise<boolean> {
    const dashboardMarker = this.page.locator(this.dashboardSelector);
    await waitForVisible(dashboardMarker);
    return dashboardMarker.isVisible();
  }

  async isLoginErrorVisible(): Promise<boolean> {
    const loginError = this.page.locator(this.loginErrorSelector);
    await waitForVisible(loginError);
    return loginError.isVisible();
  }
}
