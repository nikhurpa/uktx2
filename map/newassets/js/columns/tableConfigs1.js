// ─── Geographic reference data ────────────────────────────────────────────────

var OA = {
    Almora:    { BA: "NTL", name: "Almora",    code: "ALM", lat: 29.5949, lng: 79.6562, Districts: ["Almora","Bageshwar","Pithoragarh","Champawat"] },
    Dehradun:  { BA: "DDN", name: "Dehradun",  code: "DDN", lat: 30.3165, lng: 78.0322, Districts: ["Dehradun"] },
    Haridwar:  { BA: "HRD", name: "Haridwar",  code: "HRD", lat: 29.9457, lng: 78.1642, Districts: ["Haridwar"] },
    Nainital:  { BA: "NTL", name: "Nainital",  code: "NTL", lat: 29.3919, lng: 79.4542, Districts: ["Nainital","Udham Singh Nagar"] },
    Srinagar:  { BA: "HWR", name: "Srinagar",  code: "SGR", lat: 30.2215, lng: 78.7804, Districts: ["Pauri Garhwal","Chamoli","Rudraprayag"] },
    "New Tehri":{ BA: "DDN", name: "New Tehri", code: "NWT", lat: 29.3919, lng: 79.4542, Districts: ["Tehri Garhwal","Uttarkashi"] },
};

var BLOCKS = {
    "Dehradun":        ["Raipur","Doiwala","Sahaspur","Vikas Nagar","Kalsi","Chakrata"],
    "Tehri Garhwal":   ["Narendra Nagar","CHAMBA","THAULDHAR","Bhilangana","JAUNPUR","PRATAPNAGAR","JAKHNIDHAR","KIRTINAGAR","DEVPRAYAG"],
    "Uttarkashi":      ["BHATWARI","DUNDA","CHINIYALISAUR","NAUGAON","PUROLA","MORI"],
    "Nainital":        ["Haldwani","Kotabag","Ramnagar","Bhimtal","Dhari","Betalghat","Okhalkanda","Ramgarh"],
    "Udham Singh Nagar":["Rudrapur","Bazpur","Gadarpur","Kashipur","Khatima","Sitarganj","Jaspur"],
    "Almora":          ["Takula","Hawalbag","Bhaisiyachhana","Lamgara","Tarikhet","Bhikiyasen","Chaukhatiya (Ganai)","Dhauladevi","Dwarahat","Sult (Shashikhal)","Syalde"],
    "Bageshwar":       ["Bageshwar","Kapkote","Garur"],
    "Champawat":       ["Champawat","Pati","Lohagaht","Barakot"],
    "Pithoragarh":     ["Munakot","Bin (Pithiragarh)","Kanalichhina","Didihat (Askot)","Gangolihat","Berinag","Munsyari","Dharchula"],
    "Haridwar":        ["BAHADRABAD","BHAGWANPUR","KHANPUR","LAKSAR","NARSAN","ROORKEE"],
    "Pauri Garhwal":   ["BIRONKHAL","DUGGADA","DWARIKHAL","EKESHWAR","KALJIKHAL","KHIRSU","KOT","NAINIDANDA","PABAU","PAURI","POKHRA","RIKHNIKHAL","THALISAIN","YAMKESHWAR","ZAHRIKHAL"],
    "Chamoli":         ["DASHOLI","DEWAL","GAIRSAIN","GHAT","JOSHIMATH","KARNAPRAYAG","NARAYANBAGAR","POKHARI","THARALI"],
    "Rudraprayag":     ["AUGUSTMUNI","JAKHOLI","UKHIMATH"],
};

const OA_OPTIONS = Object.values(OA).map(item => ({ value: item.code, label: item.name }));
const OA_CODES   = Object.values(OA).map(item => item.code);
const OA_NAMES   = Object.values(OA).map(item => item.name);

// ─── Shared column factory helpers ────────────────────────────────────────────

/**
 * Returns the three linked OA → DISTRICT → BLOCK column definitions.
 * Used by any table that has all three fields (block, bts, gp, olt, phc, sas, sch, fth).
 * Pass { hasOA: bool } — some tables (phc, sas, sch) have DISTRICT+BLOCK but no OA column.
 */
