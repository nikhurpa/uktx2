CREATE DEFINER=`u642970219_uktx`@`%` PROCEDURE `GetBbmMonthlyBnuConnections`(
    IN input_date VARCHAR(10),
    IN input_table VARCHAR(64)
)
BEGIN
    SET @sql_query = CONCAT('
        SELECT 
            b.BBM_NAME, 
            b.BBM_MOBILE, 
            b.OA,
            COUNT(f.CUSTOMER_ID) AS OPENED
        FROM bbm b
        LEFT JOIN olt o ON b.BBM_NAME = o.BBM_NAME
        -- All filters for table f must live inside the ON clause below
        LEFT JOIN ', input_table, ' f ON o.OLT_IP = f.OLT_IP 
            AND f.CONNECTION_DATE IS NOT NULL
            AND (DATE_FORMAT(f.CONNECTION_DATE, ''%d-%m-%Y'') COLLATE utf8mb4_general_ci) 
                LIKE CONCAT(''%'', ?, ''%'') COLLATE utf8mb4_general_ci
        -- Only filters for the primary table (bbm) should remain in the WHERE clause
        WHERE b.ACTIVE = ''Y''
        GROUP BY b.BBM_NAME, b.BBM_MOBILE, b.OA
        ORDER BY OPENED DESC, b.BBM_NAME ASC;
    ');

    SET @param_date = input_date;
    PREPARE stmt FROM @sql_query;
    EXECUTE stmt USING @param_date;
    DEALLOCATE PREPARE stmt;
END$$













DELIMITER $$

DROP PROCEDURE IF EXISTS GetBbmMonthlyBnuConnections$$

CREATE PROCEDURE GetBbmMonthlyBnuConnections(
    IN input_date VARCHAR(10),
    IN input_table VARCHAR(64),
    IN input_opened_after_date VARCHAR(10),
    IN input_gp_filter VARCHAR(20)
)
BEGIN
    -- Handle default baseline date if NULL or empty string is passed
    SET @opened_after = IF(input_opened_after_date IS NULL OR input_opened_after_date = '', '01-05-2025', input_opened_after_date);

    SET @sql_query = CONCAT('
        SELECT 
            b.BBM_NAME, 
            b.BBM_MOBILE, 
            b.OA,
            COUNT(f.CUSTOMER_ID) AS OPENED,
            COALESCE(SUM((g.GP_TYPE COLLATE utf8mb4_general_ci) = ''PRIORITY''), 0) AS PRIORITY_COUNT,
            COALESCE(SUM((g.GP_TYPE COLLATE utf8mb4_general_ci) = ''REST''), 0) AS REST_COUNT,
            COALESCE(SUM((g.SAMRIDH COLLATE utf8mb4_general_ci) = ''Y''), 0) AS SAMRIDH_COUNT
        FROM bbm b
        LEFT JOIN olt o ON b.BBM_NAME = o.BBM_NAME
        LEFT JOIN ', input_table, ' f ON o.OLT_IP = f.OLT_IP
            AND f.CONNECTION_DATE IS NOT NULL
            AND (DATE_FORMAT(f.CONNECTION_DATE, ''%d-%m-%Y'') COLLATE utf8mb4_general_ci) 
                LIKE CONCAT(''%'', ?, ''%'') COLLATE utf8mb4_general_ci
            AND ((? COLLATE utf8mb4_general_ci) = ''ALL'' OR f.CONNECTION_DATE > STR_TO_DATE(?, ''%d-%m-%Y'')) 
        LEFT JOIN gp g ON (g.LGD_CODE COLLATE utf8mb4_0900_ai_ci) = 
            CASE 
                WHEN f.VILLAGE_NAME LIKE ''BH%'' OR f.VILLAGE_CODE LIKE ''BH%'' 
                    THEN TRIM(LEADING ''0'' FROM SUBSTRING(f.VILLAGE_CODE, 3))
                ELSE TRIM(LEADING ''0'' FROM f.GP_CODE)
            END
        WHERE b.ACTIVE = ''Y''
          AND (
                (? COLLATE utf8mb4_general_ci) = ''ALL''
                OR ((? COLLATE utf8mb4_general_ci) = ''ABP'' AND f.CONNECTION_DATE > STR_TO_DATE(''01-05-2025'', ''%d-%m-%Y''))
                OR ((? COLLATE utf8mb4_general_ci) IN (''PRIORITY'', ''REST'') AND (g.GP_TYPE COLLATE utf8mb4_general_ci) = (? COLLATE utf8mb4_general_ci))
                OR ((? COLLATE utf8mb4_general_ci) = ''SAMRIDH'' AND (g.SAMRIDH COLLATE utf8mb4_general_ci) = ''Y'')
              )
        GROUP BY b.BBM_NAME, b.BBM_MOBILE, b.OA
        ORDER BY OPENED DESC, b.BBM_NAME ASC;
    ');

    SET @param_date = input_date;
    SET @param_opened_after1 = @opened_after;
    SET @param_opened_after2 = @opened_after;
    SET @filter1 = input_gp_filter;
    SET @filter2 = input_gp_filter;
    SET @filter3 = input_gp_filter;
    SET @filter4 = input_gp_filter;
    SET @filter5 = input_gp_filter;
    
    PREPARE stmt FROM @sql_query;
    EXECUTE stmt USING @param_date, @param_opened_after1,@param_opened_after2, @filter1, @filter2, @filter3, @filter4, @filter5;
    DEALLOCATE PREPARE stmt;
END$$

DELIMITER ;

DELIMITER $$

DROP PROCEDURE IF EXISTS GetBbmMonthlyBnuDisconnections$$

CREATE PROCEDURE GetBbmMonthlyBnuDisconnections(
    IN input_date VARCHAR(10),
    IN input_table VARCHAR(64),
    IN input_opened_after_date VARCHAR(10),
    IN input_gp_filter VARCHAR(20)
)
BEGIN
    -- Handle default baseline date if NULL or empty string is passed
    SET @opened_after = IF(input_opened_after_date IS NULL OR input_opened_after_date = '', '01-05-2025', input_opened_after_date);

    SET @sql_query = CONCAT('
        SELECT 
            b.BBM_NAME, 
            b.BBM_MOBILE, 
            b.OA,
            COUNT(f.CUSTOMER_ID) AS CLOSED,
            COALESCE(SUM((g.GP_TYPE COLLATE utf8mb4_general_ci) = ''PRIORITY''), 0) AS PRIORITY_COUNT,
            COALESCE(SUM((g.GP_TYPE COLLATE utf8mb4_general_ci) = ''REST''), 0) AS REST_COUNT,
            COALESCE(SUM((g.SAMRIDH COLLATE utf8mb4_general_ci) = ''Y''), 0) AS SAMRIDH_COUNT
        FROM bbm b
        LEFT JOIN olt o ON b.BBM_NAME = o.BBM_NAME
        LEFT JOIN ', input_table, ' f ON o.OLT_IP = f.OLT_IP
            AND f.DISCONNECTION_DATE IS NOT NULL
            AND (DATE_FORMAT(f.DISCONNECTION_DATE, ''%d-%m-%Y'') COLLATE utf8mb4_general_ci) 
                LIKE CONCAT(''%'', ?, ''%'') COLLATE utf8mb4_general_ci
            AND ((? COLLATE utf8mb4_general_ci) = ''ALL'' OR f.CONNECTION_DATE > STR_TO_DATE(?, ''%d-%m-%Y'')) 
        LEFT JOIN gp g ON (g.LGD_CODE COLLATE utf8mb4_0900_ai_ci) = 
            CASE 
                WHEN f.VILLAGE_NAME LIKE ''BH%'' OR f.VILLAGE_CODE LIKE ''BH%'' 
                    THEN TRIM(LEADING ''0'' FROM SUBSTRING(f.VILLAGE_CODE, 3))
                ELSE TRIM(LEADING ''0'' FROM f.GP_CODE)
            END
        WHERE b.ACTIVE = ''Y''
          AND (
                (? COLLATE utf8mb4_general_ci) = ''ALL''
                OR ((? COLLATE utf8mb4_general_ci) = ''ABP'' AND f.CONNECTION_DATE > STR_TO_DATE(''01-05-2025'', ''%d-%m-%Y''))
                OR ((? COLLATE utf8mb4_general_ci) IN (''PRIORITY'', ''REST'') AND (g.GP_TYPE COLLATE utf8mb4_general_ci) = (? COLLATE utf8mb4_general_ci))
                OR ((? COLLATE utf8mb4_general_ci) = ''SAMRIDH'' AND (g.SAMRIDH COLLATE utf8mb4_general_ci) = ''Y'')
              )
        GROUP BY b.BBM_NAME, b.BBM_MOBILE, b.OA
        ORDER BY CLOSED DESC, b.BBM_NAME ASC;
    ');

    SET @param_date = input_date;
    SET @param_opened_after1 = @opened_after;
    SET @param_opened_after2 = @opened_after;
    SET @filter1 = input_gp_filter;
    SET @filter2 = input_gp_filter;
    SET @filter3 = input_gp_filter;
    SET @filter4 = input_gp_filter;
    SET @filter5 = input_gp_filter;
    
    PREPARE stmt FROM @sql_query;
    EXECUTE stmt USING @param_date, @param_opened_after1,@param_opened_after2, @filter1, @filter2, @filter3, @filter4, @filter5;
    DEALLOCATE PREPARE stmt;
END$$

DELIMITER ;