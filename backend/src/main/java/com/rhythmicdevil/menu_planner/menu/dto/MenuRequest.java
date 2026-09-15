package com.rhythmicdevil.menu_planner.menu.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.Set;

public record MenuRequest(
        @NotBlank String name,
        Set<Long> recipeIds
) {
}
