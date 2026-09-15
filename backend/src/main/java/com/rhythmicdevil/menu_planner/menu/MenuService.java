package com.rhythmicdevil.menu_planner.menu;

import com.rhythmicdevil.menu_planner.menu.dto.MenuRequest;
import com.rhythmicdevil.menu_planner.menu.dto.MenuResponse;
import com.rhythmicdevil.menu_planner.recipe.Recipe;
import com.rhythmicdevil.menu_planner.recipe.RecipeRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@Transactional
public class MenuService {

    private final MenuRepository menuRepository;
    private final RecipeRepository recipeRepository;

    public MenuService(MenuRepository menuRepository, RecipeRepository recipeRepository) {
        this.menuRepository = menuRepository;
        this.recipeRepository = recipeRepository;
    }

    @Transactional(readOnly = true)
    public List<MenuResponse> findAll() {
        return menuRepository.findAll().stream()
                .map(MenuResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public MenuResponse findById(Long id) {
        return MenuResponse.from(getOrThrow(id));
    }

    public MenuResponse create(MenuRequest request) {
        Menu menu = new Menu(request.name());
        applyRequest(menu, request);
        return MenuResponse.from(menuRepository.save(menu));
    }

    public MenuResponse update(Long id, MenuRequest request) {
        Menu menu = getOrThrow(id);
        menu.setName(request.name());
        applyRequest(menu, request);
        return MenuResponse.from(menu);
    }

    public void delete(Long id) {
        if (!menuRepository.existsById(id)) {
            throw new EntityNotFoundException("Menu " + id + " not found");
        }
        menuRepository.deleteById(id);
    }

    private void applyRequest(Menu menu, MenuRequest request) {
        Set<Recipe> recipes = new HashSet<>();
        if (request.recipeIds() != null) {
            for (Long recipeId : request.recipeIds()) {
                recipes.add(recipeRepository.findById(recipeId)
                        .orElseThrow(() -> new EntityNotFoundException("Recipe " + recipeId + " not found")));
            }
        }
        menu.setRecipes(recipes);
    }

    private Menu getOrThrow(Long id) {
        return menuRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Menu " + id + " not found"));
    }
}
