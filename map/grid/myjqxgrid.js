import { loadJS, loadCSS, loadModule, addDiv, Router } from "../newassets/js/loader.js";
let currentTable = "";
const DataService = {
    getData: function (table) {
        return [];
    },
    saveRow: function (table, row) {
        console.log("Save:", table, row);
    },
    deleteRow: function (table, id) {
        console.log("Delete:", table, id);
    }
};


function initGrid(){

addElement();
var customStyle = {
        // Defines a header style
        'headerStyle': {
            'font-name': 'Arial',
            'font-size': '14px',
            'font-weight': 'bold',
            'color': '#FFFFFF',
            'background-color': '#4472C4'
        },
        // Defines a cell style
        'rowStyle': {
            'font-name': 'Courier New',
            'font-size': '12px',
            'font-style': 'italic'
        }
    
    };

    $("#grid").jqxGrid({
        width: "100%",
        height: 450,
        editable: true,
        pageable: true,
        sortable: true,
        filterable: true,
        showfilterrow: true,
        selectionmode: 'singlerow',
        columns: [] ,// empty initially
        // theme: 'energyblue',
         
        });

  
    $("#btnfth").click(() => loadTable("fth"));
    $("#btnblock").click(() => loadTable("block"));
   
    // $("#addBtn").click(() => {
    //     $("#grid").jqxGrid('addrow', null, {});
    // });

    $("#btnDelete").click(() => {
        let row = $("#grid").jqxGrid('getselectedrowindex');
        let id = $("#grid").jqxGrid('getrowid', row);

        if (row >= 0) {
            $("#grid").jqxGrid('deleterow', id);
        }
    });
   

    $("#tableSelector").on('change', function () {
        loadTable(this.value);
    });

    $("#popupForm").jqxWindow({
        width: 400,
        height: 400,
        isModal: true,
        autoOpen: false
    });

    $("#btnAdd").off().on("click", function () {

        let table = currentTable; // store current table globally
        let config = TABLE_CONFIGS[table];
        let formTemplate = generateFormTemplate(config.columns);
        console.log("Generated Form Template:", formTemplate);
        // $("#formContainer").html("");


        // let formTemplate = config.columns.map(col => {
        //     return {
        //         bind: col.datafield,
        //         name: col.datafield,   // ✅ REQUIRED
        //         type: "text",
        //         label: col.text
        //     };
        // });

        $("#formContainer").jqxForm({
            template: formTemplate,
            value: {}
        });

        $("#popupForm").jqxWindow('open');
    });


    $("#btnUpdate").on("click", function () {
    $("#grid").jqxGrid('destroy');
    const mainCOntainer = document.getElementById("gridContainer");
    addBulkUploadElements()
    loadJS("./grid/bulkupload.js"); 

   

    });


    $("#saveBtn").on("click", function () {

        let data = getFormValues();
        console.log("Form Data:", data);

        $.ajax({
            url: `./grid/api/api.php?action=insert&table=${currentTable}`,
            method: "POST",
            data: JSON.stringify(data),
            contentType: "application/json",
            success: function () {
                $("#grid").jqxGrid('updatebounddata');
                $("#popupForm").jqxWindow('close');
            }
        });
    });

       
        
    
    $("#excelExport").jqxButton();
     $("#excelExport").click(function () {
          $("#grid").jqxGrid('exportdata', 'xlsx', 'report',true, null, true, null, customStyle);          
     });


}


function getFormValues(formSelector = "#formContainer") {
    // 1. Get the original template used to create the form
    var template = $(formSelector).jqxForm('template');
    var formData = {};

    // 2. Iterate through the template items
    template.forEach(function (item) {
        // Only process items that have a 'name' or 'bind' property (the data fields)
        var fieldName = item.name || item.bind;
        
        if (fieldName) {
            // jqxForm stores the actual widget instance in the component's internal structure
            // We use the jqxForm 'getComponentByName' method to find the specific widget
            var component = $(formSelector).jqxForm('getComponentByName', fieldName);
            
            if (component) {
                // Use the universal .val() method on the specific jqxWidget
                formData[fieldName] = component.val();
            }
        }
    });

    return formData;
}


function generateFormTemplate(columns) {

    return columns.map(col => {

        let field = {
            name: col.datafield,
            bind: col.datafield,
            label: col.text || col.datafield,
            validation: col.validation || null,
            width: "100%"
        };

        // 🔥 Detect type
        switch (col.columntype) {

            case "dropdownlist":
                field.type = "option";
                field.component = 'jqxDropDownList';
                field.options = col.options || []; // pass from config
                field.init=col.init || null;
                
                break;

            case "checkbox":
                field.type = "boolean";
                break;

            case "datetimeinput":
                field.type = "date";
                break;

            case "numberinput":
                field.type = "number";
                break;

            case "radiobutton":
                field.type = "option";
                field.options = col.options || [];
                // field.component = 'jqxRadioButton';
                break;

            default:
                field.type = "text";
        }

        // 🔥 Extra enhancements

        // required field
        if (col.required) {
            field.required = true;
        }

        // placeholder
        if (col.placeholder) {
            field.placeholder = col.placeholder;
        }

        // validation
        if (col.validation) {
            field.validation = col.validation;
        }

        return field;
    });
}


