package com.rhythmicdevil.menu_planner.recipe.dto;

import com.rhythmicdevil.menu_planner.recipe.Recipe;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

public record RecipeResponse(
        Long id,
        String name,
        String sourceUrl,
        Integer servings,
        List<RecipeStepDto> steps,
        List<RecipeIngredientResponse> ingredients,
        Set<String> tags,
        int version
) {
    public static RecipeResponse from(Recipe recipe) {
        return new RecipeResponse(
                recipe.getId(),
                recipe.getName(),
                recipe.getSourceUrl(),
                recipe.getServings(),
                recipe.getSteps().stream().map(RecipeStepDto::from).toList(),
                recipe.getIngredients().stream().map(RecipeIngredientResponse::from).toList(),
                new HashSet<>(recipe.getTags()),
                recipe.getVersion()
        );
    }
}
