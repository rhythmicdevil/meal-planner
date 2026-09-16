package com.rhythmicdevil.menu_planner.preplist.dto;

import java.util.List;

public record PrepListResponse(
        Long mealPlanId,
        List<PrepListItemResponse> items
) {
}
