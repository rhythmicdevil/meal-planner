package com.rhythmicdevil.menu_planner.recipeimport;

public class RecipeImportException extends RuntimeException {

    public RecipeImportException(String message) {
        super(message);
    }

    public RecipeImportException(String message, Throwable cause) {
        super(message, cause);
    }
}
