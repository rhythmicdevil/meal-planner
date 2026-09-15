package com.rhythmicdevil.menu_planner.recipe;

import com.rhythmicdevil.menu_planner.ingredient.Ingredient;
import com.rhythmicdevil.menu_planner.ingredient.IngredientCategory;
import com.rhythmicdevil.menu_planner.ingredient.IngredientRepository;
import com.rhythmicdevil.menu_planner.support.AbstractIntegrationTest;
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

    @Test
    void savesAndReloadsStepsIngredientsAndTags() {
        Ingredient onion = ingredientRepository.save(new Ingredient("yellow onion", IngredientCategory.PRODUCE));

        Recipe recipe = new Recipe("Weeknight Tacos");
        recipe.setServings(4);
        recipe.setTags(Set.of("weeknight", "mexican"));
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
        assertThat(reloaded.getVersion()).isEqualTo(1);
        assertThat(reloaded.getTags()).containsExactlyInAnyOrder("weeknight", "mexican");
        assertThat(reloaded.getSteps()).extracting(RecipeStep::getStepText)
                .containsExactly("Dice the onion", "Brown the meat");
        assertThat(reloaded.getIngredients()).hasSize(1);
        assertThat(reloaded.getIngredients().get(0).getIngredient().getName()).isEqualTo("yellow onion");
        assertThat(reloaded.getIngredients().get(0).getCutType()).isEqualTo(CutType.DICED);
    }
}
