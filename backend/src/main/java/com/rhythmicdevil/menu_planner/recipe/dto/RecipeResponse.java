package com.rhythmicdevil.menu_planner.recipe.dto;

import com.rhythmicdevil.menu_planner.recipe.Recipe;
import com.rhythmicdevil.menu_planner.tag.Tag;
import com.rhythmicdevil.menu_planner.tag.dto.TagResponse;

import java.util.Comparator;
import java.util.List;
import java.util.Set;

public record RecipeResponse(
        Long id,
        String name,
        String sourceUrl,
        Integer servings,
        List<RecipeStepDto> steps,
        List<RecipeIngredientResponse> ingredients,
        List<TagResponse> cuisineTags,
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
                sortedTags(recipe.getCuisineTags()),
                sortedTags(recipe.getDescriptiveTags())
        );
    }

    private static List<TagResponse> sortedTags(Set<Tag> tags) {
        return tags.stream()
                .map(TagResponse::from)
                .sorted(Comparator.comparing(TagResponse::name))
                .toList();
    }
}