function makeGeoColumns({ hasOA = true } = {}) {
    const cols = [];

    if (hasOA) {
        cols.push({
            text: 'OA', datafield: 'OA', width: 120,
            columntype: 'dropdownlist',
            options: OA_NAMES,
            init: function (component) {
                component.jqxDropDownList({ source: OA_NAMES, width: "100%", autoDropDownHeight: true });
                component.jqxDropDownList('selectIndex', 0);
                component.on('change', function (event) {
                    const oa = event.args.item.value;
                    const districts = OA[oa]?.Districts || [];
                    const districtComp = $("#formContainer").jqxForm('getComponentByName', 'DISTRICT');
                    districtComp.jqxDropDownList({ source: districts });
                    districtComp.jqxDropDownList('clearSelection');
                });
            },
            createeditor: function (row, value, editor) {
                editor.jqxDropDownList({ source: OA_NAMES, width: "100%", autoDropDownHeight: true });
            },
            cellvaluechanging: function (row, datafield, columntype, oldvalue, newvalue) {
                if (newvalue !== oldvalue) {
                    $("#grid").jqxGrid('setcellvalue', row, "DISTRICT", "Select a District...");
                }
            }
        });
    }

    cols.push({
        text: 'DISTRICT', datafield: 'DISTRICT', width: 120,
        columntype: 'dropdownlist',
        options: [],
        init: function (component) {
            const defaultDistricts = OA["Almora"].Districts;
            component.jqxDropDownList({ source: defaultDistricts, width: "100%", autoDropDownHeight: true });
            component.jqxDropDownList('selectIndex', 0);
            component.on('change', function (event) {
                const district = event.args.item.value;
                const blocks = BLOCKS[district] || [];
                const blockComp = $("#formContainer").jqxForm('getComponentByName', 'BLOCK');
                blockComp.jqxDropDownList({ source: blocks });
                blockComp.jqxDropDownList('clearSelection');
            });
        },
        createeditor: function (row, value, editor) {
            const selectedOA = hasOA ? $("#grid").jqxGrid('getcellvalue', row, "OA") : null;
            const districts = (selectedOA && OA[selectedOA]) ? OA[selectedOA].Districts : Object.keys(BLOCKS);
            editor.jqxDropDownList({ source: districts, autoDropDownHeight: true });
        },
        cellvaluechanging: function (row, datafield, columntype, oldvalue, newvalue) {
            if (newvalue !== oldvalue) {
                $("#grid").jqxGrid('setcellvalue', row, "BLOCK", "Select a Block...");
            }
        },
        initeditor: function (row, cellvalue, editor) {
            const selectedOA = hasOA ? $('#grid').jqxGrid('getcellvalue', row, "OA") : null;
            const districts = (selectedOA && OA[selectedOA]) ? OA[selectedOA].Districts : Object.keys(BLOCKS);
            const district = editor.val();
            editor.jqxDropDownList({ autoDropDownHeight: true, source: districts });
            if (district && district !== "Select a District...") {
                editor.jqxDropDownList('selectIndex', districts.indexOf(district));
            }
        }
    });

    cols.push({
        text: 'BLOCK', datafield: 'BLOCK', width: 120,
        columntype: 'dropdownlist',
        options: BLOCKS["Almora"],
        init: function (component) {
            component.jqxDropDownList({ source: BLOCKS["Almora"], width: "100%", autoDropDownHeight: true });
            component.jqxDropDownList('selectIndex', 0);
        },
        createeditor: function (row, value, editor) {
            const selectedDistrict = $("#grid").jqxGrid('getcellvalue', row, "DISTRICT");
            editor.jqxDropDownList({ source: BLOCKS[selectedDistrict] || [], autoDropDownHeight: true });
        },
        initeditor: function (row, cellvalue, editor) {
            const selectedDistrict = $('#grid').jqxGrid('getcellvalue', row, "DISTRICT");
            const blocks = BLOCKS[selectedDistrict] || [];
            const block = editor.val();
            editor.jqxDropDownList({ autoDropDownHeight: true, source: blocks });
            if (block && block !== "Select a Block...") {
                editor.jqxDropDownList('selectIndex', blocks.indexOf(block));
            }
        }
    });

    return cols;
}

