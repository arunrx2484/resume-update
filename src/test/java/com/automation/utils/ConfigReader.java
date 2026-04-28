package com.automation.utils;

import com.automation.constants.FrameworkConstants;

import java.io.IOException;
import java.io.InputStream;
import java.util.Objects;
import java.util.Properties;

public final class ConfigReader {

    private static final Properties PROPERTIES = new Properties();
    private static final String ENV = System.getProperty("env", FrameworkConstants.DEFAULT_ENV).toLowerCase();

    static {
        String configFile = FrameworkConstants.CONFIG_DIR + "/" + ENV + ".properties";
        try (InputStream stream = ConfigReader.class.getClassLoader().getResourceAsStream(configFile)) {
            if (stream == null) {
                throw new IllegalStateException("Environment config not found: " + configFile);
            }
            PROPERTIES.load(stream);
        } catch (IOException e) {
            throw new IllegalStateException("Unable to load config: " + configFile, e);
        }
    }

    private ConfigReader() {
    }

    public static String getEnv() {
        return ENV;
    }

    public static String getBrowser() {
        return System.getProperty("browser", FrameworkConstants.DEFAULT_BROWSER).toLowerCase();
    }

    public static String get(String key) {
        return Objects.requireNonNull(PROPERTIES.getProperty(key), "Missing config key: " + key).trim();
    }

    public static String getOrDefault(String key, String defaultValue) {
        return PROPERTIES.getProperty(key, defaultValue).trim();
    }
}
