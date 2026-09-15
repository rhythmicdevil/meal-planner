CREATE TABLE menu (
    id   BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE menu_recipe (
    menu_id   BIGINT NOT NULL,
    recipe_id BIGINT NOT NULL,
    PRIMARY KEY (menu_id, recipe_id),
    CONSTRAINT fk_menu_recipe_menu FOREIGN KEY (menu_id) REFERENCES menu (id) ON DELETE CASCADE,
    CONSTRAINT fk_menu_recipe_recipe FOREIGN KEY (recipe_id) REFERENCES recipe (id) ON DELETE CASCADE
);
