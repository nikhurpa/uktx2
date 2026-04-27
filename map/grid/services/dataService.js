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
