package com.rhythmicdevil.menu_planner.store;

import com.rhythmicdevil.menu_planner.store.dto.StoreRequest;
import com.rhythmicdevil.menu_planner.store.dto.StoreResponse;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class StoreService {

    private final StoreRepository storeRepository;

    public StoreService(StoreRepository storeRepository) {
        this.storeRepository = storeRepository;
    }

    @Transactional(readOnly = true)
    public List<StoreResponse> findAll() {
        return storeRepository.findAll().stream()
                .map(StoreResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public StoreResponse findById(Long id) {
        return StoreResponse.from(getOrThrow(id));
    }

    public StoreResponse create(StoreRequest request) {
        Store store = new Store(request.name());
        return StoreResponse.from(storeRepository.save(store));
    }

    public StoreResponse update(Long id, StoreRequest request) {
        Store store = getOrThrow(id);
        store.setName(request.name());
        return StoreResponse.from(store);
    }

    public void delete(Long id) {
        if (!storeRepository.existsById(id)) {
            throw new EntityNotFoundException("Store " + id + " not found");
        }
        storeRepository.deleteById(id);
    }

    private Store getOrThrow(Long id) {
        return storeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Store " + id + " not found"));
    }
}
