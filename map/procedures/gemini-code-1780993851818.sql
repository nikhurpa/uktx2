-- =========================================================================
-- UKCFA DATABASE ROUTINE DEPLOYMENT PACKAGE
-- AUTHOR: Gemini AI Database Collaborator
-- TARGET ENGINE: MySQL 8.x / MariaDB (Collation-Safe & Dynamic)
-- =========================================================================

DELIMITER $$

-- -------------------------------------------------------------------------
-- 1. GRAM PANCHAYAT MAPPED METRICS PROCEDURES
-- -------------------------------------------------------------------------

DROP PROCEDURE IF EXISTS GetGpMonthlyBnuConnections$$
CREATE PROCEDURE GetGpMonthlyBnuConnections(
    IN input_date VARCHAR(10),
    IN input_table VARCHAR(64),
    IN input_gp_filter VARCHAR(20)
)
BEGIN
    SET @sql_query = CONCAT('
        SELECT 
            g.DISTRICT, g.BLOCK, g.GP_NAME, g.LGD_CODE, g.GP_TYPE, g.SAMRIDH,
            COUNT(f.CUSTOMER_ID) AS OPENED
        FROM gp g
        LEFT JOIN ', input_table, ' f ON g.LGD_CODE = 
            CASE 
                WHEN f.VILLAGE_NAME LIKE ''BH%'' OR f.VILLAGE_CODE LIKE ''BH%'' 
                    THEN TRIM(LEADING ''0'' FROM SUBSTRING(f.VILLAGE_CODE, 3))
                ELSE TRIM(LEADING ''0'' FROM f.GP_CODE)
            END
            AND f.CONNECTION_DATE IS NOT NULL
            AND (DATE_FORMAT(f.CONNECTION_DATE, ''%d-%m-%Y'') COLLATE utf8mb4_general_ci) LIKE CONCAT(''%'', ?, ''%'') COLLATE utf8mb4_general_ci
        WHERE 1=1
            AND (
                ? = ''ALL'' 
                OR (? IN (''PRIORITY'', ''REST'') AND g.GP_TYPE = ?)
                OR (? = ''SAMRIDH'' AND g.SAMRIDH = ''Y'')
            )
        GROUP BY g.DISTRICT, g.BLOCK, g.GP_NAME, g.LGD_CODE, g.GP_TYPE, g.SAMRIDH
        ORDER BY OPENED DESC, g.GP_NAME ASC;
    ');
    SET @param_date = input_date;
    SET @filter1 = input_gp_filter; SET @filter2 = input_gp_filter; SET @filter3 = input_gp_filter; SET @filter4 = input_gp_filter;
    PREPARE stmt FROM @sql_query;
    EXECUTE stmt USING @param_date, @filter1, @filter2, @filter3, @filter4;
    DEALLOCATE PREPARE stmt;
END$$

DROP PROCEDURE IF EXISTS GetGpMonthlyBnuDisconnections$$
CREATE PROCEDURE GetGpMonthlyBnuDisconnections(
    IN input_date VARCHAR(10),
    IN input_table VARCHAR(64),
    IN input_gp_filter VARCHAR(20)
)
BEGIN
    SET @sql_query = CONCAT('
        SELECT 
            g.DISTRICT, g.BLOCK, g.GP_NAME, g.LGD_CODE, g.GP_TYPE, g.SAMRIDH,
            COUNT(f.CUSTOMER_ID) AS CLOSED
        FROM gp g
        LEFT JOIN ', input_table, ' f ON g.LGD_CODE = 
            CASE 
                WHEN f.VILLAGE_NAME LIKE ''BH%'' OR f.VILLAGE_CODE LIKE ''BH%'' 
                    THEN TRIM(LEADING ''0'' FROM SUBSTRING(f.VILLAGE_CODE, 3))
                ELSE TRIM(LEADING ''0'' FROM f.GP_CODE)
            END
            AND f.DISCONNECTION_DATE IS NOT NULL
            AND (DATE_FORMAT(f.DISCONNECTION_DATE, ''%d-%m-%Y'') COLLATE utf8mb4_general_ci) LIKE CONCAT(''%'', ?, ''%'') COLLATE utf8mb4_general_ci
        WHERE 1=1
            AND (
                ? = ''ALL'' 
                OR (? IN (''PRIORITY'', ''REST'') AND g.GP_TYPE = ?)
                OR (? = ''SAMRIDH'' AND g.SAMRIDH = ''Y'')
            )
        GROUP BY g.DISTRICT, g.BLOCK, g.GP_NAME, g.LGD_CODE, g.GP_TYPE, g.SAMRIDH
        ORDER BY CLOSED DESC, g.GP_NAME ASC;
    ');
    SET @param_date = input_date;
    SET @filter1 = input_gp_filter; SET @filter2 = input_gp_filter; SET @filter3 = input_gp_filter; SET @filter4 = input_gp_filter;
    PREPARE stmt FROM @sql_query;
    EXECUTE stmt USING @param_date, @filter1, @filter2, @filter3, @filter4;
    DEALLOCATE PREPARE stmt;
END$$

DROP PROCEDURE IF EXISTS GetGpMonthlyBnuDisconnectionsABP$$
CREATE PROCEDURE GetGpMonthlyBnuDisconnectionsABP(
    IN input_date VARCHAR(10),
    IN input_table VARCHAR(64),
    IN input_gp_filter VARCHAR(20),
    IN input_opened_after_date VARCHAR(10)
)
BEGIN
    SET @opened_after = IF(input_opened_after_date IS NULL OR input_opened_after_date = '', '01-05-2025', input_opened_after_date);
    SET @sql_query = CONCAT('
        SELECT 
            g.DISTRICT, g.BLOCK, g.GP_NAME, g.LGD_CODE, g.GP_TYPE, g.SAMRIDH,
            COUNT(f.CUSTOMER_ID) AS CLOSED
        FROM gp g
        LEFT JOIN ', input_table, ' f ON g.LGD_CODE = 
            CASE 
                WHEN f.VILLAGE_NAME LIKE ''BH%'' OR f.VILLAGE_CODE LIKE ''BH%'' 
                    THEN TRIM(LEADING ''0'' FROM SUBSTRING(f.VILLAGE_CODE, 3))
                ELSE TRIM(LEADING ''0'' FROM f.GP_CODE)
            END
            AND f.DISCONNECTION_DATE IS NOT NULL
            AND (DATE_FORMAT(f.DISCONNECTION_DATE, ''%d-%m-%Y'') COLLATE utf8mb4_general_ci) LIKE CONCAT(''%'', ?, ''%'') COLLATE utf8mb4_general_ci
            AND f.CONNECTION_DATE > STR_TO_DATE(?, ''%d-%m-%Y'')
        WHERE 1=1
            AND (
                ? = ''ALL'' 
                OR (? IN (''PRIORITY'', ''REST'') AND g.GP_TYPE = ?)
                OR (? = ''SAMRIDH'' AND g.SAMRIDH = ''Y'')
            )
        GROUP BY g.DISTRICT, g.BLOCK, g.GP_NAME, g.LGD_CODE, g.GP_TYPE, g.SAMRIDH
        ORDER BY CLOSED DESC, g.GP_NAME ASC;
    ');
    SET @param_date = input_date; SET @param_opened_after = @opened_after;
    SET @filter1 = input_gp_filter; SET @filter2 = input_gp_filter; SET @filter3 = input_gp_filter; SET @filter4 = input_gp_filter;
    PREPARE stmt FROM @sql_query;
    EXECUTE stmt USING @param_date, @param_opened_after, @filter1, @filter2, @filter3, @filter4;
    DEALLOCATE PREPARE stmt;
END$$


-- -------------------------------------------------------------------------
-- 2. BBM REVENUE & LOGISTICS SUMMARY MANAGEMENT
-- -------------------------------------------------------------------------

DROP PROCEDURE IF EXISTS GetBbmMonthlyBnuConnections$$
CREATE PROCEDURE GetBbmMonthlyBnuConnections(
    IN input_date VARCHAR(10),
    IN input_table VARCHAR(64)
)
BEGIN
    SET @sql_query = CONCAT('
        SELECT b.BBM_NAME, b.BBM_MOBILE, b.OA, COUNT(f.CUSTOMER_ID) AS OPENED
        FROM bbm b
        INNER JOIN olt o ON b.BBM_NAME = o.BBM_NAME
        INNER JOIN ', input_table, ' f ON o.OLT_IP = f.OLT_IP 
        WHERE b.ACTIVE = ''Y'' AND f.CONNECTION_DATE IS NOT NULL
          AND (DATE_FORMAT(f.CONNECTION_DATE, ''%d-%m-%Y'') COLLATE utf8mb4_general_ci) LIKE CONCAT(''%'', ?, ''%'') COLLATE utf8mb4_general_ci
        GROUP BY b.BBM_NAME, b.BBM_MOBILE, b.OA
        ORDER BY OPENED DESC, b.BBM_NAME ASC;
    ');
    SET @param_date = input_date; PREPARE stmt FROM @sql_query; EXECUTE stmt USING @param_date; DEALLOCATE PREPARE stmt;
END$$

DROP PROCEDURE IF EXISTS GetBbmMonthlyBnuDisconnections$$
CREATE PROCEDURE GetBbmMonthlyBnuDisconnections(
    IN input_date VARCHAR(10),
    IN input_table VARCHAR(64)
)
BEGIN
    SET @sql_query = CONCAT('
        SELECT b.BBM_NAME, b.BBM_MOBILE, b.OA, COUNT(f.CUSTOMER_ID) AS CLOSED
        FROM bbm b
        INNER JOIN olt o ON b.BBM_NAME = o.BBM_NAME
        INNER JOIN ', input_table, ' f ON o.OLT_IP = f.OLT_IP 
        WHERE b.ACTIVE = ''Y'' AND f.DISCONNECTION_DATE IS NOT NULL
          AND (DATE_FORMAT(f.DISCONNECTION_DATE, ''%d-%m-%Y'') COLLATE utf8mb4_general_ci) LIKE CONCAT(''%'', ?, ''%'') COLLATE utf8mb4_general_ci
        GROUP BY b.BBM_NAME, b.BBM_MOBILE, b.OA
        ORDER BY CLOSED DESC, b.BBM_NAME ASC;
    ');
    SET @param_date = input_date; PREPARE stmt FROM @sql_query; EXECUTE stmt USING @param_date; DEALLOCATE PREPARE stmt;
END$$

DROP PROCEDURE IF EXISTS GetBbmMonthlyBnuConnectionsABP$$
CREATE PROCEDURE GetBbmMonthlyBnuConnectionsABP(
    IN input_date VARCHAR(10),
    IN input_table VARCHAR(64),
    IN input_opened_after_date VARCHAR(10)
)
BEGIN
    SET @opened_after = IF(input_opened_after_date IS NULL OR input_opened_after_date = '', '01-05-2025', input_opened_after_date);
    SET @sql_query = CONCAT('
        SELECT b.BBM_NAME, b.BBM_MOBILE, b.OA, COUNT(f.CUSTOMER_ID) AS OPENED
        FROM bbm b
        INNER JOIN olt o ON b.BBM_NAME = o.BBM_NAME
        INNER JOIN ', input_table, ' f ON o.OLT_IP = f.OLT_IP 
        WHERE b.ACTIVE = ''Y'' AND f.CONNECTION_DATE IS NOT NULL
          AND (DATE_FORMAT(f.CONNECTION_DATE, ''%d-%m-%Y'') COLLATE utf8mb4_general_ci) LIKE CONCAT(''%'', ?, ''%'') COLLATE utf8mb4_general_ci
          AND f.CONNECTION_DATE > STR_TO_DATE(?, ''%d-%m-%Y'')
        GROUP BY b.BBM_NAME, b.BBM_MOBILE, b.OA
        ORDER BY OPENED DESC, b.BBM_NAME ASC;
    ');
    SET @param_date = input_date; SET @param_opened_after = @opened_after;
    PREPARE stmt FROM @sql_query; EXECUTE stmt USING @param_date, @param_opened_after; DEALLOCATE PREPARE stmt;
END$$

DROP PROCEDURE IF EXISTS GetBbmMonthlyBnuDisconnectionsABP$$
CREATE PROCEDURE GetBbmMonthlyBnuDisconnectionsABP(
    IN input_date VARCHAR(10),
    IN input_table VARCHAR(64),
    IN input_opened_after_date VARCHAR(10)
)
BEGIN
    SET @opened_after = IF(input_opened_after_date IS NULL OR input_opened_after_date = '', '01-05-2025', input_opened_after_date);
    SET @sql_query = CONCAT('
        SELECT b.BBM_NAME, b.BBM_MOBILE, b.OA, COUNT(f.CUSTOMER_ID) AS CLOSED
        FROM bbm b
        INNER JOIN olt o ON b.BBM_NAME = o.BBM_NAME
        INNER JOIN ', input_table, ' f ON o.OLT_IP = f.OLT_IP 
        WHERE b.ACTIVE = ''Y'' AND f.DISCONNECTION_DATE IS NOT NULL
          AND (DATE_FORMAT(f.DISCONNECTION_DATE, ''%d-%m-%Y'') COLLATE utf8mb4_general_ci) LIKE CONCAT(''%'', ?, ''%'') COLLATE utf8mb4_general_ci
          AND f.CONNECTION_DATE > STR_TO_DATE(?, ''%d-%m-%Y'')
        GROUP BY b.BBM_NAME, b.BBM_MOBILE, b.OA
        ORDER BY CLOSED DESC, b.BBM_NAME ASC;
    ');
    SET @param_date = input_date; SET @param_opened_after = @opened_after;
    PREPARE stmt FROM @sql_query; EXECUTE stmt USING @param_date, @param_opened_after; DEALLOCATE PREPARE stmt;
END$$


-- -------------------------------------------------------------------------
-- 3. BBM GRANULAR OPERATIONAL DETAIL LIST RECORDS
-- -------------------------------------------------------------------------

DROP PROCEDURE IF EXISTS GetBbmMonthlyBnuConnectionList$$
CREATE PROCEDURE GetBbmMonthlyBnuConnectionList(
    IN input_bbm_name VARCHAR(100), IN input_date VARCHAR(10), IN input_table VARCHAR(64), IN input_gp_filter VARCHAR(20)
)
BEGIN
    SET @sql_query = CONCAT('
        SELECT f.CUSTOMER_ID, f.BNU_NAME, f.OLT_IP, f.GP_NAME AS CONNECTION_GP_NAME, f.CONNECTION_DATE, g.GP_TYPE, g.SAMRIDH,
            IF(f.CONNECTION_DATE > STR_TO_DATE(''01-05-2025'', ''%d-%m-%Y''), ''Y'', ''N'') AS IS_ABP,
            CASE WHEN g.SAMRIDH = ''Y'' THEN ''Samridh'' WHEN g.GP_TYPE = ''PRIORITY'' THEN ''PRIORITY'' WHEN g.GP_TYPE = ''REST'' THEN ''REST'' ELSE ''UNCLASSIFIED'' END AS CONNECTION_CATEGORY
        FROM ', input_table, ' f INNER JOIN olt o ON f.OLT_IP = o.OLT_IP INNER JOIN bbm b ON o.BBM_NAME = b.BBM_NAME
        LEFT JOIN gp g ON g.LGD_CODE = CASE WHEN f.VILLAGE_NAME LIKE ''BH%'' OR f.VILLAGE_CODE LIKE ''BH%'' THEN TRIM(LEADING ''0'' FROM SUBSTRING(f.VILLAGE_CODE, 3)) ELSE TRIM(LEADING ''0'' FROM f.GP_CODE) END
        WHERE b.BBM_NAME = ? AND b.ACTIVE = ''Y'' AND f.CONNECTION_DATE IS NOT NULL
          AND (DATE_FORMAT(f.CONNECTION_DATE, ''%d-%m-%Y'') COLLATE utf8mb4_general_ci) LIKE CONCAT(''%'', ?, ''%'') COLLATE utf8mb4_general_ci
          AND (? = ''ALL'' OR (? = ''ABP'' AND f.CONNECTION_DATE > STR_TO_DATE(''01-05-2025'', ''%d-%m-%Y'')) OR (? IN (''PRIORITY'', ''REST'') AND g.GP_TYPE = ?) OR (? = ''SAMRIDH'' AND g.SAMRIDH = ''Y''))
        ORDER BY f.CONNECTION_DATE DESC;
    ');
    SET @param_bbm = input_bbm_name; SET @param_date = input_date;
    SET @f1 = input_gp_filter; SET @f2 = input_gp_filter; SET @f3 = input_gp_filter; SET @f4 = input_gp_filter; SET @f5 = input_gp_filter;
    PREPARE stmt FROM @sql_query; EXECUTE stmt USING @param_bbm, @param_date, @f1, @f2, @f3, @f4, @f5; DEALLOCATE PREPARE stmt;
END$$

DROP PROCEDURE IF EXISTS GetBbmMonthlyBnuDisconnectionsList$$
CREATE PROCEDURE GetBbmMonthlyBnuDisconnectionsList(
    IN input_bbm_name VARCHAR(100), IN input_date VARCHAR(10), IN input_table VARCHAR(64), IN input_gp_filter VARCHAR(20)
)
BEGIN
    SET @sql_query = CONCAT('
        SELECT f.CUSTOMER_ID, f.BNU_NAME, f.OLT_IP, f.GP_NAME AS CONNECTION_GP_NAME, f.CONNECTION_DATE, f.DISCONNECTION_DATE, g.GP_TYPE, g.SAMRIDH,
            IF(f.CONNECTION_DATE > STR_TO_DATE(''01-05-2025'', ''%d-%m-%Y''), ''Y'', ''N'') AS IS_ABP,
            CASE WHEN g.SAMRIDH = ''Y'' THEN ''Samridh'' WHEN g.GP_TYPE = ''PRIORITY'' THEN ''PRIORITY'' WHEN g.GP_TYPE = ''REST'' THEN ''REST'' ELSE ''UNCLASSIFIED'' END AS CONNECTION_CATEGORY
        FROM ', input_table, ' f INNER JOIN olt o ON f.OLT_IP = o.OLT_IP INNER JOIN bbm b ON o.BBM_NAME = b.BBM_NAME
        LEFT JOIN gp g ON g.LGD_CODE = CASE WHEN f.VILLAGE_NAME LIKE ''BH%'' OR f.VILLAGE_CODE LIKE ''BH%'' THEN TRIM(LEADING ''0'' FROM SUBSTRING(f.VILLAGE_CODE, 3)) ELSE TRIM(LEADING ''0'' FROM f.GP_CODE) END
        WHERE b.BBM_NAME = ? AND b.ACTIVE = ''Y'' AND f.DISCONNECTION_DATE IS NOT NULL
          AND (DATE_FORMAT(f.DISCONNECTION_DATE, ''%d-%m-%Y'') COLLATE utf8mb4_general_ci) LIKE CONCAT(''%'', ?, ''%'') COLLATE utf8mb4_general_ci
          AND (? = ''ALL'' OR (? = ''ABP'' AND f.CONNECTION_DATE > STR_TO_DATE(''01-05-2025'', ''%d-%m-%Y'')) OR (? IN (''PRIORITY'', ''REST'') AND g.GP_TYPE = ?) OR (? = ''SAMRIDH'' AND g.SAMRIDH = ''Y''))
        ORDER BY f.DISCONNECTION_DATE DESC;
    ');
    SET @param_bbm = input_bbm_name; SET @param_date = input_date;
    SET @f1 = input_gp_filter; SET @f2 = input_gp_filter; SET @f3 = input_gp_filter; SET @f4 = input_gp_filter; SET @f5 = input_gp_filter;
    PREPARE stmt FROM @sql_query; EXECUTE stmt USING @param_bbm, @param_date, @f1, @f2, @f3, @f4, @f5; DEALLOCATE PREPARE stmt;
END$$

DROP PROCEDURE IF EXISTS GetBbmMonthlyBnuConnectionsABPList$$
CREATE PROCEDURE GetBbmMonthlyBnuConnectionsABPList(
    IN input_bbm_name VARCHAR(100), IN input_date VARCHAR(10), IN input_table VARCHAR(64), IN input_gp_filter VARCHAR(20), IN input_opened_after_date VARCHAR(10)
)
BEGIN
    SET @opened_after = IF(input_opened_after_date IS NULL OR input_opened_after_date = '', '01-05-2025', input_opened_after_date);
    SET @sql_query = CONCAT('
        SELECT f.CUSTOMER_ID, f.BNU_NAME, f.OLT_IP, f.GP_NAME AS CONNECTION_GP_NAME, f.CONNECTION_DATE, g.GP_TYPE, g.SAMRIDH, ''Y'' AS IS_ABP,
            CASE WHEN g.SAMRIDH = ''Y'' THEN ''Samridh'' WHEN g.GP_TYPE = ''PRIORITY'' THEN ''PRIORITY'' WHEN g.GP_TYPE = ''REST'' THEN ''REST'' ELSE ''UNCLASSIFIED'' END AS CONNECTION_CATEGORY
        FROM ', input_table, ' f INNER JOIN olt o ON f.OLT_IP = o.OLT_IP INNER JOIN bbm b ON o.BBM_NAME = b.BBM_NAME
        LEFT JOIN gp g ON g.LGD_CODE = CASE WHEN f.VILLAGE_NAME LIKE ''BH%'' OR f.VILLAGE_CODE LIKE ''BH%'' THEN TRIM(LEADING ''0'' FROM SUBSTRING(f.VILLAGE_CODE, 3)) ELSE TRIM(LEADING ''0'' FROM f.GP_CODE) END
        WHERE b.BBM_NAME = ? AND b.ACTIVE = ''Y'' AND f.CONNECTION_DATE IS NOT NULL
          AND (DATE_FORMAT(f.CONNECTION_DATE, ''%d-%m-%Y'') COLLATE utf8mb4_general_ci) LIKE CONCAT(''%'', ?, ''%'') COLLATE utf8mb4_general_ci
          AND f.CONNECTION_DATE > STR_TO_DATE(?, ''%d-%m-%Y'')
          AND (? = ''ALL'' OR ? = ''ABP'' OR (? IN (''PRIORITY'', ''REST'') AND g.GP_TYPE = ?) OR (? = ''SAMRIDH'' AND g.SAMRIDH = ''Y''))
        ORDER BY f.CONNECTION_DATE DESC;
    ');
    SET @param_bbm = input_bbm_name; SET @param_date = input_date; SET @param_opened_after = @opened_after;
    SET @f1 = input_gp_filter; SET @f2 = input_gp_filter; SET @f3 = input_gp_filter; SET @f4 = input_gp_filter; SET @f5 = input_gp_filter;
    PREPARE stmt FROM @sql_query; EXECUTE stmt USING @param_bbm, @param_date, @param_opened_after, @f1, @f2, @f3, @f4, @f5; DEALLOCATE PREPARE stmt;
END$$

DROP PROCEDURE IF EXISTS GetBbmMonthlyBnuDisconnectionsABPList$$
CREATE PROCEDURE GetBbmMonthlyBnuDisconnectionsABPList(
    IN input_bbm_name VARCHAR(100), IN input_date VARCHAR(10), IN input_table VARCHAR(64), IN input_gp_filter VARCHAR(20), IN input_opened_after_date VARCHAR(10)
)
BEGIN
    SET @opened_after = IF(input_opened_after_date IS NULL OR input_opened_after_date = '', '01-05-2025', input_opened_after_date);
    SET @sql_query = CONCAT('
        SELECT f.CUSTOMER_ID, f.BNU_NAME, f.OLT_IP, f.GP_NAME AS CONNECTION_GP_NAME, f.CONNECTION_DATE, f.DISCONNECTION_DATE, g.GP_TYPE, g.SAMRIDH, ''Y'' AS IS_ABP,
            CASE WHEN g.SAMRIDH = ''Y'' THEN ''Samridh'' WHEN g.GP_TYPE = ''PRIORITY'' THEN ''PRIORITY'' WHEN g.GP_TYPE = ''REST'' THEN ''REST'' ELSE ''UNCLASSIFIED'' END AS CONNECTION_CATEGORY
        FROM ', input_table, ' f INNER JOIN olt o ON f.OLT_IP = o.OLT_IP INNER JOIN bbm b ON o.BBM_NAME = b.BBM_NAME
        LEFT JOIN gp g ON g.LGD_CODE = CASE WHEN f.VILLAGE_NAME LIKE ''BH%'' OR f.VILLAGE_CODE LIKE ''BH%'' THEN TRIM(LEADING ''0'' FROM SUBSTRING(f.VILLAGE_CODE, 3)) ELSE TRIM(LEADING ''0'' FROM f.GP_CODE) END
        WHERE b.BBM_NAME = ? AND b.ACTIVE = ''Y'' AND f.DISCONNECTION_DATE IS NOT NULL
          AND (DATE_FORMAT(f.DISCONNECTION_DATE, ''%d-%m-%Y'') COLLATE utf8mb4_general_ci) LIKE CONCAT(''%'', ?, ''%'') COLLATE utf8mb4_general_ci
          AND f.CONNECTION_DATE > STR_TO_DATE(?, ''%d-%m-%Y'')
          AND (? = ''ALL'' OR ? = ''ABP'' OR (? IN (''PRIORITY'', ''REST'') AND g.GP_TYPE = ?) OR (? = ''SAMRIDH'' AND g.SAMRIDH = ''Y''))
        ORDER BY f.DISCONNECTION_DATE DESC;
    ');
    SET @param_bbm = input_bbm_name; SET @param_date = input_date; SET @param_opened_after = @opened_after;
    SET @f1 = input_gp_filter; SET @f2 = input_gp_filter; SET @f3 = input_gp_filter; SET @f4 = input_gp_filter; SET @f5 = input_gp_filter;
    PREPARE stmt FROM @sql_query; EXECUTE stmt USING @param_bbm, @param_date, @param_opened_after, @f1, @f2, @f3, @f4, @f5; DEALLOCATE PREPARE stmt;
END$$


-- -------------------------------------------------------------------------
-- 4. LIVE WORKING STATUS MATRIX REPORTS (`working_ftth_xxxx`)
-- -------------------------------------------------------------------------

DROP PROCEDURE IF EXISTS GetSsaMonthlyFtthReport$$
CREATE PROCEDURE GetSsaMonthlyFtthReport(IN input_date VARCHAR(10), IN input_table VARCHAR(64))
BEGIN
    SET @sql_query = CONCAT('
        SELECT COALESCE(NULLIF(f.SSA, ''''), o.OA) AS OA_SSA, COUNT(f.OLT_IP) AS TOTAL_CONNECTIONS
        FROM ', input_table, ' f INNER JOIN olt o ON f.OLT_IP = o.OLT_IP
        WHERE 1=1 AND (? = ''ALL'' OR (DATE_FORMAT(f.INST_DATE, ''%m-%Y'') COLLATE utf8mb4_general_ci) LIKE CONCAT(''%'', ?, ''%'') COLLATE utf8mb4_general_ci)
        GROUP BY OA_SSA ORDER BY TOTAL_CONNECTIONS DESC;
    ');
    SET @p1 = input_date; SET @p2 = input_date; PREPARE stmt FROM @sql_query; EXECUTE stmt USING @p1, @p2; DEALLOCATE PREPARE stmt;
END$$

DROP PROCEDURE IF EXISTS GetBbmMonthlyFtthReport$$
CREATE PROCEDURE GetBbmMonthlyFtthReport(IN input_date VARCHAR(10), IN input_table VARCHAR(64))
BEGIN
    SET @sql_query = CONCAT('
        SELECT b.BBM_NAME, b.BBM_MOBILE, b.OA, COUNT(f.OLT_IP) AS TOTAL_CONNECTIONS
        FROM bbm b INNER JOIN olt o ON b.BBM_NAME = o.BBM_NAME INNER JOIN ', input_table, ' f ON o.OLT_IP = f.OLT_IP
        WHERE b.ACTIVE = ''Y'' AND (? = ''ALL'' OR (DATE_FORMAT(f.INST_DATE, ''%m-%Y'') COLLATE utf8mb4_general_ci) LIKE CONCAT(''%'', ?, ''%'') COLLATE utf8mb4_general_ci)
        GROUP BY b.BBM_NAME, b.BBM_MOBILE, b.OA ORDER BY TOTAL_CONNECTIONS DESC, b.BBM_NAME ASC;
    ');
    SET @p1 = input_date; SET @p2 = input_date; PREPARE stmt FROM @sql_query; EXECUTE stmt USING @p1, @p2; DEALLOCATE PREPARE stmt;
END$$

DROP PROCEDURE IF EXISTS GetFranchiseeMonthlyFtthReport$$
CREATE PROCEDURE GetFrfranchiseeMonthlyFtthReport(IN input_date VARCHAR(10), IN input_table VARCHAR(64))
BEGIN
    SET @sql_query = CONCAT('
        SELECT o.FRANCHISEE_ID, o.FRANCHISEE AS FRANCHISEE_NAME, COUNT(f.OLT_IP) AS TOTAL_CONNECTIONS
        FROM olt o INNER JOIN ', input_table, ' f ON o.OLT_IP = f.OLT_IP
        WHERE o.FRANCHISEE_ID IS NOT NULL AND o.FRANCHISEE_ID <> ''''
          AND (? = ''ALL'' OR (DATE_FORMAT(f.INST_DATE, ''%m-%Y'') COLLATE utf8mb4_general_ci) LIKE CONCAT(''%'', ?, ''%'') COLLATE utf8mb4_general_ci)
        GROUP BY o.FRANCHISEE_ID, o.FRANCHISEE ORDER BY TOTAL_CONNECTIONS DESC;
    ');
    SET @p1 = input_date; SET @p2 = input_date; PREPARE stmt FROM @sql_query; EXECUTE stmt USING @p1, @p2; DEALLOCATE PREPARE stmt;
END$$


-- -------------------------------------------------------------------------
-- 5. LIVE WORKING STATUS GRANULAR DETAIL RECORD LISTS (`f.*`)
-- -------------------------------------------------------------------------

DROP PROCEDURE IF EXISTS GetSsaMonthlyFtthList$$
CREATE PROCEDURE GetSsaMonthlyFtthList(IN input_ssa_name VARCHAR(50), IN input_date VARCHAR(10), IN input_table VARCHAR(64))
BEGIN
    SET @sql_query = CONCAT('
        SELECT f.*, COALESCE(NULLIF(f.SSA, ''''), o.OA) AS COMPUTED_OA_SSA, g.GP_NAME AS MAPPED_GP_NAME,
            CASE WHEN g.SAMRIDH = ''Y'' THEN ''Samridh'' WHEN g.GP_TYPE = ''PRIORITY'' THEN ''PRIORITY'' WHEN g.GP_TYPE = ''REST'' THEN ''REST'' ELSE ''UNCLASSIFIED'' END AS CONNECTION_CATEGORY
        FROM ', input_table, ' f INNER JOIN olt o ON f.OLT_IP = o.OLT_IP
        LEFT JOIN gp g ON g.LGD_CODE = CASE WHEN f.VILLAGE_NAME LIKE ''BH%'' OR f.VILLAGE_CODE LIKE ''BH%'' THEN TRIM(LEADING ''0'' FROM SUBSTRING(f.VILLAGE_CODE, 3)) ELSE TRIM(LEADING ''0'' FROM f.GP_CODE) END
        WHERE COALESCE(NULLIF(f.SSA, ''''), o.OA) = ?
          AND (? = ''ALL'' OR (DATE_FORMAT(f.INST_DATE, ''%m-%Y'') COLLATE utf8mb4_general_ci) LIKE CONCAT(''%'', ?, ''%'') COLLATE utf8mb4_general_ci)
        ORDER BY f.INST_DATE DESC;
    ');
    SET @p_ssa = input_ssa_name; SET @p1 = input_date; SET @p2 = input_date;
    PREPARE stmt FROM @sql_query; EXECUTE stmt USING @p_ssa, @p1, @p2; DEALLOCATE PREPARE stmt;
END$$

DROP PROCEDURE IF EXISTS GetBbmMonthlyFtthList$$
CREATE PROCEDURE GetBbmMonthlyFtthList(IN input_bbm_name VARCHAR(100), IN input_date VARCHAR(10), IN input_table VARCHAR(64))
BEGIN
    SET @sql_query = CONCAT('
        SELECT f.*, o.OA AS MAPPED_OA, g.GP_NAME AS MAPPED_GP_NAME,
            CASE WHEN g.SAMRIDH = ''Y'' THEN ''Samridh'' WHEN g.GP_TYPE = ''PRIORITY'' THEN ''PRIORITY'' WHEN g.GP_TYPE = ''REST'' THEN ''REST'' ELSE ''UNCLASSIFIED'' END AS CONNECTION_CATEGORY
        FROM bbm b INNER JOIN olt o ON b.BBM_NAME = o.BBM_NAME INNER JOIN ', input_table, ' f ON o.OLT_IP = f.OLT_IP
        LEFT JOIN gp g ON g.LGD_CODE = CASE WHEN f.VILLAGE_NAME LIKE ''BH%'' OR f.VILLAGE_CODE LIKE ''BH%'' THEN TRIM(LEADING ''0'' FROM SUBSTRING(f.VILLAGE_CODE, 3)) ELSE TRIM(LEADING ''0'' FROM f.GP_CODE) END
        WHERE b.BBM_NAME = ? AND b.ACTIVE = ''Y''
          AND (? = ''ALL'' OR (DATE_FORMAT(f.INST_DATE, ''%m-%Y'') COLLATE utf8mb4_general_ci) LIKE CONCAT(''%'', ?, ''%'') COLLATE utf8mb4_general_ci)
        ORDER BY f.INST_DATE DESC;
    ');
    SET @p_bbm = input_bbm_name; SET @p1 = input_date; SET @p2 = input_date;
    PREPARE stmt FROM @sql_query; EXECUTE stmt USING @p_bbm, @p1, @p2; DEALLOCATE PREPARE stmt;
END$$

DROP PROCEDURE IF EXISTS GetFranchiseeMonthlyFtthList$$
CREATE PROCEDURE GetFranchiseeMonthlyFtthList(IN input_franchisee_id VARCHAR(50), IN input_date VARCHAR(10), IN input_table VARCHAR(64))
BEGIN
    SET @sql_query = CONCAT('
        SELECT f.*, o.FRANCHISEE AS MAPPED_FRANCHISEE_NAME, g.GP_NAME AS MAPPED_GP_NAME,
            CASE WHEN g.SAMRIDH = ''Y'' THEN ''Samridh'' WHEN g.GP_TYPE = ''PRIORITY'' THEN ''PRIORITY'' WHEN g.GP_TYPE = ''REST'' THEN ''REST'' ELSE ''UNCLASSIFIED'' END AS CONNECTION_CATEGORY
        FROM olt o INNER JOIN ', input_table, ' f ON o.OLT_IP = f.OLT_IP
        LEFT JOIN gp g ON g.LGD_CODE = CASE WHEN f.VILLAGE_NAME LIKE ''BH%'' OR f.VILLAGE_CODE LIKE ''BH%'' THEN TRIM(LEADING ''0'' FROM SUBSTRING(f.VILLAGE_CODE, 3)) ELSE TRIM(LEADING ''0'' FROM f.GP_CODE) END
        WHERE o.FRANCHISEE_ID = ?
          AND (? = ''ALL'' OR (DATE_FORMAT(f.INST_DATE, ''%m-%Y'') COLLATE utf8mb4_general_ci) LIKE CONCAT(''%'', ?, ''%'') COLLATE utf8mb4_general_ci)
        ORDER BY f.INST_DATE DESC;
    ');
    SET @p_fran = input_franchisee_id; SET @p1 = input_date; SET @p2 = input_date;
    PREPARE stmt FROM @sql_query; EXECUTE stmt USING @p_fran, @p1, @p2; DEALLOCATE PREPARE stmt;
END$$

DELIMITER ;