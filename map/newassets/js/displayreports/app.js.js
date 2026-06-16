let reportTable = null;
let currentReportType = "getSsaProvisioning";

if (!window.UKCFA_Cache) {
    window.UKCFA_Cache = { ssa: [], bbm: [], franchisee: [] };
}

const tableTemplates = {
    matrices: {
        ssa_prov: [
            {title: "Operational Area (SSA)", field: "OA_SSA", sorter: "string"},
            {title: "Provisions Gross Volume", field: "PROVISIONED", hozAlign: "right", formatter: "money", formatterParams: {precision: 0}}
        ],
        ssa_disc: [
            {title: "Operational Area (SSA)", field: "OA_SSA", sorter: "string"},
            {title: "Accounts Closed", field: "CLOSED", hozAlign: "right", formatter: "money", formatterParams: {precision: 0}}
        ],
        bbm_prov: [
            {title: "BBM Name Pointer", field: "BBM_NAME"},
            {title: "Contact Mobile", field: "BBM_MOBILE"},
            {title: "Zone (OA)", field: "OA"},
            {title: "Provisions Tracked", field: "PROVISIONED", hozAlign: "right", formatter: "money", formatterParams: {precision: 0}}
        ],
        bbm_disc: [
            {title: "BBM Name Pointer", field: "BBM_NAME"},
            {title: "Contact Mobile", field: "BBM_MOBILE"},
            {title: "Zone (OA)", field: "OA"},
            {title: "Accounts Closed", field: "CLOSED", hozAlign: "right", formatter: "money", formatterParams: {precision: 0}}
        ],
        fran_prov: [
            {title: "Franchisee Account ID", field: "FRANCHISEE_ID"},
            {title: "Commercial Name Assignment", field: "FRANCHISEE_NAME"},
            {title: "Gross Acquisitions", field: "PROVISIONED", hozAlign: "right", formatter: "money", formatterParams: {precision: 0}}
        ],
        fran_disc: [
            {title: "Franchisee Account ID", field: "FRANCHISEE_ID"},
            {title: "Commercial Name Assignment", field: "FRANCHISEE_NAME"},
            {title: "Gross Disconnections", field: "CLOSED", hozAlign: "right", formatter: "money", formatterParams: {precision: 0}}
        ]
    },
    lists: {
        provisioning: [
            {title: "Order ID Reference", field: "CRM_ORDER_ID", width: 150},
            {title: "Telephone Line", field: "TEL_NUM", width: 120},
            {title: "Gateway (OLT IP)", field: "OLT_IP", width: 120},
            {title: "Operational Area", field: "COMPUTED_OA_SSA", width: 130},
            {title: "Mapped GP Name", field: "MAPPED_GP_NAME", width: 150},
            {title: "Service Category Class", field: "SERVICE_TYPE", width: 140},
            {title: "Circle", field: "CIRCLE", width: 90},
            {title: "Exchange", field: "EXCHANGE", width: 120},
            {title: "Maintenance Fran", field: "MAINT_FRAN", width: 160},
            {title: "Owner", field: "OLT_OWNER", width: 110},
            {title: "CRM Timestamp", field: "DATED", width: 150, hozAlign: "center"}
        ],
        disconnection: [
            {title: "Order ID Reference", field: "CRM_ORDER_ID", width: 150},
            {title: "Telephone Line", field: "TEL_NUM", width: 120},
            {title: "Gateway (OLT IP)", field: "OLT_IP", width: 120},
            {title: "Operational Area", field: "COMPUTED_OA_SSA", width: 130},
            {title: "Mapped GP Name", field: "MAPPED_GP_NAME", width: 150},
            {title: "Action Sub-Type", field: "ORDER_SUB_TYPE", width: 160, cssClass: "text-danger fw-semibold"},
            {title: "Service Category Class", field: "SERVICE_TYPE", width: 140},
            {title: "Circle", field: "CIRCLE", width: 90},
            {title: "Exchange", field: "EXCHANGE", width: 120},
            {title: "Maintenance Fran", field: "MAINT_FRAN", width: 160},
            {title: "Owner", field: "OLT_OWNER", width: 110},
            {title: "CRM Timestamp", field: "DATED", width: 150, hozAlign: "center"}
        ]
    }
};

$(document).ready(function() {
    initTabulator();
    handleDateScaleConfiguration();
    updateUIFilters();
    preloadFormMetadata();

    // Catch Selection Scale Adjustments to change Calendar UI Engine
    $('#date_scale_type').on('change', handleDateScaleConfiguration);
    
    $('.sidebar .nav-link').on('click', function(e) {
        e.preventDefault();
        $('.sidebar .nav-link').removeClass('active');
        $(this).addClass('active');
        
        currentReportType = $(this).data('report');
        $('#current-report-title').text($(this).text() + " Report");
        
        updateUIFilters();
        loadReportData();
    });

    $('#param-form').on('submit', function(e) {
        e.preventDefault();
        loadReportData();
    });

    $('#export-csv').on('click', () => reportTable.download("csv", `${currentReportType}.csv`));
    $('#export-json').on('click', () => reportTable.download("json", `${currentReportType}.json`));
});

