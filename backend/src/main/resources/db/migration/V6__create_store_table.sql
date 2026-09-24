CREATE TABLE store (
    id   BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    CONSTRAINT uk_store_name UNIQUE (name)
);

ALTER TABLE ingredient
    ADD COLUMN store_id BIGINT NULL,
    ADD CONSTRAINT fk_ingredient_store FOREIGN KEY (store_id) REFERENCES store (id) ON DELETE SET NULL;

ALTER TABLE staple_item
    ADD COLUMN store_id BIGINT NULL,
    ADD CONSTRAINT fk_staple_item_store FOREIGN KEY (store_id) REFERENCES store (id) ON DELETE SET NULL;
