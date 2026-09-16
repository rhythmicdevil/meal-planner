package com.rhythmicdevil.menu_planner.recipeimport;

import com.rhythmicdevil.menu_planner.recipeimport.dto.RawRecipeDTO;

public interface RecipeImportAdapter {

    RawRecipeDTO parse(String source);
}
