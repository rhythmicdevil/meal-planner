package com.rhythmicdevil.menu_planner.staplegroup.dto;

import com.rhythmicdevil.menu_planner.staplegroup.StapleItem;
import com.rhythmicdevil.menu_planner.store.dto.StoreResponse;

import java.util.Comparator;
import java.util.List;

public record StapleItemResponse(
        Long id,
        String name,
        Long ingredientId,
        String ingredientName,
        List<StoreResponse> stores
) {
    public static StapleItemResponse from(StapleItem item) {
        return new StapleItemResponse(
                item.getId(),
                item.getName(),
                item.getIngredient() != null ? item.getIngredient().getId() : null,
                item.getIngredient() != null ? item.getIngredient().getName() : null,
                item.getStores().stream()
                        .map(StoreResponse::from)
                        .sorted(Comparator.comparing(StoreResponse::name))
                        .toList()
        );
    }
}
