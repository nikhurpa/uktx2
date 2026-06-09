DELIMITER $$

-- -------------------------------------------------------------------------
-- 1. SSA / OPERATIONAL AREA TRANSACTION REPORTS
-- -------------------------------------------------------------------------

DROP PROCEDURE IF EXISTS getSsaProvisioning$$
CREATE PROCEDURE getSsaProvisioning(IN input_date VARCHAR(10))
BEGIN
    SELECT 
        COALESCE(NULLIF(f.SSA, ''), o.OA) AS OA_SSA, 
        COUNT(*) AS PROVISIONED
    FROM ftth_provisioning f
    INNER JOIN olt o ON f.OLT_IP = o.OLT_IP
    WHERE (input_date = 'ALL' OR (DATE_FORMAT(f.DATED, '%d-%m-%Y') COLLATE utf8mb4_general_ci) LIKE CONCAT('%', input_date, '%') COLLATE utf8mb4_general_ci)
    GROUP BY OA_SSA ORDER BY PROVISIONED DESC;
END$$

DROP PROCEDURE IF EXISTS getSsaProvisioningList$$
CREATE PROCEDURE getSsaProvisioningList(IN input_date VARCHAR(10), IN input_ssa VARCHAR(50))
BEGIN
    SELECT f.*, COALESCE(NULLIF(f.SSA, ''), o.OA) AS COMPUTED_OA_SSA, g.GP_NAME AS MAPPED_GP_NAME
    FROM ftth_provisioning f
    INNER JOIN olt o ON f.OLT_IP = o.OLT_IP
    LEFT JOIN gp g ON g.LGD_CODE = CASE WHEN o.GP_NAME LIKE 'BH%' THEN TRIM(LEADING '0' FROM o.GP_NAME) ELSE NULL END
    WHERE COALESCE(NULLIF(f.SSA, ''), o.OA) = input_ssa
      AND (input_date = 'ALL' OR (DATE_FORMAT(f.DATED, '%d-%m-%Y') COLLATE utf8mb4_general_ci) LIKE CONCAT('%', input_date, '%') COLLATE utf8mb4_general_ci)
    ORDER BY f.DATED DESC;
END$$

DROP PROCEDURE IF EXISTS getSsaDisconnection$$
CREATE PROCEDURE getSsaDisconnection(IN input_date VARCHAR(10), IN input_sub_type VARCHAR(50))
BEGIN
    SELECT 
        COALESCE(NULLIF(f.SSA, ''), o.OA) AS OA_SSA, 
        COUNT(*) AS CLOSED
    FROM ftth_disconnection f
    INNER JOIN olt o ON f.OLT_IP = o.OLT_IP
    WHERE (input_date = 'ALL' OR (DATE_FORMAT(f.DATED, '%d-%m-%Y') COLLATE utf8mb4_general_ci) LIKE CONCAT('%', input_date, '%') COLLATE utf8mb4_general_ci)
      AND (input_sub_type = 'ALL' OR f.ORDER_SUB_TYPE COLLATE utf8mb4_general_ci = input_sub_type COLLATE utf8mb4_general_ci)
    GROUP BY OA_SSA ORDER BY CLOSED DESC;
END$$

DROP PROCEDURE IF EXISTS getSsaDisconnectionList$$
CREATE PROCEDURE getSsaDisconnectionList(IN input_date VARCHAR(10), IN input_ssa VARCHAR(50), IN input_sub_type VARCHAR(50))
BEGIN
    SELECT f.*, COALESCE(NULLIF(f.SSA, ''), o.OA) AS COMPUTED_OA_SSA, g.GP_NAME AS MAPPED_GP_NAME
    FROM ftth_disconnection f
    INNER JOIN olt o ON f.OLT_IP = o.OLT_IP
    LEFT JOIN gp g ON g.LGD_CODE = CASE WHEN o.GP_NAME LIKE 'BH%' THEN TRIM(LEADING '0' FROM o.GP_NAME) ELSE NULL END
    WHERE COALESCE(NULLIF(f.SSA, ''), o.OA) = input_ssa
      AND (input_date = 'ALL' OR (DATE_FORMAT(f.DATED, '%d-%m-%Y') COLLATE utf8mb4_general_ci) LIKE CONCAT('%', input_date, '%') COLLATE utf8mb4_general_ci)
      AND (input_sub_type = 'ALL' OR f.ORDER_SUB_TYPE COLLATE utf8mb4_general_ci = input_sub_type COLLATE utf8mb4_general_ci)
    ORDER BY f.DATED DESC;
END$$


-- -------------------------------------------------------------------------
-- 2. BBM AREA TRANSACTION REPORTS
-- -------------------------------------------------------------------------

