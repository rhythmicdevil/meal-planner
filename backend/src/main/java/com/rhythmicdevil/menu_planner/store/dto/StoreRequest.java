package com.rhythmicdevil.menu_planner.store.dto;

import jakarta.validation.constraints.NotBlank;

public record StoreRequest(
        @NotBlank String name
) {
}
