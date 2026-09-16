package com.rhythmicdevil.menu_planner.menu;

import com.rhythmicdevil.menu_planner.menu.dto.MenuRequest;
import com.rhythmicdevil.menu_planner.recipe.Recipe;
import com.rhythmicdevil.menu_planner.recipe.RecipeRepository;
import com.rhythmicdevil.menu_planner.support.AbstractApiTest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import tools.jackson.databind.ObjectMapper;

import java.util.Set;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class MenuControllerTest extends AbstractApiTest {

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private RecipeRepository recipeRepository;

    @Autowired
    private MenuRepository menuRepository;

    @AfterEach
    void cleanUp() {
        menuRepository.deleteAll();
        recipeRepository.deleteAll();
    }

    @Test
    void createFetchUpdateAndDelete() throws Exception {
        Recipe tacos = recipeRepository.save(new Recipe("Tacos"));
        Recipe rice = recipeRepository.save(new Recipe("Rice"));

        String createResponse = mockMvc.perform(authenticated(post("/api/menus"))
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(
                                new MenuRequest("Taco Night", Set.of(tacos.getId())))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Taco Night"))
                .andExpect(jsonPath("$.recipes[0].name").value("Tacos"))
                .andReturn().getResponse().getContentAsString();

        Long menuId = objectMapper.readTree(createResponse).get("id").asLong();

        mockMvc.perform(authenticated(get("/api/menus/" + menuId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.recipes.length()").value(1));

        // replace the recipe set wholesale with both recipes
        mockMvc.perform(authenticated(put("/api/menus/" + menuId))
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(
                                new MenuRequest("Taco Night", Set.of(tacos.getId(), rice.getId())))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.recipes.length()").value(2));

        mockMvc.perform(authenticated(delete("/api/menus/" + menuId)))
                .andExpect(status().isNoContent());

        mockMvc.perform(authenticated(get("/api/menus/" + menuId)))
                .andExpect(status().isNotFound());
    }

    @Test
    void createWithUnknownRecipe_isNotFound() throws Exception {
        mockMvc.perform(authenticated(post("/api/menus"))
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(
                                new MenuRequest("Ghost Menu", Set.of(999999L)))))
                .andExpect(status().isNotFound());
    }
}
