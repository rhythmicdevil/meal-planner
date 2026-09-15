package com.rhythmicdevil.menu_planner.ingredient;

import com.rhythmicdevil.menu_planner.ingredient.dto.IngredientRequest;
import com.rhythmicdevil.menu_planner.ingredient.dto.IngredientResponse;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;

@Service
@Transactional
public class IngredientService {

    private final IngredientRepository ingredientRepository;

    public IngredientService(IngredientRepository ingredientRepository) {
        this.ingredientRepository = ingredientRepository;
    }

    @Transactional(readOnly = true)
    public List<IngredientResponse> findAll() {
        return ingredientRepository.findAll().stream()
                .map(IngredientResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public IngredientResponse findById(Long id) {
        return IngredientResponse.from(getOrThrow(id));
    }

    public IngredientResponse create(IngredientRequest request) {
        Ingredient ingredient = new Ingredient(request.name(), request.category());
        applyRequest(ingredient, request);
        return IngredientResponse.from(ingredientRepository.save(ingredient));
    }

    public IngredientResponse update(Long id, IngredientRequest request) {
        Ingredient ingredient = getOrThrow(id);
        ingredient.setName(request.name());
        ingredient.setCategory(request.category());
        applyRequest(ingredient, request);
        return IngredientResponse.from(ingredient);
    }

    public void delete(Long id) {
        if (!ingredientRepository.existsById(id)) {
            throw new EntityNotFoundException("Ingredient " + id + " not found");
        }
        ingredientRepository.deleteById(id);
    }

    private void applyRequest(Ingredient ingredient, IngredientRequest request) {
        ingredient.setDefaultUnit(request.defaultUnit());
        ingredient.setAliases(request.aliases() != null ? new HashSet<>(request.aliases()) : new HashSet<>());
    }

    private Ingredient getOrThrow(Long id) {
        return ingredientRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Ingredient " + id + " not found"));
    }
}
