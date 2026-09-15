package com.rhythmicdevil.menu_planner.mealplan;

import com.rhythmicdevil.menu_planner.menu.Menu;
import com.rhythmicdevil.menu_planner.menu.MenuRepository;
import com.rhythmicdevil.menu_planner.recipe.Recipe;
import com.rhythmicdevil.menu_planner.recipe.RecipeRepository;
import com.rhythmicdevil.menu_planner.support.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@Transactional
class MealPlanRepositoryTest extends AbstractIntegrationTest {

    @Autowired
    private MealPlanRepository mealPlanRepository;

    @Autowired
    private RecipeRepository recipeRepository;

    @Autowired
    private MenuRepository menuRepository;

    @Test
    void savesAndReloadsAMixOfRecipeAndMenuItems() {
        Recipe pancakes = recipeRepository.save(new Recipe("Pancakes"));
        Recipe tacos = recipeRepository.save(new Recipe("Tacos"));
        Menu tacoNight = new Menu("Taco Night");
        tacoNight.setRecipes(Set.of(tacos));
        tacoNight = menuRepository.save(tacoNight);

        MealPlan mealPlan = new MealPlan("This Week");
        mealPlan.replaceItems(List.of(
                MealPlanItem.forRecipe(mealPlan, pancakes),
                MealPlanItem.forMenu(mealPlan, tacoNight)
        ));

        Long id = mealPlanRepository.saveAndFlush(mealPlan).getId();
        mealPlanRepository.flush();

        MealPlan reloaded = mealPlanRepository.findById(id).orElseThrow();
        assertThat(reloaded.getItems()).hasSize(2);

        MealPlanItem recipeItem = reloaded.getItems().stream()
                .filter(i -> i.getItemType() == MealPlanItemType.RECIPE).findFirst().orElseThrow();
        assertThat(recipeItem.getRecipe().getName()).isEqualTo("Pancakes");

        MealPlanItem menuItem = reloaded.getItems().stream()
                .filter(i -> i.getItemType() == MealPlanItemType.MENU).findFirst().orElseThrow();
        assertThat(menuItem.getMenu().getName()).isEqualTo("Taco Night");
    }
}
