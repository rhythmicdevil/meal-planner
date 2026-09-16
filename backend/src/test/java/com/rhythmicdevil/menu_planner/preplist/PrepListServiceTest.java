package com.rhythmicdevil.menu_planner.preplist;

import com.rhythmicdevil.menu_planner.ingredient.Ingredient;
import com.rhythmicdevil.menu_planner.ingredient.IngredientCategory;
import com.rhythmicdevil.menu_planner.mealplan.MealPlan;
import com.rhythmicdevil.menu_planner.mealplan.MealPlanItem;
import com.rhythmicdevil.menu_planner.menu.Menu;
import com.rhythmicdevil.menu_planner.preplist.dto.PrepListItemResponse;
import com.rhythmicdevil.menu_planner.recipe.CutType;
import com.rhythmicdevil.menu_planner.recipe.Recipe;
import com.rhythmicdevil.menu_planner.recipe.RecipeIngredient;
import com.rhythmicdevil.menu_planner.recipe.StateCondition;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

// Plain unit tests against hand-built entities -- no Spring context or database, mirroring
// ShoppingListServiceTest's style (PrepListService.computeItems is a pure function; the
// @Transactional loading itself is covered by the MealPlanControllerTest wiring smoke test).
class PrepListServiceTest {

    private static Ingredient produce(String name) {
        return new Ingredient(name, IngredientCategory.PRODUCE);
    }

    private static RecipeIngredient line(Ingredient ingredient, String amount, String unit, CutType cutType) {
        RecipeIngredient recipeIngredient = new RecipeIngredient(ingredient, new BigDecimal(amount), unit);
        recipeIngredient.setCutType(cutType);
        return recipeIngredient;
    }

    private static Recipe recipeWith(String name, RecipeIngredient... lines) {
        Recipe recipe = new Recipe(name);
        recipe.replaceIngredients(List.of(lines));
        return recipe;
    }

    @Test
    void excludesNonProduceIngredientsEvenWithACutType() {
        Ingredient chicken = new Ingredient("chicken breast", IngredientCategory.MEAT_AND_SEAFOOD);
        Recipe recipe = recipeWith("Stir Fry", line(chicken, "2", "each", CutType.DICED));

        List<PrepListItemResponse> items = PrepListService.computeItems(List.of(recipe));

        assertThat(items).isEmpty();
    }

    @Test
    void excludesNullOrWholeCutType() {
        Ingredient onion = produce("onion");
        RecipeIngredient noCutType = new RecipeIngredient(onion, new BigDecimal("1"), "each");
        RecipeIngredient whole = line(onion, "1", "each", CutType.WHOLE);
        Recipe recipe = recipeWith("Soup", noCutType, whole);

        List<PrepListItemResponse> items = PrepListService.computeItems(List.of(recipe));

        assertThat(items).isEmpty();
    }

    @Test
    void mergesSimilarCutTypesIntoOneLine() {
        Ingredient onion = produce("onion");
        Recipe soup = recipeWith("Soup", line(onion, "1", "cup", CutType.DICED));
        Recipe hash = recipeWith("Hash", line(onion, "1", "cup", CutType.CHOPPED));

        List<PrepListItemResponse> items = PrepListService.computeItems(List.of(soup, hash));

        assertThat(items).hasSize(1);
        assertThat(items.get(0).amount()).isEqualByComparingTo("2");
        assertThat(items.get(0).sourceRecipes()).hasSize(2);
    }

    @Test
    void keepsGenuinelyDifferentCutsAsSeparateLines() {
        Ingredient onion = produce("onion");
        Recipe soup = recipeWith("Soup", line(onion, "1", "cup", CutType.DICED));
        Recipe salad = recipeWith("Salad", line(onion, "1", "cup", CutType.SLICED));

        List<PrepListItemResponse> items = PrepListService.computeItems(List.of(soup, salad));

        assertThat(items).hasSize(2);
        assertThat(items).extracting(PrepListItemResponse::cutType)
                .containsExactlyInAnyOrder(CutType.DICED, CutType.SLICED);
    }

    @Test
    void differentStateConditionsStaySeparateEvenWithTheSameCutType() {
        Ingredient tomato = produce("tomato");
        RecipeIngredient raw = line(tomato, "1", "cup", CutType.DICED);
        raw.setStateCondition(StateCondition.RAW);
        RecipeIngredient frozen = line(tomato, "1", "cup", CutType.DICED);
        frozen.setStateCondition(StateCondition.FROZEN);

        Recipe recipe = recipeWith("Everything", raw, frozen);

        List<PrepListItemResponse> items = PrepListService.computeItems(List.of(recipe));

        assertThat(items).hasSize(2);
        assertThat(items).extracting(PrepListItemResponse::stateCondition)
                .containsExactlyInAnyOrder(StateCondition.RAW, StateCondition.FROZEN);
    }

