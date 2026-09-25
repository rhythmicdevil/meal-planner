package com.rhythmicdevil.menu_planner.shoppinglist;

import com.rhythmicdevil.menu_planner.ingredient.Ingredient;
import com.rhythmicdevil.menu_planner.ingredient.IngredientCategory;
import com.rhythmicdevil.menu_planner.menu.Menu;
import com.rhythmicdevil.menu_planner.mealplan.MealPlan;
import com.rhythmicdevil.menu_planner.mealplan.MealPlanItem;
import com.rhythmicdevil.menu_planner.recipe.CutType;
import com.rhythmicdevil.menu_planner.recipe.Recipe;
import com.rhythmicdevil.menu_planner.recipe.RecipeIngredient;
import com.rhythmicdevil.menu_planner.recipe.StateCondition;
import com.rhythmicdevil.menu_planner.shoppinglist.dto.ShoppingListItemResponse;
import com.rhythmicdevil.menu_planner.shoppinglist.dto.ShoppingListStapleItemResponse;
import com.rhythmicdevil.menu_planner.staplegroup.StapleGroup;
import com.rhythmicdevil.menu_planner.staplegroup.StapleItem;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

// Plain unit tests against hand-built entities -- no Spring context or database, since
// ShoppingListService.computeItems/flattenRecipes are pure functions over already-loaded
// entities (the @Transactional loading itself is covered by the MealPlanControllerTest
// wiring smoke test instead).
class ShoppingListServiceTest {

    private static Ingredient ingredient(String name) {
        return new Ingredient(name, IngredientCategory.OTHER);
    }

    private static Ingredient ingredient(String name, IngredientCategory category) {
        return new Ingredient(name, category);
    }

    private static RecipeIngredient rawLine(Ingredient ingredient, String amount, String unit) {
        RecipeIngredient line = new RecipeIngredient(ingredient, new BigDecimal(amount), unit);
        line.setStateCondition(StateCondition.RAW);
        return line;
    }

    private static Recipe recipeWith(String name, RecipeIngredient... lines) {
        Recipe recipe = new Recipe(name);
        recipe.replaceIngredients(List.of(lines));
        return recipe;
    }

    @Test
    void sumsCompatibleButDifferentUnits() {
        Ingredient flour = ingredient("flour");
        Recipe pancakes = recipeWith("Pancakes", rawLine(flour, "1", "cup"));
        Recipe waffles = recipeWith("Waffles", rawLine(flour, "8", "tbsp")); // 0.5 cup

        List<ShoppingListItemResponse> items = ShoppingListService.computeItems(List.of(pancakes, waffles));

        assertThat(items).hasSize(1);
        ShoppingListItemResponse item = items.get(0);
        assertThat(item.ingredientName()).isEqualTo("flour");
        assertThat(item.unit()).isEqualTo("cup");
        assertThat(item.totalAmount()).isEqualByComparingTo("2"); // 1.5 cups ceilinged to 2
        assertThat(item.toTaste()).isFalse();
        assertThat(item.sourceRecipes()).hasSize(2);
    }

    @Test
    void keepsIncompatibleUnitsAsSeparateLines() {
        Ingredient onion = ingredient("onion");
        Recipe soup = recipeWith("Soup", rawLine(onion, "2", "each"));
        Recipe stock = recipeWith("Stock", rawLine(onion, "200", "g"));

        List<ShoppingListItemResponse> items = ShoppingListService.computeItems(List.of(soup, stock));

        assertThat(items).hasSize(2);
        assertThat(items).allSatisfy(item -> assertThat(item.ingredientName()).isEqualTo("onion"));
        assertThat(items).extracting(ShoppingListItemResponse::unit).containsExactlyInAnyOrder("each", "g");
    }

