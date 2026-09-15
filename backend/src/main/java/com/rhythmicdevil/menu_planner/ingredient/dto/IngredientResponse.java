package com.rhythmicdevil.menu_planner.ingredient.dto;

import com.rhythmicdevil.menu_planner.ingredient.Ingredient;
import com.rhythmicdevil.menu_planner.ingredient.IngredientCategory;

import java.util.HashSet;
import java.util.Set;

public record IngredientResponse(
        Long id,
        String name,
        Set<String> aliases,
        String defaultUnit,
        IngredientCategory category
) {
    public static IngredientResponse from(Ingredient ingredient) {
        return new IngredientResponse(
                ingredient.getId(),
                ingredient.getName(),
                new HashSet<>(ingredient.getAliases()),
                ingredient.getDefaultUnit(),
                ingredient.getCategory()
        );
    }
}
