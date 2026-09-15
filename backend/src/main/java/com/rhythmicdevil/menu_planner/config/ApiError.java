package com.rhythmicdevil.menu_planner.config;

import java.util.Map;

public record ApiError(String message, Map<String, String> fieldErrors) {
    public ApiError(String message) {
        this(message, null);
    }
}
