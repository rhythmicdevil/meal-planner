CREATE TABLE staple_group (
    id   BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE staple_item (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    staple_group_id BIGINT       NOT NULL,
    name            VARCHAR(255) NOT NULL,
    ingredient_id   BIGINT       NULL,
    CONSTRAINT fk_staple_item_staple_group FOREIGN KEY (staple_group_id) REFERENCES staple_group (id) ON DELETE CASCADE,
    CONSTRAINT fk_staple_item_ingredient FOREIGN KEY (ingredient_id) REFERENCES ingredient (id)
);

ALTER TABLE meal_plan_item
    MODIFY item_type VARCHAR(20) NOT NULL;

ALTER TABLE meal_plan_item
    ADD COLUMN staple_group_id BIGINT NULL,
    ADD CONSTRAINT fk_meal_plan_item_staple_group FOREIGN KEY (staple_group_id) REFERENCES staple_group (id);

ALTER TABLE meal_plan_item
    DROP CHECK chk_meal_plan_item_type;

ALTER TABLE meal_plan_item
    ADD CONSTRAINT chk_meal_plan_item_type CHECK (
        (item_type = 'RECIPE' AND recipe_id IS NOT NULL AND menu_id IS NULL AND staple_group_id IS NULL)
        OR
        (item_type = 'MENU' AND menu_id IS NOT NULL AND recipe_id IS NULL AND staple_group_id IS NULL)
        OR
        (item_type = 'STAPLE_GROUP' AND staple_group_id IS NOT NULL AND recipe_id IS NULL AND menu_id IS NULL)
    );
