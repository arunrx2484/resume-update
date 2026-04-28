package com.automation.pages;

import com.automation.utils.WaitUtils;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

public class LoginPage {

    private final WebDriver driver;

    // TODO: Update locators based on actual application DOM.
    private final By usernameInput = By.id("username");
    private final By passwordInput = By.id("password");
    private final By loginButton = By.id("loginBtn");
    private final By dashboardMarker = By.cssSelector("[data-test='dashboard']");
    private final By loginError = By.cssSelector("[data-test='login-error']");

    public LoginPage(WebDriver driver) {
        this.driver = driver;
    }

    public void open(String loginUrl) {
        driver.get(loginUrl);
    }

    public void enterUsername(String username) {
        WaitUtils.waitForVisible(driver, usernameInput).sendKeys(username);
    }

    public void enterPassword(String password) {
        WaitUtils.waitForVisible(driver, passwordInput).sendKeys(password);
    }

    public void clickLogin() {
        WaitUtils.waitForClickable(driver, loginButton).click();
    }

    public boolean isDashboardVisible() {
        return WaitUtils.waitForVisible(driver, dashboardMarker).isDisplayed();
    }

    public boolean isLoginErrorVisible() {
        return WaitUtils.waitForVisible(driver, loginError).isDisplayed();
    }
}
