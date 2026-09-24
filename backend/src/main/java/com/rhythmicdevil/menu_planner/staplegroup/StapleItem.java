package com.rhythmicdevil.menu_planner.staplegroup;

import com.rhythmicdevil.menu_planner.ingredient.Ingredient;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "staple_item")
public class StapleItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "staple_group_id", nullable = false)
    private StapleGroup stapleGroup;

    @Column(name = "name", nullable = false)
    private String name;

    @ManyToOne
    @JoinColumn(name = "ingredient_id")
    private Ingredient ingredient;

    protected StapleItem() {
    }

    public StapleItem(String name, Ingredient ingredient) {
        this.name = name;
        this.ingredient = ingredient;
    }

    public Long getId() {
        return id;
    }

    public StapleGroup getStapleGroup() {
        return stapleGroup;
    }

    void setStapleGroup(StapleGroup stapleGroup) {
        this.stapleGroup = stapleGroup;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Ingredient getIngredient() {
        return ingredient;
    }

    public void setIngredient(Ingredient ingredient) {
        this.ingredient = ingredient;
    }
}
