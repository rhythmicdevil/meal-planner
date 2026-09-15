package com.rhythmicdevil.menu_planner.recipe;

import com.rhythmicdevil.menu_planner.ingredient.Ingredient;
import com.rhythmicdevil.menu_planner.ingredient.IngredientCategory;
import com.rhythmicdevil.menu_planner.ingredient.IngredientRepository;
import com.rhythmicdevil.menu_planner.recipe.dto.RecipeIngredientRequest;
import com.rhythmicdevil.menu_planner.recipe.dto.RecipeRequest;
import com.rhythmicdevil.menu_planner.recipe.dto.RecipeStepDto;
import com.rhythmicdevil.menu_planner.support.AbstractApiTest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

import static org.hamcrest.Matchers.nullValue;
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

    @AfterEach
    void cleanUp() {
        recipeRepository.deleteAll();
        ingredientRepository.deleteAll();
    }

    @Test
    void createThenUpdate_incrementsVersion() throws Exception {
        Ingredient onion = ingredientRepository.save(new Ingredient("yellow onion", IngredientCategory.PRODUCE));

        RecipeRequest createRequest = new RecipeRequest(
                "Weeknight Tacos", null, 4,
                List.of(new RecipeStepDto(1, "Dice the onion")),
                List.of(new RecipeIngredientRequest(
                        onion.getId(), new BigDecimal("1.5"), "cup", CutType.DICED, null, StateCondition.RAW, null, null)),
                Set.of("weeknight"));

        String createResponse = mockMvc.perform(authenticated(post("/api/recipes"))
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.version").value(1))
                .andReturn().getResponse().getContentAsString();

        JsonNode created = objectMapper.readTree(createResponse);
        Long recipeId = created.get("id").asLong();

        // A separate request/session from the create above, so this exercises the real
        // lazy-collection-after-session-close path that in-test @Transactional would mask.
        mockMvc.perform(authenticated(get("/api/recipes/" + recipeId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tags[0]").value("weeknight"))
                .andExpect(jsonPath("$.ingredients[0].ingredientName").value("yellow onion"));

        RecipeRequest updateRequest = new RecipeRequest(
                "Weeknight Tacos v2", null, 4,
                List.of(new RecipeStepDto(1, "Dice the onion")),
                List.of(new RecipeIngredientRequest(
                        onion.getId(), new BigDecimal("2"), "cup", CutType.DICED, null, StateCondition.RAW, null, null)),
                Set.of("weeknight"));

        mockMvc.perform(authenticated(put("/api/recipes/" + recipeId))
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.version").value(2))
                .andExpect(jsonPath("$.name").value("Weeknight Tacos v2"));
    }

    @Test
    void createWithNullAmountAndUnit_isCreated() throws Exception {
        Ingredient salt = ingredientRepository.save(new Ingredient("salt", IngredientCategory.SPICE));

        RecipeRequest request = new RecipeRequest(
                "Seasoned to Taste", null, 4,
                List.of(),
                List.of(new RecipeIngredientRequest(
                        salt.getId(), null, null, null, null, null, null, "to taste")),
                Set.of());

        mockMvc.perform(authenticated(post("/api/recipes"))
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.ingredients[0].amount").value(nullValue()))
                .andExpect(jsonPath("$.ingredients[0].unit").value(nullValue()))
                .andExpect(jsonPath("$.ingredients[0].notes").value("to taste"));
    }

    @Test
    void createWithUnknownIngredient_isNotFound() throws Exception {
        RecipeRequest request = new RecipeRequest(
                "Ghost Recipe", null, 2,
                List.of(),
                List.of(new RecipeIngredientRequest(999999L, BigDecimal.ONE, "cup", null, null, null, null, null)),
                Set.of());

        mockMvc.perform(authenticated(post("/api/recipes"))
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }
}
