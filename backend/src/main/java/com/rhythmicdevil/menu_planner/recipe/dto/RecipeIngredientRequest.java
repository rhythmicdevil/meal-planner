package com.rhythmicdevil.menu_planner.recipe.dto;

import com.rhythmicdevil.menu_planner.recipe.CutType;
import com.rhythmicdevil.menu_planner.recipe.StateCondition;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record RecipeIngredientRequest(
        @NotNull Long ingredientId,
        @NotNull @Positive BigDecimal amount,
        @NotBlank String unit,
        CutType cutType,
        String cutTypeOther,
        StateCondition stateCondition,
        String stateConditionOther,
        String notes
) {
}
