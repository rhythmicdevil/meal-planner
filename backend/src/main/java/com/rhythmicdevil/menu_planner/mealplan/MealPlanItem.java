package com.rhythmicdevil.menu_planner.mealplan;

import com.rhythmicdevil.menu_planner.menu.Menu;
import com.rhythmicdevil.menu_planner.recipe.Recipe;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "meal_plan_item")
public class MealPlanItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "meal_plan_id", nullable = false)
    private MealPlan mealPlan;

    @Enumerated(EnumType.STRING)
    @Column(name = "item_type", nullable = false)
    private MealPlanItemType itemType;

    @ManyToOne
    @JoinColumn(name = "recipe_id")
    private Recipe recipe;

    @ManyToOne
    @JoinColumn(name = "menu_id")
    private Menu menu;

    protected MealPlanItem() {
    }

    private MealPlanItem(MealPlan mealPlan, MealPlanItemType itemType) {
        this.mealPlan = mealPlan;
        this.itemType = itemType;
    }

    public static MealPlanItem forRecipe(MealPlan mealPlan, Recipe recipe) {
        MealPlanItem item = new MealPlanItem(mealPlan, MealPlanItemType.RECIPE);
        item.recipe = recipe;
        return item;
    }

    public static MealPlanItem forMenu(MealPlan mealPlan, Menu menu) {
        MealPlanItem item = new MealPlanItem(mealPlan, MealPlanItemType.MENU);
        item.menu = menu;
        return item;
    }

    public Long getId() {
        return id;
    }

    public MealPlan getMealPlan() {
        return mealPlan;
    }

    public MealPlanItemType getItemType() {
        return itemType;
    }

    public Recipe getRecipe() {
        return recipe;
    }

    public Menu getMenu() {
        return menu;
    }
}
