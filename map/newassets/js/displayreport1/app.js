/**
 * UKCFA JQXGRID OPERATIONS CONTROL LAYOUT
 */

let currentReportType = "getSsaProvisioning";

// Master Dictionary Mapping System Schema to jqxGrid Properties
const DB_FIELD_DICTIONARY = {
    // Aggregated Totals Indicators
    "PROVISIONED": { title: "Provisions Gross Volume", width: 150, type: "number", cellsalign: "right", cellsformat: "n" },
    "CLOSED": { title: "Accounts Closed Volume", width: 150, type: "number", cellsalign: "right", cellsformat: "n" },
    "TOTAL_CONNECTIONS": { title: "Active Inventory Lines", width: 160, type: "number", cellsalign: "right", cellsformat: "n" },
    "OA_SSA": { title: "Operational Area (SSA)", width: 180, type: "string" },
    "COMPUTED_OA_SSA": { title: "Operational Area", width: 150, type: "string" },
    "MAPPED_GP_NAME": { title: "Mapped GP Name", width: 160, type: "string" },

    // Core Tracking Fields
    "CRM_ORDER_ID": { title: "CRM Order ID Reference", width: 150, type: "string" },
    "TEL_NUM": { title: "Telephone Line", width: 130, type: "string" },
    "OLT_IP": { title: "Gateway (OLT IP)", width: 130, type: "string" },
    "SSA": { title: "Operational Area (SSA)", width: 140, type: "string" },
    "SERVICE_TYPE": { title: "Service Category Class", width: 140, type: "string" },
    "CIRCLE": { title: "LSA Core Circle", width: 100, type: "string" },
    "EXCHANGE": { title: "Assigned Exchange", width: 130, type: "string" },
    "EXG": { title: "Assigned Exchange", width: 130, type: "string" },
    "MAINT_FRAN": { title: "Maintenance Franchisee", width: 160, type: "string" },
    "OLT_OWNER": { title: "Hardware Owner", width: 120, type: "string" },
    "DATED": { title: "CRM Timestamp", width: 150, type: "date", cellsalign: "center" },
    "ORDER_SUB_TYPE": { title: "Action Sub-Type", width: 160, type: "string" },
    
    // Infrastructures & Allocations Nodes Properties
    "BA": { title: "Business Area (BA)", width: 120, type: "string" },
    "INST_DATE": { title: "Installation Timestamp", width: 150, type: "date", cellsalign: "center" },
    "CUST_NAME": { title: "Registered Customer", width: 180, type: "string" },
    "CUST_ADD": { title: "Registered Address", width: 220, type: "string" },
    "PLAN": { title: "Assigned Tariff Plan", width: 160, type: "string" },
    "MOBILE_NO": { title: "Contact Mobile", width: 120, type: "string" },
    "EMAIL": { title: "Registered Email", width: 160, type: "string" },
    "OLT_NAME": { title: "OLT Device Descriptor", width: 160, type: "string" },
    "OLT_VENDOR": { title: "Hardware Vendor", width: 130, type: "string" },
    "BBM_NAME": { title: "BBM Name Pointer", width: 160, type: "string" },
    "BBM_MOBILE": { title: "BBM Mobile Contact", width: 120, type: "string" },
    "OA": { title: "Zone (OA)", width: 110, type: "string" },
    "FRANCHISEE_ID": { title: "Franchisee Account ID", width: 140, type: "string" },
    "FRANCHISEE": { title: "Franchisee Corporate Name", width: 180, type: "string" },
    "STATUS": { title: "Active Status", width: 100, type: "string", cellsalign: "center" }
};

