package com.rhythmicdevil.menu_planner.recipe;

import com.rhythmicdevil.menu_planner.ingredient.Ingredient;
import com.rhythmicdevil.menu_planner.ingredient.IngredientRepository;
import com.rhythmicdevil.menu_planner.recipe.dto.RecipeIngredientRequest;
import com.rhythmicdevil.menu_planner.recipe.dto.RecipeRequest;
import com.rhythmicdevil.menu_planner.recipe.dto.RecipeResponse;
import com.rhythmicdevil.menu_planner.recipe.dto.RecipeStepDto;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;

@Service
@Transactional
public class RecipeService {

    private final RecipeRepository recipeRepository;
    private final IngredientRepository ingredientRepository;

    public RecipeService(RecipeRepository recipeRepository, IngredientRepository ingredientRepository) {
        this.recipeRepository = recipeRepository;
        this.ingredientRepository = ingredientRepository;
    }

    @Transactional(readOnly = true)
    public List<RecipeResponse> findAll() {
        return recipeRepository.findAll().stream()
                .map(RecipeResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public RecipeResponse findById(Long id) {
        return RecipeResponse.from(getOrThrow(id));
    }

    public RecipeResponse create(RecipeRequest request) {
        Recipe recipe = new Recipe(request.name());
        applyRequest(recipe, request);
        return RecipeResponse.from(recipeRepository.save(recipe));
    }

    public RecipeResponse update(Long id, RecipeRequest request) {
        Recipe recipe = getOrThrow(id);
        recipe.setName(request.name());
        applyRequest(recipe, request);
        recipe.incrementVersion();
        return RecipeResponse.from(recipe);
    }

    public void delete(Long id) {
        if (!recipeRepository.existsById(id)) {
            throw new EntityNotFoundException("Recipe " + id + " not found");
        }
        recipeRepository.deleteById(id);
    }

    private void applyRequest(Recipe recipe, RecipeRequest request) {
        recipe.setSourceUrl(request.sourceUrl());
        recipe.setSourceName(request.sourceName());
        recipe.setServings(request.servings());
        recipe.setTags(request.tags() != null ? new HashSet<>(request.tags()) : new HashSet<>());

        List<RecipeStep> steps = new ArrayList<>();
        if (request.steps() != null) {
            for (RecipeStepDto stepDto : request.steps()) {
                steps.add(stepDto.toEntity());
            }
        }
        recipe.setSteps(steps);

        List<RecipeIngredient> recipeIngredients = new ArrayList<>();
        if (request.ingredients() != null) {
            for (RecipeIngredientRequest ingredientRequest : request.ingredients()) {
                recipeIngredients.add(toRecipeIngredient(ingredientRequest));
            }
        }
        recipe.replaceIngredients(recipeIngredients);
    }

    private RecipeIngredient toRecipeIngredient(RecipeIngredientRequest request) {
        Ingredient ingredient = ingredientRepository.findById(request.ingredientId())
                .orElseThrow(() -> new EntityNotFoundException("Ingredient " + request.ingredientId() + " not found"));
        RecipeIngredient recipeIngredient = new RecipeIngredient(ingredient, request.amount(), request.unit());
        recipeIngredient.setCutType(request.cutType());
        recipeIngredient.setCutTypeOther(request.cutTypeOther());
        recipeIngredient.setStateCondition(request.stateCondition());
        recipeIngredient.setStateConditionOther(request.stateConditionOther());
        recipeIngredient.setNotes(request.notes());
        return recipeIngredient;
    }

    private Recipe getOrThrow(Long id) {
        return recipeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Recipe " + id + " not found"));
    }
}
