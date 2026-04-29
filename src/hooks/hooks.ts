import { After, Before, BeforeAll, Status, setDefaultTimeout } from "@cucumber/cucumber";
import { CustomWorld } from "../support/world";
import { getConfig } from "../utils/config-reader";
import { logger } from "../utils/logger";
import { startBrowserSession, stopBrowserSession } from "../utils/browser-manager";
import { LoginPage } from "../pages/login.page";
import { captureFailureScreenshot } from "../utils/screenshot-utils";
import { ApiClient } from "../utils/api-client";
import { NaukriProfilePage } from "../pages/naukri-profile.page";
import { validateNaukriRunConfig } from "../utils/pre-run-validator";

setDefaultTimeout(process.env.CI === "true" ? 180 * 1000 : 120 * 1000);

BeforeAll(function () {
  validateNaukriRunConfig();
});

Before(async function (this: CustomWorld, scenario) {
  const config = getConfig();
  logger.info(`Starting scenario: ${scenario.pickle.name} | env=${config.env} | browser=${config.browser}`);
  this.session = await startBrowserSession();
  this.loginPage = new LoginPage(this.session.page);
  this.naukriProfilePage = new NaukriProfilePage(this.session.page);
  this.apiClient = new ApiClient(config.apiBaseUrl);
});

After(async function (this: CustomWorld, scenario) {
  try {
    if (this.session && scenario.result?.status === Status.FAILED) {
      const screenshot = await captureFailureScreenshot(this.session.page, scenario.pickle.name);
      await this.attach(screenshot.bytes, "image/png");
      logger.error(`Scenario failed: ${scenario.pickle.name} | screenshot=${screenshot.filePath}`);
    } else {
      logger.info(`Scenario finished: ${scenario.pickle.name} | status=${scenario.result?.status}`);
    }
  } finally {
    if (this.apiClient) {
      await this.apiClient.dispose();
    }
    if (this.session) {
      await stopBrowserSession(this.session);
      this.session = undefined;
    }
  }
});
