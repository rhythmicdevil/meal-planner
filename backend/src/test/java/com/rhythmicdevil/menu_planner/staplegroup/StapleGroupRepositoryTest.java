package com.rhythmicdevil.menu_planner.staplegroup;

import com.rhythmicdevil.menu_planner.ingredient.Ingredient;
import com.rhythmicdevil.menu_planner.ingredient.IngredientCategory;
import com.rhythmicdevil.menu_planner.ingredient.IngredientRepository;
import com.rhythmicdevil.menu_planner.support.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@Transactional
class StapleGroupRepositoryTest extends AbstractIntegrationTest {

    @Autowired
    private StapleGroupRepository stapleGroupRepository;

    @Autowired
    private IngredientRepository ingredientRepository;

    @Test
    void savesAndReloadsItemsIncludingAnOptionalIngredientLink() {
        Ingredient bananas = ingredientRepository.save(new Ingredient("bananas", IngredientCategory.PRODUCE));

        StapleGroup group = new StapleGroup("Kitchen");
        group.replaceItems(List.of(
                new StapleItem("paper towels", null),
                new StapleItem("bananas", bananas)
        ));

        Long id = stapleGroupRepository.saveAndFlush(group).getId();
        stapleGroupRepository.flush();

        StapleGroup reloaded = stapleGroupRepository.findById(id).orElseThrow();
        assertThat(reloaded.getName()).isEqualTo("Kitchen");
        assertThat(reloaded.getItems()).extracting(StapleItem::getName)
                .containsExactlyInAnyOrder("paper towels", "bananas");
        StapleItem bananaItem = reloaded.getItems().stream()
                .filter(item -> item.getName().equals("bananas"))
                .findFirst().orElseThrow();
        assertThat(bananaItem.getIngredient().getId()).isEqualTo(bananas.getId());
    }

    @Test
    void replaceItemsOrphansThePreviousOnes() {
        StapleGroup group = new StapleGroup("Cleaning Products");
        group.replaceItems(List.of(new StapleItem("glass cleaner", null)));
        Long id = stapleGroupRepository.saveAndFlush(group).getId();

        StapleGroup reloaded = stapleGroupRepository.findById(id).orElseThrow();
        reloaded.replaceItems(List.of(new StapleItem("sponges", null)));
        stapleGroupRepository.saveAndFlush(reloaded);
        stapleGroupRepository.flush();

        StapleGroup reloadedAgain = stapleGroupRepository.findById(id).orElseThrow();
        assertThat(reloadedAgain.getItems()).extracting(StapleItem::getName)
                .containsExactly("sponges");
    }
}
