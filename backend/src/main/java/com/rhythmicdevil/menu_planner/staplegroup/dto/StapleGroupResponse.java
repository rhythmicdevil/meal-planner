package com.rhythmicdevil.menu_planner.staplegroup.dto;

import com.rhythmicdevil.menu_planner.staplegroup.StapleGroup;

import java.util.List;

public record StapleGroupResponse(
        Long id,
        String name,
        List<StapleItemResponse> items
) {
    public static StapleGroupResponse from(StapleGroup stapleGroup) {
        return new StapleGroupResponse(
                stapleGroup.getId(),
                stapleGroup.getName(),
                stapleGroup.getItems().stream().map(StapleItemResponse::from).toList()
        );
    }
}
