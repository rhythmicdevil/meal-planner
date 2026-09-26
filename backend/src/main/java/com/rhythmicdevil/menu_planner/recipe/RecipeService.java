package com.rhythmicdevil.menu_planner.recipe;

import com.rhythmicdevil.menu_planner.ingredient.Ingredient;
import com.rhythmicdevil.menu_planner.ingredient.IngredientRepository;
import com.rhythmicdevil.menu_planner.recipe.dto.RecipeIngredientRequest;
import com.rhythmicdevil.menu_planner.recipe.dto.RecipeRequest;
import com.rhythmicdevil.menu_planner.recipe.dto.RecipeResponse;
import com.rhythmicdevil.menu_planner.recipe.dto.RecipeStepDto;
import com.rhythmicdevil.menu_planner.tag.Tag;
import com.rhythmicdevil.menu_planner.tag.TagRepository;
import com.rhythmicdevil.menu_planner.tag.TagType;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@Transactional
public class RecipeService {

    private final RecipeRepository recipeRepository;
    private final IngredientRepository ingredientRepository;
    private final TagRepository tagRepository;

    public RecipeService(
            RecipeRepository recipeRepository,
            IngredientRepository ingredientRepository,
            TagRepository tagRepository
    ) {
        this.recipeRepository = recipeRepository;
        this.ingredientRepository = ingredientRepository;
        this.tagRepository = tagRepository;
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
        recipe.setServings(request.servings());
        recipe.setCuisineTags(resolveTags(request.cuisineTagIds(), TagType.CUISINE));
        recipe.setDescriptiveTags(resolveTags(request.descriptiveTagIds(), TagType.DESCRIPTIVE));

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

    private Set<Tag> resolveTags(Set<Long> tagIds, TagType expectedType) {
        if (tagIds == null || tagIds.isEmpty()) {
            return new HashSet<>();
        }
        if (tagIds.contains(null)) {
            throw new IllegalArgumentException("Tag id must not be null");
        }
        List<Tag> found = tagRepository.findAllById(tagIds);
        if (found.size() != tagIds.size()) {
            throw new EntityNotFoundException("One or more tags not found");
        }
        for (Tag tag : found) {
            if (tag.getType() != expectedType) {
                throw new IllegalArgumentException(
                        "Tag " + tag.getId() + " (" + tag.getName() + ") is not a "
                                + expectedType.name().toLowerCase() + " tag");
            }
        }
        return new HashSet<>(found);
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
