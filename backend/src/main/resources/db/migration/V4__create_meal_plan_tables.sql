CREATE TABLE meal_plan (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    start_date DATE NULL,
    end_date   DATE NULL
);

CREATE TABLE meal_plan_item (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    meal_plan_id   BIGINT      NOT NULL,
    item_type      VARCHAR(10) NOT NULL,
    recipe_id      BIGINT      NULL,
    recipe_version INT         NULL,
    menu_id        BIGINT      NULL,
    CONSTRAINT fk_meal_plan_item_meal_plan FOREIGN KEY (meal_plan_id) REFERENCES meal_plan (id) ON DELETE CASCADE,
    CONSTRAINT fk_meal_plan_item_recipe FOREIGN KEY (recipe_id) REFERENCES recipe (id),
    CONSTRAINT fk_meal_plan_item_menu FOREIGN KEY (menu_id) REFERENCES menu (id),
    CONSTRAINT chk_meal_plan_item_type CHECK (
        (item_type = 'RECIPE' AND recipe_id IS NOT NULL AND recipe_version IS NOT NULL AND menu_id IS NULL)
        OR
        (item_type = 'MENU' AND menu_id IS NOT NULL AND recipe_id IS NULL AND recipe_version IS NULL)
    )
);
