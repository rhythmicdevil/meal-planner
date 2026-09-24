package com.rhythmicdevil.menu_planner.store;

import com.rhythmicdevil.menu_planner.support.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;

@Transactional
class StoreRepositoryTest extends AbstractIntegrationTest {

    @Autowired
    private StoreRepository storeRepository;

    @Test
    void savesAndReloadsAStore() {
        Long id = storeRepository.saveAndFlush(new Store("Trader Joe's")).getId();
        storeRepository.flush();

        Store reloaded = storeRepository.findById(id).orElseThrow();
        assertThat(reloaded.getName()).isEqualTo("Trader Joe's");
    }
}
