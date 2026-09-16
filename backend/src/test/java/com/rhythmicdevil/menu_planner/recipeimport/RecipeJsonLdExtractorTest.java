package com.rhythmicdevil.menu_planner.recipeimport;

import com.rhythmicdevil.menu_planner.recipeimport.dto.RawRecipeDTO;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RecipeJsonLdExtractorTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    private JsonNode loadFixture(String name) throws IOException {
        try (InputStream is = getClass().getResourceAsStream("/import-fixtures/" + name)) {
            String json = new String(is.readAllBytes(), StandardCharsets.UTF_8);
            return objectMapper.readTree(json);
        }
    }

    @Test
    void flatTopLevelRecipe_numericYield() throws IOException {
        JsonNode block = loadFixture("sarahscucinabella-risotto.json");
        JsonNode recipeNode = RecipeJsonLdExtractor.findRecipeNode(List.of(block)).orElseThrow();

        RawRecipeDTO dto = RecipeJsonLdExtractor.toRawRecipeDto(recipeNode, "https://example.com/risotto");

        assertThat(dto.name()).isEqualTo("Roasted Tomato Risotto");
        assertThat(dto.sourceUrl()).isEqualTo("https://example.com/risotto");
        assertThat(dto.servings()).isEqualTo(4);
        assertThat(dto.ingredientLines()).hasSize(12);
        assertThat(dto.ingredientLines()).contains("4 cups cherry tomatoes", "salt and pepper, to taste");
        assertThat(dto.instructionLines()).hasSize(6);
        assertThat(dto.tags()).containsExactlyInAnyOrder("dinner", "italian");
    }

    @Test
    void graphNestedRecipe_arrayYield_andCompoundIngredientLines() throws IOException {
        JsonNode block = loadFixture("liveeatlearn-tortellini-soup.json");
        JsonNode recipeNode = RecipeJsonLdExtractor.findRecipeNode(List.of(block)).orElseThrow();

        RawRecipeDTO dto = RecipeJsonLdExtractor.toRawRecipeDto(recipeNode, "https://example.com/soup");

        assertThat(dto.name()).isEqualTo("Marry Me Tortellini Soup (Creamy Broth)");
        assertThat(dto.servings()).isEqualTo(4);
        assertThat(dto.ingredientLines()).hasSize(14);
        assertThat(dto.ingredientLines()).contains("1 tsp each oregano, crushed red pepper flakes, smoked paprika");
        assertThat(dto.instructionLines()).hasSize(4);
        // "&#32;" html-entity noise in the raw instruction text should be unescaped to a space
        assertThat(dto.instructionLines().get(0)).contains("Melt 2 Tbsp unsalted butter");
        assertThat(dto.tags()).containsExactlyInAnyOrder("main dishes", "soups", "italian", "mediterranean");
    }

    @Test
    void graphNestedRecipe_stringYield_andHtmlEntityUnescaping() throws IOException {
        JsonNode block = loadFixture("feastingathome-pasta.json");
        JsonNode recipeNode = RecipeJsonLdExtractor.findRecipeNode(List.of(block)).orElseThrow();

        RawRecipeDTO dto = RecipeJsonLdExtractor.toRawRecipeDto(recipeNode, "https://example.com/pasta");

        assertThat(dto.name()).isEqualTo("Roasted Vegetable Pasta");
        assertThat(dto.servings()).isEqualTo(4);
        assertThat(dto.ingredientLines()).hasSize(16);
        assertThat(dto.ingredientLines().get(0)).isEqualTo("1 pound zucchini – about 2 medium zucchini cut in 1/2 moon slices");
        assertThat(dto.ingredientLines()).contains("salt to taste", "black pepper to taste");
        assertThat(dto.instructionLines()).hasSize(7);
        assertThat(dto.tags()).containsExactlyInAnyOrder("dinner recipe", "italian");
    }

    @Test
    void noRecipeNodePresent_returnsEmpty() throws IOException {
        JsonNode block = objectMapper.readTree("{\"@type\":\"Article\",\"name\":\"Not a recipe\"}");

        assertThat(RecipeJsonLdExtractor.findRecipeNode(List.of(block))).isEmpty();
    }

    @Test
    void emptyBlockList_returnsEmpty() {
        assertThat(RecipeJsonLdExtractor.findRecipeNode(List.of())).isEmpty();
    }

    @Test
    void missingName_throws() {
        JsonNode recipeNode = objectMapper.readTree("{\"@type\":\"Recipe\"}");

        assertThatThrownBy(() -> RecipeJsonLdExtractor.toRawRecipeDto(recipeNode, "https://example.com"))
                .isInstanceOf(RecipeImportException.class);
    }

    @Test
    void howToSection_flattensNestedSteps() {
        JsonNode recipeNode = objectMapper.readTree("""
                {
                  "@type": "Recipe",
                  "name": "Sectioned Recipe",
                  "recipeInstructions": [
                    {
                      "@type": "HowToSection",
                      "name": "Sauce",
                      "itemListElement": [
                        {"@type": "HowToStep", "text": "Make the sauce"},
                        {"@type": "HowToStep", "text": "Simmer the sauce"}
                      ]
                    },
                    {
                      "@type": "HowToSection",
                      "name": "Assembly",
                      "itemListElement": [
                        {"@type": "HowToStep", "text": "Combine everything"}
                      ]
                    }
                  ]
                }
                """);

        RawRecipeDTO dto = RecipeJsonLdExtractor.toRawRecipeDto(recipeNode, "https://example.com");

        assertThat(dto.instructionLines()).containsExactly(
                "Make the sauce", "Simmer the sauce", "Combine everything");
    }
}
