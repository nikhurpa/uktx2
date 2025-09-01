let pendingFaults = [];
function loadPendingFaultsPage(pagetype='') {

    $('#page-content').html(`
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Pending Faults</h5>
                <div class="btn-group" role="group">
                    <button type="button" class="btn btn-outline-primary btn-sm" onclick="exportPending()">
                        <i class="fas fa-download me-1"></i>Export
                    </button>
                    <button type="button" class="btn btn-outline-success btn-sm" onclick="refreshPendingFaults()">
                        <i class="fas fa-sync-alt me-1"></i>Refresh
                    </button>
                </div>
            </div>
            <div class="card-body">
                <!-- Filters -->
                <div class="row mb-3">
                    <div class="col-md-3">
                        <label for="filterOA" class="form-label">Filter by OA</label>
                        <select class="form-select" id="filterOA">
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
                        <select class="form-select" id="filterMaintainedBy">
                            <option value="">All</option>
                            <option value="BA">BA</option>
                            <option value="CNTX">CNTX</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <label for="filterRouteOwner" class="form-label">Filter by Route Owner</label>
                        <select class="form-select" id="filterRouteOwner">
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
                        <input type="text" class="form-control" id="filterRoute" placeholder="Route name">
                    </div>
                    <div class="col-md-2">
                        <label class="form-label">&nbsp;</label>
                        <div class="d-grid">
                            <button type="button" class="btn btn-primary" onclick="applyFilters()">
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
                                <th>Fault ID <br>OA & Maintained By</th>
                                <th>Fault <br> Type</th>
                                <th>Route <br>Location</th>
                                <th>Route Owner</th>
                                <th>Elements affected <br><span class="badge bg-info">BTS</span> <span class="badge bg-warning">OLT</span> <span class="badge bg-success">LL</span> <span class="badge bg-danger">EXH</span></th>
                                <th>Fault Date<br> Time Hrs Pending</th>
                                <th>Linear <br> Ring</th>
                                <th>FRT Assigned</th>
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
    let page={};
    page.type=pagetype;
    // Load pending faults
    loadPendingFaults(page);
    
    // Add event listeners for filters
    $('#filterOA, #filterMaintainedBy, #filterRouteOwner').on('change', function() {
        applyFilters();
    });
    
    $('#filterRoute').on('keyup', function(e) {
        if (e.key === 'Enter') {
            applyFilters();
        }
    });
}

function loadPendingFaults(filters = {}) {
    // Add user role and OA to filters
    filters.user_role = localStorage.getItem('user_role') || 'user';
    filters.user_oa = localStorage.getItem('user_oa') || '';
    
    $.ajax({
        url: 'php/get_pending_faults.php',
        type: 'GET',
        data: filters,
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                displayPendingFaults(response.faults);
                pendingFaults=response.faults;
            } else {
                showAlert('Error loading pending faults: ' + response.message, 'danger');
            }
        },
        error: function() {
            showAlert('Failed to load pending faults', 'danger');
        }
    });
}

function displayPendingFaults(faults) {
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
            
                <td><strong>${fault.FAULT_ID}</strong><br><span class="badge bg-secondary">${fault.OA}</span> <span class="badge bg-info">${fault.MAINTAINED_BY}</span></td>
                <td><span class="badge ${faultTypeClass}">${fault.FAULT_TYPE}</span></td>
                <td>${fault.ROUTE_BRIEF}<br>${fault.LOCATION_BRIEF}</td>
                <td><span class="badge bg-primary">${fault.ROUTE_OWNER || 'OTHER'}</span></td>
                <td><span class="badge bg-info">${elements.BTS}</span> <span class="badge bg-warning">${elements.OLT}</span> <span class="badge bg-success">${elements.LEASED_LINE}</span> <span class="badge bg-danger">${elements.EXCH}</span></td>
                <td>${fault.FAULT_DATE}<br><small class="text-muted">${fault.FAULT_TIME}</small> <span class="badge bg-info">${fault.HOURS_PENDING}</span> </td>
                <td><span class="badge bg-info">${fault.ROUTE_RING_LINEAR}</span></td>
                <td>${fault.FRT_ASSIGNED || '-'}</td>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        <button type="button" class="btn btn-outline-primary" onclick="viewFaultDetails('${fault.FAULT_ID}')" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                      
                         ${getRestoreButton(fault)}
                         ${getEditButton(fault)}
                         ${getDeleteButton(fault)}
                    </div>
                </td>
            </tr>
       


        `;
        tbody.append(row);
    });
}

function applyFilters() {
    const filters = {
        oa: $('#filterOA').val(),
        maintained_by: $('#filterMaintainedBy').val(),
        route_owner: $('#filterRouteOwner').val(),
        route: $('#filterRoute').val()
    };
    
    loadPendingFaults(filters);
}

function refreshPendingFaults() {
    $('#filterOA').val('');
    $('#filterMaintainedBy').val('');
    $('#filterRouteOwner').val('');
    $('#filterRoute').val('');
    loadPendingFaults();
}

