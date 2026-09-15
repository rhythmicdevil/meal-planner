package com.rhythmicdevil.menu_planner.recipe.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

import java.util.List;
import java.util.Set;

public record RecipeRequest(
        @NotBlank String name,
        String sourceUrl,
        String sourceName,
        @Positive Integer servings,
        List<@Valid RecipeStepDto> steps,
        List<@Valid RecipeIngredientRequest> ingredients,
        Set<String> tags
) {
}