$(document).ready(function() {
    // Render an empty base framework grid placeholder on startup
    initEmptyGrid();
    handleDateScaleConfiguration();
    updateUIFilters();

    $('#date_scale_type').on('change', handleDateScaleConfiguration);
    
    $('.sidebar .nav-link').on('click', function(e) {
        e.preventDefault();
        $('.sidebar .nav-link').removeClass('active');
        $(this).addClass('active');
        
        currentReportType = $(this).data('report');
        $('#current-report-title').text($(this).text() + " Report");
        
        updateUIFilters();
    });

    $('#param-form').on('submit', function(e) {
        e.preventDefault();
        loadReportData();
    });

    // jqxGrid Export Protocol Handlers
    $('#export-excel').on('click', function() {
        $("#report-grid-container").jqxGrid('exportdata', 'xls', `${currentReportType}_export`);
    });
    $('#export-csv').on('click', function() {
        $("#report-grid-container").jqxGrid('exportdata', 'csv', `${currentReportType}_export`);
    });

    // document.querySelectorAll('input[name="opt1"]').forEach(radio => {
    //     radio.addEventListener('click', function () {
    //         console.log(this.id);

    //     });
    // });

    //   document.querySelectorAll('input[name="opt2"]').forEach(radio => {
    //     radio.addEventListener('click', function () {
    //         console.log(this.id);

    //     });
    // });

    $('.btn-group-toggle input[type="radio"]').on('change', function() {
    // Find the parent button group
    var $group = $(this).closest('.btn-group-toggle');
    
    // Remove the 'active' class from all labels in this specific group
    $group.find('.btn').removeClass('active');
    
    // Add the 'active' class to the label of the checked radio
    $(this).closest('.btn').addClass('active');
    var activeId = $(this).attr('id');

  });

    var opt1Id = $('input[name="opt1"]:checked').attr('id');
    console.log("Selected ID:", opt1Id);

    var opt2Id = $('input[name="opt2"]:checked').attr('id');
    console.log("Selected ID:", opt2Id);



});

function initEmptyGrid() {
    $("#report-grid-container").jqxGrid({
        width: '100%',
        height: 480,
        theme: 'bootstrap',
        columnsresize: true,
        sortable: true,
        pageable: true,
        pagesize: 20,
        columns: [{ text: 'No active transactional query generated.', datafield: 'placeholder', width: '100%' }]
    });
}

function handleDateScaleConfiguration() {
    const scale = $('#date_scale_type').val();
    const $wrapper = $('#wrapper-date-input');
    const $input = $('#calendar_picker');
    
    if (scale === "ALL") { $wrapper.hide(); return; }
    $wrapper.show();

    $input.removeAttr("type min max").val("");

    if (scale === "MONTH") {
        $('#date-input-label').text("Choose Target Month");
        $input.attr("type", "month").val("2026-06");
    } else if (scale === "DATE") {
        $('#date-input-label').text("Choose Target Date");
        $input.attr("type", "date").val("2026-06-16");
    } else if (scale === "YEAR") {
        $('#date-input-label').text("Choose Target Year");
        $input.attr({ "type": "number", "min": "2020", "max": "2035" }).val("2026");
    }
}

function getFormattedBackendDate() {
    const scale = $('#date_scale_type').val();
    const rawVal = $('#calendar_picker').val();
    if (scale === "ALL" || !rawVal) return "ALL";

    const parts = rawVal.split("-");
    if (scale === "MONTH") return `${parts[1]}-${parts[0]}`;
    if (scale === "DATE")  return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return rawVal; // Year View
}

/**
 * FETCHES DROP-DOWN PARAMETERS ON THE GO USING AJAX
 */
function updateUIFilters() {
    $('.param-group').hide();
    
    if (currentReportType.includes('List')) {
        $('#group-entity').show();
        
        let targetType = "";
        if (currentReportType.includes('Ssa')) {
            $('#entity-label').text("Select SSA Zone");
            targetType = "ssa";
        } else if (currentReportType.includes('Bbm')) {
            $('#entity-label').text("Select BBM Manager");
            targetType = "bbm";
        } else if (currentReportType.includes('Franchisee')) {
            $('#entity-label').text("Select Franchisee");
            targetType = "franchisee";
        }
        
        fetchDropdownOptionsOnTheGo(targetType);
    } else {
        // Automatically fetch summaries for matrix reports directly upon click selection
        loadReportData();
    }

    if (currentReportType.includes('Disconnection') || currentReportType.includes('getSsaDisconnection')) {
        $('#group-subtype').show();
    }
}

