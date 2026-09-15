package com.rhythmicdevil.menu_planner.ingredient;

import com.rhythmicdevil.menu_planner.ingredient.dto.IngredientRequest;
import com.rhythmicdevil.menu_planner.support.AbstractApiTest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import tools.jackson.databind.ObjectMapper;

import java.util.Set;

import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class IngredientControllerTest extends AbstractApiTest {

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private IngredientRepository ingredientRepository;

    @AfterEach
    void cleanUp() {
        ingredientRepository.deleteAll();
    }

    @Test
    void createThenFetchIngredient() throws Exception {
        IngredientRequest request = new IngredientRequest(
                "yellow onion", Set.of("onion", "spanish onion"), "each", IngredientCategory.PRODUCE);

        String createResponse = mockMvc.perform(authenticated(post("/api/ingredients"))
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.name").value("yellow onion"))
                .andExpect(jsonPath("$.category").value("PRODUCE"))
                .andReturn().getResponse().getContentAsString();

        Long id = objectMapper.readTree(createResponse).get("id").asLong();

        // Fetching by id (a separate request/session from the create above) exercises the
        // real lazy-collection-after-session-close path that in-test @Transactional would mask.
        mockMvc.perform(authenticated(get("/api/ingredients/" + id)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("yellow onion"))
                .andExpect(jsonPath("$.aliases", containsInAnyOrder("onion", "spanish onion")));

        mockMvc.perform(authenticated(get("/api/ingredients")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("yellow onion"));
    }

    @Test
    void createWithoutCredentials_isUnauthorized() throws Exception {
        IngredientRequest request = new IngredientRequest("yellow onion", null, null, IngredientCategory.PRODUCE);

        mockMvc.perform(post("/api/ingredients")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void createWithBlankName_isBadRequest() throws Exception {
        IngredientRequest request = new IngredientRequest("", null, null, IngredientCategory.PRODUCE);

        mockMvc.perform(authenticated(post("/api/ingredients"))
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.name").exists());
    }
}
