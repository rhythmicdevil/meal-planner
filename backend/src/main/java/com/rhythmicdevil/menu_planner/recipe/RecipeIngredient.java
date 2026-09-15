package com.rhythmicdevil.menu_planner.recipe;

import com.rhythmicdevil.menu_planner.ingredient.Ingredient;
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

import java.math.BigDecimal;

@Entity
@Table(name = "recipe_ingredient")
public class RecipeIngredient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "recipe_id", nullable = false)
    private Recipe recipe;

    @ManyToOne
    @JoinColumn(name = "ingredient_id", nullable = false)
    private Ingredient ingredient;

    @Column(name = "amount", nullable = false)
    private BigDecimal amount;

    @Column(name = "unit", nullable = false)
    private String unit;

    @Enumerated(EnumType.STRING)
    @Column(name = "cut_type")
    private CutType cutType;

    @Column(name = "cut_type_other")
    private String cutTypeOther;

    @Enumerated(EnumType.STRING)
    @Column(name = "state_condition")
    private StateCondition stateCondition;

    @Column(name = "state_condition_other")
    private String stateConditionOther;

    @Column(name = "notes")
    private String notes;

    protected RecipeIngredient() {
    }

    public RecipeIngredient(Ingredient ingredient, BigDecimal amount, String unit) {
        this.ingredient = ingredient;
        this.amount = amount;
        this.unit = unit;
    }

    public Long getId() {
        return id;
    }

    public Recipe getRecipe() {
        return recipe;
    }

    void setRecipe(Recipe recipe) {
        this.recipe = recipe;
    }

    public Ingredient getIngredient() {
        return ingredient;
    }

    public void setIngredient(Ingredient ingredient) {
        this.ingredient = ingredient;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public CutType getCutType() {
        return cutType;
    }

    public void setCutType(CutType cutType) {
        this.cutType = cutType;
    }

    public String getCutTypeOther() {
        return cutTypeOther;
    }

    public void setCutTypeOther(String cutTypeOther) {
        this.cutTypeOther = cutTypeOther;
    }

    public StateCondition getStateCondition() {
        return stateCondition;
    }

    public void setStateCondition(StateCondition stateCondition) {
        this.stateCondition = stateCondition;
    }

    public String getStateConditionOther() {
        return stateConditionOther;
    }

    public void setStateConditionOther(String stateConditionOther) {
        this.stateConditionOther = stateConditionOther;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
