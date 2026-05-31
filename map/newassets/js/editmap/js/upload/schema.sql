-- ─────────────────────────────────────────────────────────────────────────────
-- MySQL schema for saving jqxTree map features to "My Places"
-- Run this once in your database
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS map_places (

    -- Primary key
    id              INT UNSIGNED    NOT NULL AUTO_INCREMENT PRIMARY KEY,

    -- Tree hierarchy
    -- parent_id is NULL for top-level nodes inside "My Places"
    parent_id       INT UNSIGNED    NULL,
    client_id       VARCHAR(64)     NOT NULL,   -- the jqxTree node id from JS (e.g. "item42")

    -- Display
    label           VARCHAR(255)    NOT NULL DEFAULT '',
    icon            VARCHAR(255)    NOT NULL DEFAULT '',
    checked         TINYINT(1)      NOT NULL DEFAULT 1,
    sort_order      INT             NOT NULL DEFAULT 0,

    -- Geometry
    -- geom_type: Folder | Point | LineString | Polygon | KmlLayer
    geom_type       VARCHAR(32)     NOT NULL DEFAULT 'Folder',

    -- KML-format coordinate string:
    --   Point      → "lon,lat,0"
    --   LineString → "lon,lat,0 lon,lat,0 …"
    --   Polygon    → "lon,lat,0 lon,lat,0 … lon,lat,0"  (closed ring)
    coordinates     MEDIUMTEXT      NULL,

    -- JSON blob: { stroke, strokeWidth, strokeOpacity,
    --              fill, fillOpacity, iconHref, iconScale }
    style           TEXT            NULL,

    -- Ownership
    user_id         INT UNSIGNED    NOT NULL DEFAULT 1,

    -- Timestamps
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                    ON UPDATE CURRENT_TIMESTAMP,

    -- ── Constraints ────────────────────────────────────────────────────────

    -- Self-referential FK for folder hierarchy
    CONSTRAINT fk_map_places_parent
        FOREIGN KEY (parent_id) REFERENCES map_places(id)
        ON DELETE CASCADE,

    -- One client_id per user (allows upsert via ON DUPLICATE KEY UPDATE)
    UNIQUE KEY uq_client_user (client_id, user_id),

    -- Fast lookups
    KEY idx_user_order  (user_id, sort_order),
    KEY idx_parent      (parent_id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ─────────────────────────────────────────────────────────────────────────────
-- Optional: users table if you don't already have one
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
    id          INT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(100)  NOT NULL,
    email       VARCHAR(200)  NOT NULL,
    created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add FK from map_places.user_id → users.id  (only if you have users table)
-- ALTER TABLE map_places
--     ADD CONSTRAINT fk_map_places_user
--     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
