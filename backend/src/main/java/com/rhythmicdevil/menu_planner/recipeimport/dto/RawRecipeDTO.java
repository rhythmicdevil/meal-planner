package com.rhythmicdevil.menu_planner.recipeimport.dto;

import java.util.List;
import java.util.Set;

public record RawRecipeDTO(
        String name,
        String sourceUrl,
        Integer servings,
        List<String> ingredientLines,
        List<String> instructionLines,
        Set<String> tags
) {
}
