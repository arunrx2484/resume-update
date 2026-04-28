package com.automation.utils;

import com.automation.constants.FrameworkConstants;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public final class ScreenshotUtils {

    private ScreenshotUtils() {
    }

    public static byte[] captureAsBytes(WebDriver driver) {
        return ((TakesScreenshot) driver).getScreenshotAs(OutputType.BYTES);
    }

    public static String captureToFile(WebDriver driver, String fileName) {
        try {
            Path screenshotDir = Paths.get(FrameworkConstants.SCREENSHOT_DIR);
            Files.createDirectories(screenshotDir);
            Path screenshotPath = screenshotDir.resolve(fileName + ".png");
            Files.write(screenshotPath, ((TakesScreenshot) driver).getScreenshotAs(OutputType.BYTES));
            return screenshotPath.toString();
        } catch (IOException e) {
            throw new IllegalStateException("Unable to save screenshot to file", e);
        }
    }
}
