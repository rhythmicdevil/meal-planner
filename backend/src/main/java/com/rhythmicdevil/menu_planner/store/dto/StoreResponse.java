package com.rhythmicdevil.menu_planner.store.dto;

import com.rhythmicdevil.menu_planner.store.Store;

public record StoreResponse(Long id, String name) {
    public static StoreResponse from(Store store) {
        return new StoreResponse(store.getId(), store.getName());
    }
}
