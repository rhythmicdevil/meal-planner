package com.rhythmicdevil.menu_planner.staplegroup;

import com.rhythmicdevil.menu_planner.staplegroup.dto.StapleGroupRequest;
import com.rhythmicdevil.menu_planner.staplegroup.dto.StapleGroupResponse;
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
@RequestMapping("/api/staple-groups")
public class StapleGroupController {

    private final StapleGroupService stapleGroupService;

    public StapleGroupController(StapleGroupService stapleGroupService) {
        this.stapleGroupService = stapleGroupService;
    }

    @GetMapping
    public List<StapleGroupResponse> findAll() {
        return stapleGroupService.findAll();
    }

    @GetMapping("/{id}")
    public StapleGroupResponse findById(@PathVariable Long id) {
        return stapleGroupService.findById(id);
    }

    @PostMapping
    public ResponseEntity<StapleGroupResponse> create(@Valid @RequestBody StapleGroupRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(stapleGroupService.create(request));
    }

    @PutMapping("/{id}")
    public StapleGroupResponse update(@PathVariable Long id, @Valid @RequestBody StapleGroupRequest request) {
        return stapleGroupService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        stapleGroupService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
