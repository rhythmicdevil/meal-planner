package com.rhythmicdevil.menu_planner.staplegroup.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record StapleGroupRequest(
        @NotBlank String name,
        List<@Valid StapleItemRequest> items
) {
}
