package com.rhythmicdevil.menu_planner.recipe.dto;

import com.rhythmicdevil.menu_planner.recipe.Recipe;

public record RecipeSummary(Long id, String name, Integer servings) {
    public static RecipeSummary from(Recipe recipe) {
        return new RecipeSummary(recipe.getId(), recipe.getName(), recipe.getServings());
    }
}
