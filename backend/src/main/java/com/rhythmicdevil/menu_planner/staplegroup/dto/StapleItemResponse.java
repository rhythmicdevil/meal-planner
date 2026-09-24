package com.rhythmicdevil.menu_planner.staplegroup.dto;

import com.rhythmicdevil.menu_planner.staplegroup.StapleItem;

public record StapleItemResponse(
        Long id,
        String name,
        Long ingredientId,
        String ingredientName
) {
    public static StapleItemResponse from(StapleItem item) {
        return new StapleItemResponse(
                item.getId(),
                item.getName(),
                item.getIngredient() != null ? item.getIngredient().getId() : null,
                item.getIngredient() != null ? item.getIngredient().getName() : null
        );
    }
}
