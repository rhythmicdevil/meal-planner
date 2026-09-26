package com.rhythmicdevil.menu_planner.tag;

import com.rhythmicdevil.menu_planner.tag.dto.TagRequest;
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

class TagControllerTest extends AbstractApiTest {

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private TagRepository tagRepository;

    @AfterEach
    void cleanUp() {
        tagRepository.deleteAll();
    }

    @Test
    void createFetchUpdateAndDelete() throws Exception {
        String createResponse = mockMvc.perform(authenticated(post("/api/tags"))
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new TagRequest("Mexican", TagType.CUISINE))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Mexican"))
                .andExpect(jsonPath("$.type").value("CUISINE"))
                .andReturn().getResponse().getContentAsString();

        Long tagId = objectMapper.readTree(createResponse).get("id").asLong();

        mockMvc.perform(authenticated(get("/api/tags/" + tagId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Mexican"));

        mockMvc.perform(authenticated(put("/api/tags/" + tagId))
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new TagRequest("Tex-Mex", TagType.CUISINE))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Tex-Mex"));

        mockMvc.perform(authenticated(delete("/api/tags/" + tagId)))
                .andExpect(status().isNoContent());

        mockMvc.perform(authenticated(get("/api/tags/" + tagId)))
                .andExpect(status().isNotFound());
    }

    @Test
    void createWithBlankName_isBadRequest() throws Exception {
        mockMvc.perform(authenticated(post("/api/tags"))
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new TagRequest("", TagType.DESCRIPTIVE))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.name").exists());
    }
}