DROP PROCEDURE IF EXISTS getBbmProvisioning$$
CREATE PROCEDURE getBbmProvisioning(IN input_date VARCHAR(10))
BEGIN
    SELECT b.BBM_NAME, b.BBM_MOBILE, b.OA, COUNT(*) AS PROVISIONED
    FROM bbm b
    INNER JOIN olt o ON b.BBM_NAME = o.BBM_NAME
    INNER JOIN ftth_provisioning f ON o.OLT_IP = f.OLT_IP
    WHERE b.ACTIVE = 'Y'
      AND (input_date = 'ALL' OR (DATE_FORMAT(f.DATED, '%d-%m-%Y') COLLATE utf8mb4_general_ci) LIKE CONCAT('%', input_date, '%') COLLATE utf8mb4_general_ci)
    GROUP BY b.BBM_NAME, b.BBM_MOBILE, b.OA ORDER BY PROVISIONED DESC, b.BBM_NAME ASC;
END$$

DROP PROCEDURE IF EXISTS getBbmProvisioningList$$
CREATE PROCEDURE getBbmProvisioningList(IN input_date VARCHAR(10), IN input_bbm VARCHAR(100))
BEGIN
    SELECT f.*, o.OA AS MAPPED_OA, g.GP_NAME AS MAPPED_GP_NAME
    FROM bbm b
    INNER JOIN olt o ON b.BBM_NAME = o.BBM_NAME
    INNER JOIN ftth_provisioning f ON o.OLT_IP = f.OLT_IP
    LEFT JOIN gp g ON g.LGD_CODE = CASE WHEN o.GP_NAME LIKE 'BH%' THEN TRIM(LEADING '0' FROM o.GP_NAME) ELSE NULL END
    WHERE b.BBM_NAME = input_bbm AND b.ACTIVE = 'Y'
      AND (input_date = 'ALL' OR (DATE_FORMAT(f.DATED, '%d-%m-%Y') COLLATE utf8mb4_general_ci) LIKE CONCAT('%', input_date, '%') COLLATE utf8mb4_general_ci)
    ORDER BY f.DATED DESC;
END$$

DROP PROCEDURE IF EXISTS getBbmDisconnection$$
CREATE PROCEDURE getBbmDisconnection(IN input_date VARCHAR(10), IN input_sub_type VARCHAR(50))
BEGIN
    SELECT b.BBM_NAME, b.BBM_MOBILE, b.OA, COUNT(*) AS CLOSED
    FROM bbm b
    INNER JOIN olt o ON b.BBM_NAME = o.BBM_NAME
    INNER JOIN ftth_disconnection f ON o.OLT_IP = f.OLT_IP
    WHERE b.ACTIVE = 'Y'
      AND (input_date = 'ALL' OR (DATE_FORMAT(f.DATED, '%d-%m-%Y') COLLATE utf8mb4_general_ci) LIKE CONCAT('%', input_date, '%') COLLATE utf8mb4_general_ci)
      AND (input_sub_type = 'ALL' OR f.ORDER_SUB_TYPE COLLATE utf8mb4_general_ci = input_sub_type COLLATE utf8mb4_general_ci)
    GROUP BY b.BBM_NAME, b.BBM_MOBILE, b.OA ORDER BY CLOSED DESC, b.BBM_NAME ASC;
END$$

DROP PROCEDURE IF EXISTS getBbmDisconnectionList$$
CREATE PROCEDURE getBbmDisconnectionList(IN input_date VARCHAR(10), IN input_bbm VARCHAR(100), IN input_sub_type VARCHAR(50))
BEGIN
    SELECT f.*, o.OA AS MAPPED_OA, g.GP_NAME AS MAPPED_GP_NAME
    FROM bbm b
    INNER JOIN olt o ON b.BBM_NAME = o.BBM_NAME
    INNER JOIN ftth_disconnection f ON o.OLT_IP = f.OLT_IP
    LEFT JOIN gp g ON g.LGD_CODE = CASE WHEN o.GP_NAME LIKE 'BH%' THEN TRIM(LEADING '0' FROM o.GP_NAME) ELSE NULL END
    WHERE b.BBM_NAME = input_bbm AND b.ACTIVE = 'Y'
      AND (input_date = 'ALL' OR (DATE_FORMAT(f.DATED, '%d-%m-%Y') COLLATE utf8mb4_general_ci) LIKE CONCAT('%', input_date, '%') COLLATE utf8mb4_general_ci)
      AND (input_sub_type = 'ALL' OR f.ORDER_SUB_TYPE COLLATE utf8mb4_general_ci = input_sub_type COLLATE utf8mb4_general_ci)
    ORDER BY f.DATED DESC;
END$$


