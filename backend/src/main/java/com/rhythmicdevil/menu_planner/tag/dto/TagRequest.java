package com.rhythmicdevil.menu_planner.tag.dto;

import com.rhythmicdevil.menu_planner.tag.TagType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record TagRequest(
        @NotBlank String name,
        @NotNull TagType type
) {
}
