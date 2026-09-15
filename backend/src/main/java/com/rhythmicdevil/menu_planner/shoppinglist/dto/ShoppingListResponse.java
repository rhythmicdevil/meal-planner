package com.rhythmicdevil.menu_planner.shoppinglist.dto;

import java.util.List;

public record ShoppingListResponse(
        Long mealPlanId,
        List<ShoppingListItemResponse> items
) {
}
