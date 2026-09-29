package com.rhythmicdevil.menu_planner.mealplan;

import com.rhythmicdevil.menu_planner.recipe.Recipe;
import com.rhythmicdevil.menu_planner.staplegroup.StapleItem;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "meal_plan")
public class MealPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @OneToMany(mappedBy = "mealPlan", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MealPlanItem> items = new ArrayList<>();

    protected MealPlan() {
    }

    public MealPlan(String name) {
        this.name = name;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public List<MealPlanItem> getItems() {
        return items;
    }

    public void replaceItems(List<MealPlanItem> newItems) {
        items.clear();
        items.addAll(newItems);
    }

    public void addItem(MealPlanItem item) {
        items.add(item);
    }

    // Removes a single item by id (orphanRemoval on the items relationship deletes its row on
    // flush) -- used by the Recipe list's per-plan "remove"/"move" affordance, which targets
    // one specific item rather than rebuilding the whole plan the way update() does. Returns
    // whether an item was actually found and removed, so the caller can 404 otherwise.
    public boolean removeItem(Long itemId) {
        return items.removeIf(item -> item.getId().equals(itemId));
    }

    // Whether an item referencing the same recipe/menu/staple group as candidate is already
    // on this plan. Left as a query the caller opts into (see MealPlanService.addItem())
    // rather than enforced here or in replaceItems() -- the full plan editor intentionally
    // allows repeats (see flattenRecipes() below), so this collection has no general
    // uniqueness invariant of its own.
    public boolean hasItem(MealPlanItem candidate) {
        for (MealPlanItem existing : items) {
            if (existing.getItemType() != candidate.getItemType()) {
                continue;
            }
            boolean sameReference = switch (candidate.getItemType()) {
                case RECIPE -> existing.getRecipe().getId().equals(candidate.getRecipe().getId());
                case MENU -> existing.getMenu().getId().equals(candidate.getMenu().getId());
                case STAPLE_GROUP -> existing.getStapleGroup().getId().equals(candidate.getStapleGroup().getId());
            };
            if (sameReference) {
                return true;
            }
        }
        return false;
    }

    // Not deduped -- the same recipe reached twice (direct + via a menu, or a repeated
    // meal-plan item) means it's being cooked twice, so its ingredients count twice.
    public List<Recipe> flattenRecipes() {
        List<Recipe> recipes = new ArrayList<>();
        for (MealPlanItem item : items) {
            switch (item.getItemType()) {
                case RECIPE -> recipes.add(item.getRecipe());
                case MENU -> recipes.addAll(item.getMenu().getRecipes());
                case STAPLE_GROUP -> {
                    // no recipes contributed by a staple group
                }
            }
        }
        return recipes;
    }

    public List<StapleItem> flattenStapleItems() {
        List<StapleItem> stapleItems = new ArrayList<>();
        for (MealPlanItem item : items) {
            if (item.getItemType() == MealPlanItemType.STAPLE_GROUP) {
                stapleItems.addAll(item.getStapleGroup().getItems());
            }
        }
        return stapleItems;
    }
}
