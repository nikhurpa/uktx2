CREATE TABLE kml_elements (
    id VARCHAR(100) PRIMARY KEY,
    temp VARCHAR(10),
    file TEXT,
    fileid VARCHAR(100) UNIQUE,
    parentfolder TEXT,
    element_type VARCHAR(10),
    element_name TEXT,
    element_sl INT,
    description TEXT,
    ikon TEXT,
    style TEXT,
    coordinates TEXT,
    open VARCHAR(10),
    user_created VARCHAR(20),
    user_updated VARCHAR(20),
    creation_date_time DATETIME,
    updation_date_time DATETIME
    
);