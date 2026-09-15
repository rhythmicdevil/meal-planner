package com.rhythmicdevil.menu_planner.mealplan.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;
import java.util.List;

public record MealPlanRequest(
        @NotBlank String name,
        LocalDate startDate,
        LocalDate endDate,
        List<@Valid MealPlanItemRequest> items
) {
}
