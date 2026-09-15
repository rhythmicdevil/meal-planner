package com.rhythmicdevil.menu_planner.recipe.dto;

import com.rhythmicdevil.menu_planner.recipe.CutType;
import com.rhythmicdevil.menu_planner.recipe.RecipeIngredient;
import com.rhythmicdevil.menu_planner.recipe.StateCondition;

import java.math.BigDecimal;

public record RecipeIngredientResponse(
        Long id,
        Long ingredientId,
        String ingredientName,
        BigDecimal amount,
        String unit,
        CutType cutType,
        String cutTypeOther,
        StateCondition stateCondition,
        String stateConditionOther,
        String notes
) {
    public static RecipeIngredientResponse from(RecipeIngredient recipeIngredient) {
        return new RecipeIngredientResponse(
                recipeIngredient.getId(),
                recipeIngredient.getIngredient().getId(),
                recipeIngredient.getIngredient().getName(),
                recipeIngredient.getAmount(),
                recipeIngredient.getUnit(),
                recipeIngredient.getCutType(),
                recipeIngredient.getCutTypeOther(),
                recipeIngredient.getStateCondition(),
                recipeIngredient.getStateConditionOther(),
                recipeIngredient.getNotes()
        );
    }
}