-- -------------------------------------------------------------------------
-- 3. FRANCHISEE AREA TRANSACTION REPORTS
-- -------------------------------------------------------------------------

DROP PROCEDURE IF EXISTS getFranchiseeProvisioning$$
CREATE PROCEDURE getFranchiseeProvisioning(IN input_date VARCHAR(10))
BEGIN
    SELECT o.FRANCHISEE_ID, o.FRANCHISEE AS FRANCHISEE_NAME, COUNT(*) AS PROVISIONED
    FROM olt o
    INNER JOIN ftth_provisioning f ON o.OLT_IP = f.OLT_IP
    WHERE o.FRANCHISEE_ID IS NOT NULL AND o.FRANCHISEE_ID <> ''
      AND (input_date = 'ALL' OR (DATE_FORMAT(f.DATED, '%d-%m-%Y') COLLATE utf8mb4_general_ci) LIKE CONCAT('%', input_date, '%') COLLATE utf8mb4_general_ci)
    GROUP BY o.FRANCHISEE_ID, o.FRANCHISEE ORDER BY PROVISIONED DESC;
END$$

DROP PROCEDURE IF EXISTS getFranchiseeProvisioningList$$
CREATE PROCEDURE getFranchiseeProvisioningList(IN input_date VARCHAR(10), IN input_franchisee VARCHAR(50))
BEGIN
    SELECT f.*, o.FRANCHISEE AS MAPPED_FRANCHISEE_NAME, g.GP_NAME AS MAPPED_GP_NAME
    FROM olt o
    INNER JOIN ftth_provisioning f ON o.OLT_IP = f.OLT_IP
    LEFT JOIN gp g ON g.LGD_CODE = CASE WHEN o.GP_NAME LIKE 'BH%' THEN TRIM(LEADING '0' FROM o.GP_NAME) ELSE NULL END
    WHERE o.FRANCHISEE_ID = input_franchisee
      AND (input_date = 'ALL' OR (DATE_FORMAT(f.DATED, '%d-%m-%Y') COLLATE utf8mb4_general_ci) LIKE CONCAT('%', input_date, '%') COLLATE utf8mb4_general_ci)
    ORDER BY f.DATED DESC;
END$$

DROP PROCEDURE IF EXISTS getFranchiseeDisconnection$$
CREATE PROCEDURE getFranchiseeDisconnection(IN input_date VARCHAR(10), IN input_sub_type VARCHAR(50))
BEGIN
    SELECT o.FRANCHISEE_ID, o.FRANCHISEE AS FRANCHISEE_NAME, COUNT(*) AS CLOSED
    FROM olt o
    INNER JOIN ftth_disconnection f ON o.OLT_IP = f.OLT_IP
    WHERE o.FRANCHISEE_ID IS NOT NULL AND o.FRANCHISEE_ID <> ''
      AND (input_date = 'ALL' OR (DATE_FORMAT(f.DATED, '%d-%m-%Y') COLLATE utf8mb4_general_ci) LIKE CONCAT('%', input_date, '%') COLLATE utf8mb4_general_ci)
      AND (input_sub_type = 'ALL' OR f.ORDER_SUB_TYPE COLLATE utf8mb4_general_ci = input_sub_type COLLATE utf8mb4_general_ci)
    GROUP BY o.FRANCHISEE_ID, o.FRANCHISEE ORDER BY CLOSED DESC;
END$$

DROP PROCEDURE IF EXISTS getFranchiseeDisconnectionList$$
CREATE PROCEDURE getFranchiseeDisconnectionList(IN input_date VARCHAR(10), IN input_franchisee VARCHAR(50), IN input_sub_type VARCHAR(50))
BEGIN
    SELECT f.*, o.FRANCHISEE AS MAPPED_FRANCHISEE_NAME, g.GP_NAME AS MAPPED_GP_NAME
    FROM olt o
    INNER JOIN ftth_disconnection f ON o.OLT_IP = f.OLT_IP
    LEFT JOIN gp g ON g.LGD_CODE = CASE WHEN o.GP_NAME LIKE 'BH%' THEN TRIM(LEADING '0' FROM o.GP_NAME) ELSE NULL END
    WHERE o.FRANCHISEE_ID = input_franchisee
      AND (input_date = 'ALL' OR (DATE_FORMAT(f.DATED, '%d-%m-%Y') COLLATE utf8mb4_general_ci) LIKE CONCAT('%', input_date, '%') COLLATE utf8mb4_general_ci)
      AND (input_sub_type = 'ALL' OR f.ORDER_SUB_TYPE COLLATE utf8mb4_general_ci = input_sub_type COLLATE utf8mb4_general_ci)
    ORDER BY f.DATED DESC;
END$$

DELIMITER ;