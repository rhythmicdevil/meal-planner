package com.rhythmicdevil.menu_planner.tag;

import com.rhythmicdevil.menu_planner.tag.dto.TagRequest;
import com.rhythmicdevil.menu_planner.tag.dto.TagResponse;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class TagService {

    private final TagRepository tagRepository;

    public TagService(TagRepository tagRepository) {
        this.tagRepository = tagRepository;
    }

    @Transactional(readOnly = true)
    public List<TagResponse> findAll() {
        return tagRepository.findAll().stream()
                .map(TagResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public TagResponse findById(Long id) {
        return TagResponse.from(getOrThrow(id));
    }

    public TagResponse create(TagRequest request) {
        Tag tag = new Tag(request.name(), request.type());
        return TagResponse.from(tagRepository.save(tag));
    }

    public TagResponse update(Long id, TagRequest request) {
        Tag tag = getOrThrow(id);
        tag.setName(request.name());
        tag.setType(request.type());
        return TagResponse.from(tag);
    }

    public void delete(Long id) {
        if (!tagRepository.existsById(id)) {
            throw new EntityNotFoundException("Tag " + id + " not found");
        }
        tagRepository.deleteById(id);
    }

    private Tag getOrThrow(Long id) {
        return tagRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Tag " + id + " not found"));
    }
}
