package com.automation.constants;

public final class FrameworkConstants {

    private FrameworkConstants() {
    }

    public static final String DEFAULT_ENV = "qa";
    public static final String DEFAULT_BROWSER = "chrome";
    public static final int DEFAULT_WAIT_SECONDS = 15;

    public static final String CONFIG_DIR = "config";
    public static final String TESTDATA_DIR = "testdata";

    public static final String REPORT_DIR = "target/cucumber-reports";
    public static final String SCREENSHOT_DIR = "reports/screenshots";
}
