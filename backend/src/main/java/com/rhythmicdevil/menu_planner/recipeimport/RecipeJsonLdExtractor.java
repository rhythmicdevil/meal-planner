package com.rhythmicdevil.menu_planner.recipeimport;

import com.rhythmicdevil.menu_planner.recipeimport.dto.RawRecipeDTO;
import org.jsoup.parser.Parser;
import tools.jackson.databind.JsonNode;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

// Pure JSON-LD tree extraction, no I/O -- lets the messy real-world-schema-variety handling
// (flat vs @graph-nested Recipe node, recipeYield as number/string/array, HowToStep vs plain
// string vs HowToSection instructions) be unit tested directly against captured fixtures.
final class RecipeJsonLdExtractor {

    private static final Pattern DIGITS = Pattern.compile("\\d+");

    private RecipeJsonLdExtractor() {
    }

    static Optional<JsonNode> findRecipeNode(List<JsonNode> ldJsonBlocks) {
        for (JsonNode block : ldJsonBlocks) {
            Optional<JsonNode> found = findRecipeNode(block);
            if (found.isPresent()) {
                return found;
            }
        }
        return Optional.empty();
    }

    private static Optional<JsonNode> findRecipeNode(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return Optional.empty();
        }
        if (node.isObject()) {
            if (isRecipeType(node)) {
                return Optional.of(node);
            }
            JsonNode graph = node.path("@graph");
            if (graph.isArray()) {
                return findRecipeNode(graph);
            }
            return Optional.empty();
        }
        if (node.isArray()) {
            for (JsonNode element : node) {
                Optional<JsonNode> found = findRecipeNode(element);
                if (found.isPresent()) {
                    return found;
                }
            }
        }
        return Optional.empty();
    }

    private static boolean isRecipeType(JsonNode node) {
        JsonNode type = node.path("@type");
        if (type.isTextual()) {
            return "Recipe".equals(type.asString());
        }
        if (type.isArray()) {
            for (JsonNode t : type) {
                if (t.isTextual() && "Recipe".equals(t.asString())) {
                    return true;
                }
            }
        }
        return false;
    }

    static RawRecipeDTO toRawRecipeDto(JsonNode recipeNode, String sourceUrl) {
        String name = unescape(recipeNode.path("name").asString(null));
        if (name == null || name.isBlank()) {
            throw new RecipeImportException("Recipe page did not include a name");
        }

        Integer servings = parseYield(recipeNode.path("recipeYield"));
        List<String> ingredientLines = extractIngredientLines(recipeNode.path("recipeIngredient"));
        List<String> instructionLines = extractInstructionLines(recipeNode.path("recipeInstructions"));
        Set<String> tags = extractTags(recipeNode);

        return new RawRecipeDTO(name.trim(), sourceUrl, servings, ingredientLines, instructionLines, tags);
    }

    // recipeYield shows up as a plain number, a string ("4"), or an array of strings
    // (["4", "4 servings"]) in the wild -- pull the first integer found, whatever the shape.
    private static Integer parseYield(JsonNode yieldNode) {
        if (yieldNode.isNumber()) {
            return yieldNode.asInt();
        }
        if (yieldNode.isTextual()) {
            return firstInt(yieldNode.asString());
        }
        if (yieldNode.isArray()) {
            for (JsonNode element : yieldNode) {
                Integer parsed = element.isNumber() ? element.asInt() : firstInt(element.asString(""));
                if (parsed != null) {
                    return parsed;
                }
            }
        }
        return null;
    }

    private static Integer firstInt(String text) {
        if (text == null) {
            return null;
        }
        Matcher matcher = DIGITS.matcher(text);
        return matcher.find() ? Integer.parseInt(matcher.group()) : null;
    }

    private static List<String> extractIngredientLines(JsonNode ingredientsNode) {
        List<String> lines = new ArrayList<>();
        if (!ingredientsNode.isArray()) {
            return lines;
        }
        for (JsonNode line : ingredientsNode) {
            String text = unescape(line.asString(null));
            if (text != null && !text.isBlank()) {
                lines.add(text.trim());
            }
        }
        return lines;
    }

    private static List<String> extractInstructionLines(JsonNode instructionsNode) {
        List<String> lines = new ArrayList<>();
        collectInstructionLines(instructionsNode, lines);
        return lines;
    }

    // recipeInstructions elements can be a HowToStep object (.text), a plain string, or a
    // HowToSection grouping (.itemListElement, itself a list of HowToStep) -- flatten all
    // three shapes into one ordered list of step text, dropping any section headers since
    // the domain model has no concept of grouped steps.
    private static void collectInstructionLines(JsonNode node, List<String> lines) {
        if (!node.isArray()) {
            return;
        }
        for (JsonNode element : node) {
            if (element.isTextual()) {
                addInstructionLine(element.asString(null), lines);
                continue;
            }
            if (!element.isObject()) {
                continue;
            }
            JsonNode itemListElement = element.path("itemListElement");
            if (itemListElement.isArray()) {
                collectInstructionLines(itemListElement, lines);
                continue;
            }
            addInstructionLine(element.path("text").asString(null), lines);
        }
    }

    private static void addInstructionLine(String rawText, List<String> lines) {
        String text = unescape(rawText);
        if (text != null && !text.isBlank()) {
            lines.add(text.trim());
        }
    }

    private static Set<String> extractTags(JsonNode recipeNode) {
        Set<String> tags = new LinkedHashSet<>();
        addTagValues(recipeNode.path("recipeCategory"), tags);
        addTagValues(recipeNode.path("recipeCuisine"), tags);
        return tags;
    }

    private static void addTagValues(JsonNode node, Set<String> tags) {
        if (node.isTextual()) {
            addTag(node.asString(null), tags);
        } else if (node.isArray()) {
            for (JsonNode element : node) {
                addTag(element.asString(null), tags);
            }
        }
    }

    private static void addTag(String rawTag, Set<String> tags) {
        String tag = unescape(rawTag);
        if (tag != null && !tag.isBlank()) {
            tags.add(tag.trim().toLowerCase());
        }
    }

    private static String unescape(String text) {
        return text == null ? null : Parser.unescapeEntities(text, false);
    }
}
