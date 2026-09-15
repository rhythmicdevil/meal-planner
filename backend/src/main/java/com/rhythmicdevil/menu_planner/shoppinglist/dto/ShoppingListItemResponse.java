package com.rhythmicdevil.menu_planner.shoppinglist.dto;

import com.rhythmicdevil.menu_planner.ingredient.IngredientCategory;
import com.rhythmicdevil.menu_planner.recipe.dto.RecipeSummary;

import java.math.BigDecimal;
import java.util.List;

public record ShoppingListItemResponse(
        Long ingredientId,
        String ingredientName,
        IngredientCategory category,
        BigDecimal totalAmount,
        String unit,
        boolean toTaste,
        List<RecipeSummary> sourceRecipes
) {
}
