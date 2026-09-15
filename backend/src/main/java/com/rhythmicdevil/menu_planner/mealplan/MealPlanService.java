package com.rhythmicdevil.menu_planner.mealplan;

import com.rhythmicdevil.menu_planner.mealplan.dto.MealPlanItemRequest;
import com.rhythmicdevil.menu_planner.mealplan.dto.MealPlanRequest;
import com.rhythmicdevil.menu_planner.mealplan.dto.MealPlanResponse;
import com.rhythmicdevil.menu_planner.menu.Menu;
import com.rhythmicdevil.menu_planner.menu.MenuRepository;
import com.rhythmicdevil.menu_planner.recipe.Recipe;
import com.rhythmicdevil.menu_planner.recipe.RecipeRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class MealPlanService {

    private final MealPlanRepository mealPlanRepository;
    private final RecipeRepository recipeRepository;
    private final MenuRepository menuRepository;

    public MealPlanService(MealPlanRepository mealPlanRepository, RecipeRepository recipeRepository,
                            MenuRepository menuRepository) {
        this.mealPlanRepository = mealPlanRepository;
        this.recipeRepository = recipeRepository;
        this.menuRepository = menuRepository;
    }

    @Transactional(readOnly = true)
    public List<MealPlanResponse> findAll() {
        return mealPlanRepository.findAll().stream()
                .map(MealPlanResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public MealPlanResponse findById(Long id) {
        return MealPlanResponse.from(getOrThrow(id));
    }

    public MealPlanResponse create(MealPlanRequest request) {
        MealPlan mealPlan = new MealPlan(request.name());
        applyRequest(mealPlan, request);
        return MealPlanResponse.from(mealPlanRepository.save(mealPlan));
    }

    public MealPlanResponse update(Long id, MealPlanRequest request) {
        MealPlan mealPlan = getOrThrow(id);
        mealPlan.setName(request.name());
        applyRequest(mealPlan, request);
        return MealPlanResponse.from(mealPlan);
    }

    public void delete(Long id) {
        if (!mealPlanRepository.existsById(id)) {
            throw new EntityNotFoundException("MealPlan " + id + " not found");
        }
        mealPlanRepository.deleteById(id);
    }

    private void applyRequest(MealPlan mealPlan, MealPlanRequest request) {
        mealPlan.setStartDate(request.startDate());
        mealPlan.setEndDate(request.endDate());

        List<MealPlanItem> items = new ArrayList<>();
        if (request.items() != null) {
            for (MealPlanItemRequest itemRequest : request.items()) {
                items.add(toMealPlanItem(mealPlan, itemRequest));
            }
        }
        mealPlan.replaceItems(items);
    }

    private MealPlanItem toMealPlanItem(MealPlan mealPlan, MealPlanItemRequest request) {
        boolean hasRecipe = request.recipeId() != null;
        boolean hasMenu = request.menuId() != null;

        return switch (request.itemType()) {
            case RECIPE -> {
                if (!hasRecipe || hasMenu) {
                    throw new IllegalArgumentException(
                            "A RECIPE item must set recipeId and leave menuId unset");
                }
                Recipe recipe = recipeRepository.findById(request.recipeId())
                        .orElseThrow(() -> new EntityNotFoundException("Recipe " + request.recipeId() + " not found"));
                yield MealPlanItem.forRecipe(mealPlan, recipe);
            }
            case MENU -> {
                if (!hasMenu || hasRecipe) {
                    throw new IllegalArgumentException(
                            "A MENU item must set menuId and leave recipeId unset");
                }
                Menu menu = menuRepository.findById(request.menuId())
                        .orElseThrow(() -> new EntityNotFoundException("Menu " + request.menuId() + " not found"));
                yield MealPlanItem.forMenu(mealPlan, menu);
            }
        };
    }

    private MealPlan getOrThrow(Long id) {
        return mealPlanRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("MealPlan " + id + " not found"));
    }
}