/** Simple dropdown column */
function dropdownCol(text, datafield, source, width = 120) {
    return {
        text, datafield, width,
        columntype: 'dropdownlist',
        options: source,
        createeditor: function (row, value, editor) {
            editor.jqxDropDownList({ source, autoDropDownHeight: true });
        }
    };
}

/** Lat validation column (India: 6–38) */
function latCol(datafield = 'LAT', width = 100) {
    return {
        text: datafield, datafield, width,
        columntype: 'numberinput',
        validation: function (cell, value) {
            if (value && (value < 6 || value > 38)) return { result: false, message: "Invalid India Latitude (6–38)" };
            return true;
        }
    };
}

/** Lng validation column (India: 68–98) */
function lngCol(datafield = 'LNG', width = 100) {
    return {
        text: datafield, datafield, width,
        columntype: 'numberinput',
        validation: function (cell, value) {
            if (value && (value < 68 || value > 98)) return { result: false, message: "Invalid India Longitude (68–98)" };
            return true;
        }
    };
}

/** Plain text column shorthand */
function col(text, datafield, width = 120, extra = {}) {
    return { text, datafield, width, ...extra };
}

// ─── TABLE_CONFIGS ─────────────────────────────────────────────────────────────

TABLE_CONFIGS = {

    // ── block ──────────────────────────────────────────────────────────────────
    block: {
        table: "block",
        primaryKey: "ID",
        columns: [
            col('ID',          'ID',          80,  { columntype: 'numberinput', editable: false }),
            ...makeGeoColumns({ hasOA: true }),
            col('CODE',        'CODE',         120, { required: true }),
            col('TE_NAME',     'TE_NAME',      140, { required: true }),
            col('LAT_LNG',     'LAT_LNG',      140, { required: true }),
            col('ENTITY_CODE', 'ENTITY_CODE',  120, { required: true }),
            { ...latCol('LAT'), required: true },
            { ...lngCol('LNG'), required: true },
            col('RENTED',      'RENTED',       100, { required: true }),
            dropdownCol('BHQ_STATUS', 'BHQ_STATUS', ["Active","Inactive"]),
            col('PHASE',       'PHASE',        120, { columntype: 'datetimeinput', required: true }),
            col('BACKHAUL',    'BACKHAUL',     120, { required: true }),
            col('RING',        'RING',         100, { columntype: 'checkbox', required: true }),
            col('INFRA',       'INFRA',        120, { required: true }),
        ]
    },

    // ── bts ────────────────────────────────────────────────────────────────────
    // Columns: TS_SITE_ID(PK), LSA, OA, DISTRICT, BLOCK, TOWN_VILLAGE,
    //          SITE_CATEGORY, SITE_TYPE, TSP_SITE_ID, TSP_SITE_NAME,
    //          IP_NAME, IP_SITE_ID, IP_SITE_NAME, LAT, LAT_LONG, LNG,
    //          TOWER_HEIGHT, BUILDING_HEIGHT, PINCODE, FULL_SITE_ADDRESS,
    //          STATUS, MEDIA, TYPE
    bts: {
        table: "bts",
        primaryKey: "TS_SITE_ID",
        columns: [
            col('TS_SITE_ID',        'TS_SITE_ID',        150, { editable: false }),
            col('LSA',               'LSA',               100),
            ...makeGeoColumns({ hasOA: true }),
            col('TOWN_VILLAGE',      'TOWN_VILLAGE',      140),
            col('SITE_CATEGORY',     'SITE_CATEGORY',     130),
            col('SITE_TYPE',         'SITE_TYPE',         120),
            col('TSP_SITE_ID',       'TSP_SITE_ID',       130),
            col('TSP_SITE_NAME',     'TSP_SITE_NAME',     150),
            col('IP_NAME',           'IP_NAME',           130),
            col('IP_SITE_ID',        'IP_SITE_ID',        130),
            col('IP_SITE_NAME',      'IP_SITE_NAME',      150),
            latCol('LAT'),
            col('LAT_LONG',          'LAT_LONG',          120),
            lngCol('LNG'),
            col('TOWER_HEIGHT',      'TOWER_HEIGHT',      120, { columntype: 'numberinput' }),
            col('BUILDING_HEIGHT',   'BUILDING_HEIGHT',   130, { columntype: 'numberinput' }),
            col('PINCODE',           'PINCODE',           100, { columntype: 'numberinput' }),
            col('FULL_SITE_ADDRESS', 'FULL_SITE_ADDRESS', 200),
            dropdownCol('STATUS', 'STATUS', ["Active","Inactive","Planned","Under Construction"]),
            dropdownCol('MEDIA',  'MEDIA',  ["Fibre","Microwave","Satellite","Other"]),
            dropdownCol('TYPE',   'TYPE',   ["Ground","Rooftop","Wall Mount","Pole"]),
        ]
    },

    // ── fth ────────────────────────────────────────────────────────────────────
    // Columns: NUMBER, OLT_IP, ONT_MAC_ID, BNU_NAME, BNU_MOBILE, BNU_CODE,
    //          BNU_TYPE, PAN_NUMBER, STATE, DISTRICT, BLOCK, GP_NAME, GP_CODE,
    //          VILLAGE_NAME, VILLAGE_CODE, CONNECTION_DATE, CUSTOMER_ID(PK),
    //          USER_TYPE, CUSTOMER_INSTITUTION_NAME, CONTACT_NO, ADDRESS,
    //          GENDER, LAT, LNG, BB_TARIFF_ID, TARIFF_PLAN, BANDWIDTH_PROVIDED,
    //          CATEGORY, IMPLEMENTATION_AGENCY, CURRENT_STATUS
    fth: {
        table: "fth",
        primaryKey: "CUSTOMER_ID",
        columns: [
            col('CUSTOMER_ID',               'CUSTOMER_ID',               160, { editable: false }),
            col('NUMBER',                    'NUMBER',                    120),
            col('OLT_IP',                    'OLT_IP',                    130),
            col('ONT_MAC_ID',                'ONT_MAC_ID',                150),
            col('BNU_NAME',                  'BNU_NAME',                  150),
            col('BNU_MOBILE',                'BNU_MOBILE',                120),
            col('BNU_CODE',                  'BNU_CODE',                  120),
            col('BNU_TYPE',                  'BNU_TYPE',                  120),
            col('PAN_NUMBER',                'PAN_NUMBER',                120),
            col('STATE',                     'STATE',                     120),
            ...makeGeoColumns({ hasOA: false }),   // fth has DISTRICT+BLOCK, no OA col
            col('GP_NAME',                   'GP_NAME',                   140),
            col('GP_CODE',                   'GP_CODE',                   100),
            col('VILLAGE_NAME',              'VILLAGE_NAME',              140),
            col('VILLAGE_CODE',              'VILLAGE_CODE',              120),
            col('CONNECTION_DATE',           'CONNECTION_DATE',           130, { columntype: 'datetimeinput' }),
            col('USER_TYPE',                 'USER_TYPE',                 130),
            col('CUSTOMER_INSTITUTION_NAME', 'CUSTOMER_INSTITUTION_NAME', 200),
            col('CONTACT_NO',                'CONTACT_NO',                120),
            col('ADDRESS',                   'ADDRESS',                   200),
            dropdownCol('GENDER', 'GENDER', ["Male","Female","Other"]),
            latCol('LAT'),
            lngCol('LNG'),
            col('BB_TARIFF_ID',              'BB_TARIFF_ID',              120),
            col('TARIFF_PLAN',               'TARIFF_PLAN',               150),
            col('BANDWIDTH_PROVIDED',        'BANDWIDTH_PROVIDED',        150),
            col('CATEGORY',                  'CATEGORY',                  120),
            col('IMPLEMENTATION_AGENCY',     'IMPLEMENTATION_AGENCY',     160),
            dropdownCol('CURRENT_STATUS', 'CURRENT_STATUS', ["Active","Inactive","Suspended","Terminated"]),
        ]
    },

    // ── gp ─────────────────────────────────────────────────────────────────────
    // Columns: STATE, DISTRICT, BLOCK, OA, BLOCK_LGD_CODE, GP_NAME,
    //          LGD_CODE(PK/unique), LAT, LNG, PHASE, VIL, HH, POP,
    //          INT_DATE, STATUS, AVL, COV, FFTH_NUM, TOTAL_FTTH, OLT, BNU
    gp: {
        table: "gp",
        primaryKey: "LGD_CODE",
        columns: [
            col('LGD_CODE',       'LGD_CODE',       120, { editable: false }),
            col('STATE',          'STATE',           120),
            ...makeGeoColumns({ hasOA: true }),
            col('BLOCK_LGD_CODE', 'BLOCK_LGD_CODE', 130),
            col('GP_NAME',        'GP_NAME',         160),
            latCol('LAT'),
            lngCol('LNG'),
            col('PHASE',          'PHASE',           100),
            col('VIL',            'VIL',             80,  { columntype: 'numberinput' }),
            col('HH',             'HH',              80,  { columntype: 'numberinput' }),
            col('POP',            'POP',             80,  { columntype: 'numberinput' }),
            col('INT_DATE',       'INT_DATE',        130, { columntype: 'datetimeinput' }),
            dropdownCol('STATUS',     'STATUS',     ["Active","Inactive","Planned"]),
            dropdownCol('AVL',        'AVL',        ["Y","N"]),
            dropdownCol('COV',        'COV',        ["Y","N"]),
            col('FFTH_NUM',       'FFTH_NUM',        120, { columntype: 'numberinput' }),
            col('TOTAL_FTTH',     'TOTAL_FTTH',      120, { columntype: 'numberinput' }),
            col('OLT',            'OLT',             120),
            col('BNU',            'BNU',             120),
        ]
    },

    // ── ofc ────────────────────────────────────────────────────────────────────
    // Columns: ID, OA, KMZ_FILENAME, NAME, OWNER, GOOGLE_ENCODED_POLYLINE,
    //          COORDINATES_COUNT, START_LAT, START_LNG, END_LAT, END_LNG,
    //          BOUNDING_BOX, CREATED_AT, UPDATED_AT, STATUS
    ofc: {
        table: "ofc",
        primaryKey: "ID",
        columns: [
            col('ID',                     'ID',                     80,  { columntype: 'numberinput', editable: false }),
            dropdownCol('OA', 'OA', OA_NAMES),
            col('KMZ_FILENAME',           'KMZ_FILENAME',           200),
            col('NAME',                   'NAME',                   160),
            col('OWNER',                  'OWNER',                  140),
            col('GOOGLE_ENCODED_POLYLINE','GOOGLE_ENCODED_POLYLINE',200),
            col('COORDINATES_COUNT',      'COORDINATES_COUNT',      150, { columntype: 'numberinput' }),
            {
                // START_LAT — generic decimal, no strict India range enforced on polyline endpoints
                text: 'START_LAT', datafield: 'START_LAT', width: 110,
                columntype: 'numberinput'
            },
            col('START_LNG',              'START_LNG',              110, { columntype: 'numberinput' }),
            col('END_LAT',                'END_LAT',                110, { columntype: 'numberinput' }),
            col('END_LNG',                'END_LNG',                110, { columntype: 'numberinput' }),
            col('BOUNDING_BOX',           'BOUNDING_BOX',           160),
            col('CREATED_AT',             'CREATED_AT',             150, { columntype: 'datetimeinput', editable: false }),
            col('UPDATED_AT',             'UPDATED_AT',             150, { columntype: 'datetimeinput', editable: false }),
            dropdownCol('STATUS', 'STATUS', ["Active","Inactive","Planned"]),
        ]
    },

    // ── olt ────────────────────────────────────────────────────────────────────
    // Columns: LOCATION, OLT_IP(PK), TYPE, OA, SDCA, DISTRICT, BLOCK,
    //          WKG_CONN, PORTS, VENDOR, MAKE, LOCATION_TYPE, BSNLEXCH_NAME,
    //          POWER_BACKUP, BACKUP_DURATION, MEDIA_SITE, CONNECTIVITY,
    //          BBC, BBC_MOBILE, BBC_DESIGNATION, LAT, LOCATION_LATLONG, LNG,
    //          URBAN_RURAL, BNU_OLTE_YN, MAAN_MIGRATED, MANN_NODE,
    //          IN_DATE, BNG_IP, AVL, REBOOT, STATUS
    olt: {
        table: "olt",
        primaryKey: "OLT_IP",
        columns: [
            col('OLT_IP',            'OLT_IP',            150, { editable: false }),
            col('LOCATION',          'LOCATION',          160),
            dropdownCol('TYPE',      'TYPE',      ["Indoor","Outdoor","Integrated"]),
            ...makeGeoColumns({ hasOA: true }),
            col('SDCA',              'SDCA',              120),
            col('WKG_CONN',          'WKG_CONN',          110, { columntype: 'numberinput' }),
            col('PORTS',             'PORTS',             80,  { columntype: 'numberinput' }),
            col('VENDOR',            'VENDOR',            120),
            col('MAKE',              'MAKE',              120),
            col('LOCATION_TYPE',     'LOCATION_TYPE',     130),
            col('BSNLEXCH_NAME',     'BSNLEXCH_NAME',     150),
            dropdownCol('POWER_BACKUP',  'POWER_BACKUP',  ["Yes","No"]),
            col('BACKUP_DURATION',   'BACKUP_DURATION',   130),
            col('MEDIA_SITE',        'MEDIA_SITE',        120),
            col('CONNECTIVITY',      'CONNECTIVITY',      130),
            col('BBC',               'BBC',               120),
            col('BBC_MOBILE',        'BBC_MOBILE',        120, { columntype: 'numberinput' }),
            col('BBC_DESIGNATION',   'BBC_DESIGNATION',   140, { columntype: 'numberinput' }),
            latCol('LAT'),
            col('LOCATION_LATLONG',  'LOCATION_LATLONG',  140),
            lngCol('LNG'),
            dropdownCol('URBAN_RURAL',  'URBAN_RURAL',  ["Urban","Rural","Semi-Urban"]),
            dropdownCol('BNU_OLTE_YN',  'BNU_OLTE_YN',  ["Y","N"]),
            dropdownCol('MAAN_MIGRATED','MAAN_MIGRATED', ["Y","N"]),
            col('MANN_NODE',         'MANN_NODE',         120),
            col('IN_DATE',           'IN_DATE',           140, { columntype: 'datetimeinput' }),
            col('BNG_IP',            'BNG_IP',            130),
            col('AVL',               'AVL',               80,  { columntype: 'numberinput' }),
            col('REBOOT',            'REBOOT',            80,  { columntype: 'numberinput' }),
            dropdownCol('STATUS', 'STATUS', ["Active","Inactive","Planned","Under Maintenance"]),
        ]
    },

    // ── phc ────────────────────────────────────────────────────────────────────
    // Columns: DISTRICT, BLOCK, GP, GP_LGD_CODE, VILLAGE, VILLAGE_LGD_CODE,
    //          PHC_ADDRESS, LAT, LNG, CONTACT_PERSON, CONTACT_PERSON_NUMBER,
    //          AVAILABILITY_OF_ICT_INFRASTRUCTURE, FTTH_AVAILABILITY_YES_NO_,
    //          DETAILS_OF_DIGITAL_SERVICES_USED_BY_PHC, REMARK,
    //          CATEGORY, PHASE, FES, STATUS
    phc: {
        table: "phc",
        primaryKey: null,   // no single PK in schema
        columns: [
            ...makeGeoColumns({ hasOA: false }),  // phc has DISTRICT+BLOCK only
            col('GP',                                    'GP',                                    160),
            col('GP_LGD_CODE',                           'GP_LGD_CODE',                           120),
            col('VILLAGE',                               'VILLAGE',                               140),
            col('VILLAGE_LGD_CODE',                      'VILLAGE_LGD_CODE',                      140),
            col('PHC_ADDRESS',                           'PHC_ADDRESS',                           200),
            latCol('LAT'),
            lngCol('LNG'),
            col('CONTACT_PERSON',                        'CONTACT_PERSON',                        150),
            col('CONTACT_PERSON_NUMBER',                 'CONTACT_PERSON_NUMBER',                 160),
            dropdownCol('AVAILABILITY_OF_ICT_INFRASTRUCTURE', 'AVAILABILITY_OF_ICT_INFRASTRUCTURE', ["Y","N"], 200),
            dropdownCol('FTTH_AVAILABILITY_YES_NO_',     'FTTH_AVAILABILITY_YES_NO_',              ["Y","N"], 160),
            col('DETAILS_OF_DIGITAL_SERVICES_USED_BY_PHC','DETAILS_OF_DIGITAL_SERVICES_USED_BY_PHC', 240),
            col('REMARK',                                'REMARK',                                150),
            dropdownCol('CATEGORY', 'CATEGORY', ["PHC","CHC","DH","SC","Other"], 120),
            col('PHASE',                                 'PHASE',                                 100),
            dropdownCol('FES',    'FES',    ["Y","N"], 80),
            dropdownCol('STATUS', 'STATUS', ["Active","Inactive","Planned"], 100),
        ]
    },

    // ── sas ────────────────────────────────────────────────────────────────────
    // Columns: DISTRICT, BLOCK, GP, SSA, PHONE_NO, LAT, LONG, OLTE_IP,
    //          CUSTOMER_NAME, INSTALL_DATE, BBM, + monthly usage cols (2025-02 to 2026-03)
    sas: {
        table: "sas",
        primaryKey: null,
        columns: [
            ...makeGeoColumns({ hasOA: false }),
            col('GP',            'GP',            160),
            col('SSA',           'SSA',           100),
            col('PHONE_NO',      'PHONE_NO',      120),
            latCol('LAT'),
            col('LNG',          'LNG',          100, { columntype: 'numberinput' }),   // note: schema uses LONG not LNG
            col('OLTE_IP',       'OLTE_IP',       130),
            col('CUSTOMER_NAME', 'CUSTOMER_NAME', 160),
            col('INSTALL_DATE',  'INSTALL_DATE',  130, { columntype: 'datetimeinput' }),
            col('BBM',           'BBM',           120),
            // Monthly usage columns
            col('Feb-25',  '2025_02_01_00_00_00', 90),
            col('Mar-25',  '2025_03_01_00_00_00', 90),
            col('Apr-25',  '2025_04_01_00_00_00', 90),
            col('May-25',  '2025_05_01_00_00_00', 90),
            col('Jun-25',  '2025_06_01_00_00_00', 90),
            col('Jul-25',  '2025_07_01_00_00_00', 90),
            col('Aug-25',  '2025_08_01_00_00_00', 90),
            col('Sep-25',  '2025_09_01_00_00_00', 90),
            col('Oct-25',  '2025_10_01_00_00_00', 90),
            col('Nov-25',  '2025_11_01_00_00_00', 90),
            col('Dec-25',  '2025_12_01_00_00_00', 90),
            col('Jan-26',  '2026_01_01_00_00_00', 90),
            col('Feb-26',  '2026_02_01_00_00_00', 90),
            col('Mar-26',  '2026_03_01_00_00_00', 90),
        ]
    },

    // ── sch ────────────────────────────────────────────────────────────────────
    // Columns: SLNO, CUSTOMER_NAME, CUSTOMER_ADDRESS, ID, LAT, LNG, SSA,
    //          DISTRICT, BLOCK, GP, VILLAGE, BBM, DIST_BAND, DISTANCEFROM_OLT,
    //          RURAL_URBAN, PROV, PHONE_NO, BNU_AVLBL, NW_AVLBL, GP_CODE,
    //          PHASE, FES, STATUS
    sch: {
        table: "sch",
        primaryKey: "ID",
        columns: [
            col('ID',               'ID',               80,  { editable: false }),
            col('SLNO',             'SLNO',             80),
            col('CUSTOMER_NAME',    'CUSTOMER_NAME',    160),
            col('CUSTOMER_ADDRESS', 'CUSTOMER_ADDRESS', 200),
            latCol('LAT'),
            lngCol('LNG'),
            col('SSA',              'SSA',              80),
            ...makeGeoColumns({ hasOA: false }),
            col('GP',               'GP',               160),
            col('VILLAGE',          'VILLAGE',          140),
            col('BBM',              'BBM',              120),
            col('DIST_BAND',        'DIST_BAND',        100),
            col('DISTANCEFROM_OLT', 'DISTANCEFROM_OLT', 140, { columntype: 'numberinput' }),
            dropdownCol('RURAL_URBAN', 'RURAL_URBAN', ["Rural","Urban","Semi-Urban"]),
            dropdownCol('PROV',        'PROV',        ["Y","N"]),
            col('PHONE_NO',         'PHONE_NO',         120),
            dropdownCol('BNU_AVLBL', 'BNU_AVLBL', ["Y","N"]),
            dropdownCol('NW_AVLBL',  'NW_AVLBL',  ["Y","N"]),
            col('GP_CODE',          'GP_CODE',          100),
            col('PHASE',            'PHASE',            100),
            dropdownCol('FES',    'FES',    ["Y","N"], 80),
            dropdownCol('STATUS', 'STATUS', ["Active","Inactive","Planned","Provisioned"], 120),
        ]
    },

    // ── user ───────────────────────────────────────────────────────────────────
    // Columns: USERNAME(PK), DESIGNATION, ROLE, SSA, BLOCKS, DISTRICT,
    //          PASSWORD, TYPE, ORG, STATUS, CREATED, UPDATED
    user: {
        table: "user",
        primaryKey: "USERNAME",
        columns: [
            col('USERNAME',    'USERNAME',    140, { editable: false }),
            col('DESIGNATION', 'DESIGNATION', 160),
            dropdownCol('ROLE', 'ROLE', ["Admin","Viewer","Editor","Operator"]),
            col('SSA',         'SSA',         100),
            col('BLOCKS',      'BLOCKS',      200),   // comma-separated block list
            col('DISTRICT',    'DISTRICT',    140),
            col('PASSWORD',    'PASSWORD',    140),   // hash — treat as plain text col
            dropdownCol('TYPE',   'TYPE',   ["Internal","External","Contractor"]),
            col('ORG',         'ORG',         160),
            dropdownCol('STATUS', 'STATUS', ["Active","Inactive","Suspended"]),
            col('CREATED',     'CREATED',     150, { columntype: 'datetimeinput', editable: false }),
            col('UPDATED',     'UPDATED',     150, { columntype: 'datetimeinput', editable: false }),
        ]
    },

    // ── vil ────────────────────────────────────────────────────────────────────
    // Columns: DISTRICT_CODE, DISTRICT, SUBDISTRICT_CODE, SUBDISTRICT_NAME,
    //          VILLAGE_CODE(PK candidate), VILLAGE_NAME, LOCAL_BODY_CODE,
    //          LOCAL_BODY_NAME, LAT, LNG, HH, POP, BLOCK, DEMAND,
    //          COVERED_FTTH, FIRST_FTTH, TOTAL_FTTH
    vil: {
        table: "vil",
        primaryKey: "VILLAGE_CODE",
        columns: [
            col('VILLAGE_CODE',    'VILLAGE_CODE',    120, { editable: false }),
            col('VILLAGE_NAME',    'VILLAGE_NAME',    160),
            col('DISTRICT_CODE',   'DISTRICT_CODE',   130),
            col('DISTRICT',        'DISTRICT',        140),
            col('SUBDISTRICT_CODE','SUBDISTRICT_CODE', 140),
            col('SUBDISTRICT_NAME','SUBDISTRICT_NAME', 150),
            col('BLOCK',           'BLOCK',           130),
            col('LOCAL_BODY_CODE', 'LOCAL_BODY_CODE', 130),
            col('LOCAL_BODY_NAME', 'LOCAL_BODY_NAME', 160),
            latCol('LAT'),
            lngCol('LNG'),
            col('HH',              'HH',              80,  { columntype: 'numberinput' }),
            col('POP',             'POP',             80,  { columntype: 'numberinput' }),
            dropdownCol('DEMAND',       'DEMAND',       ["Y","N"], 90),
            col('COVERED_FTTH',    'COVERED_FTTH',    120, { columntype: 'numberinput' }),
            col('FIRST_FTTH',      'FIRST_FTTH',      120, { columntype: 'numberinput' }),
            col('TOTAL_FTTH',      'TOTAL_FTTH',      120, { columntype: 'numberinput' }),
        ]
    },

};
