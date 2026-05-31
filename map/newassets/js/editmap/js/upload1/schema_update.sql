-- Run this if you already created the table without the popup column
ALTER TABLE map_places 
    ADD COLUMN IF NOT EXISTS popup MEDIUMTEXT NULL AFTER style;

-- If creating fresh, use this full schema:
CREATE TABLE IF NOT EXISTS map_places (
    id              INT UNSIGNED    NOT NULL AUTO_INCREMENT PRIMARY KEY,
    parent_id       INT UNSIGNED    NULL,
    client_id       VARCHAR(64)     NOT NULL,
    label           VARCHAR(255)    NOT NULL DEFAULT '',
    icon            VARCHAR(255)    NOT NULL DEFAULT '',
    checked         TINYINT(1)      NOT NULL DEFAULT 1,
    sort_order      INT             NOT NULL DEFAULT 0,
    geom_type       VARCHAR(32)     NOT NULL DEFAULT 'Folder',
    coordinates     MEDIUMTEXT      NULL,
    style           TEXT            NULL,
    popup           MEDIUMTEXT      NULL,   -- stores full popup HTML/content
    user_id         VARCHAR(64)     NOT NULL DEFAULT '',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                    ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_map_places_parent
        FOREIGN KEY (parent_id) REFERENCES map_places(id) ON DELETE CASCADE,
    UNIQUE KEY uq_client_user (client_id, user_id),
    KEY idx_user_order (user_id, sort_order),
    KEY idx_parent     (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
