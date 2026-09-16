package com.rhythmicdevil.menu_planner.preplist.dto;

import com.rhythmicdevil.menu_planner.recipe.CutType;
import com.rhythmicdevil.menu_planner.recipe.StateCondition;
import com.rhythmicdevil.menu_planner.recipe.dto.RecipeSummary;

import java.math.BigDecimal;
import java.util.List;

public record PrepListItemResponse(
        Long ingredientId,
        String ingredientName,
        BigDecimal amount,
        String unit,
        CutType cutType,
        String cutTypeOther,
        StateCondition stateCondition,
        String stateConditionOther,
        boolean toTaste,
        List<RecipeSummary> sourceRecipes
) {
}
