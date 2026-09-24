package com.rhythmicdevil.menu_planner.staplegroup;

import com.rhythmicdevil.menu_planner.ingredient.Ingredient;
import com.rhythmicdevil.menu_planner.ingredient.IngredientRepository;
import com.rhythmicdevil.menu_planner.staplegroup.dto.StapleGroupRequest;
import com.rhythmicdevil.menu_planner.staplegroup.dto.StapleGroupResponse;
import com.rhythmicdevil.menu_planner.staplegroup.dto.StapleItemRequest;
import com.rhythmicdevil.menu_planner.store.Store;
import com.rhythmicdevil.menu_planner.store.StoreRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@Transactional
public class StapleGroupService {

    private final StapleGroupRepository stapleGroupRepository;
    private final IngredientRepository ingredientRepository;
    private final StoreRepository storeRepository;

    public StapleGroupService(
            StapleGroupRepository stapleGroupRepository,
            IngredientRepository ingredientRepository,
            StoreRepository storeRepository
    ) {
        this.stapleGroupRepository = stapleGroupRepository;
        this.ingredientRepository = ingredientRepository;
        this.storeRepository = storeRepository;
    }

    @Transactional(readOnly = true)
    public List<StapleGroupResponse> findAll() {
        return stapleGroupRepository.findAll().stream()
                .map(StapleGroupResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public StapleGroupResponse findById(Long id) {
        return StapleGroupResponse.from(getOrThrow(id));
    }

    public StapleGroupResponse create(StapleGroupRequest request) {
        StapleGroup stapleGroup = new StapleGroup(request.name());
        applyRequest(stapleGroup, request);
        return StapleGroupResponse.from(stapleGroupRepository.save(stapleGroup));
    }

    public StapleGroupResponse update(Long id, StapleGroupRequest request) {
        StapleGroup stapleGroup = getOrThrow(id);
        stapleGroup.setName(request.name());
        applyRequest(stapleGroup, request);
        return StapleGroupResponse.from(stapleGroup);
    }

    public void delete(Long id) {
        if (!stapleGroupRepository.existsById(id)) {
            throw new EntityNotFoundException("StapleGroup " + id + " not found");
        }
        stapleGroupRepository.deleteById(id);
    }

    private void applyRequest(StapleGroup stapleGroup, StapleGroupRequest request) {
        List<StapleItem> items = new ArrayList<>();
        if (request.items() != null) {
            for (StapleItemRequest itemRequest : request.items()) {
                items.add(toStapleItem(itemRequest));
            }
        }
        stapleGroup.replaceItems(items);
    }

    private StapleItem toStapleItem(StapleItemRequest request) {
        Ingredient ingredient = null;
        if (request.ingredientId() != null) {
            ingredient = ingredientRepository.findById(request.ingredientId())
                    .orElseThrow(() -> new EntityNotFoundException("Ingredient " + request.ingredientId() + " not found"));
        }
        StapleItem item = new StapleItem(request.name(), ingredient);

        Set<Long> storeIds = request.storeIds() != null ? request.storeIds() : Set.of();
        Set<Store> stores = new HashSet<>(storeRepository.findAllById(storeIds));
        if (stores.size() != storeIds.size()) {
            throw new EntityNotFoundException("One or more stores not found");
        }
        item.setStores(stores);

        return item;
    }

    private StapleGroup getOrThrow(Long id) {
        return stapleGroupRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("StapleGroup " + id + " not found"));
    }
}
