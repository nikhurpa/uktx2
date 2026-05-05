let currentTable = "";


$(document).ready(function () {

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
        height: 500,
        editable: true,
        pageable: true,
        sortable: true,
        filterable: true,
        showfilterrow: true,
        selectionmode: 'singlerow',
        columns: [] ,// empty initially
        // theme: 'energyblue',
         
        });

  
    $("#btnTable1").click(() => loadTable("fth"));
    $("#btnTable2").click(() => loadTable("block"));
   
    // $("#addBtn").click(() => {
    //     $("#grid").jqxGrid('addrow', null, {});
    // });

    $("#deleteBtn").click(() => {
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

    $("#addBtn").off().on("click", function () {

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
            // value: {}
        });

        $("#popupForm").jqxWindow('open');
    });

    $("#saveBtn").on("click", function () {

        let data = getFormValues();
        console.log("Form Data:", data);

        $.ajax({
            url: `api/api.php?action=insert&table=${currentTable}`,
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
    

});


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

    currentTable = tableName;
    let config = TABLE_CONFIGS[tableName];

    // let source = {
    //     datatype: "json",
    //     url: "api/get.php?table=" + tableName,
    //     id: config.primaryKey,

    //     addrow: function (rowid, rowdata, commit) {

    //         $.ajax({
    //             url: "api/insert.php?table=" + tableName,
    //             method: "POST",
    //             data: JSON.stringify(rowdata),
    //             contentType: "application/json",
    //             success: () => commit(true),
    //             error: () => commit(false)
    //         });
    //     },

    //     updaterow: function (rowid, rowdata, commit) {

    //         $.ajax({
    //             url: `api/update.php?table=${tableName}&id=${rowdata[config.primaryKey]}`,
    //             method: "POST",
    //             data: JSON.stringify(rowdata),
    //             contentType: "application/json",
    //             success: () => commit(true),
    //             error: () => commit(false)
    //         });
    //     },

    //     deleterow: function (rowid, commit) {

    //         $.ajax({
    //             url: `api/delete.php?table=${tableName}&id=${rowid}`,
    //             method: "POST",
    //             success: () => commit(true),
    //             error: () => commit(false)
    //         });
    //     }
    // };

    let source = {
    datatype: "json",
    url: `api/api.php?action=get&table=${tableName}`,
    id: config.primaryKey,
    datafields: config.columns.map(col => ({
        name: col.datafield
    })),

    loadError: function (xhr) {
        console.error("API ERROR:", xhr.responseText);
    },
    

    addrow: function (rowid, rowdata, commit) {

        $.ajax({
            url: `api/api.php?action=insert&table=${tableName}`,
            method: "POST",
            data: JSON.stringify(rowdata),
            contentType: "application/json",
            success: () => commit(true),
            error: () => commit(false)
        });
    },

    updaterow: function (rowid, rowdata, commit) {

        $.ajax({
            url: `api/api.php?action=update&table=${tableName}&id=${rowdata[config.primaryKey]}`,
            method: "POST",
            data: JSON.stringify(rowdata),
            contentType: "application/json",
            success: () => commit(true),
            error: () => commit(false)
        });
    },

    deleterow: function (rowid, commit) {

        $.ajax({
            url: `api/api.php?action=delete&table=${tableName}&id=${rowid}`,
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
            $("body").append('<div id="grid"></div>');
             
        } catch (e) {}
    }
    $("#grid").jqxGrid({
        source: adapter,
        columns: config.columns,
      
    });

     $("#grid").one('bindingcomplete', function () {
     $("#grid").jqxGrid({
                width: "100%",
                height: 500,
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