function exportPendingFaults() {
    const filters = {
        oa: $('#filterOA').val(),
        maintained_by: $('#filterMaintainedBy').val(),
        route_owner: $('#filterRouteOwner').val(),
        route: $('#filterRoute').val(),
        export: true
    };
    
    // Create a form to submit the export request
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'php/export_pending_faults.php';
    
    Object.keys(filters).forEach(key => {
        if (filters[key]) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = filters[key];
            form.appendChild(input);
        }
    });
    
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
}

function viewFaultDetails(faultId) {
    // Load fault details in a modal
    $.ajax({
        url: 'php/get_fault_details.php',
        type: 'GET',
        data: { fault_id: faultId },
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                showFaultDetailsModal(response.fault);
            } else {
                showAlert('Error loading fault details: ' + response.message, 'danger');
            }
        },
        error: function() {
            showAlert('Failed to load fault details', 'danger');
        }
    });
}

function restoreFault(faultId) {
    if (confirm('Are you sure you want to mark this fault as restored?')) {
        // Load restoration form
        loadRestorationForm(faultId);
    }
}

function editFault(faultId) {
    // Load edit form
    loadEditFaultForm(faultId);
}

function showFaultDetailsModal(fault) {
    const modal = `
        <div class="modal fade" id="faultDetailsModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Fault Details - ${fault.FAULT_ID}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6>Basic Information</h6>
                                <table class="table table-sm">
                                    <tr><td><strong>Fault ID:</strong></td><td>${fault.FAULT_ID}</td></tr>
                                    <tr><td><strong>OA:</strong></td><td>${fault.OA}</td></tr>
                                    <tr><td><strong>Date:</strong></td><td>${fault.FAULT_DATE}</td></tr>
                                    <tr><td><strong>Time:</strong></td><td>${fault.FAULT_TIME}</td></tr>
                                    <tr><td><strong>Route:</strong></td><td>${fault.ROUTE_BRIEF}</td></tr>
                                    <tr><td><strong>Location:</strong></td><td>${fault.LOCATION_BRIEF}</td></tr>
                                </table>
                            </div>
                            <div class="col-md-6">
                                <h6>Additional Information</h6>
                                <table class="table table-sm">
                                    <tr><td><strong>Maintained By:</strong></td><td>${fault.MAINTAINED_BY}</td></tr>
                                    <tr><td><strong>Route Owner:</strong></td><td>${fault.ROUTE_OWNER || 'OTHER'}</td></tr>
                                    <tr><td><strong>FRT Assigned:</strong></td><td>${fault.FRT_ASSIGNED || '-'}</td></tr>
                                    <tr><td><strong>ETR:</strong></td><td>${fault.ETR || '-'}</td></tr>
                                    <tr><td><strong>Route Type:</strong></td><td>${fault.ROUTE_RING_LINEAR}</td></tr>
                                    <tr><td><strong>Coordinates:</strong></td><td>${fault.LOCATION_LATLONG || '-'}</td></tr>
                                </table>
                            </div>
                        </div>
                        <div class="row mt-3">
                            <div class="col-12">
                                <h6>Fault Description</h6>
                                <p class="border rounded p-2 bg-light">${fault.FAULT_DESCRIPTION}</p>
                            </div>
                        </div>
                        <div class="row mt-3">
                            <div class="col-12">
                                <h6>Elements Affected</h6>
                                <div id="elementsAffectedDisplay">
                                    <!-- Elements will be displayed here -->
                                </div>
                            </div>
                        </div>
                        <div class="row mt-3">
                            <div class="col-12">
                                <h6>Fault Images</h6>
                                <div id="faultImagesDisplay">
                                    ${displayFaultImages(fault.FAULT_IMAGES)}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-success" onclick="restoreFault('${fault.FAULT_ID}')" data-bs-dismiss="modal">
                            <i class="fas fa-check me-1"></i>Mark as Restored
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    $('#faultDetailsModal').remove();
    
    // Add modal to body
    $('body').append(modal);
    
    // Show modal
    new bootstrap.Modal(document.getElementById('faultDetailsModal')).show();
    
    // Display elements affected
    if (fault.ELEMENT_AFFECTED) {
        try {
            const elements = JSON.parse(fault.ELEMENT_AFFECTED);
            let elementsHtml = '<div class="row">';
            Object.keys(elements).forEach(key => {
                if (elements[key] > 0) {
                    elementsHtml += `
                        <div class="col-md-3">
                            <div class="card bg-light">
                                <div class="card-body text-center">
                                    <h6>${key}</h6>
                                    <span class="badge bg-primary">${elements[key]}</span>
                                </div>
                            </div>
                        </div>
                    `;
                }
            });
            elementsHtml += '</div>';
            $('#elementsAffectedDisplay').html(elementsHtml);
        } catch (e) {
            $('#elementsAffectedDisplay').html('<p class="text-muted">No elements affected data available</p>');
        }
    }
}

// function showAlert(message, type) {
//     const alertDiv = $('<div class="alert alert-' + type + ' alert-dismissible fade show" role="alert">' +
//         message +
//         '<button type="button" class="btn-close" data-bs-dismiss="alert"></button>' +
//         '</div>');
    
//     $('#page-content').prepend(alertDiv);
    
//     // Auto-hide after 5 seconds
//     setTimeout(function() {
//         alertDiv.alert('close');
//     }, 5000);
// }

function displayFaultImages(faultImagesJson) {
    try {
        const faultImages = JSON.parse(faultImagesJson || '[]');
        
        if (!faultImages || faultImages.length === 0) {
            return '<div class="alert alert-info">No fault images available</div>';
        }
        
        let imagesHtml = '<div class="row">';
        faultImages.forEach((image, index) => {
            const path = image.addr || image.file_path || '';
            const name = image.original_name || `Fault Image ${index + 1}`;
            const when = image.date_time || image.upload_date || '';
            imagesHtml += `
                <div class="col-md-4 col-lg-3 mb-3">
                    <div class="card">
                        <img src="${path}" class="card-img-top" alt="Fault Image ${index + 1}" 
                             style="height: 200px; object-fit: cover; cursor: pointer;" 
                             onclick="openFaultImageModal('${path}', '${name}')">
                        <div class="card-body p-2">
                            <small class="text-muted">${name}</small>
                            <br>
                            <small class="text-muted">${when}</small>
                        </div>
                    </div>
                </div>
            `;
        });
        imagesHtml += '</div>';
        
        return imagesHtml;
    } catch (error) {
        console.error('Error parsing fault images:', error);
        return '<div class="alert alert-warning">Error loading fault images</div>';
    }
}

function openFaultImageModal(imagePath, imageName) {
    const modal = `
        <div class="modal fade" id="faultImageModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${imageName}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body text-center">
                        <img src="${imagePath}" class="img-fluid" alt="${imageName}">
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <a href="${imagePath}" class="btn btn-primary" download="${imageName}">
                            <i class="fas fa-download me-1"></i>Download
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    $('#faultImageModal').remove();
    
    // Add modal to body
    $('body').append(modal);
    
    // Show modal
    const imageModal = new bootstrap.Modal(document.getElementById('faultImageModal'));
    imageModal.show();
}

