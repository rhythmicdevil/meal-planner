package com.rhythmicdevil.menu_planner.mealplan.dto;

import com.rhythmicdevil.menu_planner.mealplan.MealPlanItemType;
import jakarta.validation.constraints.NotNull;

public record MealPlanItemRequest(
        @NotNull MealPlanItemType itemType,
        Long recipeId,
        Long menuId
) {
}
