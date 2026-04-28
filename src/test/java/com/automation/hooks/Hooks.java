package com.automation.hooks;

import com.automation.utils.ConfigReader;
import com.automation.utils.DriverFactory;
import com.automation.utils.ScreenshotUtils;
import io.cucumber.java.After;
import io.cucumber.java.Before;
import io.cucumber.java.Scenario;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.openqa.selenium.WebDriver;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class Hooks {

    private static final Logger LOGGER = LogManager.getLogger(Hooks.class);
    private static final DateTimeFormatter FILE_TIMESTAMP = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");

    @Before
    public void beforeScenario(Scenario scenario) {
        String browser = ConfigReader.getBrowser();
        LOGGER.info("Starting scenario: {} | env={} | browser={}", scenario.getName(), ConfigReader.getEnv(), browser);
        DriverFactory.initializeDriver(browser);
    }

    @After
    public void afterScenario(Scenario scenario) {
        WebDriver driver = DriverFactory.getDriver();
        if (scenario.isFailed()) {
            String screenshotName = scenario.getName().replaceAll("[^a-zA-Z0-9-_]", "_")
                    + "_"
                    + LocalDateTime.now().format(FILE_TIMESTAMP);
            byte[] screenshotBytes = ScreenshotUtils.captureAsBytes(driver);
            scenario.attach(screenshotBytes, "image/png", "Failure Screenshot");
            String screenshotPath = ScreenshotUtils.captureToFile(driver, screenshotName);
            LOGGER.error("Scenario failed: {} | screenshot={}", scenario.getName(), screenshotPath);
        } else {
            LOGGER.info("Scenario passed: {}", scenario.getName());
        }
        DriverFactory.quitDriver();
    }
}
