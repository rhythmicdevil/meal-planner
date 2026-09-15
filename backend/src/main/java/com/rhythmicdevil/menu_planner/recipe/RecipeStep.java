package com.rhythmicdevil.menu_planner.recipe;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class RecipeStep {

    @Column(name = "step_number", nullable = false)
    private int stepNumber;

    @Column(name = "step_text", nullable = false)
    private String stepText;

    protected RecipeStep() {
    }

    public RecipeStep(int stepNumber, String stepText) {
        this.stepNumber = stepNumber;
        this.stepText = stepText;
    }

    public int getStepNumber() {
        return stepNumber;
    }

    public String getStepText() {
        return stepText;
    }
}
