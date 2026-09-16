package com.rhythmicdevil.menu_planner.mealplan;

import com.rhythmicdevil.menu_planner.ingredient.Ingredient;
import com.rhythmicdevil.menu_planner.ingredient.IngredientCategory;
import com.rhythmicdevil.menu_planner.ingredient.IngredientRepository;
import com.rhythmicdevil.menu_planner.mealplan.dto.MealPlanItemRequest;
import com.rhythmicdevil.menu_planner.mealplan.dto.MealPlanRequest;
import com.rhythmicdevil.menu_planner.menu.Menu;
import com.rhythmicdevil.menu_planner.menu.MenuRepository;
import com.rhythmicdevil.menu_planner.recipe.CutType;
import com.rhythmicdevil.menu_planner.recipe.Recipe;
import com.rhythmicdevil.menu_planner.recipe.RecipeIngredient;
import com.rhythmicdevil.menu_planner.recipe.RecipeRepository;
import com.rhythmicdevil.menu_planner.recipe.StateCondition;
import com.rhythmicdevil.menu_planner.recipe.dto.RecipeRequest;
import com.rhythmicdevil.menu_planner.support.AbstractApiTest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class MealPlanControllerTest extends AbstractApiTest {

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private RecipeRepository recipeRepository;

    @Autowired
    private MenuRepository menuRepository;

    @Autowired
    private MealPlanRepository mealPlanRepository;

    @Autowired
    private IngredientRepository ingredientRepository;

    @AfterEach
    void cleanUp() {
        mealPlanRepository.deleteAll();
        menuRepository.deleteAll();
        recipeRepository.deleteAll();
        ingredientRepository.deleteAll();
    }

    @Test
    void createWithRecipeItem_reflectsLatestRecipeData() throws Exception {
        Recipe pancakes = recipeRepository.save(new Recipe("Pancakes"));

        MealPlanRequest request = new MealPlanRequest(
                "This Week", null, null,
                List.of(new MealPlanItemRequest(MealPlanItemType.RECIPE, pancakes.getId(), null)));

        String createResponse = mockMvc.perform(authenticated(post("/api/meal-plans"))
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.items[0].itemType").value("RECIPE"))
                .andExpect(jsonPath("$.items[0].recipe.name").value("Pancakes"))
                .andReturn().getResponse().getContentAsString();

        Long mealPlanId = objectMapper.readTree(createResponse).get("id").asLong();

        // recipes are referenced live (no version pinning) -- an edit should show up immediately
        RecipeRequest updateRecipe = new RecipeRequest(
                "Pancakes v2", null, null, List.of(), List.of(), Set.of());
        mockMvc.perform(authenticated(put("/api/recipes/" + pancakes.getId()))
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(updateRecipe)))
                .andExpect(status().isOk());

        mockMvc.perform(authenticated(get("/api/meal-plans/" + mealPlanId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].recipe.name").value("Pancakes v2"));
    }

    @Test
    void updateThenDeleteMealPlan() throws Exception {
        Recipe pancakes = recipeRepository.save(new Recipe("Pancakes"));
        Recipe waffles = recipeRepository.save(new Recipe("Waffles"));

        MealPlanRequest request = new MealPlanRequest(
                "This Week", null, null,
                List.of(new MealPlanItemRequest(MealPlanItemType.RECIPE, pancakes.getId(), null)));

        String createResponse = mockMvc.perform(authenticated(post("/api/meal-plans"))
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Long mealPlanId = objectMapper.readTree(createResponse).get("id").asLong();

        // replace the items wholesale with a different recipe
        MealPlanRequest updateRequest = new MealPlanRequest(
                "This Week v2", null, null,
                List.of(new MealPlanItemRequest(MealPlanItemType.RECIPE, waffles.getId(), null)));

        mockMvc.perform(authenticated(put("/api/meal-plans/" + mealPlanId))
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("This Week v2"))
                .andExpect(jsonPath("$.items[0].recipe.name").value("Waffles"));

        mockMvc.perform(authenticated(delete("/api/meal-plans/" + mealPlanId)))
                .andExpect(status().isNoContent());

        mockMvc.perform(authenticated(get("/api/meal-plans/" + mealPlanId)))
                .andExpect(status().isNotFound());
    }

    @Test
    void createWithMenuItem_includesNestedRecipes() throws Exception {
        Recipe tacos = recipeRepository.save(new Recipe("Tacos"));
        Menu tacoNight = new Menu("Taco Night");
        tacoNight.setRecipes(Set.of(tacos));
        tacoNight = menuRepository.save(tacoNight);

        MealPlanRequest request = new MealPlanRequest(
                "This Week", null, null,
                List.of(new MealPlanItemRequest(MealPlanItemType.MENU, null, tacoNight.getId())));

        mockMvc.perform(authenticated(post("/api/meal-plans"))
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.items[0].itemType").value("MENU"))
                .andExpect(jsonPath("$.items[0].menu.name").value("Taco Night"))
                .andExpect(jsonPath("$.items[0].menu.recipes[0].name").value("Tacos"));
    }

    @Test
    void createWithInconsistentItem_isBadRequest() throws Exception {
        Menu menu = menuRepository.save(new Menu("Some Menu"));

        // itemType RECIPE but menuId set instead of recipeId
        MealPlanRequest request = new MealPlanRequest(
                "This Week", null, null,
                List.of(new MealPlanItemRequest(MealPlanItemType.RECIPE, null, menu.getId())));

        mockMvc.perform(authenticated(post("/api/meal-plans"))
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createWithUnknownRecipe_isNotFound() throws Exception {
        MealPlanRequest request = new MealPlanRequest(
                "This Week", null, null,
                List.of(new MealPlanItemRequest(MealPlanItemType.RECIPE, 999999L, null)));

        mockMvc.perform(authenticated(post("/api/meal-plans"))
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    void shoppingListEndpoint_returnsGeneratedList() throws Exception {
        Ingredient flour = ingredientRepository.save(new Ingredient("flour", IngredientCategory.BAKING_AND_SPICES));
        Recipe pancakes = new Recipe("Pancakes");
        RecipeIngredient line = new RecipeIngredient(flour, new BigDecimal("1"), "cup");
        line.setStateCondition(StateCondition.RAW);
        pancakes.replaceIngredients(List.of(line));
        pancakes = recipeRepository.save(pancakes);

        MealPlanRequest request = new MealPlanRequest(
                "This Week", null, null,
                List.of(new MealPlanItemRequest(MealPlanItemType.RECIPE, pancakes.getId(), null)));

        String createResponse = mockMvc.perform(authenticated(post("/api/meal-plans"))
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Long mealPlanId = objectMapper.readTree(createResponse).get("id").asLong();

        mockMvc.perform(authenticated(get("/api/meal-plans/" + mealPlanId + "/shopping-list")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mealPlanId").value(mealPlanId))
                .andExpect(jsonPath("$.items[0].ingredientName").value("flour"))
                .andExpect(jsonPath("$.items[0].totalAmount").value(1))
                .andExpect(jsonPath("$.items[0].unit").value("cup"))
                .andExpect(jsonPath("$.items[0].toTaste").value(false));
    }

    @Test
    void shoppingListForUnknownMealPlan_isNotFound() throws Exception {
        mockMvc.perform(authenticated(get("/api/meal-plans/999999/shopping-list")))
                .andExpect(status().isNotFound());
    }

    @Test
    void prepListEndpoint_returnsGeneratedList() throws Exception {
        Ingredient onion = ingredientRepository.save(new Ingredient("onion", IngredientCategory.PRODUCE));
        Recipe soup = new Recipe("Soup");
        RecipeIngredient line = new RecipeIngredient(onion, new BigDecimal("1"), "cup");
        line.setCutType(CutType.DICED);
        soup.replaceIngredients(List.of(line));
        soup = recipeRepository.save(soup);

        MealPlanRequest request = new MealPlanRequest(
                "This Week", null, null,
                List.of(new MealPlanItemRequest(MealPlanItemType.RECIPE, soup.getId(), null)));

        String createResponse = mockMvc.perform(authenticated(post("/api/meal-plans"))
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Long mealPlanId = objectMapper.readTree(createResponse).get("id").asLong();

        mockMvc.perform(authenticated(get("/api/meal-plans/" + mealPlanId + "/prep-list")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mealPlanId").value(mealPlanId))
                .andExpect(jsonPath("$.items[0].ingredientName").value("onion"))
                .andExpect(jsonPath("$.items[0].amount").value(1.0))
                .andExpect(jsonPath("$.items[0].unit").value("cup"))
                .andExpect(jsonPath("$.items[0].cutType").value("DICED"))
                .andExpect(jsonPath("$.items[0].toTaste").value(false));
    }

    @Test
    void prepListForUnknownMealPlan_isNotFound() throws Exception {
        mockMvc.perform(authenticated(get("/api/meal-plans/999999/prep-list")))
                .andExpect(status().isNotFound());
    }
}
