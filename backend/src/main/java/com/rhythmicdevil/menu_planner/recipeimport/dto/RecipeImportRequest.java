package com.rhythmicdevil.menu_planner.recipeimport.dto;

import jakarta.validation.constraints.NotBlank;

public record RecipeImportRequest(
        @NotBlank String url
) {
}
