package com.rhythmicdevil.menu_planner.ingredient;

import com.rhythmicdevil.menu_planner.ingredient.dto.IngredientRequest;
import com.rhythmicdevil.menu_planner.store.Store;
import com.rhythmicdevil.menu_planner.store.StoreRepository;
import com.rhythmicdevil.menu_planner.support.AbstractApiTest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import tools.jackson.databind.ObjectMapper;

import java.util.Set;

import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class IngredientControllerTest extends AbstractApiTest {

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private IngredientRepository ingredientRepository;

    @Autowired
    private StoreRepository storeRepository;

    @AfterEach
    void cleanUp() {
        ingredientRepository.deleteAll();
        storeRepository.deleteAll();
    }

    @Test
    void createFetchUpdateAndDelete() throws Exception {
        Store traderJoes = storeRepository.save(new Store("Trader Joe's"));
        Store costco = storeRepository.save(new Store("Costco"));

        IngredientRequest request = new IngredientRequest(
                "yellow onion", Set.of("onion", "spanish onion"), "each", IngredientCategory.PRODUCE,
                Set.of(traderJoes.getId(), costco.getId()));

        String createResponse = mockMvc.perform(authenticated(post("/api/ingredients"))
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.name").value("yellow onion"))
                .andExpect(jsonPath("$.category").value("PRODUCE"))
                .andExpect(jsonPath("$.stores.length()").value(2))
                .andExpect(jsonPath("$.stores[0].name").value("Costco"))
                .andExpect(jsonPath("$.stores[1].name").value("Trader Joe's"))
                .andReturn().getResponse().getContentAsString();

        Long id = objectMapper.readTree(createResponse).get("id").asLong();

        // Fetching by id (a separate request/session from the create above) exercises the
        // real lazy-collection-after-session-close path that in-test @Transactional would mask.
        mockMvc.perform(authenticated(get("/api/ingredients/" + id)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("yellow onion"))
                .andExpect(jsonPath("$.aliases", containsInAnyOrder("onion", "spanish onion")))
                .andExpect(jsonPath("$.stores.length()").value(2))
                .andExpect(jsonPath("$.stores[0].name").value("Costco"))
                .andExpect(jsonPath("$.stores[1].name").value("Trader Joe's"));

        mockMvc.perform(authenticated(get("/api/ingredients")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("yellow onion"));

        IngredientRequest updateRequest = new IngredientRequest(
                "yellow onion", Set.of("onion", "spanish onion", "brown onion"), "each",
                IngredientCategory.CANNED_GOODS_AND_SOUP, null);

        mockMvc.perform(authenticated(put("/api/ingredients/" + id))
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.category").value("CANNED_GOODS_AND_SOUP"))
                .andExpect(jsonPath("$.aliases", containsInAnyOrder("onion", "spanish onion", "brown onion")))
                .andExpect(jsonPath("$.stores.length()").value(0));

        mockMvc.perform(authenticated(delete("/api/ingredients/" + id)))
                .andExpect(status().isNoContent());

        mockMvc.perform(authenticated(get("/api/ingredients/" + id)))
                .andExpect(status().isNotFound());
    }

    @Test
    void createWithoutCredentials_isUnauthorized() throws Exception {
        IngredientRequest request = new IngredientRequest("yellow onion", null, null, IngredientCategory.PRODUCE, null);

        mockMvc.perform(post("/api/ingredients")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void createWithBlankName_isBadRequest() throws Exception {
        IngredientRequest request = new IngredientRequest("", null, null, IngredientCategory.PRODUCE, null);

        mockMvc.perform(authenticated(post("/api/ingredients"))
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.name").exists());
    }
}
