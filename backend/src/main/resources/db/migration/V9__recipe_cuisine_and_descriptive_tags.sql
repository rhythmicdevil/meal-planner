CREATE TABLE tag (
    id   BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20)  NOT NULL,
    CONSTRAINT uk_tag_name_type UNIQUE (name, type)
);

-- Replaces the old freeform recipe_tag (recipe_id, tag varchar) table -- recipes now carry
-- exactly one cuisine tag and any number of descriptive tags, both drawn from the tag catalog.
DROP TABLE recipe_tag;

ALTER TABLE recipe
    ADD COLUMN cuisine_tag_id BIGINT NULL,
    ADD CONSTRAINT fk_recipe_cuisine_tag FOREIGN KEY (cuisine_tag_id) REFERENCES tag (id) ON DELETE SET NULL;

CREATE TABLE recipe_descriptive_tag (
    recipe_id BIGINT NOT NULL,
    tag_id    BIGINT NOT NULL,
    PRIMARY KEY (recipe_id, tag_id),
    CONSTRAINT fk_recipe_descriptive_tag_recipe FOREIGN KEY (recipe_id) REFERENCES recipe (id) ON DELETE CASCADE,
    CONSTRAINT fk_recipe_descriptive_tag_tag FOREIGN KEY (tag_id) REFERENCES tag (id) ON DELETE CASCADE
);
