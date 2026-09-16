package com.rhythmicdevil.menu_planner.preplist;

import com.rhythmicdevil.menu_planner.ingredient.Ingredient;
import com.rhythmicdevil.menu_planner.ingredient.IngredientCategory;
import com.rhythmicdevil.menu_planner.mealplan.MealPlan;
import com.rhythmicdevil.menu_planner.mealplan.MealPlanRepository;
import com.rhythmicdevil.menu_planner.preplist.dto.PrepListItemResponse;
import com.rhythmicdevil.menu_planner.preplist.dto.PrepListResponse;
import com.rhythmicdevil.menu_planner.recipe.CutType;
import com.rhythmicdevil.menu_planner.recipe.Recipe;
import com.rhythmicdevil.menu_planner.recipe.RecipeIngredient;
import com.rhythmicdevil.menu_planner.recipe.StateCondition;
import com.rhythmicdevil.menu_planner.recipe.dto.RecipeSummary;
import com.rhythmicdevil.menu_planner.shoppinglist.UnitConversion;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@Transactional
public class PrepListService {

    private final MealPlanRepository mealPlanRepository;

    public PrepListService(MealPlanRepository mealPlanRepository) {
        this.mealPlanRepository = mealPlanRepository;
    }

    @Transactional(readOnly = true)
    public PrepListResponse generate(Long mealPlanId) {
        MealPlan mealPlan = mealPlanRepository.findById(mealPlanId)
                .orElseThrow(() -> new EntityNotFoundException("MealPlan " + mealPlanId + " not found"));
        List<Recipe> recipes = mealPlan.flattenRecipes();
        return new PrepListResponse(mealPlanId, computeItems(recipes));
    }

    // Similar-enough cut types combine into one prep line (e.g. "diced" and "chopped" onion
    // from two different recipes); genuinely different techniques (e.g. sliced vs diced)
    // don't. OTHER is kept ungrouped, keyed by its exact freeform text, since there's no
    // way to know two custom descriptions mean the same prep.
    private static String cutTypeGroupKey(CutType cutType, String cutTypeOther) {
        return switch (cutType) {
            case CHOPPED, DICED, MINCED -> "SMALL_PIECES";
            case SLICED, JULIENNED -> "SLICED_STRIPS";
            case SHREDDED, GRATED -> "SHREDDED_GRATED";
            case OTHER -> "OTHER:" + (cutTypeOther == null ? "" : cutTypeOther.trim().toLowerCase());
            case WHOLE -> "WHOLE";
        };
    }

    // Display order: batch similar prep work together (small-piece cuts, then slices/strips,
    // then shredded/grated, then anything freeform) rather than a flat alphabetical list.
    private static int groupRank(PrepListItemResponse item) {
        return switch (item.cutType()) {
            case CHOPPED, DICED, MINCED -> 0;
            case SLICED, JULIENNED -> 1;
            case SHREDDED, GRATED -> 2;
            case OTHER, WHOLE -> 3;
        };
    }

    // Keyed by Ingredient reference (not id), same rationale as ShoppingListService.
    private record BucketKey(
            Ingredient ingredient, String cutTypeGroupKey,
            StateCondition stateCondition, String stateConditionOther, String unitKey) {
    }

    private static final class Bucket {
        Ingredient ingredient;
        CutType cutType;
        String cutTypeOther;
        StateCondition stateCondition;
        String stateConditionOther;
        String displayUnit;
        UnitConversion.UnitDef unitDef;
        BigDecimal total = BigDecimal.ZERO;
        Set<Recipe> sourceRecipes = new LinkedHashSet<>();
    }

    private record NoQuantityKey(
            Ingredient ingredient, String cutTypeGroupKey,
            StateCondition stateCondition, String stateConditionOther) {
    }

    private static final class NoQuantityBucket {
        Ingredient ingredient;
        CutType cutType;
        String cutTypeOther;
        StateCondition stateCondition;
        String stateConditionOther;
        Set<Recipe> sourceRecipes = new LinkedHashSet<>();
    }

