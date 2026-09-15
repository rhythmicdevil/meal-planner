package com.rhythmicdevil.menu_planner.mealplan;

import com.rhythmicdevil.menu_planner.mealplan.dto.MealPlanRequest;
import com.rhythmicdevil.menu_planner.mealplan.dto.MealPlanResponse;
import com.rhythmicdevil.menu_planner.shoppinglist.ShoppingListService;
import com.rhythmicdevil.menu_planner.shoppinglist.dto.ShoppingListResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/meal-plans")
public class MealPlanController {

    private final MealPlanService mealPlanService;
    private final ShoppingListService shoppingListService;

    public MealPlanController(MealPlanService mealPlanService, ShoppingListService shoppingListService) {
        this.mealPlanService = mealPlanService;
        this.shoppingListService = shoppingListService;
    }

    @GetMapping
    public List<MealPlanResponse> findAll() {
        return mealPlanService.findAll();
    }

    @GetMapping("/{id}")
    public MealPlanResponse findById(@PathVariable Long id) {
        return mealPlanService.findById(id);
    }

    @GetMapping("/{id}/shopping-list")
    public ShoppingListResponse shoppingList(@PathVariable Long id) {
        return shoppingListService.generate(id);
    }

    @PostMapping
    public ResponseEntity<MealPlanResponse> create(@Valid @RequestBody MealPlanRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(mealPlanService.create(request));
    }

    @PutMapping("/{id}")
    public MealPlanResponse update(@PathVariable Long id, @Valid @RequestBody MealPlanRequest request) {
        return mealPlanService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        mealPlanService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