function loadTable(tableName) {
    const gridContainer = document.getElementById("gridContainer");
    gridContainer.innerHTML = ""; // Clear existing content
    addDiv({ id: "grid", parent: gridContainer, style: "border:none;" });


    currentTable = tableName;
    let config = TABLE_CONFIGS[tableName];

    let source = {
    datatype: "json",
    url: `./grid/api/api.php?action=get&table=${tableName}`,
    id: config.primaryKey,
    datafields: config.columns.map(col => ({
        name: col.datafield
    })),

    loadError: function (xhr) {
        console.error("API ERROR:", xhr.responseText);
    },
    

    addrow: function (rowid, rowdata, commit) {

        $.ajax({
            url: `./grid/api/api.php?action=insert&table=${tableName}`,
            method: "POST",
            data: JSON.stringify(rowdata),
            contentType: "application/json",
            success: () => commit(true),
            error: () => commit(false)
        });
    },

    updaterow: function (rowid, rowdata, commit) {

        $.ajax({
            url: `./grid/api/api.php?action=update&table=${tableName}&id=${rowdata[config.primaryKey]}`,
            method: "POST",
            data: JSON.stringify(rowdata),
            contentType: "application/json",
            success: () => commit(true),
            error: () => commit(false)
        });
    },

    deleterow: function (rowid, commit) {

        $.ajax({
            url: `./grid/api/api.php?action=delete&table=${tableName}&id=${rowid}`,
            method: "POST",
            success: () => commit(true),
            error: () => commit(false)
        });
    }
};


    let adapter = new $.jqx.dataAdapter(source);

    if ($("#grid").length) {
        try {
            $("#grid").jqxGrid('destroy');
            const mainCOntainer = document.getElementById("gridContainer");
            addDiv({ id: "grid", parent: gridContainer, style: "border:none;" }); 
            // $("body").append('<div id="grid"></div>');
             
        } catch (e) {}
    }
    $("#grid").jqxGrid({
        source: adapter,
        columns: config.columns,
      
    });

     $("#grid").one('bindingcomplete', function () {
     $("#grid").jqxGrid({
                width: "100%",
                heigh:450,
                editable: true,
                pageable: true,
                sortable: true,
                filterable: true,
                showfilterrow: true,
                selectionmode: 'singlerow',
                // theme: 'energyblue',
            //      headerClassName: 'headerStyle', 
            // // Apply cell style to this column's data
            // cellClassName: 'rowStyle' 
                
                });
    });
    
}

function addElement(){



const mainDiv = document.getElementById("main");
mainDiv.innerHTML = ""; // Clear existing content
addDiv({ id: "gridmain", parent: mainDiv, 
    innerHTML: `<div class="container mt-4">
  <div class="card shadow">
    <!-- Top Header: Multiple Buttons -->
    <div class="card-header bg-light d-flex justify-content-between align-items-center">
      <h5 class="mb-0">Data Management</h5>
      <div class="btn-group" role="group">
        <button type="button" class="btn btn-outline-primary btn-sm" id="btnfth">fth</button>
        <button type="button" class="btn btn-outline-primary btn-sm" id="btnblock">block</button>
        <button type="button" class="btn btn-outline-primary btn-sm" id="btnsas">sas</button>
      </div>
    </div>

    <!-- Card Body: The Grid -->
    <div class="card-body p-10" id="gridContainer">
      <div id="grid" style="border: none;"></div>
    </div>

    <!-- Card Footer: Action Buttons -->
    <div class="card-footer d-flex gap-2">
      <button type="button" class="btn btn-success" id="btnAdd">
        <i class="fa fa-plus me-1"></i> Add New
      </button>
      <button type="button" class="btn btn-danger" id="btnDelete">
        <i class="fa fa-trash me-1"></i> Delete
      </button>
      <button type="button" class="btn btn-primary" id="btnUpdate">
        <i class="fa fa-edit me-1"></i> Bulk Update
      </button>
      
      <!-- Push Export to the right -->
      <div class="ms-auto">
        <button type="button" class="btn btn-secondary" id="excelExport">
          <i class="fa fa-file-export me-1"></i> Export Data
        </button>
      </div>
    </div>
  </div>
</div>


<div id="popupForm">
    <div>Add Record</div>
    <div style="padding:10px;">
        <div id="formContainer"></div>
        <br/>
        <button id="saveBtn">Save</button>
        <button id="cancelBtn">Cancel</button>
    </div>
</div> `
    });



    



}

