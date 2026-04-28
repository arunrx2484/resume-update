package com.automation.utils;

import com.automation.constants.FrameworkConstants;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.io.InputStream;

public final class JsonDataReader {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private JsonDataReader() {
    }

    public static JsonNode readJson(String fileName) {
        String resourcePath = FrameworkConstants.TESTDATA_DIR + "/" + fileName;
        try (InputStream stream = JsonDataReader.class.getClassLoader().getResourceAsStream(resourcePath)) {
            if (stream == null) {
                throw new IllegalStateException("Test data file not found: " + resourcePath);
            }
            return OBJECT_MAPPER.readTree(stream);
        } catch (IOException e) {
            throw new IllegalStateException("Unable to read test data file: " + resourcePath, e);
        }
    }
}
