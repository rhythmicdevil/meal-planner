package com.rhythmicdevil.menu_planner.recipe;

import com.rhythmicdevil.menu_planner.recipe.dto.RecipeRequest;
import com.rhythmicdevil.menu_planner.recipe.dto.RecipeResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/recipes")
public class RecipeController {

    private final RecipeService recipeService;

    public RecipeController(RecipeService recipeService) {
        this.recipeService = recipeService;
    }

    @GetMapping
    public List<RecipeResponse> findAll() {
        return recipeService.findAll();
    }

    @GetMapping("/{id}")
    public RecipeResponse findById(@PathVariable Long id) {
        return recipeService.findById(id);
    }

    @PostMapping
    public ResponseEntity<RecipeResponse> create(@Valid @RequestBody RecipeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(recipeService.create(request));
    }

    @PutMapping("/{id}")
    public RecipeResponse update(@PathVariable Long id, @Valid @RequestBody RecipeRequest request) {
        return recipeService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        recipeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
