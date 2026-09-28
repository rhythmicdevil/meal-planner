package com.rhythmicdevil.menu_planner.staplegroup;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StapleItemRepository extends JpaRepository<StapleItem, Long> {

    List<StapleItem> findByIngredient_Id(Long ingredientId);
}
