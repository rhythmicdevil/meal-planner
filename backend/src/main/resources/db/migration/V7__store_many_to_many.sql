CREATE TABLE ingredient_store (
    ingredient_id BIGINT NOT NULL,
    store_id      BIGINT NOT NULL,
    PRIMARY KEY (ingredient_id, store_id),
    CONSTRAINT fk_ingredient_store_ingredient FOREIGN KEY (ingredient_id) REFERENCES ingredient (id) ON DELETE CASCADE,
    CONSTRAINT fk_ingredient_store_store FOREIGN KEY (store_id) REFERENCES store (id) ON DELETE CASCADE
);

INSERT INTO ingredient_store (ingredient_id, store_id)
SELECT id, store_id FROM ingredient WHERE store_id IS NOT NULL;

ALTER TABLE ingredient
    DROP FOREIGN KEY fk_ingredient_store,
    DROP COLUMN store_id;

CREATE TABLE staple_item_store (
    staple_item_id BIGINT NOT NULL,
    store_id       BIGINT NOT NULL,
    PRIMARY KEY (staple_item_id, store_id),
    CONSTRAINT fk_staple_item_store_item FOREIGN KEY (staple_item_id) REFERENCES staple_item (id) ON DELETE CASCADE,
    CONSTRAINT fk_staple_item_store_store FOREIGN KEY (store_id) REFERENCES store (id) ON DELETE CASCADE
);

INSERT INTO staple_item_store (staple_item_id, store_id)
SELECT id, store_id FROM staple_item WHERE store_id IS NOT NULL;

ALTER TABLE staple_item
    DROP FOREIGN KEY fk_staple_item_store,
    DROP COLUMN store_id;
