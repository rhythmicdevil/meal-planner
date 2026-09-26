package com.rhythmicdevil.menu_planner.recipe;

import com.rhythmicdevil.menu_planner.tag.Tag;
import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "recipe")
public class Recipe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "source_url")
    private String sourceUrl;

    @Column(name = "servings")
    private Integer servings;

    @ElementCollection
    @CollectionTable(name = "recipe_step", joinColumns = @JoinColumn(name = "recipe_id"))
    @OrderBy("stepNumber ASC")
    private List<RecipeStep> steps = new ArrayList<>();

    @OneToMany(mappedBy = "recipe", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RecipeIngredient> ingredients = new ArrayList<>();

    @ManyToMany
    @JoinTable(
            name = "recipe_cuisine_tag",
            joinColumns = @JoinColumn(name = "recipe_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    private Set<Tag> cuisineTags = new HashSet<>();

    @ManyToMany
    @JoinTable(
            name = "recipe_descriptive_tag",
            joinColumns = @JoinColumn(name = "recipe_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    private Set<Tag> descriptiveTags = new HashSet<>();

    protected Recipe() {
    }

    public Recipe(String name) {
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

    public String getSourceUrl() {
        return sourceUrl;
    }

    public void setSourceUrl(String sourceUrl) {
        this.sourceUrl = sourceUrl;
    }

    public Integer getServings() {
        return servings;
    }

    public void setServings(Integer servings) {
        this.servings = servings;
    }

    public List<RecipeStep> getSteps() {
        return steps;
    }

    public void setSteps(List<RecipeStep> steps) {
        this.steps = steps;
    }

    public List<RecipeIngredient> getIngredients() {
        return ingredients;
    }

    public void replaceIngredients(List<RecipeIngredient> newIngredients) {
        ingredients.clear();
        for (RecipeIngredient ingredient : newIngredients) {
            ingredient.setRecipe(this);
            ingredients.add(ingredient);
        }
    }

    public Set<Tag> getCuisineTags() {
        return cuisineTags;
    }

    public void setCuisineTags(Set<Tag> cuisineTags) {
        this.cuisineTags = cuisineTags;
    }

    public Set<Tag> getDescriptiveTags() {
        return descriptiveTags;
    }

    public void setDescriptiveTags(Set<Tag> descriptiveTags) {
        this.descriptiveTags = descriptiveTags;
    }
}
