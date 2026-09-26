CREATE TABLE recipe_cuisine_tag (
    recipe_id BIGINT NOT NULL,
    tag_id    BIGINT NOT NULL,
    PRIMARY KEY (recipe_id, tag_id),
    CONSTRAINT fk_recipe_cuisine_tag_recipe FOREIGN KEY (recipe_id) REFERENCES recipe (id) ON DELETE CASCADE,
    CONSTRAINT fk_recipe_cuisine_tag_tag FOREIGN KEY (tag_id) REFERENCES tag (id) ON DELETE CASCADE
);

INSERT INTO recipe_cuisine_tag (recipe_id, tag_id)
SELECT id, cuisine_tag_id FROM recipe WHERE cuisine_tag_id IS NOT NULL;

ALTER TABLE recipe
    DROP FOREIGN KEY fk_recipe_cuisine_tag,
    DROP COLUMN cuisine_tag_id;
