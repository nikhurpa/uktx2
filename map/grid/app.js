let currentTable = "";
$(document).ready(function () {

    $("#grid").jqxGrid({
        width: "100%",
        height: 500,
        editable: true,
        pageable: true,
        sortable: true,
        filterable: true,
        showfilterrow: true,
        selectionmode: 'singlerow',
        columns: [] // empty initially
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

        let formTemplate = config.columns.map(col => {
            return {
                bind: col.datafield,
                name: col.datafield,   // ✅ REQUIRED
                type: "text",
                label: col.text
            };
        });

        $("#formContainer").jqxForm({
            template: formTemplate,
            // value: {}
        });

        $("#popupForm").jqxWindow('open');
    });

    $("#saveBtn").on("click", function () {

        let data = $("#formContainer").jqxForm('val');
           

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
    

});

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
                // columns: [] // empty initially
                });
    });
    
}