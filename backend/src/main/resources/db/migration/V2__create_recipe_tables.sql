CREATE TABLE recipe (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    source_url  VARCHAR(1024) NULL,
    source_name VARCHAR(255) NULL,
    servings    INT NULL,
    version     INT NOT NULL DEFAULT 1
);

CREATE TABLE recipe_step (
    recipe_id   BIGINT NOT NULL,
    step_number INT    NOT NULL,
    step_text   TEXT   NOT NULL,
    PRIMARY KEY (recipe_id, step_number),
    CONSTRAINT fk_recipe_step_recipe FOREIGN KEY (recipe_id) REFERENCES recipe (id) ON DELETE CASCADE
);

CREATE TABLE recipe_tag (
    recipe_id BIGINT       NOT NULL,
    tag       VARCHAR(100) NOT NULL,
    PRIMARY KEY (recipe_id, tag),
    CONSTRAINT fk_recipe_tag_recipe FOREIGN KEY (recipe_id) REFERENCES recipe (id) ON DELETE CASCADE
);

CREATE TABLE recipe_ingredient (
    id                     BIGINT AUTO_INCREMENT PRIMARY KEY,
    recipe_id              BIGINT        NOT NULL,
    ingredient_id          BIGINT        NOT NULL,
    amount                 DECIMAL(10,3) NOT NULL,
    unit                   VARCHAR(50)   NOT NULL,
    cut_type               VARCHAR(20)   NULL,
    cut_type_other         VARCHAR(100)  NULL,
    state_condition        VARCHAR(20)   NULL,
    state_condition_other  VARCHAR(100)  NULL,
    notes                  VARCHAR(255)  NULL,
    CONSTRAINT fk_recipe_ingredient_recipe FOREIGN KEY (recipe_id) REFERENCES recipe (id) ON DELETE CASCADE,
    CONSTRAINT fk_recipe_ingredient_ingredient FOREIGN KEY (ingredient_id) REFERENCES ingredient (id)
);
