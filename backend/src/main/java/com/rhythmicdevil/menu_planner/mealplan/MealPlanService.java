package com.rhythmicdevil.menu_planner.mealplan;

import com.rhythmicdevil.menu_planner.mealplan.dto.MealPlanItemRequest;
import com.rhythmicdevil.menu_planner.mealplan.dto.MealPlanRequest;
import com.rhythmicdevil.menu_planner.mealplan.dto.MealPlanResponse;
import com.rhythmicdevil.menu_planner.menu.Menu;
import com.rhythmicdevil.menu_planner.menu.MenuRepository;
import com.rhythmicdevil.menu_planner.recipe.Recipe;
import com.rhythmicdevil.menu_planner.recipe.RecipeRepository;
import com.rhythmicdevil.menu_planner.staplegroup.StapleGroup;
import com.rhythmicdevil.menu_planner.staplegroup.StapleGroupRepository;
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
    private final StapleGroupRepository stapleGroupRepository;

    public MealPlanService(MealPlanRepository mealPlanRepository, RecipeRepository recipeRepository,
                            MenuRepository menuRepository, StapleGroupRepository stapleGroupRepository) {
        this.mealPlanRepository = mealPlanRepository;
        this.recipeRepository = recipeRepository;
        this.menuRepository = menuRepository;
        this.stapleGroupRepository = stapleGroupRepository;
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

    // Appends a single item without disturbing the rest -- used by the "Add to Meal Plan"
    // quick-add affordance on the Recipe list/detail views, which only knows the one recipe
    // it wants to add and shouldn't need to fetch and resubmit the whole plan (update()'s
    // full-replace semantics) just to do that.
    //
    // Rejects a duplicate (same recipe/menu/staple group already on this plan) -- this is a
    // guard against an accidental double-click on the quick-add button, not a general "no
    // repeats" rule for meal plans: the full plan editor (update(), above) still allows the
    // same recipe to be added more than once on purpose, e.g. cooking it twice in one week
    // (see MealPlan.flattenRecipes()'s note on why that's intentionally not deduped there).
    public MealPlanResponse addItem(Long mealPlanId, MealPlanItemRequest request) {
        // Locked fetch (rather than getOrThrow()) so the hasItem() check below and the insert
        // it guards are atomic with respect to another concurrent addItem() on this same plan --
        // see MealPlanRepository.findByIdForUpdate().
        MealPlan mealPlan = mealPlanRepository.findByIdForUpdate(mealPlanId)
                .orElseThrow(() -> new EntityNotFoundException("MealPlan " + mealPlanId + " not found"));
        MealPlanItem item = toMealPlanItem(mealPlan, request);
        if (mealPlan.hasItem(item)) {
            throw new IllegalArgumentException(alreadyInPlanMessage(item) + " is already in this meal plan.");
        }
        mealPlan.addItem(item);
        // Flush so the new item's identity-generated id is populated before it's serialized --
        // otherwise the response would report it as null until the next fetch.
        mealPlanRepository.flush();
        return MealPlanResponse.from(mealPlan);
    }

    private String alreadyInPlanMessage(MealPlanItem item) {
        return switch (item.getItemType()) {
            case RECIPE -> "\"" + item.getRecipe().getName() + "\"";
            case MENU -> "\"" + item.getMenu().getName() + "\"";
            case STAPLE_GROUP -> "\"" + item.getStapleGroup().getName() + "\"";
        };
    }

    // Counterpart to addItem() -- removes one item by id without touching the rest of the
    // plan. Used by the same Recipe list quick-add affordance to let a recipe be removed from,
    // or moved to a different, meal plan without opening that plan's own full editor.
    public MealPlanResponse removeItem(Long mealPlanId, Long itemId) {
        MealPlan mealPlan = getOrThrow(mealPlanId);
        if (!mealPlan.removeItem(itemId)) {
            throw new EntityNotFoundException("MealPlanItem " + itemId + " not found in MealPlan " + mealPlanId);
        }
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
        boolean hasStapleGroup = request.stapleGroupId() != null;

        return switch (request.itemType()) {
            case RECIPE -> {
                if (!hasRecipe || hasMenu || hasStapleGroup) {
                    throw new IllegalArgumentException(
                            "A RECIPE item must set recipeId and leave menuId/stapleGroupId unset");
                }
                Recipe recipe = recipeRepository.findById(request.recipeId())
                        .orElseThrow(() -> new EntityNotFoundException("Recipe " + request.recipeId() + " not found"));
                yield MealPlanItem.forRecipe(mealPlan, recipe);
            }
            case MENU -> {
                if (!hasMenu || hasRecipe || hasStapleGroup) {
                    throw new IllegalArgumentException(
                            "A MENU item must set menuId and leave recipeId/stapleGroupId unset");
                }
                Menu menu = menuRepository.findById(request.menuId())
                        .orElseThrow(() -> new EntityNotFoundException("Menu " + request.menuId() + " not found"));
                yield MealPlanItem.forMenu(mealPlan, menu);
            }
            case STAPLE_GROUP -> {
                if (!hasStapleGroup || hasRecipe || hasMenu) {
                    throw new IllegalArgumentException(
                            "A STAPLE_GROUP item must set stapleGroupId and leave recipeId/menuId unset");
                }
                StapleGroup stapleGroup = stapleGroupRepository.findById(request.stapleGroupId())
                        .orElseThrow(() -> new EntityNotFoundException("StapleGroup " + request.stapleGroupId() + " not found"));
                yield MealPlanItem.forStapleGroup(mealPlan, stapleGroup);
            }
        };
    }

    private MealPlan getOrThrow(Long id) {
        return mealPlanRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("MealPlan " + id + " not found"));
    }
}
