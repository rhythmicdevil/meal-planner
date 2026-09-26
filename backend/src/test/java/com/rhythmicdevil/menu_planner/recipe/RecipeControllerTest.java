package com.rhythmicdevil.menu_planner.recipe;

import com.rhythmicdevil.menu_planner.ingredient.Ingredient;
import com.rhythmicdevil.menu_planner.ingredient.IngredientCategory;
import com.rhythmicdevil.menu_planner.ingredient.IngredientRepository;
import com.rhythmicdevil.menu_planner.mealplan.MealPlan;
import com.rhythmicdevil.menu_planner.mealplan.MealPlanItem;
import com.rhythmicdevil.menu_planner.mealplan.MealPlanRepository;
import com.rhythmicdevil.menu_planner.recipe.dto.RecipeIngredientRequest;
import com.rhythmicdevil.menu_planner.recipe.dto.RecipeRequest;
import com.rhythmicdevil.menu_planner.recipe.dto.RecipeStepDto;
import com.rhythmicdevil.menu_planner.support.AbstractApiTest;
import com.rhythmicdevil.menu_planner.tag.Tag;
import com.rhythmicdevil.menu_planner.tag.TagRepository;
import com.rhythmicdevil.menu_planner.tag.TagType;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class RecipeControllerTest extends AbstractApiTest {

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private IngredientRepository ingredientRepository;

    @Autowired
    private RecipeRepository recipeRepository;

    @Autowired
    private MealPlanRepository mealPlanRepository;

    @Autowired
    private TagRepository tagRepository;

    @AfterEach
    void cleanUp() {
        mealPlanRepository.deleteAll();
        recipeRepository.deleteAll();
        ingredientRepository.deleteAll();
        tagRepository.deleteAll();
    }

    @Test
    void createFetchUpdateAndDelete() throws Exception {
        Ingredient onion = ingredientRepository.save(new Ingredient("yellow onion", IngredientCategory.PRODUCE));
        Tag mexican = tagRepository.save(new Tag("Mexican", TagType.CUISINE));
        Tag weeknight = tagRepository.save(new Tag("weeknight", TagType.DESCRIPTIVE));

        RecipeRequest createRequest = new RecipeRequest(
                "Weeknight Tacos", null, 4,
                List.of(new RecipeStepDto(1, "Dice the onion")),
                List.of(new RecipeIngredientRequest(
                        onion.getId(), new BigDecimal("1.5"), "cup", CutType.DICED, null, StateCondition.RAW, null, null)),
                Set.of(mexican.getId()), Set.of(weeknight.getId()));

        String createResponse = mockMvc.perform(authenticated(post("/api/recipes"))
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.cuisineTags[0].name").value("Mexican"))
                .andExpect(jsonPath("$.descriptiveTags[0].name").value("weeknight"))
                .andReturn().getResponse().getContentAsString();

        JsonNode created = objectMapper.readTree(createResponse);
        Long recipeId = created.get("id").asLong();

        // A separate request/session from the create above, so this exercises the real
        // lazy-collection-after-session-close path that in-test @Transactional would mask.
        mockMvc.perform(authenticated(get("/api/recipes/" + recipeId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cuisineTags[0].name").value("Mexican"))
                .andExpect(jsonPath("$.descriptiveTags[0].name").value("weeknight"))
                .andExpect(jsonPath("$.ingredients[0].ingredientName").value("yellow onion"));

        RecipeRequest updateRequest = new RecipeRequest(
                "Weeknight Tacos v2", null, 4,
                List.of(new RecipeStepDto(1, "Dice the onion")),
                List.of(new RecipeIngredientRequest(
                        onion.getId(), new BigDecimal("2"), "cup", CutType.DICED, null, StateCondition.RAW, null, null)),
                Set.of(), Set.of());

        mockMvc.perform(authenticated(put("/api/recipes/" + recipeId))
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Weeknight Tacos v2"))
                .andExpect(jsonPath("$.cuisineTags.length()").value(0))
                .andExpect(jsonPath("$.descriptiveTags.length()").value(0));

        mockMvc.perform(authenticated(delete("/api/recipes/" + recipeId)))
                .andExpect(status().isNoContent());

        mockMvc.perform(authenticated(get("/api/recipes/" + recipeId)))
                .andExpect(status().isNotFound());
    }

    @Test
    void createWithNullAmountAndUnit_isCreated() throws Exception {
        Ingredient salt = ingredientRepository.save(new Ingredient("salt", IngredientCategory.BAKING_AND_SPICES));

        RecipeRequest request = new RecipeRequest(
                "Seasoned to Taste", null, 4,
                List.of(),
                List.of(new RecipeIngredientRequest(
                        salt.getId(), null, null, null, null, null, null, "to taste")),
                null, Set.of());

        mockMvc.perform(authenticated(post("/api/recipes"))
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.ingredients[0].amount").value(nullValue()))
                .andExpect(jsonPath("$.ingredients[0].unit").value(nullValue()))
                .andExpect(jsonPath("$.ingredients[0].notes").value("to taste"));
    }

    @Test
    void deleteRecipeReferencedByMealPlan_isConflict() throws Exception {
        Recipe recipe = recipeRepository.save(new Recipe("Referenced Recipe"));
        MealPlan mealPlan = new MealPlan("Uses It");
        mealPlan.replaceItems(List.of(MealPlanItem.forRecipe(mealPlan, recipe)));
        mealPlanRepository.save(mealPlan);

        mockMvc.perform(authenticated(delete("/api/recipes/" + recipe.getId())))
                .andExpect(status().isConflict());
    }

    @Test
    void createWithUnknownIngredient_isNotFound() throws Exception {
        RecipeRequest request = new RecipeRequest(
                "Ghost Recipe", null, 2,
                List.of(),
                List.of(new RecipeIngredientRequest(999999L, BigDecimal.ONE, "cup", null, null, null, null, null)),
                null, Set.of());

        mockMvc.perform(authenticated(post("/api/recipes"))
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    void createWithADescriptiveTagAsCuisine_isBadRequest() throws Exception {
        Tag weeknight = tagRepository.save(new Tag("weeknight", TagType.DESCRIPTIVE));

        RecipeRequest request = new RecipeRequest(
                "Mislabeled Tag Recipe", null, null,
                List.of(), List.of(),
                Set.of(weeknight.getId()), Set.of());

        mockMvc.perform(authenticated(post("/api/recipes"))
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
