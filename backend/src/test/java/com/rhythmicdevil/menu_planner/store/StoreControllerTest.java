package com.rhythmicdevil.menu_planner.store;

import com.rhythmicdevil.menu_planner.store.dto.StoreRequest;
import com.rhythmicdevil.menu_planner.support.AbstractApiTest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import tools.jackson.databind.ObjectMapper;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class StoreControllerTest extends AbstractApiTest {

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private StoreRepository storeRepository;

    @AfterEach
    void cleanUp() {
        storeRepository.deleteAll();
    }

    @Test
    void createFetchUpdateAndDelete() throws Exception {
        String createResponse = mockMvc.perform(authenticated(post("/api/stores"))
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new StoreRequest("Trader Joe's"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Trader Joe's"))
                .andReturn().getResponse().getContentAsString();

        Long storeId = objectMapper.readTree(createResponse).get("id").asLong();

        mockMvc.perform(authenticated(get("/api/stores/" + storeId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Trader Joe's"));

        mockMvc.perform(authenticated(put("/api/stores/" + storeId))
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new StoreRequest("Costco"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Costco"));

        mockMvc.perform(authenticated(delete("/api/stores/" + storeId)))
                .andExpect(status().isNoContent());

        mockMvc.perform(authenticated(get("/api/stores/" + storeId)))
                .andExpect(status().isNotFound());
    }

    @Test
    void createWithBlankName_isBadRequest() throws Exception {
        mockMvc.perform(authenticated(post("/api/stores"))
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new StoreRequest(""))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.name").exists());
    }
}
