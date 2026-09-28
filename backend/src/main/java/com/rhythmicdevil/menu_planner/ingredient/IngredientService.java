package com.rhythmicdevil.menu_planner.ingredient;

import com.rhythmicdevil.menu_planner.ingredient.dto.IngredientRequest;
import com.rhythmicdevil.menu_planner.ingredient.dto.IngredientResponse;
import com.rhythmicdevil.menu_planner.recipe.RecipeIngredient;
import com.rhythmicdevil.menu_planner.recipe.RecipeIngredientRepository;
import com.rhythmicdevil.menu_planner.staplegroup.StapleItem;
import com.rhythmicdevil.menu_planner.staplegroup.StapleItemRepository;
import com.rhythmicdevil.menu_planner.store.Store;
import com.rhythmicdevil.menu_planner.store.StoreRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class IngredientService {

    private final IngredientRepository ingredientRepository;
    private final StoreRepository storeRepository;
    private final RecipeIngredientRepository recipeIngredientRepository;
    private final StapleItemRepository stapleItemRepository;

    public IngredientService(
            IngredientRepository ingredientRepository,
            StoreRepository storeRepository,
            RecipeIngredientRepository recipeIngredientRepository,
            StapleItemRepository stapleItemRepository) {
        this.ingredientRepository = ingredientRepository;
        this.storeRepository = storeRepository;
        this.recipeIngredientRepository = recipeIngredientRepository;
        this.stapleItemRepository = stapleItemRepository;
    }

    @Transactional(readOnly = true)
    public List<IngredientResponse> findAll() {
        return ingredientRepository.findAll().stream()
                .map(IngredientResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public IngredientResponse findById(Long id) {
        return IngredientResponse.from(getOrThrow(id));
    }

    public IngredientResponse create(IngredientRequest request) {
        Ingredient ingredient = new Ingredient(request.name(), request.category());
        applyRequest(ingredient, request);
        return IngredientResponse.from(ingredientRepository.save(ingredient));
    }

    public IngredientResponse update(Long id, IngredientRequest request) {
        Ingredient ingredient = getOrThrow(id);
        ingredient.setName(request.name());
        ingredient.setCategory(request.category());
        applyRequest(ingredient, request);
        return IngredientResponse.from(ingredient);
    }

    public void delete(Long id) {
        Ingredient ingredient = getOrThrow(id);

        List<RecipeIngredient> recipeUses = recipeIngredientRepository.findByIngredient_Id(id);
        List<StapleItem> stapleUses = stapleItemRepository.findByIngredient_Id(id);
        if (!recipeUses.isEmpty() || !stapleUses.isEmpty()) {
            throw new IllegalArgumentException(buildInUseMessage(ingredient, recipeUses, stapleUses));
        }

        ingredientRepository.delete(ingredient);
    }

    // Both recipes and staple items can hold an ingredient in use, and a bulk "delete
    // orphaned ingredients" pass only ever sees the generic failure of a Promise.allSettled
    // -- so the message here needs to say exactly why, for whichever reason(s) actually
    // apply, rather than the caller having to guess or re-check separately.
    private String buildInUseMessage(Ingredient ingredient, List<RecipeIngredient> recipeUses, List<StapleItem> stapleUses) {
        List<String> reasons = new ArrayList<>();
        if (!recipeUses.isEmpty()) {
            Set<String> recipeNames = recipeUses.stream()
                    .map(ri -> ri.getRecipe().getName())
                    .collect(Collectors.toCollection(LinkedHashSet::new));
            reasons.add("recipe" + (recipeNames.size() == 1 ? "" : "s") + " (" + String.join(", ", recipeNames) + ")");
        }
        if (!stapleUses.isEmpty()) {
            Set<String> groupNames = stapleUses.stream()
                    .map(si -> si.getStapleGroup().getName())
                    .collect(Collectors.toCollection(LinkedHashSet::new));
            reasons.add("staple group" + (groupNames.size() == 1 ? "" : "s") + " (" + String.join(", ", groupNames) + ")");
        }
        return "\"" + ingredient.getName() + "\" can't be deleted -- still used by " + String.join(" and ", reasons) + ".";
    }

    private void applyRequest(Ingredient ingredient, IngredientRequest request) {
        ingredient.setDefaultUnit(request.defaultUnit());
        ingredient.setAliases(request.aliases() != null ? new HashSet<>(request.aliases()) : new HashSet<>());

        Set<Long> storeIds = request.storeIds() != null ? request.storeIds() : Set.of();
        Set<Store> stores = new HashSet<>(storeRepository.findAllById(storeIds));
        if (stores.size() != storeIds.size()) {
            throw new EntityNotFoundException("One or more stores not found");
        }
        ingredient.setStores(stores);
    }

    private Ingredient getOrThrow(Long id) {
        return ingredientRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Ingredient " + id + " not found"));
    }
}