    @Test
    void sumsCompatibleButDifferentUnits() {
        Ingredient carrot = produce("carrot");
        Recipe a = recipeWith("A", line(carrot, "8", "tbsp", CutType.DICED)); // 0.5 cup
        Recipe b = recipeWith("B", line(carrot, "1", "cup", CutType.CHOPPED));

        List<PrepListItemResponse> items = PrepListService.computeItems(List.of(a, b));

        assertThat(items).hasSize(1);
        assertThat(items.get(0).unit()).isEqualTo("tbsp");
        assertThat(items.get(0).amount()).isEqualByComparingTo("24"); // 1.5 cups in tbsp
    }

    @Test
    void keepsIncompatibleUnitsAsSeparateLines() {
        Ingredient onion = produce("onion");
        Recipe a = recipeWith("A", line(onion, "2", "each", CutType.DICED));
        Recipe b = recipeWith("B", line(onion, "200", "g", CutType.DICED));

        List<PrepListItemResponse> items = PrepListService.computeItems(List.of(a, b));

        assertThat(items).hasSize(2);
        assertThat(items).extracting(PrepListItemResponse::unit).containsExactlyInAnyOrder("each", "g");
    }

    @Test
    void otherCutTypeIsKeyedByItsFreeformText() {
        Ingredient herbs = produce("basil");
        RecipeIngredient chiffonade = line(herbs, "1", "cup", CutType.OTHER);
        chiffonade.setCutTypeOther("chiffonade");
        RecipeIngredient torn = line(herbs, "1", "cup", CutType.OTHER);
        torn.setCutTypeOther("torn");
        RecipeIngredient moreChiffonade = line(herbs, "1", "cup", CutType.OTHER);
        moreChiffonade.setCutTypeOther("Chiffonade"); // same prep, different casing

        Recipe recipe = recipeWith("Garnish", chiffonade, torn, moreChiffonade);

        List<PrepListItemResponse> items = PrepListService.computeItems(List.of(recipe));

        assertThat(items).hasSize(2);
        assertThat(items).extracting(PrepListItemResponse::amount)
                .containsExactlyInAnyOrder(new BigDecimal("2.00"), new BigDecimal("1.00"));
    }

    @Test
    void flagsRowsWithNoAmountAsToTaste() {
        Ingredient garnishHerb = produce("cilantro");
        RecipeIngredient noAmount = new RecipeIngredient(garnishHerb, null, null);
        noAmount.setCutType(CutType.CHOPPED);

        Recipe recipe = recipeWith("Tacos", noAmount);

        List<PrepListItemResponse> items = PrepListService.computeItems(List.of(recipe));

        assertThat(items).hasSize(1);
        assertThat(items.get(0).toTaste()).isTrue();
        assertThat(items.get(0).amount()).isNull();
    }

    @Test
    void expandsMenuItemsIntoTheirRecipes() {
        Ingredient onion = produce("onion");
        Recipe salsa = recipeWith("Salsa", line(onion, "1", "cup", CutType.DICED));
        Menu tacoNight = new Menu("Taco Night");
        tacoNight.setRecipes(Set.of(salsa));

        MealPlan mealPlan = new MealPlan("This Week");
        mealPlan.replaceItems(List.of(MealPlanItem.forMenu(mealPlan, tacoNight)));

        List<PrepListItemResponse> items = PrepListService.computeItems(mealPlan.flattenRecipes());

        assertThat(items).hasSize(1);
        assertThat(items.get(0).amount()).isEqualByComparingTo("1");
    }

    @Test
    void aRecipeReferencedTwiceDoublesItsQuantities() {
        Ingredient onion = produce("onion");
        Recipe soup = recipeWith("Soup", line(onion, "1", "cup", CutType.DICED));

        MealPlan mealPlan = new MealPlan("This Week");
        mealPlan.replaceItems(List.of(
                MealPlanItem.forRecipe(mealPlan, soup),
                MealPlanItem.forRecipe(mealPlan, soup)
        ));

        List<PrepListItemResponse> items = PrepListService.computeItems(mealPlan.flattenRecipes());

        assertThat(items).hasSize(1);
        assertThat(items.get(0).amount()).isEqualByComparingTo("2");
    }
}
