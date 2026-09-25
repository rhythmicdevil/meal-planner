package com.rhythmicdevil.menu_planner.staplegroup.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.Set;

public record StapleItemRequest(
        @NotBlank String name,
        Long ingredientId,
        Set<Long> storeIds,
        Integer quantity
) {
}
