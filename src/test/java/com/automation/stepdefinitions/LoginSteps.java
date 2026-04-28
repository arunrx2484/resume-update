package com.automation.stepdefinitions;

import com.automation.pages.LoginPage;
import com.automation.utils.ConfigReader;
import com.automation.utils.DriverFactory;
import com.automation.utils.JsonDataReader;
import com.fasterxml.jackson.databind.JsonNode;
import io.cucumber.java.en.And;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.junit.Assert;

public class LoginSteps {

    private final JsonNode loginData = JsonDataReader.readJson("login-test-data.json");
    private LoginPage loginPage;

    private LoginPage loginPage() {
        if (loginPage == null) {
            loginPage = new LoginPage(DriverFactory.getDriver());
        }
        return loginPage;
    }

    @Given("the user is on the login page")
    public void theUserIsOnTheLoginPage() {
        loginPage().open(ConfigReader.get("baseUrl"));
    }

    @When("the user enters valid username and password")
    public void theUserEntersValidUsernameAndPassword() {
        JsonNode validUser = loginData.get("validUser");
        loginPage().enterUsername(validUser.get("username").asText());
        loginPage().enterPassword(validUser.get("password").asText());
    }

    @When("the user enters invalid username and password")
    public void theUserEntersInvalidUsernameAndPassword() {
        JsonNode invalidUser = loginData.get("invalidUser");
        loginPage().enterUsername(invalidUser.get("username").asText());
        loginPage().enterPassword(invalidUser.get("password").asText());
    }

    @And("the user clicks the login button")
    public void theUserClicksTheLoginButton() {
        loginPage().clickLogin();
    }

    @Then("the user should be redirected to the dashboard")
    public void theUserShouldBeRedirectedToTheDashboard() {
        Assert.assertTrue("Dashboard is not visible after successful login", loginPage().isDashboardVisible());
    }

    @Then("the user should see a login error message")
    public void theUserShouldSeeALoginErrorMessage() {
        Assert.assertTrue("Login error is not visible for invalid credentials", loginPage().isLoginErrorVisible());
    }
}
