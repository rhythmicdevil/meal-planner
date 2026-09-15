package com.rhythmicdevil.menu_planner.ingredient;

import com.rhythmicdevil.menu_planner.support.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@Transactional
class IngredientRepositoryTest extends AbstractIntegrationTest {

    @Autowired
    private IngredientRepository ingredientRepository;

    @Test
    void savesAndReloadsAliasesAndCategory() {
        Ingredient ingredient = new Ingredient("yellow onion", IngredientCategory.PRODUCE);
        ingredient.setAliases(Set.of("onion", "spanish onion"));
        ingredient.setDefaultUnit("each");

        Long id = ingredientRepository.saveAndFlush(ingredient).getId();
        ingredientRepository.flush();

        Ingredient reloaded = ingredientRepository.findById(id).orElseThrow();
        assertThat(reloaded.getName()).isEqualTo("yellow onion");
        assertThat(reloaded.getCategory()).isEqualTo(IngredientCategory.PRODUCE);
        assertThat(reloaded.getDefaultUnit()).isEqualTo("each");
        assertThat(reloaded.getAliases()).containsExactlyInAnyOrder("onion", "spanish onion");
    }
}
