package com.rhythmicdevil.menu_planner.mealplan;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface MealPlanRepository extends JpaRepository<MealPlan, Long> {

    // Row-locking variant of findById -- used by MealPlanService.addItem()'s duplicate-recipe
    // check, which is otherwise a check-then-act race: two concurrent addItem calls for the
    // same plan/recipe could both read "not present yet" before either commits, defeating the
    // "reject an accidental double-click" guard and leaving the recipe on the plan twice.
    // PESSIMISTIC_WRITE serializes concurrent addItem calls against the same meal plan so the
    // second one sees the first one's insert before running its own duplicate check.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select mp from MealPlan mp where mp.id = :id")
    Optional<MealPlan> findByIdForUpdate(@Param("id") Long id);
}
