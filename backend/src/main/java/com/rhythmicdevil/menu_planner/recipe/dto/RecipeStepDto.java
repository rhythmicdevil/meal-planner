package com.rhythmicdevil.menu_planner.recipe.dto;

import com.rhythmicdevil.menu_planner.recipe.RecipeStep;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record RecipeStepDto(
        @Positive int stepNumber,
        @NotBlank String stepText
) {
    public static RecipeStepDto from(RecipeStep step) {
        return new RecipeStepDto(step.getStepNumber(), step.getStepText());
    }

    public RecipeStep toEntity() {
        return new RecipeStep(stepNumber, stepText);
    }
}