function addBulkUploadElements(){

    const mainDiv = document.getElementById("gridContainer");
    mainDiv.innerHTML = ""; // Clear existing content

 addDiv({ id: "gridmain", parent: mainDiv, 
    innerHTML:  `
                <div class="app">

              <!--  <header>
                    <div class="logo-mark">
                    <div class="logo-icon"></div>
                    <span class="logo-label">DataSync</span>
                    </div>
                    <h1>Excel → <span>Database</span><br>Sync Engine</h1>
                    <p class="subtitle">Batch-process large Excel datasets with real-time feedback</p>
                </header>
                -->

                <!-- Step 1: Files -->
                <div class="panel" data-label="01 — Files">
                    <div class="panel-body">
                    <div class="upload-grid">
                        <div>
                        <div class="config-label">Excel File (.xlsx / .xls)</div>
                        <div class="drop-zone" id="excelZone">
                            <input type="file" id="excelFile" accept=".xlsx,.xls" onchange="handleFile(this,'excelZone','excelName')">
                            <div class="drop-icon">📊</div>
                            <div class="drop-label">Drop Excel File</div>
                            <div class="drop-hint">or click to browse</div>
                            <div class="drop-filename" id="excelName"></div>
                        </div>
                        </div>
                        <div>
                        <div class="config-label">Config File (.txt / .js) — optional</div>
                        <div class="drop-zone" id="confZone">
                            <input type="file" id="confFile" accept=".txt,.js" onchange="handleFile(this,'confZone','confName');loadConfFile(this)">
                            <div class="drop-icon">⚙️</div>
                            <div class="drop-label">Drop Config File</div>
                            <div class="drop-hint">or paste config below</div>
                            <div class="drop-filename" id="confName"></div>
                        </div>
                        </div>
                    </div>
                    </div>
                </div>

                <!-- Step 2: Config -->
                <div class="panel  d-none" data-label="02 — Configuration">
                    <div class="panel-body">
                    <div class="config-label">Paste or edit your config object</div>
                    <textarea id="configText" spellcheck="false">const conf = {
                table_name: "BLOCK",
                action: "update",           // "insert" or "update"
                sheet: "Sheet1",
                unique_id: "A",             // Excel column letter whose value is used for matching
                unique_id_field: "BLOCK_ID", // DB column name to match against (WHERE unique_id_field = ?)
                update_fields: ["PHASE", "BACKHAUL", "MEDIA"],
                values: ["B", "C", "D"]    // Excel column letters that supply the update values
                };</textarea>
                    </div>
                </div>

                <!-- Step 3: Database -->
                <div class="panel" data-label="03 — Database Connection">
                    <div class="panel-body">
                    <div class="db-grid">
                    <!--
                        <div class="field-group">
                        
                        <label class="field-label">Host</label>
                        <input type="text" id="dbHost" value="localhost" placeholder="localhost">
                        </div>
                        <div class="field-group">
                        <label class="field-label">Port</label>
                        <input type="number" id="dbPort" value="3306" placeholder="3306">
                        </div>
                        <div class="field-group">
                        <label class="field-label">Database Name</label>
                        <input type="text" id="dbName" placeholder="my_database">
                        </div>
                        <div class="field-group">
                        <label class="field-label">Username</label>
                        <input type="text" id="dbUser" placeholder="root">
                        </div>
                        <div class="field-group" style="grid-column:1/-1">
                        <label class="field-label">Password</label>
                        <input type="password" id="dbPass" placeholder="••••••••">
                        </div>-->
                    </div>
                    <!-- <div class="batch-row"> -->
                        <div class="field-group">
                        <label class="field-label">Batch Size</label>
                        <input type="number" id="batchSize" value="200" min="10" max="1000">
                        <span class="batch-hint">Rows per AJAX request (100–500 recommended)</span>
                        </div>
                        
                    <!-- </div> -->
                    </div>
                </div>

                <!-- Run Button -->
                <button class="run-btn" id="runBtn" onclick="startSync()">
                    <span class="btn-icon">▶</span>
                    <span id="runLabel">Run Sync</span>
                </button>

                <!-- Progress -->
                <div class="panel progress-panel" id="progressPanel" data-label="04 — Live Progress" style="margin-top:16px">
                    <div class="panel-body">
                    <div class="pct-row">
                        <span class="pct-label">Progress</span>
                        <span class="pct-val" id="pctVal">0%</span>
                    </div>
                    <div class="progress-track">
                        <div class="progress-fill" id="progressFill"></div>
                    </div>

                    <div class="stats-row">
                        <div class="stat-box" data-tip="Total rows in Excel">
                        <div class="stat-val muted" id="statTotal">—</div>
                        <div class="stat-label">Total Rows</div>
                        </div>
                        <div class="stat-box" data-tip="Successfully processed">
                        <div class="stat-val" id="statDone">0</div>
                        <div class="stat-label">Processed</div>
                        </div>
                        <div class="stat-box" data-tip="Rows skipped or errored">
                        <div class="stat-val warn" id="statErr">0</div>
                        <div class="stat-label">Errors</div>
                        </div>
                        <div class="stat-box" data-tip="Elapsed time">
                        <div class="stat-val purple" id="statTime">0s</div>
                        <div class="stat-label">Elapsed</div>
                        </div>
                    </div>

                    <div class="log-header">
                        <span class="log-title">Activity Log</span>
                        <button class="log-clear" onclick="clearLog()">clear</button>
                    </div>
                    <div id="log"></div>

                    <div class="done-banner" id="doneBanner"></div>
                    </div>
                </div>

                </div
                `   });
}

export { initGrid, addElement };