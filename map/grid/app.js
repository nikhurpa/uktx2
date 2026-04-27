$(document).ready(function () {

    // function createGrid(tableKey) {
    //     let config = TABLE_CONFIGS[tableKey];

    //     let source = {
    //         datatype: "array",
    //         localdata: tableKey === "table1" ?
    //             [{ id: 1, name: "John", age: 25 }] :
    //             [{ code: "A1", city: "Dehradun" }]
    //     };

    //     let dataAdapter = new $.jqx.dataAdapter(source);

    //     $("#grid").jqxGrid({
    //         width: "100%",
    //         height: 400,
    //         source: dataAdapter,
    //         editable: true,
    //         pageable: true,
    //         sortable: true,
    //         filterable: true,
    //         showfilterrow: true,
    //         columns: config.columns
    //     });
    // }

    // createGrid("table1");

    $("#btnTable1").click(() => loadTable("fth"));
    $("#btnTable2").click(() => loadTable("block"));

    $("#addBtn").click(() => {
        $("#grid").jqxGrid('addrow', null, {});
    });

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
    

});

function loadTable(tableName) {

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

    $("#grid").jqxGrid({
        source: adapter,
        columns: config.columns,

        editable: true,
        pageable: true,
        sortable: true,
        filterable: true,
        showfilterrow: true,

        selectionmode: 'singlerow'
    });
}