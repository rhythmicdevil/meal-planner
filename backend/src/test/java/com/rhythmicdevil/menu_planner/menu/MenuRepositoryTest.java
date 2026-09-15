package com.rhythmicdevil.menu_planner.menu;

import com.rhythmicdevil.menu_planner.recipe.Recipe;
import com.rhythmicdevil.menu_planner.recipe.RecipeRepository;
import com.rhythmicdevil.menu_planner.support.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@Transactional
class MenuRepositoryTest extends AbstractIntegrationTest {

    @Autowired
    private MenuRepository menuRepository;

    @Autowired
    private RecipeRepository recipeRepository;

    @Test
    void savesAndReloadsRecipes() {
        Recipe tacos = recipeRepository.save(new Recipe("Tacos"));
        Recipe rice = recipeRepository.save(new Recipe("Rice"));

        Menu menu = new Menu("Taco Night");
        menu.setRecipes(Set.of(tacos, rice));

        Long id = menuRepository.saveAndFlush(menu).getId();
        menuRepository.flush();

        Menu reloaded = menuRepository.findById(id).orElseThrow();
        assertThat(reloaded.getName()).isEqualTo("Taco Night");
        assertThat(reloaded.getRecipes()).extracting(Recipe::getName)
                .containsExactlyInAnyOrder("Tacos", "Rice");
    }
}
