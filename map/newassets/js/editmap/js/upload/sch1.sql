CREATE TABLE IF NOT EXISTS map_places (

    -- Primary key
    ID              INT UNSIGNED    NOT NULL AUTO_INCREMENT PRIMARY KEY,

    -- Tree hierarchy
    -- parent_id is NULL for top-level nodes inside "My Places"
    PARENT_ID      INT UNSIGNED    NULL,
    CLIENT_ID       VARCHAR(64)     NOT NULL,   -- the jqxTree node id from JS (e.g. "item42")

    -- Display
    LABEL           VARCHAR(255)    NOT NULL DEFAULT '',
    ICON            VARCHAR(255)    NOT NULL DEFAULT '',
    CHECKED         TINYINT(1)      NOT NULL DEFAULT 1,
    SORT_ORDER      INT             NOT NULL DEFAULT 0,

    -- Geometry
    -- geom_type: Folder | Point | LineString | Polygon | KmlLayer
    GEOM_TYPE       VARCHAR(32)     NOT NULL DEFAULT 'Folder',

    -- KML-format coordinate string:
    --   Point      → "lon,lat,0"
    --   LineString → "lon,lat,0 lon,lat,0 …"
    --   Polygon    → "lon,lat,0 lon,lat,0 … lon,lat,0"  (closed ring)
    COORDINATES     MEDIUMTEXT      NULL,

    -- JSON blob: { stroke, strokeWidth, strokeOpacity,
    --              fill, fillOpacity, iconHref, iconScale }
    STYLE           TEXT            NULL,

    -- Ownership
    USER_ID         VARCHAR(50)     NOT NULL DEFAULT "admin",

    -- Timestamps
    CREATED_AT      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                    ON UPDATE CURRENT_TIMESTAMP,
    -- ── Constraints ────────────────────────────────────────────────────────

    -- Self-referential FK for folder hierarchy
    CONSTRAINT FK_MAP_PLACES_PARENT
        FOREIGN KEY (PARENT_ID) REFERENCES MAP_PLACES(ID)
        ON DELETE CASCADE,

    -- One client_id per user (allows upsert via ON DUPLICATE KEY UPDATE)
    UNIQUE KEY UQ_CLIENT_USER (CLIENT_ID, USER_ID),

    -- Fast lookups
    KEY IDX_USER_ORDER  (USER_ID, SORT_ORDER),
    KEY IDX_PARENT      (PARENT_ID)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
