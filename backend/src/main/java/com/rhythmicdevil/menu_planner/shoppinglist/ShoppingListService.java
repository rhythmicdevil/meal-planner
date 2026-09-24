package com.rhythmicdevil.menu_planner.shoppinglist;

import com.rhythmicdevil.menu_planner.ingredient.Ingredient;
import com.rhythmicdevil.menu_planner.mealplan.MealPlan;
import com.rhythmicdevil.menu_planner.mealplan.MealPlanRepository;
import com.rhythmicdevil.menu_planner.recipe.Recipe;
import com.rhythmicdevil.menu_planner.recipe.RecipeIngredient;
import com.rhythmicdevil.menu_planner.recipe.StateCondition;
import com.rhythmicdevil.menu_planner.recipe.dto.RecipeSummary;
import com.rhythmicdevil.menu_planner.shoppinglist.dto.ShoppingListItemResponse;
import com.rhythmicdevil.menu_planner.shoppinglist.dto.ShoppingListResponse;
import com.rhythmicdevil.menu_planner.shoppinglist.dto.ShoppingListStapleItemResponse;
import com.rhythmicdevil.menu_planner.staplegroup.StapleItem;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@Transactional
public class ShoppingListService {

    private final MealPlanRepository mealPlanRepository;

    public ShoppingListService(MealPlanRepository mealPlanRepository) {
        this.mealPlanRepository = mealPlanRepository;
    }

    @Transactional(readOnly = true)
    public ShoppingListResponse generate(Long mealPlanId) {
        MealPlan mealPlan = mealPlanRepository.findById(mealPlanId)
                .orElseThrow(() -> new EntityNotFoundException("MealPlan " + mealPlanId + " not found"));
        List<Recipe> recipes = mealPlan.flattenRecipes();
        List<ShoppingListItemResponse> items = computeItems(recipes);
        List<ShoppingListStapleItemResponse> stapleItems = computeStapleItems(mealPlan.flattenStapleItems(), items);
        return new ShoppingListResponse(mealPlanId, items, stapleItems);
    }

    // Keyed by Ingredient reference (not id) -- within one Hibernate session the same
    // catalog row always resolves to the same object, so reference equality is exactly
    // what "same ingredient" means here, and it works for hand-built test entities too.
    private record BucketKey(Ingredient ingredient, String key) {
    }

    private static final class Bucket {
        Ingredient ingredient;
        String displayUnit;
        UnitConversion.UnitDef unitDef;
        BigDecimal total = BigDecimal.ZERO;
        Set<Recipe> sourceRecipes = new LinkedHashSet<>();
    }

    static List<ShoppingListItemResponse> computeItems(List<Recipe> recipes) {
        Map<BucketKey, Bucket> buckets = new LinkedHashMap<>();
        Map<Ingredient, Set<Recipe>> toTasteSources = new LinkedHashMap<>();

        for (Recipe recipe : recipes) {
            for (RecipeIngredient recipeIngredient : recipe.getIngredients()) {
                StateCondition state = recipeIngredient.getStateCondition();
                if (state != null && state != StateCondition.RAW) {
                    continue;
                }

                Ingredient ingredient = recipeIngredient.getIngredient();

                if (recipeIngredient.getAmount() == null || recipeIngredient.getUnit() == null) {
                    toTasteSources.computeIfAbsent(ingredient, i -> new LinkedHashSet<>()).add(recipe);
                    continue;
                }

                UnitConversion.UnitDef unitDef = UnitConversion.lookup(recipeIngredient.getUnit());
                String bucketKeyPart = unitDef != null
                        ? unitDef.kind().name()
                        : recipeIngredient.getUnit().trim().toLowerCase();
                BucketKey key = new BucketKey(ingredient, bucketKeyPart);

                Bucket bucket = buckets.computeIfAbsent(key, k -> {
                    Bucket b = new Bucket();
                    b.ingredient = ingredient;
                    b.displayUnit = recipeIngredient.getUnit();
                    b.unitDef = unitDef;
                    return b;
                });

                BigDecimal amountInBaseUnits = unitDef != null
                        ? recipeIngredient.getAmount().multiply(unitDef.factorToBase())
                        : recipeIngredient.getAmount();
                bucket.total = bucket.total.add(amountInBaseUnits);
                bucket.sourceRecipes.add(recipe);
            }
        }

        List<ShoppingListItemResponse> items = new ArrayList<>();

        for (Bucket bucket : buckets.values()) {
            BigDecimal displayAmount = bucket.unitDef != null
                    ? bucket.total.divide(bucket.unitDef.factorToBase(), 10, RoundingMode.HALF_UP)
                    : bucket.total;
            displayAmount = displayAmount.setScale(0, RoundingMode.CEILING);

            items.add(new ShoppingListItemResponse(
                    bucket.ingredient.getId(),
                    bucket.ingredient.getName(),
                    bucket.ingredient.getCategory(),
                    displayAmount,
                    bucket.displayUnit,
                    false,
                    bucket.sourceRecipes.stream().map(RecipeSummary::from).toList()
            ));
        }

        for (Map.Entry<Ingredient, Set<Recipe>> entry : toTasteSources.entrySet()) {
            Ingredient ingredient = entry.getKey();
            items.add(new ShoppingListItemResponse(
                    ingredient.getId(),
                    ingredient.getName(),
                    ingredient.getCategory(),
                    null,
                    null,
                    true,
                    entry.getValue().stream().map(RecipeSummary::from).toList()
            ));
        }

        // grouped by category in its declared (grocery-store walking) order, then
        // alphabetically by ingredient within each group.
        items.sort(Comparator.comparing(ShoppingListItemResponse::category)
                .thenComparing(ShoppingListItemResponse::ingredientName, String.CASE_INSENSITIVE_ORDER));
        return items;
    }

    // A staple item linked to an ingredient that's already needed for a recipe this week is
    // suppressed (the recipe-derived line already covers buying it) rather than shown twice;
    // staple items are also deduped against each other, by ingredient when linked or by name
    // when not.
    static List<ShoppingListStapleItemResponse> computeStapleItems(
            List<StapleItem> stapleItems, List<ShoppingListItemResponse> recipeItems) {
        Set<Long> ingredientIdsAlreadyListed = new HashSet<>();
        for (ShoppingListItemResponse item : recipeItems) {
            ingredientIdsAlreadyListed.add(item.ingredientId());
        }

        List<ShoppingListStapleItemResponse> result = new ArrayList<>();
        Set<Object> seen = new HashSet<>();

        for (StapleItem stapleItem : stapleItems) {
            Long ingredientId = stapleItem.getIngredient() != null ? stapleItem.getIngredient().getId() : null;

            if (ingredientId != null && ingredientIdsAlreadyListed.contains(ingredientId)) {
                continue;
            }

            Object dedupeKey = ingredientId != null ? ingredientId : stapleItem.getName().trim().toLowerCase();
            if (!seen.add(dedupeKey)) {
                continue;
            }

            result.add(new ShoppingListStapleItemResponse(
                    stapleItem.getId(),
                    stapleItem.getName(),
                    ingredientId,
                    stapleItem.getStapleGroup().getName()
            ));
        }

        result.sort(Comparator.comparing(ShoppingListStapleItemResponse::stapleGroupName, String.CASE_INSENSITIVE_ORDER)
                .thenComparing(ShoppingListStapleItemResponse::name, String.CASE_INSENSITIVE_ORDER));
        return result;
    }
}