function initTabulator() {
    reportTable = new Tabulator("#report-table-container", {
        layout: "fitColumns",
        placeholder: "<div class='p-3 text-muted text-center fw-semibold'>No active transactional data rows located.</div>",
        pagination: "local",
        paginationSize: 20,
        movableColumns: true
    });
}

// Intercepts scale choices to alter properties on the HTML5 calendar tag
function handleDateScaleConfiguration() {
    const scale = $('#date_scale_type').val();
    const $wrapper = $('#wrapper-date-input');
    const $input = $('#calendar_picker');
    
    if (scale === "ALL") { 
        $wrapper.hide(); 
        return; 
    }
    $wrapper.show();

    // Reset component configurations
    $input.removeAttr("type min max").val("");

    if (scale === "MONTH") {
        $('#date-input-label').text("Choose Target Month");
        $input.attr("type", "month").val("2026-06");
    } else if (scale === "DATE") {
        $('#date-input-label').text("Choose Target Date");
        $input.attr("type", "date").val("2026-06-16");
    } else if (scale === "YEAR") {
        $('#date-input-label').text("Choose Target Year");
        // Fallback layout wrapper configuration for annual selections
        $input.attr({ "type": "number", "min": "2020", "max": "2035" }).val("2026");
    }
}

// Parse input outputs into standard DB procedure parsing structures
function getFormattedBackendDate() {
    const scale = $('#date_scale_type').val();
    const rawVal = $('#calendar_picker').val();

    if (scale === "ALL" || !rawVal) return "ALL";

    if (scale === "MONTH") {
        // Formats "2026-06" string arrays straight into "06-2026"
        const parts = rawVal.split("-");
        return `${parts[1]}-${parts[0]}`;
    } else if (scale === "DATE") {
        // Formats "2026-06-16" string arrays straight into "16-06-2026"
        const parts = rawVal.split("-");
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    } else if (scale === "YEAR") {
        return rawVal; // Outputs "2026" directly
    }
    return "ALL";
}

function updateUIFilters() {
    $('.param-group').hide();
    if (currentReportType.includes('Disconnection') || currentReportType.includes('getSsaDisconnection')) {
        $('#group-subtype').show();
    }
    if (currentReportType.includes('List')) {
        $('#group-entity').show();
        populateEntityOptions();
    }
}

function preloadFormMetadata() {
    $.post('reports_engine.php', { action: 'get_form_metadata' }, function(res) {
        if (res.status === "success") {
            window.UKCFA_Cache = res.data;
            populateEntityOptions();
            loadReportData();
        }
    }, 'json');
}

function populateEntityOptions() {
    const $select = $('#input_entity_select');
    $select.empty();
    
    if (currentReportType.includes('Ssa')) {
        $('#entity-label').text("Select SSA Zone");
        window.UKCFA_Cache.ssa.forEach(v => $select.append(`<option value="${v}">${v}</option>`));
    } else if (currentReportType.includes('Bbm')) {
        $('#entity-label').text("Select BBM Manager");
        window.UKCFA_Cache.bbm.forEach(v => $select.append(`<option value="${v}">${v}</option>`));
    } else if (currentReportType.includes('Franchisee')) {
        $('#entity-label').text("Select Franchisee");
        window.UKCFA_Cache.franchisee.forEach(v => $select.append(`<option value="${v.id}">${v.name} (${v.id})</option>`));
    }
}

function getActiveColumns() {
    if (currentReportType.includes('List')) {
        return currentReportType.includes('Provisioning') ? tableTemplates.lists.provisioning : tableTemplates.lists.disconnection;
    }
    switch(currentReportType) {
        case "getSsaProvisioning": return tableTemplates.matrices.ssa_prov;
        case "getSsaDisconnection": return tableTemplates.matrices.ssa_disc;
        case "getBbmProvisioning": return tableTemplates.matrices.bbm_prov;
        case "getBbmDisconnection": return tableTemplates.matrices.bbm_disc;
        case "getFranchiseeProvisioning": return tableTemplates.matrices.fran_prov;
        case "getFranchiseeDisconnection": return tableTemplates.matrices.fran_disc;
        default: return [];
    }
}

function loadReportData() {
    reportTable.alert("<div class='text-primary fw-bold'>Loading transaction ledger entries...</div>");
    
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
            reportTable.clearAlert();
            if (response.status === "success") {
                reportTable.setColumns(getActiveColumns());
                reportTable.setData(response.data);
            }
        }
    });
}