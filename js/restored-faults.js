let restoredFaults = [];
function loadRestoredFaultsPage() {

    $('#page-content').html(`
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Restored Faults</h5>
                <div class="btn-group" role="group">
                    <button type="button" class="btn btn-outline-primary btn-sm" onclick="exportRestored()">
                        <i class="fas fa-download me-1"></i>Export
                    </button>
                    <button type="button" class="btn btn-outline-success btn-sm" onclick="refreshRestoredFaults()">
                        <i class="fas fa-sync-alt me-1"></i>Refresh
                    </button>
                </div>
            </div>
            <div class="card-body">
                <!-- Filters -->
                <div class="row mb-3">
                    <div class="col-md-2">
                        <label for="filterOA" class="form-label">Filter by OA</label>
                        <select class="form-select" id="filterOA_restored">
                                    <option value="">Select OA</option>
                                    <option value="ALMORA">ALM</option>
                                    <option value="DEHRADUN">DDN</option>
                                    <option value="HARIDWAR">HWR</option>
                                    <option value="NAINITAL">NTL</option>
                                    <option value="UTTARKASHI">NWT</option>
                                    <option value="KOTDWARA">SGR</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <label for="filterMaintainedBy" class="form-label">Filter by Maintained By</label>
                        <select class="form-select" id="filterMaintainedBy_restored">
                            <option value="">All</option>
                            <option value="BA">BA</option>
                            <option value="CNTX">CNTX</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <label for="filterRouteOwner" class="form-label">Filter by Route Owner</label>
                        <select class="form-select" id="filterRouteOwner_restored">
                            <option value="">All</option>
                            <option value="BA">BA</option>
                            <option value="CNTX">CNTX</option>
                            <option value="VTL">VTL</option>
                            <option value="PGCIL">PGCIL</option>
                            <option value="OTHER">OTHER</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <label for="filterRoute" class="form-label">Filter by Route</label>
                        <input type="text" class="form-control" id="filterRoute_restored" placeholder="Route name">
                    </div>
                     <div class="col-md-2">
                            <label class="form-label">Date Range:</label>
                            <div class="input-group">
                                <input type="date" class="form-control" id="reportDateFrom_restored" placeholder="From">
                                <input type="date" class="form-control" id="reportDateTo_restored" placeholder="To">
                            </div>
                    </div>
                    <div class="col-md-2">
                        <label class="form-label">&nbsp;</label>
                        <div class="d-grid">
                            <button type="button" class="btn btn-primary" onclick="applyFiltersRestored()">
                                <i class="fas fa-filter me-1"></i>Apply Filters
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Faults Table -->
                <div class="table-responsive">
                    <table class="table table-striped table-hover" id="pendingFaultsTable">
                        <thead class="table-dark">
                            <tr>
                                <th>Fault ID - OA <br>Maintained By & Owner</th>
                                <th>Fault Type &<br> Linear/Ring</th>
                                <th>Route <br>Location</th>
                                <th>Elements affected <br><span class="badge bg-info">BTS</span> <span class="badge bg-warning">OLT</span> <span class="badge bg-success">LL</span> <span class="badge bg-danger">EXH</span></th>
                                <th>Fault Date<br> Time </th>
                                <th>Restoration Date<br> Time </th>
                                <th>Restoration Time</th>
                                <th>FRT </th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="pendingFaultsTableBody">
                            <!-- Data will be loaded here -->
                        </tbody>
                    </table>
                </div>
                
                <!-- Pagination -->
                <nav aria-label="Pending faults pagination">
                    <ul class="pagination justify-content-center" id="pendingFaultsPagination">
                        <!-- Pagination will be generated here -->
                    </ul>
                </nav>
            </div>
        </div>

         <!-- Resolution Form Modal -->
        <div class="modal fade" id="resolutionModal" tabindex="-1">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Resolve Fault - <span id="resolutionFaultId"></span></h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="resolutionForm">
                            <input type="hidden" id="resolutionFaultIdHidden" name="fault_id">
                            
                            <!-- Fault Information Display -->
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <h6>Fault Information</h6>
                                    <table class="table table-sm">
                                        <tr><td><strong>Fault ID:</strong></td><td id="displayFaultId"></td></tr>
                                        <tr><td><strong>Route:</strong></td><td id="displayRoute"></td></tr>
                                        <tr><td><strong>Location:</strong></td><td id="displayLocation"></td></tr>
                                        <tr><td><strong>Fault Date:</strong></td><td id="displayFaultDate"></td></tr>
                                    </table>
                                </div>
                                <div class="col-md-6">
                                    <h6>Restoration Details</h6>
                                    <div class="mb-3">
                                        <label for="resolution_date" class="form-label">Restoration Date *</label>
                                        <input type="date" class="form-control" id="resolution_date" name="restoration_date" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="resolution_time" class="form-label">Restoration Time *</label>
                                        <input type="time" class="form-control" id="resolution_time" name="restoration_time" required>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label for="resolution_brief" class="form-label">Restoration Brief *</label>
                                <textarea class="form-control" id="resolution_brief" name="restoration_brief" rows="3" required placeholder="Describe the restoration work performed, parts replaced, actions taken..."></textarea>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Restoration Images</label>
                                <div class="row">
                                    <div class="col-md-6">
                                        <button type="button" class="btn btn-primary w-100 mb-2" onclick="startResolutionCamera()">
                                            <i class="fas fa-camera me-2"></i>Take Photo
                                        </button>
                                    </div>
                                    <div class="col-md-6">
                                        <button type="button" class="btn btn-secondary w-100 mb-2" onclick="selectResolutionImageFromFolder()">
                                            <i class="fas fa-folder-open me-2"></i>Select from Folder
                                        </button>
                                    </div>
                                </div>
                                
                                <!-- Camera Section -->
                                <div id="resolutionCameraSection" class="mt-3" style="display: none;">
                                    <div class="card">
                                        <div class="card-header">
                                            <h6 class="mb-0">Camera</h6>
                                        </div>
                                        <div class="card-body">
                                            <video id="resolutionCameraVideo" autoplay style="width: 100%; max-width: 400px; height: 300px; background: #000;"></video>
                                            <div class="mt-2">
                                                <button type="button" class="btn btn-success me-2" onclick="captureResolutionPhoto()">
                                                    <i class="fas fa-camera me-1"></i>Capture
                                                </button>
                                                <button type="button" class="btn btn-danger" onclick="stopResolutionCamera()">
                                                    <i class="fas fa-times me-1"></i>Close Camera
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Image Preview Section -->
                                <div id="resolutionImagePreviewSection" class="mt-3">
                                    <h6>Selected Images:</h6>
                                    <div id="resolutionImagePreviewContainer" class="row">
                                        <!-- Images will be displayed here -->
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-success" onclick="submitResolution()">
                            <i class="fas fa-check me-1"></i>Mark as Resolved
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `);
    
    // Load pending faults
    loadRestoredFaults();
    
    // Add event listeners for filters
    $('#filterOA_restored, #filterMaintainedBy_restored , #filterRouteOwner_restored').on('change', function() {
        applyFiltersRestored();
    });
    
    $('#filterRoute_restored').on('keyup', function(e) {
        if (e.key === 'Enter') {
            applyFiltersRestored();
        }
    });
}

