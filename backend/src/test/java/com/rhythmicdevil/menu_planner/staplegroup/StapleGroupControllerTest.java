package com.rhythmicdevil.menu_planner.staplegroup;

import com.rhythmicdevil.menu_planner.ingredient.Ingredient;
import com.rhythmicdevil.menu_planner.ingredient.IngredientCategory;
import com.rhythmicdevil.menu_planner.ingredient.IngredientRepository;
import com.rhythmicdevil.menu_planner.staplegroup.dto.StapleGroupRequest;
import com.rhythmicdevil.menu_planner.staplegroup.dto.StapleItemRequest;
import com.rhythmicdevil.menu_planner.support.AbstractApiTest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import tools.jackson.databind.ObjectMapper;

import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class StapleGroupControllerTest extends AbstractApiTest {

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private StapleGroupRepository stapleGroupRepository;

    @Autowired
    private IngredientRepository ingredientRepository;

    @AfterEach
    void cleanUp() {
        stapleGroupRepository.deleteAll();
        ingredientRepository.deleteAll();
    }

    @Test
    void createFetchUpdateAndDelete() throws Exception {
        Ingredient bananas = ingredientRepository.save(new Ingredient("bananas", IngredientCategory.PRODUCE));

        StapleGroupRequest createRequest = new StapleGroupRequest("Paper Products", List.of(
                new StapleItemRequest("paper towels", null),
                new StapleItemRequest("bananas", bananas.getId())
        ));

        String createResponse = mockMvc.perform(authenticated(post("/api/staple-groups"))
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Paper Products"))
                .andExpect(jsonPath("$.items.length()").value(2))
                .andExpect(jsonPath("$.items[0].name").value("paper towels"))
                .andExpect(jsonPath("$.items[0].ingredientId").doesNotExist())
                .andExpect(jsonPath("$.items[1].name").value("bananas"))
                .andExpect(jsonPath("$.items[1].ingredientId").value(bananas.getId()))
                .andExpect(jsonPath("$.items[1].ingredientName").value("bananas"))
                .andReturn().getResponse().getContentAsString();

        Long groupId = objectMapper.readTree(createResponse).get("id").asLong();

        mockMvc.perform(authenticated(get("/api/staple-groups/" + groupId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(2));

        // replace the items wholesale with just one, unlinked
        StapleGroupRequest updateRequest = new StapleGroupRequest("Paper Products",
                List.of(new StapleItemRequest("napkins", null)));

        mockMvc.perform(authenticated(put("/api/staple-groups/" + groupId))
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].name").value("napkins"));

        mockMvc.perform(authenticated(delete("/api/staple-groups/" + groupId)))
                .andExpect(status().isNoContent());

        mockMvc.perform(authenticated(get("/api/staple-groups/" + groupId)))
                .andExpect(status().isNotFound());
    }

    @Test
    void createWithUnknownIngredient_isNotFound() throws Exception {
        StapleGroupRequest request = new StapleGroupRequest("Ghost Group",
                List.of(new StapleItemRequest("mystery item", 999999L)));

        mockMvc.perform(authenticated(post("/api/staple-groups"))
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }
}
