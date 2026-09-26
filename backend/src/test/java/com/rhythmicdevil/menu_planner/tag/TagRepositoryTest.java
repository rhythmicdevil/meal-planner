package com.rhythmicdevil.menu_planner.tag;

import com.rhythmicdevil.menu_planner.support.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;

@Transactional
class TagRepositoryTest extends AbstractIntegrationTest {

    @Autowired
    private TagRepository tagRepository;

    @Test
    void savesAndReloadsATag() {
        Long id = tagRepository.saveAndFlush(new Tag("Mexican", TagType.CUISINE)).getId();
        tagRepository.flush();

        Tag reloaded = tagRepository.findById(id).orElseThrow();
        assertThat(reloaded.getName()).isEqualTo("Mexican");
        assertThat(reloaded.getType()).isEqualTo(TagType.CUISINE);
    }
}
