package com.rhythmicdevil.menu_planner.tag.dto;

import com.rhythmicdevil.menu_planner.tag.Tag;
import com.rhythmicdevil.menu_planner.tag.TagType;

public record TagResponse(Long id, String name, TagType type) {
    public static TagResponse from(Tag tag) {
        return new TagResponse(tag.getId(), tag.getName(), tag.getType());
    }
}
