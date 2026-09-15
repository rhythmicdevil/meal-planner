package com.rhythmicdevil.menu_planner.menu.dto;

import com.rhythmicdevil.menu_planner.menu.Menu;
import com.rhythmicdevil.menu_planner.recipe.dto.RecipeSummary;

import java.util.List;

public record MenuResponse(Long id, String name, List<RecipeSummary> recipes) {
    public static MenuResponse from(Menu menu) {
        return new MenuResponse(
                menu.getId(),
                menu.getName(),
                menu.getRecipes().stream().map(RecipeSummary::from).toList()
        );
    }
}
