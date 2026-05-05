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

var OA ={
Almora:{BA:"NTL",name:"Almora",code:"ALM",lat:29.5949,lng:79.6562,Districts:["Almora","Bageshwar","Pithoragarh","Champawat"]},
Dehradun:{BA:"DDN",name:"Dehradun",code:"DDN",lat:30.3165,lng:78.0322,Districts:["Dehradun"]},
Haridwar:{BA:"HRD",name:"Haridwar",code:"HRD",lat:29.9457,lng:78.1642,Districts:["Haridwar"]},
Nainital:{BA:"NTL",name:"Nainital",code:"NTL",lat:29.3919,lng:79.4542,Districts:["Nainital","Udham Singh Nagar"]},
Srinagar:{BA:"HWR",name:"Srinagar",code:"SGR",lat:30.2215,lng:78.7804,Districts:["Pauri Garhwal","Chamoli","Rudraprayag"]}, 
"New Tehri":{BA:"DDN",name:"New Tehri",code:"NWT",lat:29.3919,lng:79.4542,Districts:["Tehri Garhwal","Uttarkahi"]},
}
var BLOCKS ={
  "Dehradun": ["Raipur","Doiwala","Sahaspur","Vikas Nagar", "Kalsi","Chakrata"],
  "Tehri Garhwal": ["Narendra Nagar","CHAMBA","THAULDHAR","Bhilangana","JAUNPUR","PRATAPNAGAR","JAKHNIDHAR", "KIRTINAGAR", "DEVPRAYAG"],
  "Uttarkashi": ["BHATWARI", "DUNDA","CHINIYALISAUR","NAUGAON","PUROLA","MORI" ],
  "Nainital": ["Haldwani","Kotabag","Ramnagar","Bhimtal","Dhari","Betalghat", "Okhalkanda","Ramgarh"],
   "Udham Singh Nagar": [ "Rudrapur", "Bazpur", "Gadarpur","Kashipur", "Khatima", "Sitarganj","Jaspur"],  
   "Almora": [ "Takula","Hawalbag","Bhaisiyachhana","Lamgara","Tarikhet","Bhikiyasen","Chaukhatiya (Ganai)","Dhauladevi","Dwarahat", "Sult (Shashikhal)", "Syalde" ],
   "Bageshwar": ["Bageshwar","Kapkote", "Garur"],
   "Champawat": ["Champawat", "Pati","Lohagaht","Barakot"],
   "Pithoragarh": [
      "Munakot",
      "Bin (Pithiragarh)",
      "Kanalichhina",
      "Didihat (Askot)",
      "Gangolihat",
      "Berinag",
      "Munsyari",
      "Dharchula"
    ]
  ,
 
    "Haridwar": [
      "BAHADRABAD",
      "BHAGWANPUR",
      "KHANPUR",
      "LAKSAR",
      "NARSAN",
      "ROORKEE"
    ],
   
    "Pauri Garhwal": [
      "BIRONKHAL",
      "DUGGADA",
      "DWARIKHAL",
      "EKESHWAR",
      "KALJIKHAL",
      "KHIRSU",
      "KOT",
      "NAINIDANDA",
      "PABAU",
      "PAURI",
      "POKHRA",
      "RIKHNIKHAL",
      "THALISAIN",
      "YAMKESHWAR",
      "ZAHRIKHAL"
    ],
    "Chamoli": [
      "DASHOLI",
      "DEWAL",
      "GAIRSAIN",
      "GHAT",
      "JOSHIMATH",
      "KARNAPRAYAG",
      "NARAYANBAGAR",
      "POKHARI",
      "THARALI"
    ],
    "Rudraprayag": [
      "AUGUSTMUNI",
      "JAKHOLI",
      "UKHIMATH"
    ]
  
}

