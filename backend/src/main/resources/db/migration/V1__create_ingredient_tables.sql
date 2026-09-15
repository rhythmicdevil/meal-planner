CREATE TABLE ingredient (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(255) NOT NULL,
    default_unit VARCHAR(50)  NULL,
    category     VARCHAR(20)  NOT NULL,
    CONSTRAINT uk_ingredient_name UNIQUE (name)
);

CREATE TABLE ingredient_alias (
    ingredient_id BIGINT       NOT NULL,
    alias         VARCHAR(255) NOT NULL,
    PRIMARY KEY (ingredient_id, alias),
    CONSTRAINT fk_ingredient_alias_ingredient FOREIGN KEY (ingredient_id) REFERENCES ingredient (id) ON DELETE CASCADE
);