    @Test
    void excludesPreppedStateConditionsButKeepsRawAndNull() {
        Ingredient garlic = ingredient("garlic");

        RecipeIngredient raw = rawLine(garlic, "2", "clove");
        RecipeIngredient noState = new RecipeIngredient(garlic, new BigDecimal("1"), "clove"); // null stateCondition
        RecipeIngredient cooked = new RecipeIngredient(garlic, new BigDecimal("3"), "clove");
        cooked.setStateCondition(StateCondition.COOKED);
        cooked.setCutType(CutType.MINCED);

        Recipe recipe = recipeWith("Garlic Bread", raw, noState, cooked);

        List<ShoppingListItemResponse> items = ShoppingListService.computeItems(List.of(recipe));

        assertThat(items).hasSize(1);
        // only the RAW (2) and null-stateCondition (1) lines count -- the COOKED line is excluded
        assertThat(items.get(0).totalAmount()).isEqualByComparingTo("3");
    }

    @Test
    void flagsToTasteIngredientsWithoutAnAmount() {
        Ingredient salt = ingredient("salt");
        RecipeIngredient toTaste = new RecipeIngredient(salt, null, null);
        toTaste.setStateCondition(StateCondition.RAW);
        toTaste.setNotes("to taste");

        Recipe recipe = recipeWith("Soup", toTaste);

        List<ShoppingListItemResponse> items = ShoppingListService.computeItems(List.of(recipe));

        assertThat(items).hasSize(1);
        ShoppingListItemResponse item = items.get(0);
        assertThat(item.toTaste()).isTrue();
        assertThat(item.totalAmount()).isNull();
        assertThat(item.unit()).isNull();
    }

    @Test
    void expandsMenuItemsIntoTheirRecipes() {
        Ingredient tomato = ingredient("tomato");
        Recipe salsa = recipeWith("Salsa", rawLine(tomato, "3", "each"));
        Menu tacoNight = new Menu("Taco Night");
        tacoNight.setRecipes(Set.of(salsa));

        MealPlan mealPlan = new MealPlan("This Week");
        mealPlan.replaceItems(List.of(MealPlanItem.forMenu(mealPlan, tacoNight)));

        List<Recipe> flattened = mealPlan.flattenRecipes();

        assertThat(flattened).containsExactly(salsa);
    }

    @Test
    void groupsByCategoryOrderThenAlphabeticallyWithinCategory() {
        // "Zucchini" would sort before "Basil" alphabetically, but PRODUCE items should
        // stay together and sorted among themselves; BAKING_AND_SPICES items come after,
        // per the category enum's declared (grocery-store walking) order.
        Ingredient zucchini = ingredient("zucchini", IngredientCategory.PRODUCE);
        Ingredient basil = ingredient("basil", IngredientCategory.PRODUCE);
        Ingredient cinnamon = ingredient("cinnamon", IngredientCategory.BAKING_AND_SPICES);

        Recipe recipe = recipeWith("Everything",
                rawLine(zucchini, "1", "each"),
                rawLine(basil, "1", "each"),
                rawLine(cinnamon, "1", "each"));

        List<ShoppingListItemResponse> items = ShoppingListService.computeItems(List.of(recipe));

        assertThat(items).extracting(ShoppingListItemResponse::ingredientName)
                .containsExactly("basil", "zucchini", "cinnamon");
        assertThat(items).extracting(ShoppingListItemResponse::category)
                .containsExactly(IngredientCategory.PRODUCE, IngredientCategory.PRODUCE, IngredientCategory.BAKING_AND_SPICES);
    }

    @Test
    void aRecipeReferencedTwiceDoublesItsQuantities() {
        Ingredient tomato = ingredient("tomato");
        Recipe salsa = recipeWith("Salsa", rawLine(tomato, "3", "each"));

        MealPlan mealPlan = new MealPlan("This Week");
        mealPlan.replaceItems(List.of(
                MealPlanItem.forRecipe(mealPlan, salsa),
                MealPlanItem.forRecipe(mealPlan, salsa)
        ));

        List<Recipe> flattened = mealPlan.flattenRecipes();
        List<ShoppingListItemResponse> items = ShoppingListService.computeItems(flattened);

        assertThat(items).hasSize(1);
        assertThat(items.get(0).totalAmount()).isEqualByComparingTo("6");
    }