const OA_OPTIONS = Object.values(OA).map(item => ({ value: item.code, label: item.name }));
let OA_CODES =  Object.values(OA).map(item => item.code);
let OA_NAMES=  Object.values(OA).map(item => item.name);
TABLE_CONFIGS = {

    block: {
        table: "block",
        primaryKey: "ID",

        columns: [
            { text: 'ID', datafield: 'ID', width: 80, columntype: 'numberinput', editable: false },
           
            {
                text: 'OA',
                datafield: 'OA',
                width: 120,
                columntype: 'dropdownlist',
                options: OA_NAMES,
                init: function (component) {

                        component.jqxDropDownList({
                            source: Object.keys(OA),
                            width: "100%",
                            autoDropDownHeight: true
                        });
                        component.jqxDropDownList('selectIndex', 0 ); 
                        component.on('change', function (event) {

                            let oa = event.args.item.value;
                            let districts = OA[oa]?.Districts || [];
                            let districtComp = $("#formContainer")
                                .jqxForm('getComponentByName', 'DISTRICT');

                            districtComp.jqxDropDownList({
                                source: districts
                            });

                            districtComp.jqxDropDownList('clearSelection');
                        });
                    },

                createeditor: function (row, value, editor) {
                    editor.jqxDropDownList({
                        source: OA_NAMES,
                         width: "100%",   
                        autoDropDownHeight: true
                    });
                },
                cellvaluechanging: function (row, datafield, columntype, oldvalue, newvalue) {
                            if (newvalue != oldvalue) {
                                $("#grid").jqxGrid('setcellvalue', row, "DISTRICT", "Select a District...");
                            };
                        }
            },

            {
                text: 'DISTRICT',
                datafield: 'DISTRICT',
                width: 120,
                columntype: 'dropdownlist',
                options: [], // function that generates district options based on selected OA
                init: function (component) {

                        component.jqxDropDownList({
                            source: OA["Almora"].Districts, // default to first OA's districts
                            width: "100%",                            
                             autoDropDownHeight: true
                        });
                        component.jqxDropDownList('selectIndex', 0 ); 
                        component.on('change', function (event) {

                            let district = event.args.item.value;
                            let blocks = BLOCKS[district] || [];
                            let blockComp = $("#formContainer")
                                .jqxForm('getComponentByName', 'BLOCK');

                            blockComp.jqxDropDownList({
                                source: blocks
                            });

                            blockComp.jqxDropDownList('clearSelection');
                        });
                    },
                 
                createeditor: function (row, value, editor) {

                    let rowData = $("#grid").jqxGrid('getrowdata', row);
                    let selectedOA = rowData.OA;
                    let districts = OA[selectedOA].Districts;
                    editor.jqxDropDownList({
                        source: districts,
                        autoDropDownHeight: true
                    });
                },
                cellvaluechanging: function (row, datafield, columntype, oldvalue, newvalue) {
                    if (newvalue != oldvalue) {
                        $("#grid").jqxGrid('setcellvalue', row, "BLOCK", "Select a Block..");
                    };
                },
                initeditor: function (row, cellvalue, editor, celltext, cellwidth, cellheight) {
                            let selectedOA = $('#grid').jqxGrid('getcellvalue', row, "OA");
                            let districts = OA[selectedOA].Districts;
                            let district=editor.val();
                            editor.jqxDropDownList({ autoDropDownHeight: true, source: districts });
                            if (district != "Select a District...") {
                                var index = districts.indexOf(district);
                                editor.jqxDropDownList('selectIndex', index);
                            }
                        }   
            },

            {
                text: 'BLOCK',
                datafield: 'BLOCK',
                width: 120,
                columntype: 'dropdownlist',
                options: BLOCKS["Almora"], // f
                init: function (component) {

                        component.jqxDropDownList({
                            source: BLOCKS["Almora"], // default to first OA's districts
                            width: "100%",   
                             autoDropDownHeight: true
                        });
                        component.jqxDropDownList('selectIndex', 0 ); 
                    },
                createeditor: function (row, value, editor) {
                    let rowData = $("#grid").jqxGrid('getrowdata', row);
                    let selectedDistrict = rowData.DISTRICT;
                    let blocks = BLOCKS[selectedDistrict] || [];
                    editor.jqxDropDownList({
                        source: blocks,
                        autoDropDownHeight: true
                    });
                },
                initeditor: function (row, cellvalue, editor, celltext, cellwidth, cellheight) {
                            let selectedDistrict = $('#grid').jqxGrid('getcellvalue', row, "DISTRICT");
                            let blocks = BLOCKS[selectedDistrict] || [];
                            let block=editor.val();
                            editor.jqxDropDownList({ autoDropDownHeight: true, source: blocks });
                            if (block != "Select a Block..") {
                                var index = blocks.indexOf(block);
                                editor.jqxDropDownList('selectIndex', index);
                            }
                        }  
            },
            { text: 'CODE', datafield: 'CODE', width: 120 ,required: true},
            { text: 'TE_NAME', datafield: 'TE_NAME', width:  120 ,required: true},
            { text: 'LAT_LNG', datafield: 'LAT_LNG', width:  120 ,required: true},
            { text: 'ENTITY_CODE', datafield: 'ENTITY_CODE', width:  120 ,required: true},

            {
                text: 'LAT',
                datafield: 'LAT',
                width:  120,
                required: true,    
                columntype: 'numberinput',
                validation: function (cell, value) {

                    if (value < 6 || value > 38) {
                        return { result: false, message: "Invalid India Latitude" };
                    }

                    return true;
                }
            },
            {
                text: 'LNG',
                datafield: 'LNG',
                width:  120,
                required: true,
                columntype: 'numberinput',
                validation: function (cell, value) {

                    if (value < 68 || value > 98) {
                        return { result: false, message: "Invalid India Longitude" };
                    }

                    return true;
                }
            },

            { text: 'RENTED', datafield: 'RENTED', width: 100,required: true },
            {
                text: 'BHQ_STATUS',
                datafield: 'BHQ_STATUS',
                width:  120, 
                required: true,
                columntype: 'dropdownlist',
                options: ["Active", "Inactive"],
                
                createeditor: function (row, value, editor) {
                    editor.jqxDropDownList({
                        source: ["Active", "Inactive"],
                        autoDropDownHeight: true
                    });
                }
            },
            { text: 'PHASE', datafield: 'PHASE', width:  120 ,columntype: 'datetimeinput' ,required: true },
            { text: 'BACKHAUL', datafield: 'BACKHAUL', width:  120 ,required: true },
            {
                text: 'RING',
                datafield: 'RING',
                required: true,
                width:  120,
                columntype: 'checkbox'
            },
            { text: 'INFRA', datafield: 'INFRA', width:  120 ,required: true}
        ]
    },
    /////////////////////////////////////////////////////////////////////
    fth: {
        table: "fth",
        primaryKey: "CUSTOMER_ID",

        columns: [
            { text: 'NUMBER', datafield: 'NUMBER', width:  120 },
            { text: 'OLT_IP', datafield: 'OLT_IP', width:  120 },
            { text: 'ONT_MAC_ID', datafield: 'ONT_MAC_ID', width:  120 },
            { text: 'BNU_NAME', datafield: 'BNU_NAME', width:  120 },
            { text: 'BNU_MOBILE', datafield: 'BNU_MOBILE', width:  120 },
            { text: 'BNU_CODE', datafield: 'BNU_CODE', width:  120 },
            { text: 'BNU_TYPE', datafield: 'BNU_TYPE', width:  120 },
            { text: 'PAN_NUMBER', datafield: 'PAN_NUMBER', width:  120 },
            { text: 'STATE', datafield: 'STATE', width:  120 },
            { text: 'DISTRICT', datafield: 'DISTRICT', width:  120 },
            { text: 'BLOCK', datafield: 'BLOCK', width:  120 },
            { text: 'GP_NAME', datafield: 'GP_NAME', width:  120 },
            { text: 'GP_CODE', datafield: 'GP_CODE', width:  120 }
        ]
    }

    // 👉 Add more tables here (same pattern)
};

