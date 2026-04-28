import { Given, When, Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import { CustomWorld } from "../support/world";
import { getConfig } from "../utils/config-reader";
import { readLoginData } from "../utils/test-data-reader";

const loginData = readLoginData();

Given("the user is on the login page", async function (this: CustomWorld) {
  const config = getConfig();
  await this.loginPage?.open(config.baseUrl);
});

When("the user enters valid username and password", async function (this: CustomWorld) {
  await this.loginPage?.enterUsername(loginData.validUser.username);
  await this.loginPage?.enterPassword(loginData.validUser.password);
});

When("the user enters invalid username and password", async function (this: CustomWorld) {
  await this.loginPage?.enterUsername(loginData.invalidUser.username);
  await this.loginPage?.enterPassword(loginData.invalidUser.password);
});

When("the user clicks the login button", async function (this: CustomWorld) {
  await this.loginPage?.clickLogin();
});

Then("the user should be redirected to the dashboard", async function (this: CustomWorld) {
  const visible = await this.loginPage?.isDashboardVisible();
  assert.equal(visible, true, "Dashboard should be visible after successful login");
});

Then("the user should see a login error message", async function (this: CustomWorld) {
  const visible = await this.loginPage?.isLoginErrorVisible();
  assert.equal(visible, true, "Login error should be visible for invalid credentials");
});