function loadRestoredFaults(filters = {}) {
    // Add user role and OA to filters
    filters.user_role = localStorage.getItem('user_role') || 'user';
    filters.user_oa = localStorage.getItem('user_oa') || '';



    sql="SELECT * FROM FAULTS WHERE RESTORATION_DATE IS NOT NULL";
    if(filters.oa){
        sql += ` AND OA = '${filters.oa}'`;
      
    }
    if(filters.maintained_by){
        sql += ` AND MAINTAINED_BY = '${filters.maintained_by}'`;
       
    }
    if(filters.route_owner){
        sql += ` AND ROUTE_OWNER = '${filters.route_owner}'`;
       
    }
    if(filters.route){
        sql += ` AND ROUTE_BRIEF LIKE '%${filters.route}%'`;
    
    }
    if(filters.date_from){
        sql += ` AND RESTORATION_DATE >= '${filters.date_from}'`;
       
    }
    if(filters.date_to){
        sql += ` AND RESTORATION_DATE <= '${filters.date_to}'`;
      
    }
    let postData = {query : sql};
console.log(sql)
    $.ajax({
        url: 'php/query.php',
        type: 'POST',
        data: postData,
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                displayRestoredFaults(response.data);
                restoredFaults=response.data;
                console.log(restoredFaults);
            } else {
                showAlert('Error loading pending faults: ' + response.message, 'danger');
            }
        },
        error: function() {
            showAlert('Failed to load pending faults', 'danger');
        }
    });
}

