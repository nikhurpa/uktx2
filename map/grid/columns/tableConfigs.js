// const TABLE_CONFIGS = {
//     table1: {
//         columns: [
//             { text: 'ID', datafield: 'id', width: 80, editable: false },
//             { text: 'Name', datafield: 'name', width: 200 },
//             { text: 'Age', datafield: 'age', width: 100 }
//         ],
//         source: "table1"
//     },
//     table2: {
//         columns: [
//             { text: 'Code', datafield: 'code', width: 150 },
//             { text: 'City', datafield: 'city', width: 200 }
//         ],
//         source: "table2"
//     }
// };


var TABLE_CONFIGS = {

    block: {
        table: "block",
        primaryKey: "ID",

        columns: [
            { text: 'ID', datafield: 'ID', width: 80, columntype: 'numberinput', editable: false },
            { text: 'OA', datafield: 'OA', width: 120 },
            { text: 'DISTRICT', datafield: 'DISTRICT', width: 150 },
            { text: 'BLOCK', datafield: 'BLOCK', width: 150 },
            { text: 'CODE', datafield: 'CODE', width: 120 },
            { text: 'TE_NAME', datafield: 'TE_NAME', width: 180 },
            { text: 'LAT_LNG', datafield: 'LAT_LNG', width: 150 },
            { text: 'ENTITY_CODE', datafield: 'ENTITY_CODE', width: 150 },

            { text: 'LAT', datafield: 'LAT', width: 120, columntype: 'numberinput' },
            { text: 'LNG', datafield: 'LNG', width: 120, columntype: 'numberinput' },

            { text: 'RENTED', datafield: 'RENTED', width: 100 },
            { text: 'BHQ_STATUS', datafield: 'BHQ_STATUS', width: 120 },
            { text: 'PHASE', datafield: 'PHASE', width: 100 },
            { text: 'BACKHAUL', datafield: 'BACKHAUL', width: 120 },
            { text: 'RING', datafield: 'RING', width: 100 },
            { text: 'INFRA', datafield: 'INFRA', width: 100 }
        ]
    },

    fth: {
        table: "fth",
        primaryKey: "NUMBER",

        columns: [
            { text: 'NUMBER', datafield: 'NUMBER', width: 120 },
            { text: 'OLT_IP', datafield: 'OLT_IP', width: 140 },
            { text: 'ONT_MAC_ID', datafield: 'ONT_MAC_ID', width: 160 },
            { text: 'BNU_NAME', datafield: 'BNU_NAME', width: 160 },
            { text: 'BNU_MOBILE', datafield: 'BNU_MOBILE', width: 130 },
            { text: 'BNU_CODE', datafield: 'BNU_CODE', width: 120 },
            { text: 'BNU_TYPE', datafield: 'BNU_TYPE', width: 120 },
            { text: 'PAN_NUMBER', datafield: 'PAN_NUMBER', width: 140 },
            { text: 'STATE', datafield: 'STATE', width: 120 },
            { text: 'DISTRICT', datafield: 'DISTRICT', width: 140 },
            { text: 'BLOCK', datafield: 'BLOCK', width: 140 },
            { text: 'GP_NAME', datafield: 'GP_NAME', width: 160 },
            { text: 'GP_CODE', datafield: 'GP_CODE', width: 120 }
        ]
    }

    // 👉 Add more tables here (same pattern)
};