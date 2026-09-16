package com.rhythmicdevil.menu_planner.recipeimport;

import com.rhythmicdevil.menu_planner.recipeimport.dto.RawRecipeDTO;
import com.rhythmicdevil.menu_planner.recipeimport.dto.RecipeImportRequest;
import com.rhythmicdevil.menu_planner.support.AbstractApiTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import tools.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Set;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Stubs RecipeImportAdapter instead of hitting the real network -- fetch/parse edge cases
// are UrlImportAdapterTest's job, this just verifies the controller's wiring (auth,
// validation, exception mapping, JSON shape).
class ImportControllerTest extends AbstractApiTest {

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private RecipeImportAdapter recipeImportAdapter;

    @Test
    void importFromUrl_returnsParsedRecipe() throws Exception {
        RawRecipeDTO parsed = new RawRecipeDTO(
                "Roasted Tomato Risotto", "https://example.com/risotto", 4,
                List.of("4 cups cherry tomatoes"), List.of("Roast the tomatoes"), Set.of("dinner"));
        when(recipeImportAdapter.parse("https://example.com/risotto")).thenReturn(parsed);

        mockMvc.perform(authenticated(post("/api/import/url"))
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new RecipeImportRequest("https://example.com/risotto"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Roasted Tomato Risotto"))
                .andExpect(jsonPath("$.servings").value(4))
                .andExpect(jsonPath("$.ingredientLines[0]").value("4 cups cherry tomatoes"));
    }

    @Test
    void importFromUrl_withoutCredentials_isUnauthorized() throws Exception {
        mockMvc.perform(post("/api/import/url")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new RecipeImportRequest("https://example.com/risotto"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void importFromUrl_withBlankUrl_isBadRequest() throws Exception {
        mockMvc.perform(authenticated(post("/api/import/url"))
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new RecipeImportRequest(""))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.url").exists());
    }

    @Test
    void importFromUrl_whenAdapterFails_isBadRequest() throws Exception {
        when(recipeImportAdapter.parse(anyString()))
                .thenThrow(new RecipeImportException("Could not find recipe data at this URL"));

        mockMvc.perform(authenticated(post("/api/import/url"))
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new RecipeImportRequest("https://example.com/no-recipe"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Could not find recipe data at this URL"));
    }
}
