package com.rhythmicdevil.menu_planner.mealplan.dto;

import com.rhythmicdevil.menu_planner.mealplan.MealPlanItem;
import com.rhythmicdevil.menu_planner.mealplan.MealPlanItemType;
import com.rhythmicdevil.menu_planner.menu.dto.MenuResponse;
import com.rhythmicdevil.menu_planner.recipe.dto.RecipeSummary;
import com.rhythmicdevil.menu_planner.staplegroup.dto.StapleGroupResponse;

public record MealPlanItemResponse(
        Long id,
        MealPlanItemType itemType,
        RecipeSummary recipe,
        MenuResponse menu,
        StapleGroupResponse stapleGroup
) {
    public static MealPlanItemResponse from(MealPlanItem item) {
        return new MealPlanItemResponse(
                item.getId(),
                item.getItemType(),
                item.getRecipe() != null ? RecipeSummary.from(item.getRecipe()) : null,
                item.getMenu() != null ? MenuResponse.from(item.getMenu()) : null,
                item.getStapleGroup() != null ? StapleGroupResponse.from(item.getStapleGroup()) : null
        );
    }
}
