package com.rhythmicdevil.menu_planner.recipe.dto;

import com.rhythmicdevil.menu_planner.recipe.CutType;
import com.rhythmicdevil.menu_planner.recipe.StateCondition;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

// amount/unit are optional: a "to taste" ingredient (e.g. salt) has no fixed quantity.
public record RecipeIngredientRequest(
        @NotNull Long ingredientId,
        @Positive BigDecimal amount,
        String unit,
        CutType cutType,
        String cutTypeOther,
        StateCondition stateCondition,
        String stateConditionOther,
        String notes
) {
}
