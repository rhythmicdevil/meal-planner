package com.rhythmicdevil.menu_planner.recipe.dto;

import com.rhythmicdevil.menu_planner.recipe.Recipe;
import com.rhythmicdevil.menu_planner.tag.dto.TagResponse;

import java.util.Comparator;
import java.util.List;

public record RecipeResponse(
        Long id,
        String name,
        String sourceUrl,
        Integer servings,
        List<RecipeStepDto> steps,
        List<RecipeIngredientResponse> ingredients,
        TagResponse cuisineTag,
        List<TagResponse> descriptiveTags
) {
    public static RecipeResponse from(Recipe recipe) {
        return new RecipeResponse(
                recipe.getId(),
                recipe.getName(),
                recipe.getSourceUrl(),
                recipe.getServings(),
                recipe.getSteps().stream().map(RecipeStepDto::from).toList(),
                recipe.getIngredients().stream().map(RecipeIngredientResponse::from).toList(),
                recipe.getCuisineTag() != null ? TagResponse.from(recipe.getCuisineTag()) : null,
                recipe.getDescriptiveTags().stream()
                        .map(TagResponse::from)
                        .sorted(Comparator.comparing(TagResponse::name))
                        .toList()
        );
    }
}
