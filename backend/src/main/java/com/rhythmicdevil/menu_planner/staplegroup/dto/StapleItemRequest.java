package com.rhythmicdevil.menu_planner.staplegroup.dto;

import jakarta.validation.constraints.NotBlank;

public record StapleItemRequest(
        @NotBlank String name,
        Long ingredientId
) {
}