// Helper function to determine if edit button should be shown
function getEditButton(fault) {
    const userRole = localStorage.getItem('user_role') || 'user';
    const userOA = localStorage.getItem('user_oa') || '';
    const currentUser = localStorage.getItem('username') || '';
    
    if (userRole === 'Suadmin') {
        // Suadmin can edit any fault
        return `<button type="button" class="btn btn-outline-warning" onclick="editPendingFault('${fault.FAULT_ID}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>`;
    } else if (userRole === 'nodal') {
        // Nodal users can edit faults in their OA
        if (fault.OA === userOA) {
            return `<button type="button" class="btn btn-outline-warning" onclick="editPendingFault('${fault.FAULT_ID}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>`;
        }
    } else if (userRole === 'user') {
        // Users can only edit faults they created in their OA
        if (fault.OA === userOA && fault.CREATED_BY === currentUser) {
            return `<button type="button" class="btn btn-outline-warning" onclick="editPendingFault('${fault.FAULT_ID}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>`;
        }
    }
    
    return ''; // No edit button shown
}

// Helper function to determine if restore button should be shown
function getRestoreButton(fault) {
    const userRole = localStorage.getItem('user_role') || 'user';
    const userOA = localStorage.getItem('user_oa') || '';
    const currentUser = localStorage.getItem('username') || '';
    
    if (userRole === 'Suadmin') {
        // Suadmin can edit any fault
        return `<button type="button" class="btn btn-outline-success" onclick="resolveFault('${fault.FAULT_ID}')" title="Mark as Restored">
                            <i class="fas fa-check"></i>`

        // return `<button type="button" class="btn btn-outline-warning" onclick="editPendingFault('${fault.FAULT_ID}')" title="Edit">
        //             <i class="fas fa-edit"></i>
        //         </button>`;
    } else if (userRole === 'nodal') {
        // Nodal users can edit faults in their OA
        if (fault.OA === userOA) {
            return `<button type="button" class="btn btn-outline-success" onclick="resolveFault('${fault.FAULT_ID}')" title="Mark as Restored">
                            <i class="fas fa-check"></i>`

        }
    } else if (userRole === 'user') {
        // Users can only edit faults they created in their OA
        if (fault.OA === userOA && fault.CREATED_BY === currentUser) {
            return `<button type="button" class="btn btn-outline-success" onclick="resolveFault('${fault.FAULT_ID}')" title="Mark as Restored">
                            <i class="fas fa-check"></i>`

        }
    }
    
    return ''; // No edit button shown
}

// Helper function to determine if delete button should be shown
function getDeleteButton(fault) {
    const userRole = localStorage.getItem('user_role') || 'user';
    
    if (userRole === 'Suadmin') {
        // Only Suadmin can delete faults
        return `<button type="button" class="btn btn-outline-danger" onclick="deletePendingFault('${fault.FAULT_ID}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>`;
    }
    
    return ''; // No delete button shown for other roles
}
function exportPending() {
    exportToExcel(pendingFaults);
}