function fetchDropdownOptionsOnTheGo(entityType) {
    const $select = $('#input_entity_select');
    $select.html('<option value="">Syncing DB...</option>').prop('disabled', true);

    $.ajax({
        url: 'reports_engine.php',
        type: 'POST',
        data: { action: 'get_single_dropdown_meta', type_requested: entityType },
        dataType: 'json',
        success: function(response) {
            $select.empty().prop('disabled', false);
            if (response.status === "success" && response.data.length > 0) {
                response.data.forEach(function(item) {
                    if (entityType === 'franchisee') {
                        $select.append(`<option value="${item.id}">${item.name} (${item.id})</option>`);
                    } else {
                        $select.append(`<option value="${item}">${item}</option>`);
                    }
                });
                loadReportData(); // Fire active grid refresh once dependencies sync cleanly
            }
        }
    });
}

/**
 * CONSTRUCTS JQXGRID DATAFIELDS AND COLUMNS DYNAMICALLY ON THE GO
 */
function renderDynamicJqxGrid(datasetRows) {
    if (!datasetRows || datasetRows.length === 0) {
        initEmptyGrid();
        return;
    }

    const uniqueKeys = Object.keys(datasetRows[0]);
    const dynamicDatafields = [];
    const dynamicColumnsModel = [];

    uniqueKeys.forEach(function(columnKey) {
        const fieldMeta = DB_FIELD_DICTIONARY[columnKey];
        
        if (fieldMeta) {
            // 1. Build Datafields scheme definitions array
            dynamicDatafields.push({ name: columnKey, type: fieldMeta.type === "number" ? "number" : "string" });
            
            // 2. Build Render Columns layouts array
            dynamicColumnsModel.push({
                text: fieldMeta.title,
                datafield: columnKey,
                width: fieldMeta.width,
                cellsalign: fieldMeta.cellsalign || "left",
                align: "left",
                cellsformat: fieldMeta.cellsformat || ""
            });
        } else {
            // Unmapped Column Layout Safe Fallbacks
            dynamicDatafields.push({ name: columnKey, type: "string" });
            dynamicColumnsModel.push({
                text: columnKey.replace(/_/g, " "),
                datafield: columnKey,
                width: 130
            });
        }
    });

    // Initialize jqxDataAdapter on top of the dataset rows array
    const source = {
        localdata: datasetRows,
        datatype: "array",
        datafields: dynamicDatafields
    };
    const dataAdapter = new $.jqx.dataAdapter(source);

    // Completely rebind and re-initialize the component grid instantly
    $("#report-grid-container").jqxGrid({
        width: '100%',
        height: 480,
        source: dataAdapter,
        theme: 'bootstrap',
        columnsresize: true,
        sortable: true,
        pageable: true,
        pagesize: 25,
        pagesizeoptions: ['25', '50', '100'],
        columns: dynamicColumnsModel
    });
}

function loadReportData() {
    // Show native loading animation state overlays
    $("#report-grid-container").jqxGrid('showloadelement');
    
    const payload = {
        action: currentReportType,
        input_date: getFormattedBackendDate()
    };

    if ($('#group-subtype').is(':visible')) payload.input_sub_type = $('#input_sub_type').val();
    if ($('#group-entity').is(':visible')) payload.input_entity = $('#input_entity_select').val();

    $.ajax({
        url: 'reports_engine.php',
        type: 'POST',
        data: payload,
        dataType: 'json',
        success: function(response) {
            $("#report-grid-container").jqxGrid('hideloadelement');
            if (response.status === "success") {
                // Dynamically compile columns model from JSON data parameters
                renderDynamicJqxGrid(response.data);
            }
        },
        error: function() {
            $("#report-grid-container").jqxGrid('hideloadelement');
            initEmptyGrid();
        }
    });
}