function displayRestoredFaults(faults) {
    const tbody = $('#pendingFaultsTableBody');
    tbody.empty();
    var suenable='';
    if(localStorage.getItem('user_role') != "Suadmin"){ suenable='d-none'}
    
    if (faults.length === 0) {
        tbody.html('<tr><td colspan="9" class="text-center text-muted">No pending faults found</td></tr>');
        return;
    }
        // Fault type styling
        const faultTypeColors = {
            'critical': 'bg-danger',
            'urgent': 'bg-warning',
            'normal': 'bg-secondary'
        };
        
        
    faults.forEach(fault => {
        const faultTypeClass = faultTypeColors[fault.FAULT_TYPE] || 'bg-secondary';
        let elements
        if (fault.ELEMENT_AFFECTED) {
            try {
                elements = JSON.parse(fault.ELEMENT_AFFECTED);
                ('BTS' in elements) ? elements.BTS : 0;
                ('OLT' in elements) ? elements.OLT : 0;
                ('LEASED_LINE' in elements) ? elements.LEASED_LINE : 0;
                ('EXCH' in elements) ? elements.EXCH : 0;
                
            } catch (e) {
                elements={"BTS":0,"OLT":0,"LEASED_LINE":0,"EXCH":0};
            }
        } else {
            elements={"BTS":0,"OLT":0,"LEASED_LINE":0,"EXCH":0};
        }

        const row = `
            <tr>
            
                <td><strong>${fault.FAULT_ID}</strong><br><span class="badge bg-secondary">${fault.OA}</span> <span class="badge bg-info">${fault.MAINTAINED_BY}</span> <span class="badge bg-primary">${fault.ROUTE_OWNER || 'OTHER'}</span></td>
                <td><span class="badge ${faultTypeClass}">${fault.FAULT_TYPE}</span> <br> <span class="badge bg-info">${fault.ROUTE_RING_LINEAR}</span></td>
                <td>${fault.ROUTE_BRIEF}<br>${fault.LOCATION_BRIEF}</td>
               
                <td><span class="badge bg-info">${elements.BTS}</span> <span class="badge bg-warning">${elements.OLT}</span> <span class="badge bg-success">${elements.LEASED_LINE}</span> <span class="badge bg-danger">${elements.EXCH}</span></td>
                <td>${fault.FAULT_DATE}<br><small class="text-muted">${fault.FAULT_TIME}</small>  </td>
                <td>${fault.RESTORATION_DATE}<br><small class="text-muted">${fault.RESTORATION_TIME}</small>  </td>
                <td>${fault.RESTORATION_TIME}</td>
                <td>${fault.FRT_ASSIGNED || '-'}</td>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        <button type="button" class="btn btn-outline-primary" onclick="viewFaultDetails('${fault.FAULT_ID}')" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                      
                        
                         ${getEditDeleteButton(fault)}
                   
                    </div>
                </td>
            </tr>
       


        `;
        tbody.append(row);
    });
}
function applyFiltersRestored() {
    const filters = {
        oa: $('#filterOA_restored').val(),
        maintained_by: $('#filterMaintainedBy_restored').val(),
        route_owner: $('#filterRouteOwner_restored').val(),
        route: $('#filterRoute_restored').val(),
        date_from: $('#reportDateFrom_restored').val(),
        date_to: $('#reportDateTo_restored').val(),


    };
    
    loadRestoredFaults(filters);
}
function getEditDeleteButton(fault) {
    const userRole = localStorage.getItem('user_role') || 'user';
    
    if (userRole === 'Suadmin') {
        return `<button type="button" class="btn btn-outline-warning" onclick="editRestoredFault('${fault.FAULT_ID}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>`;
        // Only Suadmin can delete faults
        return `<button type="button" class="btn btn-outline-danger" onclick="deleteRestoredFault('${fault.FAULT_ID}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>`;
    }
    
    return ''; // No delete button shown for other roles
}

function editRestoredFault(faultId) {
    // Get fault details and load into add fault form
    $.ajax({
        url: 'php/get_fault_details.php',
        type: 'GET',
        data: { fault_id: faultId },
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                loadRestoredFaultPageForEdit(response.fault);
            } else {
                showAlert('Error loading fault details: ' + response.message, 'danger');
            }
        },
        error: function() {
            showAlert('Failed to load fault details', 'danger');
        }
    });
}

function deletePRestoredFault(faultId) {

    let text = "Confirm to Delete a fault .";
        if (confirm(text) == true) {
            $.ajax({
                url: 'php/delete_fault.php',
                type: 'POST',
                data: { fault_id: faultId,role:localStorage.getItem('user_role') },
                dataType: 'json',
                success: function(response) {
                    if (response.success) {
                        loadRestoredFaultsPage();
                    } else {
                        showAlert('Error loading fault details: ' + response.message, 'danger');
                    }
                },
                error: function() {
                    showAlert('Failed to load fault details', 'danger');
                }
            });
        
        } 
    // Get fault details and load into add fault form
    
}
function refreshRestoredFaults() {
    $('#filterOA').val('');
    $('#filterMaintainedBy').val('');
    $('#filterRouteOwner').val('');
    $('#filterRoute').val('');
    loadPeRestoredFaults();
}
function exportRestored() {
    exportToExcel(restoredFaults);
}