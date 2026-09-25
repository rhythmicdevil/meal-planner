package com.rhythmicdevil.menu_planner.shoppinglist.dto;

public record ShoppingListStapleItemResponse(
        Long stapleItemId,
        String name,
        String stapleGroupName,
        int quantity
) {
}
