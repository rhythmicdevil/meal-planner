package com.rhythmicdevil.menu_planner.recipeimport;

import com.rhythmicdevil.menu_planner.recipeimport.dto.RawRecipeDTO;
import com.rhythmicdevil.menu_planner.recipeimport.dto.RecipeImportRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/import")
public class ImportController {

    private final RecipeImportAdapter recipeImportAdapter;

    public ImportController(RecipeImportAdapter recipeImportAdapter) {
        this.recipeImportAdapter = recipeImportAdapter;
    }

    @PostMapping("/url")
    public RawRecipeDTO importFromUrl(@Valid @RequestBody RecipeImportRequest request) {
        return recipeImportAdapter.parse(request.url());
    }
}
