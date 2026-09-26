package com.rhythmicdevil.menu_planner.recipe;

import com.rhythmicdevil.menu_planner.ingredient.Ingredient;
import com.rhythmicdevil.menu_planner.ingredient.IngredientCategory;
import com.rhythmicdevil.menu_planner.ingredient.IngredientRepository;
import com.rhythmicdevil.menu_planner.support.AbstractIntegrationTest;
import com.rhythmicdevil.menu_planner.tag.Tag;
import com.rhythmicdevil.menu_planner.tag.TagRepository;
import com.rhythmicdevil.menu_planner.tag.TagType;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@Transactional
class RecipeRepositoryTest extends AbstractIntegrationTest {

    @Autowired
    private RecipeRepository recipeRepository;

    @Autowired
    private IngredientRepository ingredientRepository;

    @Autowired
    private TagRepository tagRepository;

    @Test
    void savesAndReloadsStepsIngredientsAndTags() {
        Ingredient onion = ingredientRepository.save(new Ingredient("yellow onion", IngredientCategory.PRODUCE));
        Tag mexican = tagRepository.save(new Tag("Mexican", TagType.CUISINE));
        Tag weeknight = tagRepository.save(new Tag("weeknight", TagType.DESCRIPTIVE));
        Tag quick = tagRepository.save(new Tag("quick", TagType.DESCRIPTIVE));

        Recipe recipe = new Recipe("Weeknight Tacos");
        recipe.setServings(4);
        recipe.setCuisineTag(mexican);
        recipe.setDescriptiveTags(Set.of(weeknight, quick));
        recipe.setSteps(List.of(
                new RecipeStep(1, "Dice the onion"),
                new RecipeStep(2, "Brown the meat")
        ));

        RecipeIngredient recipeIngredient = new RecipeIngredient(onion, new BigDecimal("1.5"), "cup");
        recipeIngredient.setCutType(CutType.DICED);
        recipeIngredient.setStateCondition(StateCondition.RAW);
        recipe.replaceIngredients(List.of(recipeIngredient));

        Long id = recipeRepository.saveAndFlush(recipe).getId();
        recipeRepository.flush();

        Recipe reloaded = recipeRepository.findById(id).orElseThrow();
        assertThat(reloaded.getName()).isEqualTo("Weeknight Tacos");
        assertThat(reloaded.getCuisineTag().getName()).isEqualTo("Mexican");
        assertThat(reloaded.getDescriptiveTags()).extracting(Tag::getName)
                .containsExactlyInAnyOrder("weeknight", "quick");
        assertThat(reloaded.getSteps()).extracting(RecipeStep::getStepText)
                .containsExactly("Dice the onion", "Brown the meat");
        assertThat(reloaded.getIngredients()).hasSize(1);
        assertThat(reloaded.getIngredients().get(0).getIngredient().getName()).isEqualTo("yellow onion");
        assertThat(reloaded.getIngredients().get(0).getCutType()).isEqualTo(CutType.DICED);
    }
}