    static List<PrepListItemResponse> computeItems(List<Recipe> recipes) {
        Map<BucketKey, Bucket> buckets = new LinkedHashMap<>();
        Map<NoQuantityKey, NoQuantityBucket> noQuantityBuckets = new LinkedHashMap<>();

        for (Recipe recipe : recipes) {
            for (RecipeIngredient recipeIngredient : recipe.getIngredients()) {
                Ingredient ingredient = recipeIngredient.getIngredient();
                if (ingredient.getCategory() != IngredientCategory.PRODUCE) {
                    continue;
                }

                CutType cutType = recipeIngredient.getCutType();
                if (cutType == null || cutType == CutType.WHOLE) {
                    continue;
                }

                String groupKey = cutTypeGroupKey(cutType, recipeIngredient.getCutTypeOther());
                StateCondition state = recipeIngredient.getStateCondition();
                String stateOther = recipeIngredient.getStateConditionOther();

                if (recipeIngredient.getAmount() == null || recipeIngredient.getUnit() == null) {
                    NoQuantityKey key = new NoQuantityKey(ingredient, groupKey, state, stateOther);
                    NoQuantityBucket bucket = noQuantityBuckets.computeIfAbsent(key, k -> {
                        NoQuantityBucket b = new NoQuantityBucket();
                        b.ingredient = ingredient;
                        b.cutType = cutType;
                        b.cutTypeOther = recipeIngredient.getCutTypeOther();
                        b.stateCondition = state;
                        b.stateConditionOther = stateOther;
                        return b;
                    });
                    bucket.sourceRecipes.add(recipe);
                    continue;
                }

                UnitConversion.UnitDef unitDef = UnitConversion.lookup(recipeIngredient.getUnit());
                String unitKey = unitDef != null
                        ? unitDef.kind().name()
                        : recipeIngredient.getUnit().trim().toLowerCase();
                BucketKey key = new BucketKey(ingredient, groupKey, state, stateOther, unitKey);

                Bucket bucket = buckets.computeIfAbsent(key, k -> {
                    Bucket b = new Bucket();
                    b.ingredient = ingredient;
                    b.cutType = cutType;
                    b.cutTypeOther = recipeIngredient.getCutTypeOther();
                    b.stateCondition = state;
                    b.stateConditionOther = stateOther;
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

        List<PrepListItemResponse> items = new ArrayList<>();

        for (Bucket bucket : buckets.values()) {
            BigDecimal displayAmount = bucket.unitDef != null
                    ? bucket.total.divide(bucket.unitDef.factorToBase(), 10, RoundingMode.HALF_UP)
                    : bucket.total;
            displayAmount = displayAmount.setScale(2, RoundingMode.HALF_UP);

            items.add(new PrepListItemResponse(
                    bucket.ingredient.getId(),
                    bucket.ingredient.getName(),
                    displayAmount,
                    bucket.displayUnit,
                    bucket.cutType,
                    bucket.cutTypeOther,
                    bucket.stateCondition,
                    bucket.stateConditionOther,
                    false,
                    bucket.sourceRecipes.stream().map(RecipeSummary::from).toList()
            ));
        }

        for (NoQuantityBucket bucket : noQuantityBuckets.values()) {
            items.add(new PrepListItemResponse(
                    bucket.ingredient.getId(),
                    bucket.ingredient.getName(),
                    null,
                    null,
                    bucket.cutType,
                    bucket.cutTypeOther,
                    bucket.stateCondition,
                    bucket.stateConditionOther,
                    true,
                    bucket.sourceRecipes.stream().map(RecipeSummary::from).toList()
            ));
        }

        // batch similar prep work together, then alphabetically by ingredient within each group
        items.sort(Comparator.comparingInt(PrepListService::groupRank)
                .thenComparing(PrepListItemResponse::ingredientName, String.CASE_INSENSITIVE_ORDER));
        return items;
    }
}
