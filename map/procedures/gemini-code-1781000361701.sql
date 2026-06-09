-- =========================================================================
-- RUN TEMPLATES FOR CRM PROVISIONING & DISCONNECTION MANAGEMENT
-- =========================================================================

-- -------------------------------------------------------------------------
-- SSA Operational Area Audits
-- -------------------------------------------------------------------------
-- Summary of all orders provisioned during May 2026
CALL getSsaProvisioning('05-2026');

-- Detailed listing of all provisioning entries for 'Almora' SSA during May 2026
CALL getSsaProvisioningList('05-2026', 'Almora');

-- Disconnections during May 2026 specifically due to 'Disconnect Due to NP'
CALL getSsaDisconnection('05-2026', 'Disconnect Due to NP');

-- Complete historical listing of all standard disconnections for 'Almora' SSA
CALL getSsaDisconnectionList('ALL', 'Almora', 'Disconnect');


-- -------------------------------------------------------------------------
-- BBM Regional Audit Tracking
-- -------------------------------------------------------------------------
-- All-time global provisioning count assigned to active BBM maps
CALL getBbmProvisioning('ALL');

-- Deep data export manifest for orders provisioned under 'RAKESH KUMAR' for June 2026
CALL getBbmProvisioningList('06-2026', 'RAKESH KUMAR');

-- Total number of disconnections in 2026 due to NP under BBM routes
CALL getBbmDisconnection('2026', 'Disconnect Due to NP');

-- Granular disconnection log lines under 'RAKESH KUMAR' for May 2026 (All sub-types compiled)
CALL getBbmDisconnectionList('05-2026', 'RAKESH KUMAR', 'ALL');


-- -------------------------------------------------------------------------
-- Franchisee Commercial Channel Tracks
-- -------------------------------------------------------------------------
-- Total provisions across all Franchisees during June 2026
CALL getFranchiseeProvisioning('06-2026');

-- Granular details of provisioning for Franchisee ID 'F10045' across all time
CALL getFranchiseeProvisioningList('ALL', 'F10045');

-- Total accounts closed through Franchisees in May 2026 via standard 'Disconnect' orders
CALL getFranchiseeDisconnection('05-2026', 'Disconnect');

-- Full details of closed accounts under Franchisee 'F10045' for a single target day
CALL getFranchiseeDisconnectionList('15-05-2026', 'F10045', 'Disconnect Due to NP');