package com.rhythmicdevil.menu_planner.ingredient.dto;

import com.rhythmicdevil.menu_planner.ingredient.IngredientCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.Set;

public record IngredientRequest(
        @NotBlank String name,
        Set<String> aliases,
        String defaultUnit,
        @NotNull IngredientCategory category
) {
}
