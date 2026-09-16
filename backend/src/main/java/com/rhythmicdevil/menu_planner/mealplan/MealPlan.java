package com.rhythmicdevil.menu_planner.mealplan;

import com.rhythmicdevil.menu_planner.recipe.Recipe;
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

    // Not deduped -- the same recipe reached twice (direct + via a menu, or a repeated
    // meal-plan item) means it's being cooked twice, so its ingredients count twice.
    public List<Recipe> flattenRecipes() {
        List<Recipe> recipes = new ArrayList<>();
        for (MealPlanItem item : items) {
            switch (item.getItemType()) {
                case RECIPE -> recipes.add(item.getRecipe());
                case MENU -> recipes.addAll(item.getMenu().getRecipes());
            }
        }
        return recipes;
    }
}