    // The staple-item dedup/suppression logic keys off Ingredient.getId(), unlike
    // computeItems' bucketing (which uses object reference equality and so works fine with
    // hand-built, never-persisted entities) -- give these a real id via reflection so that
    // logic actually gets exercised.
    private static Ingredient ingredientWithId(long id, String name) {
        Ingredient ingredient = ingredient(name);
        ReflectionTestUtils.setField(ingredient, "id", id);
        return ingredient;
    }

    private static StapleGroup stapleGroupWith(String name, StapleItem... items) {
        StapleGroup group = new StapleGroup(name);
        group.replaceItems(List.of(items));
        return group;
    }

    @Test
    void unlinkedStapleItemAlwaysShowsUp() {
        StapleGroup group = stapleGroupWith("Paper Products", new StapleItem("paper towels", null));

        List<ShoppingListStapleItemResponse> stapleItems =
                ShoppingListService.computeStapleItems(group.getItems(), List.of());

        assertThat(stapleItems).hasSize(1);
        assertThat(stapleItems.get(0).name()).isEqualTo("paper towels");
        assertThat(stapleItems.get(0).ingredientId()).isNull();
        assertThat(stapleItems.get(0).stapleGroupName()).isEqualTo("Paper Products");
        assertThat(stapleItems.get(0).quantity()).isEqualTo(1);
    }

    @Test
    void stapleItemQuantityPassesThrough() {
        StapleItem towels = new StapleItem("paper towels", null);
        towels.setQuantity(3);
        StapleGroup group = stapleGroupWith("Paper Products", towels);

        List<ShoppingListStapleItemResponse> stapleItems =
                ShoppingListService.computeStapleItems(group.getItems(), List.of());

        assertThat(stapleItems.get(0).quantity()).isEqualTo(3);
    }

    @Test
    void linkedStapleItemShowsUpWhenItsIngredientIsntNeededByAnyRecipeThisWeek() {
        Ingredient bananas = ingredientWithId(1L, "bananas");
        StapleGroup group = stapleGroupWith("Kitchen", new StapleItem("bananas", bananas));

        List<ShoppingListStapleItemResponse> stapleItems =
                ShoppingListService.computeStapleItems(group.getItems(), List.of());

        assertThat(stapleItems).hasSize(1);
        assertThat(stapleItems.get(0).ingredientId()).isEqualTo(bananas.getId());
    }

    @Test
    void linkedStapleItemIsSuppressedWhenARecipeAlreadyNeedsItThisWeek() {
        Ingredient bananas = ingredientWithId(1L, "bananas");
        Recipe smoothie = recipeWith("Smoothie", rawLine(bananas, "2", "each"));
        List<ShoppingListItemResponse> recipeItems = ShoppingListService.computeItems(List.of(smoothie));

        StapleGroup group = stapleGroupWith("Kitchen", new StapleItem("bananas", bananas));
        List<ShoppingListStapleItemResponse> stapleItems =
                ShoppingListService.computeStapleItems(group.getItems(), recipeItems);

        assertThat(stapleItems).isEmpty();
    }

    @Test
    void dedupesStapleItemsAgainstEachOtherByIngredientOrByName() {
        Ingredient bananas = ingredientWithId(1L, "bananas");
        StapleGroup kitchen = stapleGroupWith("Kitchen", new StapleItem("bananas", bananas));
        StapleGroup produce = stapleGroupWith("Produce", new StapleItem("bananas", bananas));
        StapleGroup cleaning = stapleGroupWith("Cleaning",
                new StapleItem("sponges", null), new StapleItem("Sponges", null));

        List<StapleItem> allItems = new ArrayList<>();
        allItems.addAll(kitchen.getItems());
        allItems.addAll(produce.getItems());
        allItems.addAll(cleaning.getItems());

        List<ShoppingListStapleItemResponse> stapleItems = ShoppingListService.computeStapleItems(allItems, List.of());

        assertThat(stapleItems).extracting(ShoppingListStapleItemResponse::name)
                .containsExactlyInAnyOrder("bananas", "sponges");
    }
}
