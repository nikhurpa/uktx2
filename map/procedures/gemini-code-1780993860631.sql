-- =========================================================================
-- UKCFA TEST EXECUTION SUITE
-- USE: Copy/Paste individual lines into the SQL tab to run calculations.
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. GP Reports (All-time, Daily, Monthly, and Category-Filtered)
-- -------------------------------------------------------------------------
-- Total Monthly Connections opened in May 2026 across All Gram Panchayats
CALL GetGpMonthlyBnuConnections('05-2026', 'bnu_ftth_062026', 'ALL');

-- Disconnections during June 2026 for Priority Gram Panchayats only
CALL GetGpMonthlyBnuDisconnections('06-2026', 'bnu_ftth_062026', 'PRIORITY');

-- Disconnections for connections created AFTER the default baseline date (01-05-2025)
CALL GetGpMonthlyBnuDisconnectionsABP('06-2026', 'bnu_ftth_062026', 'ALL', NULL);


-- -------------------------------------------------------------------------
-- 2. BBM Base Performance Summary Metrics
-- -------------------------------------------------------------------------
-- Total Connections opened per BBM routing map for May 2026
CALL GetBbmMonthlyBnuConnections('05-2026', 'bnu_ftth_062026');

-- Total Disconnections captured on active routes during May 2026
CALL GetBbmMonthlyBnuDisconnections('05-2026', 'bnu_ftth_062026');


-- -------------------------------------------------------------------------
-- 3. BBM Granular Detailed Sub-Ledger Row Manifests
-- -------------------------------------------------------------------------
-- Full customer detail connection records under 'RAKESH KUMAR' for May 2026
CALL GetBbmMonthlyBnuConnectionList('RAKESH KUMAR', '05-2026', 'bnu_ftth_062026', 'ALL');

-- Disconnections on Samridh routes assigned to 'RAKESH KUMAR' for the entire year 2026
CALL GetBbmMonthlyBnuDisconnectionsList('RAKESH KUMAR', '2026', 'bnu_ftth_062026', 'SAMRIDH');


-- -------------------------------------------------------------------------
-- 4. Live Active Inventory Reports (`working_ftth_xxxx`)
-- -------------------------------------------------------------------------
-- Summary of all live active lines grouped by Operational Area (SSA) for May 2026
CALL GetSsaMonthlyFtthReport('05-2026', 'working_ftth_062026');

-- Summary of all active commercial operations grouped by Franchisee ID (Lifetime totals)
CALL GetFranchiseeMonthlyFtthReport('ALL', 'working_ftth_062026');


-- -------------------------------------------------------------------------
-- 5. Live Active Granular Row Export Manifests (Includes `f.*`)
-- -------------------------------------------------------------------------
-- Export full table row records for working accounts under 'Almora' operational zone
CALL GetSsaMonthlyFtthList('Almora', '05-2026', 'working_ftth_062026');

-- Export full table row records for lines managed under Franchisee ID 'F10234'
CALL GetFranchiseeMonthlyFtthList('F10234', 'ALL', 'working_ftth_062026');