package com.rhythmicdevil.menu_planner.mealplan.dto;

import com.rhythmicdevil.menu_planner.mealplan.MealPlan;

import java.time.LocalDate;
import java.util.List;

public record MealPlanResponse(
        Long id,
        String name,
        LocalDate startDate,
        LocalDate endDate,
        List<MealPlanItemResponse> items
) {
    public static MealPlanResponse from(MealPlan mealPlan) {
        return new MealPlanResponse(
                mealPlan.getId(),
                mealPlan.getName(),
                mealPlan.getStartDate(),
                mealPlan.getEndDate(),
                mealPlan.getItems().stream().map(MealPlanItemResponse::from).toList()
        );
    }
}
