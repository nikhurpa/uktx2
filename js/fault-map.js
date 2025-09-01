function loadFaultMapPage() {
    $('#page-content').html(`
        <div class="card">
            <div class="card-header justify-content-between align-items-center  d-none">
                <h5 class="mb-0">Fault Map</h5>
                <div class="btn-group" role="group">
                    <button type="button" class="btn btn-outline-warning btn-sm" onclick="loadAllFaultsOnMap()">
                        <i class="fas fa-globe me-1"></i>All Faults
                    </button>
                    <button type="button" class="btn btn-outline-primary btn-sm" onclick="loadPendingFaultsOnMap()">
                        <i class="fas fa-clock me-1"></i>Pending Only
                    </button>
                    <button type="button" class="btn btn-outline-info btn-sm" onclick="refreshMap()">
                        <i class="fas fa-sync-alt me-1"></i>Refresh
                    </button>
                    <button type="button" class="btn btn-outline-secondary btn-sm" onclick="centerMap()">
                        <i class="fas fa-crosshairs me-1"></i>Center
                    </button>
                </div>
            </div>
            <div class="card-body p-0">
                <div class="row m-0">
                    <div class="col-md-12 p-0">
                        <div id="map" style="height: 780px; width: 100%;"></div>
                    </div>
                   
                </div>
            </div>
        </div>
        
        <!-- Fault Details Sidebar -->
        <div class="modal fade" id="faultMapModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="faultMapModalTitle">Fault Details</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" id="faultMapModalBody">
                        <!-- Fault details will be loaded here -->
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-success" id="restoreFaultBtn">
                            <i class="fas fa-check me-1"></i>Mark as Restored
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Polyline Details Modal -->
        <div class="modal fade" id="polylineModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="polylineModalTitle">Route Details</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" id="polylineModalBody">
                        <!-- Polyline details will be loaded here -->
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-danger" id="removePolylineBtn">
                            <i class="fas fa-trash me-1"></i>Remove from Map
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `);
    
    // Initialize map
    initMap();
 

    // Load KMZ files for filter
    loadKMZFilesForFilter();
    loadPendingFaultsForFilter();
}

let map;
let markers = [];
let polylines = [];
let currentFaultId = null;
let currentMapMode = 'pending'; // 'pending' or 'all'
let currentPolylineId = null;

let MY_MAP = {
    btsloaded : false,
    oltloaded : false,
    routeloaded : false,
    BTS :{markers: [],title_fields :["TSP_SITE_NAME","OA"],sts_field:"STATUS"},
    OLT : {markers: [],title_fields :["LOCATION","OA"],sts_field:"STATUS"},
    Faults : {markers: [],title_fields :[".FAULT_ID","ROUTE_BRIEF"],sts_field:"RESTORATION_DATE"},
    Routes : {markers: [],title_fields :["polyline_name","kmz_filename"],sts_field:"STATUS"},
    oaselected : "ALL",
    routeselected : "ALL",
    radious : "ALL",
    routefile : "ALL",
    nearbypending : "ALL",
    nearbyrestored : "ALL",
    routename : "ALL",
}; // Create the namespace if it doesn't exist

let MAP_FORM = {
    BTS:false,
    OLT:false,
    Faults: false,
    ALM:false, 
    DDN:false,
    HWR:false,
    NTL:false,
    NWT:false,
    SGR:false,
    NB_PENDING:false,
    NB_RESTORED:false,
    FAULTS:{},
    ROUTE_FILE:{},
    ROUTE_NAME:"",

}

let MAP_OA = ["ALM","DDN","HWR","NTL","NWT","SGR"]
let MAP_FORM2= {
    BTS: "on",
    OLT: "on",
    Faults: "on",
    ALM: "on",
    DDN: "on",
    SGR: "on",
    HWR: "on",
    NTL: "on",
    NWT: "on",
    kmzFilter: "UTTARAKHAND CNTX OFC KMLs.kmz",
    mapFaults: "",
    nearbyPending: "on",
    nearbyRestored: "on",
    routeNameFilter: "mm",
    routeRadius: "10",

}
const polylineColor = {
    'CIRCLE': '#FFCC00',
    'CNTX': '#FF0000',
    'VTL': '#00CC00',
    'NOFN': '#0000FF',
};

function initMap() {
  

     
    // Default center (you can change this to your preferred location)
    const defaultCenter = { lat: 20.5937, lng: 78.9629 }; // India center
    
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 6,
        center: defaultCenter,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: [
            {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
            }
        ]
    });
    
    // Load pending faults on map by default
    //loadPendingFaultsOnMap();
}

function loadKMZFilesForFilter() {
    $.ajax({
        url: 'php/get_all_polylines.php',
        type: 'GET',
        data: { limit: 1 }, // Just to get the KMZ files list
        dataType: 'json',
        success: function(response) {
            if (response.success && response.kmz_files) {
                const kmzSelect = $('#kmzFilter');
                response.kmz_files.forEach(kmzFile => {
                    kmzSelect.append(`<option value="${kmzFile}">${kmzFile}</option>`);
                });
            }
        },
        error: function() {
            console.log('Failed to load KMZ files for filter');
        }
    });
}


function loadPendingFaultsForFilter(){

    $.ajax({
        url: 'php/get_pending_faults.php',
        type: 'GET',
        // data: { limit: 1 }, // Just to get the KMZ files list
        dataType: 'json',
        success: function(response) {
            if (response.success && response.faults) {
                const mapFaults = $('#mapFaults');
                response.faults.forEach(fault => {
                    mapFaults.append(`<option value="${fault.FAULT_ID}">${fault.FAULT_ID}</option>`);
                });
            }
        },
        error: function() {
            console.log('Failed to load Faults for filter');
        }
    });

   
}
function loadPendingFaultsOnMap() {
    console.log("pending")
    currentMapMode = 'pending';
    $.ajax({
        url: 'php/get_pending_faults.php',
        type: 'GET',
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                displayFaultsOnMap(response.faults, 'pending');
            } else {
                showAlert('Error loading pending faults: ' + response.message, 'danger');
            }
        },
        error: function() {
            showAlert('Failed to load pending faults for map', 'danger');
        }
    });
}

function loadAllFaultsOnMap() {
    currentMapMode = 'all';
    $.ajax({
        url: 'php/get_all_faults.php',
        type: 'GET',
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                displayFaultsOnMap(response.faults, 'all');
            } else {
                showAlert('Error loading all faults: ' + response.message, 'danger');
            }
        },
        error: function() {
            showAlert('Failed to load all faults for map', 'danger');
        }
    });
}

function loadFaultsOnMap() {
    // This function is kept for backward compatibility
    loadPendingFaultsOnMap();
}

function displayFaultsOnMap(faults, mode = 'pending') {
    // Clear existing markers
    clearMarkers();
  
    if (faults.length === 0) {
        const message = mode === 'pending' ? 'No pending faults found to display on map' : 'No faults found to display on map';
        showAlert(message, 'info');
        return;
    }
    
    const bounds = new google.maps.LatLngBounds();
    let hasValidCoordinates = false;
    let pendingCount = 0;
    let resolvedCount = 0;
    
    faults.forEach(fault => {
        if (fault.LOCATION_LATLONG && fault.LOCATION_LATLONG.trim() !== '') {
            const coords = parseCoordinates(fault.LOCATION_LATLONG);
            if (coords) {
                const marker = createFaultMarker(fault, coords, mode);
                markers.push(marker);
                bounds.extend(coords);
                hasValidCoordinates = true;
               
               // now populate sidebar fault select element
                const mapFaults = $('#mapFaults');
                mapFaults.append(`<option value="${fault.FAULT_ID}">${fault.FAULT_ID}</option>`);
                
               // Count by status
                if (fault.RESTORATION_DATE) {
                    resolvedCount++;
                } else {
                    pendingCount++;
                }
            }
        }
    });
    
    if (hasValidCoordinates) {
        map.fitBounds(bounds);
        
        // If only one marker, zoom in a bit
        if (markers.length === 1) {
            map.setZoom(12);
        }
        
        const statusMessage = mode === 'all' 
            ? `${markers.length} faults shown (${pendingCount} pending, ${resolvedCount} resolved)`
            : `${markers.length} pending faults shown`;
        showAlert(statusMessage, 'success');
    } else {
        showAlert('No faults with valid coordinates found', 'warning');
    }
}

function parseCoordinates(coordString) {
    try {
        const parts = coordString.split(',');
        if (parts.length === 2) {
            const lat = parseFloat(parts[0].trim());
            const lng = parseFloat(parts[1].trim());
            
            if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                return { lat: lat, lng: lng };
            }
        }
    } catch (e) {
        console.error('Error parsing coordinates:', e);
    }
    return null;
}

function createFaultMarker(fault, position, mode = 'pending') {
    // Create custom marker icon based on OA and status
    const isResolved = fault.RESTORATION_DATE;
    const icon = {
        url: getMarkerIcon(fault.OA, isResolved, fault.FAULT_TYPE),
        scaledSize: new google.maps.Size(24, 24),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(12, 24)
    };
    
    const marker = new google.maps.Marker({
        position: position,
        map: map,
        icon: icon,
        title: `${fault.FAULT_ID} - ${fault.ROUTE_BRIEF} (${isResolved ? 'Resolved' : 'Pending'})`
    });
    
    // Create info window
    const infoWindow = new google.maps.InfoWindow({
        content: createInfoWindowContent(fault, mode)
    });
    
    // Add click listener
    marker.addListener('click', function() {
        infoWindow.open(map, marker);
    });
    
    return marker;
}

function getMarkerIcon(oa, isResolved = false, faultType = 'normal') {
    // Base colors for different fault types
    const faultTypeColors = {
        'critical': '#DC3545', // Red
        'urgent': '#FD7E14',   // Orange
        'normal': '#6C757D'    // Gray
    };
    
    const baseColor = faultTypeColors[faultType] || '#6C757D'; // Default gray
    
    // Create SVG icon with status indication
    const statusColor = isResolved ? '#27AE60' : '#E74C3C'; // Green for resolved, red for pending
    const statusSymbol = isResolved ? '✓' : '!';
    
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="${baseColor}" stroke="${statusColor}" stroke-width="2"/>
            <text x="12" y="16" font-family="Arial" font-size="12" font-weight="bold" text-anchor="middle" fill="white">${statusSymbol}</text>
        </svg>
    `)}`;
}

function createInfoWindowContent(fault, mode = 'pending') {
    const statusClass = fault.RESTORATION_DATE ? 'text-success' : 'text-danger';
    const statusText = fault.RESTORATION_DATE ? 'Restored' : 'Pending';
    const statusIcon = fault.RESTORATION_DATE ? '<i class="fas fa-check-circle me-1"></i>' : '<i class="fas fa-times-circle me-1"></i>';

    // Fault type styling
    const faultTypeColors = {
        'critical': 'bg-danger',
        'urgent': 'bg-warning',
        'normal': 'bg-secondary'
    };
    const faultTypeClass = faultTypeColors[fault.FAULT_TYPE] || 'bg-secondary';

    let actionButton = '';
    if (!fault.RESTORATION_DATE) {
        // Only show resolve button for pending faults
        actionButton = `
            <button onclick="resolveFaultFromMap('${fault.FAULT_ID}')" style="background: #28a745; color: white; border: none; padding: 4px 8px; border-radius: 3px; font-size: 11px; cursor: pointer; margin-left: 5px;">
                <i class="fas fa-check me-1"></i>Resolve
            </button>
        `;
    }

    return `
        <div style="min-width: 200px;">
            <h6 style="margin: 0 0 8px 0; color: #333;">${fault.FAULT_ID}</h6>
            <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Route:</strong> ${fault.ROUTE_BRIEF}</p>
            <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Location:</strong> ${fault.LOCATION_BRIEF}</p>
            <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Date:</strong> ${fault.FAULT_DATE}</p>
            <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>OA:</strong> <span style="color: #666;">${fault.OA}</span></p>
            <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Type:</strong> <span class="badge ${faultTypeClass} text-white">${fault.FAULT_TYPE || 'normal'}</span></p>
            <p style="margin: 0 0 8px 0; font-size: 12px;"><strong>Status:</strong> <span class="${statusClass}">${statusIcon} ${statusText}</span></p>
            <div style="margin-top: 8px;">
                <button onclick="viewFaultFromMap('${fault.FAULT_ID}')" style="background: #007bff; color: white; border: none; padding: 4px 8px; border-radius: 3px; font-size: 11px; cursor: pointer;">
                    View Details
                </button>
                ${actionButton}
            </div>
        </div>
    `;
}

function viewFaultFromMap(faultId) {
    $.ajax({
        url: 'php/get_fault_details.php',
        type: 'GET',
        data: { fault_id: faultId },
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                showFaultMapModal(response.fault);
            } else {
                showAlert('Error loading fault details: ' + response.message, 'danger');
            }
        },
        error: function() {
            showAlert('Failed to load fault details', 'danger');
        }
    });
}

function showFaultMapModal(fault) {
    $('#faultMapModalTitle').text(`Fault Details - ${fault.FAULT_ID}`);
    
    const modalContent = `
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
    `;
    
    $('#faultMapModalBody').html(modalContent);
    
    // Set current fault ID for restoration
    currentFaultId = fault.FAULT_ID;
    
    // Show modal
    new bootstrap.Modal(document.getElementById('faultMapModal')).show();
    
    // Add event listener for restore button
    $('#restoreFaultBtn').off('click').on('click', function() {
        if (currentFaultId) {
            restoreFault(currentFaultId);
        }
    });
}

function clearMarkers() {
    markers.forEach(marker => {
        marker.setMap(null);
    });
    markers = [];
}

function refreshMap() {
    if (currentMapMode === 'all') {
        loadAllFaultsOnMap();
    } else {
        loadPendingFaultsOnMap();
    }
}

function centerMap() {
    if (markers.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        markers.forEach(marker => {
            bounds.extend(marker.getPosition());
        });
        map.fitBounds(bounds);
    }
}

function restoreFault(faultId) {
    if (confirm('Are you sure you want to mark this fault as restored?')) {
        // Redirect to resolve faults page and select the fault
        loadPage('resolved-faults');
        // Store the fault ID to be selected
        localStorage.setItem('selected_fault_for_resolution', faultId);
        // Close modal
        bootstrap.Modal.getInstance(document.getElementById('faultMapModal')).hide();
        // Small delay to ensure page is loaded
        setTimeout(() => {
            selectFaultForResolution(faultId);
        }, 500);
    }
}

function resolveFaultFromMap(faultId) {
    // Close info window
    google.maps.event.trigger(map, 'closeclick');
    
    // Load restoration form directly
    loadRestorationForm(faultId);
} 

function loadPolylinesNearFaults() {
    clearPolylines()
    let faultmarkers= MY_MAP["Faults"].markers;
    if (faultmarkers.length === 0) {
        showAlert('No faults loaded on map. Please load faults first.', 'warning');
        return;
    }
    const kmzFilter = $('#kmzFilter').val();
    // Get the first fault marker as reference point
    const firstMarker = faultmarkers[0];
    // const position = firstMarker.getPosition();
    const radius = $('#searchRadius').val();
    for (let marker of faultmarkers) {
        position = marker.getPosition();
        $.ajax({
            url: 'php/get_polylines_near_faults.php',
            type: 'GET',
            data: {
                lat: position.lat(),
                lng: position.lng(),
                kmz_file: kmzFilter.map(file => `'${file}'`).join(','),
                radius: radius
            },
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    displayPolylinesOnMap(response.polylines, 'near_faults');
                    // showAlert(`Found ${response.count} routes within ${radius}km of fault points`, 'success');
                } else {
                    // showAlert('Error loading routes: ' + response.message, 'danger');
                }
            },
            error: function() {
                // showAlert('Failed to load routes near faults', 'danger');
            }
        });
      }




}

function loadAllPolylines() {
    const kmzFilter = $('#kmzFilter').val();
    const nameFilter = $('#routeNameFilter').val();
    clearPolylines()
    $.ajax({
        url: 'php/get_all_polylines.php',
        type: 'GET',
        data: {
            kmz_file: kmzFilter.map(file => `'${file}'`).join(','),
            name: nameFilter,
            limit: 100
        },
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                displayPolylinesOnMap(response.polylines, 'all');
                showAlert(`Loaded ${response.count} routes`, 'success');
            } else {
                showAlert('Error loading routes: ' + response.message, 'danger');
            }
        },
        error: function() {
            showAlert('Failed to load routes', 'danger');
        }
    });
}

function displayPolylinesOnMap(polylinesData, source = 'all') {
    // Clear existing polylines
    // clearPolylines();
    
    if (polylinesData.length === 0) {
        showAlert('No routes found to display', 'info');
        return;
    }
    
    polylinesData.forEach(polylineData => {
        try {
            // Decode Google encoded polyline
            const coordinates = google.maps.geometry.encoding.decodePath(polylineData.google_encoded_polyline);
            
            if (coordinates.length > 0) {
                const polyline = new google.maps.Polyline({
                    path: coordinates,
                    geodesic: true,
                    // strokeColor: getPolylineColor(polylineData, source),
                    strokeColor: polylineColor[polylineData.polyline_description],
                    strokeOpacity: 0.8,
                    strokeWeight: 3,
                    map: map
                });
                
                // Store polyline reference with metadata
                const polylineInfo = {
                    polyline: polyline,
                    data: polylineData,
                    source: source
                };
                
                polylines.push(polylineInfo);
                
                // Add click listener
                polyline.addListener('click', function() {
                    showPolylineModal(polylineData);
                });
                
                // Add info window on hover
                const infoWindow = new google.maps.InfoWindow({
                    content: createPolylineInfoWindow(polylineData, source)
                });
                
                polyline.addListener('mouseover', function() {
                    infoWindow.open(map, polyline);
                });
                
                polyline.addListener('mouseout', function() {
                    infoWindow.close();
                });
            }
        } catch (error) {
            console.error('Error displaying polyline:', error);
        }
    });
    
    // Update polyline list
    updatePolylineList();
    
    // Fit map to show all polylines
    if (polylines.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        polylines.forEach(polylineInfo => {
            polylineInfo.polyline.getPath().forEach(coord => {
                bounds.extend(coord);
            });
        });
        map.fitBounds(bounds);
    }
}

function getPolylineColor(polylineData, source) {

    
    if (source === 'near_faults') {
        // Color based on distance to fault
        const minDistance = polylineData.min_distance_km;
        if (minDistance <= 2) return '#FF0000';      // Red for very close
        if (minDistance <= 5) return '#FF6600';      // Orange for close
        if (minDistance <= 10) return '#FFCC00';     // Yellow for medium
        return '#00CC00';                            // Green for far
    } else {
        // Color based on KMZ file or random
        const colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b'];
        const index = polylineData.kmz_filename.length % colors.length;
        return colors[index];
    }
}

function createPolylineInfoWindow(polylineData, source) {
    let distanceInfo = '';
    if (source === 'near_faults') {
        distanceInfo = `
            <div><strong>Distance to Fault:</strong> ${polylineData.min_distance_km} km</div>
            <div><strong>Start Distance:</strong> ${polylineData.start_distance_km} km</div>
            <div><strong>End Distance:</strong> ${polylineData.end_distance_km} km</div>
        `;
    }
    
    return `
        <div style="min-width: 200px;">
            <h6 style="margin: 0 0 8px 0; color: #333;">${polylineData.polyline_name || 'Unnamed Route'}</h6>
            <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>File:</strong> ${polylineData.kmz_filename}</p>
            <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Coordinates:</strong> ${polylineData.coordinates_count}</p>
            <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Start:</strong> ${polylineData.start_lat}, ${polylineData.start_lng}</p>
            <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>End:</strong> ${polylineData.end_lat}, ${polylineData.end_lng}</p>
            ${distanceInfo}
            <div style="margin-top: 8px;">
                <button onclick="showPolylineModal('${polylineData.id}')" style="background: #007bff; color: white; border: none; padding: 4px 8px; border-radius: 3px; font-size: 11px; cursor: pointer;">
                    View Details
                </button>
            </div>
        </div>
    `;
}

function showPolylineModal(polylineData) {
    if (typeof polylineData === 'string') {
        // Find polyline by ID
        const polylineInfo = polylines.find(p => p.data.id == polylineData);
        if (polylineInfo) {
            polylineData = polylineInfo.data;
        }
    }
    
    if (!polylineData) return;
    
    currentPolylineId = polylineData.id;
    
    $('#polylineModalTitle').text(`Route Details - ${polylineData.polyline_name || 'Unnamed'}`);
    
    const modalContent = `
        <div class="row">
            <div class="col-md-6">
                <h6>Route Information</h6>
                <table class="table table-sm">
                    <tr><td><strong>Name:</strong></td><td>${polylineData.polyline_name || 'Unnamed'}</td></tr>
                    <tr><td><strong>KMZ File:</strong></td><td>${polylineData.kmz_filename}</td></tr>
                    <tr><td><strong>Coordinates:</strong></td><td>${polylineData.coordinates_count}</td></tr>
                    <tr><td><strong>Created:</strong></td><td>${polylineData.created_at}</td></tr>
                </table>
            </div>
            <div class="col-md-6">
                <h6>Coordinates</h6>
                <table class="table table-sm">
                    <tr><td><strong>Start Lat:</strong></td><td>${polylineData.start_lat}</td></tr>
                    <tr><td><strong>Start Lng:</strong></td><td>${polylineData.start_lng}</td></tr>
                    <tr><td><strong>End Lat:</strong></td><td>${polylineData.end_lat}</td></tr>
                    <tr><td><strong>End Lng:</strong></td><td>${polylineData.end_lng}</td></tr>
                </table>
            </div>
        </div>
        <div class="row mt-3">
            <div class="col-12">
                <h6>Description</h6>
                <p class="border rounded p-2 bg-light">${polylineData.polyline_description || 'No description available'}</p>
            </div>
        </div>
        <div class="row mt-3">
            <div class="col-12">
                <h6>Bounding Box</h6>
                <p class="border rounded p-2 bg-light">${polylineData.bounding_box || 'Not available'}</p>
            </div>
        </div>
    `;
    
    $('#polylineModalBody').html(modalContent);
    
    // Show modal
    new bootstrap.Modal(document.getElementById('polylineModal')).show();
    
    // Add event listener for remove button
    $('#removePolylineBtn').off('click').on('click', function() {
        if (currentPolylineId) {
            removePolylineFromMap(currentPolylineId);
            bootstrap.Modal.getInstance(document.getElementById('polylineModal')).hide();
        }
    });
}

function removePolylineFromMap(polylineId) {
    const index = polylines.findIndex(p => p.data.id == polylineId);
    if (index !== -1) {
        const polylineInfo = polylines[index];
        polylineInfo.polyline.setMap(null);
        polylines.splice(index, 1);
        updatePolylineList();
        showAlert('Route removed from map', 'success');
    }
}

function clearAllPolylines() {
    polylines.forEach(polylineInfo => {
        polylineInfo.polyline.setMap(null);
    });
    polylines = [];
    updatePolylineList();
    // showAlert('All routes cleared from map', 'success');
}

function updatePolylineList() {
    const listContainer = $('#polylineList');
    
    if (polylines.length === 0) {
        listContainer.html('<div class="text-muted">No routes loaded</div>');
        return;
    }
    
    let listHtml = '';


    polylines.forEach((polylineInfo, index) => {
        const data = polylineInfo.data;
        // const color = getPolylineColor(data, polylineInfo.source);
        const color = polylineColor[data.polyline_description];
        const distanceInfo = polylineInfo.source === 'near_faults' 
            ? `<br><small class="text-muted">${data.min_distance_km} km from fault</small>`
            : '';
        
        listHtml += `
            <div class="border rounded p-2 mb-2" style="border-left: 4px solid ${color} !important;">
                <div class="fw-bold small">${data.polyline_name || 'Unnamed Route'}</div>
                                <div class="text-muted small">${data.kmz_filename}</div>
                                <div class="text-muted small">${data.coordinates_count} points</div>
                                ${distanceInfo}
                                <div class="mt-2">
                                    <button class="btn btn-sm btn-outline-danger" onclick="removePolylineFromMap('${data.id}')">
                                        <i class="fas fa-times"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-info" onclick="showPolylineModal('${data.id}')">
                                        <i class="fas fa-info"></i>
                                    </button>
                                </div>
                            </div>
                        `;
    });
    
    listContainer.html(listHtml);
}

function clearPolylines() {
    polylines.forEach(polylineInfo => {
        polylineInfo.polyline.setMap(null);
    });
    polylines = [];
} 

////////////////////////////////////////////////////////////

function loadMapSideBar() {

    const mapsidebar = `
    <form id="myForm">
                            <h6 class="mb-3">Layer Controls</h6>
    
                            <div style="display:flex; gap:1rem; align-items:center;">
                            <label><input type="checkbox" id="BTS" name="BTS"> BTS</label>
                            <label><input type="checkbox" id="OLT" name="OLT"> OLT</label>
                            <label><input type="checkbox" id="Faults" name="Faults" checked> Faults</label>
                            </div>
    
                             <div class="mb-3">
                                <label class="form-label small">Select OA</label>
                            <div style="display:flex; gap:1rem; align-items:center;">
                            <label><input type="checkbox" id="DDN" name="DDN" > DDN</label>
                            <label><input type="checkbox" id="HWR" name="HWR" > HWR</label>
                            <label><input type="checkbox"id="NTL"  name="NTL" > NTL</label>
                            </div>
                            <div style="display:flex; gap:1rem; align-items:center;">
                            <label><input type="checkbox" id="NWT" name="NWT"   > NWT</label>
                            <label><input type="checkbox" id="SGR" name="SGR" > SGR</label>
                            <label><input type="checkbox" id="ALM" name="ALM" > ALM</label>
                            </div>
                               <!-- <select id="searchRadius" name="oa" class="form-select form-select-sm" multiple>
                                    <option value="ALL">All</option>
                                    <option value="ALM" selected>Almora</option>
                                    <option value="DDN">Dehradun</option>
                                    <option value="HWR">Haridwar</option>
                                    <option value="NTL">Nainital</option>
                                    <option value="NWT">New Tehri</option>
                                    <option value="SGR">Srinagar</option>
                                </select>-->
                            </div>
                            
                           <div class="mb-3">
                                <label class="form-label small">Select A Fault</label>
                                <select id="mapFaults" name="mapFaults" class="form-select form-select-sm">
                                    <option value="">All Pending Faults</option>
                                </select>
                            </div>
    
                            <div id="nearbycheckbox" style="display:flex; gap:1rem; align-items:center;">
                                <label><input id="nearbypending" name="nearbyPending" type="checkbox"> Nearby Pending</label>
                                <label><input id="nearbyrestored" name="nearbyRestored" type="checkbox"> Nearby Restored</label>
                               
                            </div>
    
                            <!-- Polyline Search Controls -->
                            <div class="mb-3">
                                <label class="form-label small">Route Radius (km)</label>
                                <select id="routeRadius" name="routeRadius" class="form-select form-select-sm">
                                    <option value="ALL">ALL</option>
                                    <option value="5">5 km</option>
                                    <option value="10" selected>10 km</option>
                                    <option value="20">20 km</option>
                                    <option value="50">50 km</option>
                                    
                                </select>
                            </div>
                           
                            <div class="mb-3">
                                <label class="form-label small">KMZ File Filter</label>
                                <select id="kmzFilter" name="kmzFilter" class="form-select form-select-sm" multiple>
                                    <option value="">All Files</option>
                                </select>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label small">Route Name Filter</label>
                                <input type="text" id="routeNameFilter" name="routeNameFilter" class="form-control form-control-sm" placeholder="Search routes...">
                            </div>
                            
                            <!-- Action Buttons -->
                            <div class="d-grid gap-2 mb-3">
                                <button type="button" class="btn btn-success btn-sm" onclick="loadPolylinesNearFaults()">
                                    <i class="fas fa-route me-1"></i>Show Routes Near Faults
                                </button>
                                <button type="button" class="btn btn-info btn-sm" onclick="loadAllPolylines()">
                                    <i class="fas fa-list me-1"></i>Show All Routes
                                </button>
                                <button type="button" class="btn btn-warning btn-sm" onclick="clearAllPolylines()">
                                    <i class="fas fa-times me-1"></i>Clear All Routes
                                </button>
                            </div>
                            
                            <!-- Polyline List -->
                            <div id="polylineList" class="small">
                                <div class="text-muted">No routes loaded</div>
                            </div>
                       
    </form>  
    
    `
    
    var $sidebar = $('.control-sidebar')
    $sidebar.empty();
    
    var $container = $('<div />', {
      class: 'p-3 control-sidebar-content'
    })
    
    $sidebar.append($container)
    $container.append(mapsidebar)

    let useroa = localStorage.getItem('user_oa') ;
        let OA_CODE={
            ALMORA:"ALM",
            DEHRADUN:"DDN",
            HARIDWAR:"HWR",
            NAINITAL:"NTL",
            UTTARKASHI:"NWT",
            KOTDWARA:"SGR"
        }
    
        $("#" + OA_CODE[useroa]).prop("checked", true)
   
    
}

function hideMapSideBar(){
    $('#mapsidebarcontrol').hide();
    $('.control-sidebar').css("display", "none");

}

function trackFormEvents(formId) { 
    const form = document.getElementById(formId);
  
    if (!form) {
      console.error("Form not found with id:", formId);
      return;
    }
      
     form.addEventListener("change", function(e) {
        const target = e.target;
        const type = target.type;
        const name = target.name;
        const value = (type === "checkbox") ? target.checked : target.value;
        console.log(`Changed: ${name} (${type}) →`, value);

        
         for (const key of Object.keys(MAP_FORM2)) {
            MAP_FORM2[key] = ($("#" + key).attr("type") === "checkbox") 
            ? $("#" + key).prop("checked") 
            : $("#" + key).val();
            
          }
     
        console.log(MAP_FORM2);
        mapLoad(name,type,value)
      });

    


    
}

function mapLoad(name,type,value) {
    let oanames ={
     ALM:"ALMORA",
     DDN:"DEHRADUN",
     HWR:"HARIDWAR",
     NTL:"NAINITAL",
     NWT:"UTTARKASHI",
     SGR:"KOTDWARA",
    }
    let selected_oa= []
    MAP_OA.forEach(oa => {
        if ($("#" + oa).prop("checked") ) {
            selected_oa.push(oanames[oa]);
           }
    });   
    if (selected_oa.length==0){
        showAlert("No OA selected");
        clearMapMarker("BTS");
        clearMapMarker("OLT");
        return;
    } 

    let oa_query= " UPPER(OA) IN (" + selected_oa.map(name => `"${name}"`).join(", ") + ") ";
    let sql = { BTS:"",OLT:"",Faults:"",Routes:""}

    sql["BTS"]="SELECT * FROM BTS WHERE " + oa_query +  "AND LOCATION_LATLONG IS NOT NULL AND LOCATION_LATLONG != ''";
    sql["OLT"]="SELECT * FROM OLT WHERE " + oa_query +  "AND LOCATION_LATLONG IS NOT NULL AND LOCATION_LATLONG != ''";
    sql["Faults"] = "SELECT * FROM FAULTS WHERE " +  oa_query + " AND RESTORATION_DATE IS NULL AND LOCATION_LATLONG IS NOT NULL AND LOCATION_LATLONG != ''";

    if(name == "BTS" || name=="OLT" || name=="Faults") {

        ($(`#${name}`).prop("checked") == true)?  getData(sql[name],loarMarker,name) :  clearMapMarker(name);
       
        // getData(sql[name],loarMarker,name);
    } else if (MAP_OA.includes(name)) {

        // ($(`#${name}`).prop("checked") == true)?  getData(sql[name],loarMarker,name) :  clearMapMarker(name);
        ($(`#BTS`).prop("checked") == true)?  getData(sql["BTS"],loarMarker,"BTS") :  clearMapMarker("BTS");
        ($(`#OLT`).prop("checked") == true)?  getData(sql["OLT"],loarMarker,"OLT") :  clearMapMarker("OLT");
        ($(`#Faults`).prop("checked") == true)?  getData(sql["Faults"],loarMarker,"Faults") :  clearMapMarker("Faults");
       
        // if ($("#BTS").prop("checked") == true) {
        //     getData(sql["BTS"],loarMarker,"BTS");
        // } else {
        //     clearMapMarker("BTS")
        // }

        // if ($("#OLT").prop("checked") == true) {
        //     getData(sql["OLT"],loarMarker,"OLT");
        // }
        // if ($("#Faults").prop("checked") == true) {
        //     getData(sql["Faults"],loarMarker,"Faults");
        // }
    } else if (name == "Route") {

    }

    // FAULTS COMBINATION
    // let sql_fault_query="SELECT * FROM FAULTS WHERE " + oa_query ;

    // let nearbypending_query= " OA IN (" + selected_oa.map(name => `"${name}"`).join(", ") + ") ";
    // let nearbyrestored_query= " OA IN (" + selected_oa.map(name => `"${name}"`).join(", ") + ") ";
    // let fault_query= " FAULT_ID= ";
    // let file_query= " FILES IN (" + Files.map(name => `"${name}"`).join(", ") + ") ";
    // let radius_qry = " LAT BETWEEN AND LONG BETWEEN ";
    // let name_qry = " ROUTE_NAME LIKE `` ";
    

}
function clearMapMarker(marker_type){
       //clear marker
       MY_MAP[marker_type]["markers"].forEach(map_marker => {
        map_marker.setMap(null);
    });
    MY_MAP[marker_type]["markers"]=[];

}
function loarMarker(markers,marker_type){

       //clear marker
       clearMapMarker(marker_type);

    // MY_MAP[marker_type]["markers"].forEach(map_marker => {
    //     map_marker.setMap(null);
    // });
    // MY_MAP[marker_type]["markers"]=[];

    const bounds = new google.maps.LatLngBounds();
    let hasValidCoordinates = false;
    // load new market
    markers.forEach(marker => {
        if (marker.LOCATION_LATLONG && marker.LOCATION_LATLONG.trim() !== '') {
            const coords = parseCoordinates(marker.LOCATION_LATLONG);
            if (coords) {
                const map_marker = createMarker(marker, coords,marker_type);
                MY_MAP[marker_type]["markers"].push(map_marker);
                bounds.extend(coords);
                hasValidCoordinates = true;
               
            }
        }
    });

    if (hasValidCoordinates) {
        map.fitBounds(bounds);
        
        // If only one marker, zoom in a bit
        if (MY_MAP[marker_type]["markers"].length === 1) {
            map.setZoom(12);
        }
        
        const statusMessage = `${MY_MAP[marker_type]["markers"].length} ${marker_type} shown`
        showAlert(statusMessage, 'success');
    } else {
        showAlert(`No ${marker_type} coordinates found`, 'warning');
    }




}
function createMarker(marker_data, position,marker_type) {
    // Create custom marker icon based on OA and status
    const marker_status = marker_data[MY_MAP[marker_type].sts_field] || true;
    const fault_type = marker_data.FAULT_TYPE || "normal";
    const marker_title = `${marker_data[MY_MAP[marker_type].title_fields[0]]} - ${marker_data[MY_MAP[marker_type].title_fields[1]]} (${marker_status ? 'Resolved' : 'Pending'})`
    const marker_label = marker_data[MY_MAP[marker_type].title_fields[0]];

    const icon = {
        url: getIcons(marker_type, marker_status, fault_type),
        scaledSize: new google.maps.Size(24, 24),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(12, 24)
    };
    
    const marker = new google.maps.Marker({
        position: position,
        map: map,
        icon: getIcons(marker_type, marker_status, fault_type),
        title: `${marker_title} (${ marker_status ? 'OK' : 'Down'})`,
        // label: {
        //     text: marker_label,
        //     color: "#000",
        //     fontSize: "14px",
        //     fontWeight: "bold",
        //     className: "marker-label"
        //   }
    });
    
    const overlayLabel= new LabelOverlay(marker.getPosition(), marker_label, map,14);
    // Create info window
    const infoWindow = new google.maps.InfoWindow({
        content: createInfoWindow(marker_data, marker_type)
    });
    
    // Add click listener
    marker.addListener('click', function() {
        infoWindow.open(map, marker);
    });
    
    return marker;
}


function getIcons(marker_type, marker_status = true, faultType = 'normal'){

   

        let mapPin = {
                path: "M256 0C156 0 76 80 76 180c0 134 180 332 180 332s180-198 180-332c0-100-80-180-180-180zm0 240c-33 0-60-27-60-60s27-60 60-60 60 27 60 60-27 60-60 60z",
                fillColor: "#e60026", // red
                fillOpacity: .8,
                strokeWeight: .8,
                strokeColor: "yellow",
                scale: 0.04, // adjust size for Google Maps
                anchor: new google.maps.Point(256, 512) // bottom tip of pin
            };
            // Circle
        let circleMarker = {
            path: "M16,8 A8,8 0 1,0 15.999,8 Z",
            fillColor: "red",
            fillOpacity: 0.6,
            strokeWeight: 1,
            strokeColor: "black",
            scale: 2,
            anchor: new google.maps.Point(16, 16)
        };
        
        // Square
        let squareMarker = {
            path: "M0 0 H20 V20 H0 Z",
            fillColor: "green",
            fillOpacity: 0.6,
            strokeWeight: 1,
            strokeColor: "black",
            scale: 1.5,
            anchor: new google.maps.Point(10, 10)
        };
        
        // Triangle (pointing up)
        let triangleMarker = {
            path: "M10 0 L20 20 L0 20 Z",
            fillColor: "orange",
            fillOpacity: 0.8,
            strokeWeight: .7,
            strokeColor: "orange",
            scale: .5,
            anchor: new google.maps.Point(10, 20)
        };
        
        // Star
        let starMarker = {
            path: "M10 1 L12.4 7.5 L19.5 7.5 L13.5 11.5 L15.5 18.5 L10 14.5 L4.5 18.5 L6.5 11.5 L0.5 7.5 L7.6 7.5 Z",
            fillColor: "gold",
            fillOpacity: 0.9,
            strokeWeight: 1,
            strokeColor: "black",
            scale: .9,
            anchor: new google.maps.Point(10, 10)
        };

        let pinMarker = {
            path: "M12 2C8 2 5 5.6 5 9.5c0 5.2 7 12.5 7 12.5s7-7.3 7-12.5C19 5.6 16 2 12 2zm0 9.5c-1.4 0-2.5-1.1-2.5-2.5S10.6 6.5 12 6.5s2.5 1.1 2.5 2.5S13.4 11.5 12 11.5z",
            fillColor: "red",
            fillOpacity: 0.9,
            strokeWeight: 1,
            strokeColor: "white",
            scale: 1.5,
            anchor: new google.maps.Point(12, 22)
        };

        let shieldMarker = {
            path: "M12 2L2 7v6c0 5 3.6 9.7 10 13 6.4-3.3 10-8 10-13V7l-10-5z",
            fillColor: "blue",
            fillOpacity: 0.8,
            strokeWeight: 1,
            strokeColor: "black",
            scale: 1.5,
            anchor: new google.maps.Point(12, 22)
        };

        let pushPinMarker = {
            path: "M12 2C9 2 7 4 7 7c0 1.5.6 3 1.6 4L8 20l4-2 4 2-0.6-9c1-1 1.6-2.5 1.6-4 0-3-2-5-5-5z",
            fillColor: "purple",
            fillOpacity: 0.9,
            strokeWeight: 1,
            strokeColor: "white",
            scale: 1.5,
            anchor: new google.maps.Point(12, 20)
        };

        let teardropMarker = {
            path: "M12 2C8 2 5 5.1 5 9c0 5.3 7 13 7 13s7-7.7 7-13c0-3.9-3-7-7-7z",
            fillColor: "green",
            fillOpacity: 0.9,
            strokeWeight: 1,
            strokeColor: "Yellow",
            scale: 1.5,
            anchor: new google.maps.Point(12, 22)
        };
        let badgeMarker = {
            path: "M12 2l2.39 4.84L20 8.27l-3.9 3.81L17.8 18l-5.8-3.05L6.2 18l1.7-5.92L4 8.27l5.61-1.43z",
            fillColor: "gold",
            fillOpacity: 0.9,
            strokeWeight: 1,
            strokeColor: "black",
            scale: 1.8,
            anchor: new google.maps.Point(12, 20)
        };

        const mapIkons = {
            BTS:[mapPin,"green","red","gold"],
            OLT:[triangleMarker,"blue","orange","gold"],
            Faults:[starMarker,"red","green","gold"]
        }

        let ikon = mapIkons[marker_type][0];

            if (marker_status == true ) { 
                ikon.fillColor=mapIkons[marker_type][1]
            } else {
                ikon.fillColor=mapIkons[marker_type][2]
            }
        //console.log(ikon)    
        return ikon;

}

function getMarkerIcons(marker_type, marker_status = true, faultType = 'normal') {

    const rectColor = "skyblue";
    const triColor = "orange";
    const circleColor = "green";
    const starColor = "gold";
    const shapeSize = 60; // change this to make them bigger/smaller
    // Center and size for triangle
    const triBase = shapeSize * 3.6;   // wider base
    const triHeight = shapeSize;       // height
    const triCenterX = 220;
    const triBaseY = 100;

    // Triangle points
    const triPoints = `
    ${triCenterX - triBase/2},${triBaseY} 
    ${triCenterX + triBase/2},${triBaseY} 
    ${triCenterX},${triBaseY - triHeight}
`;
    
    const svgColor = (marker_status)? "green" : "red";

    let svgTemplate = `<svg width="${shapeSize * 7}" height="${shapeSize * 2}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120"> `;

    if (marker_type=="Faults") {
        // svgTemplate = svgTemplate + `<rect x="30" y="30" width="${shapeSize*2}" height="${shapeSize * .6}" fill="${svgColor }" stroke="blue" stroke-width="2" /> </svg>`;  // RECTANGLE
    

       svgTemplate =svgTemplate + `<polygon points="340,35 348,55 370,55 352,68 360,90 340,78 320,90 328,68 310,55 332,55" fill="${svgColor }" stroke="$pink" stroke-width="2"/> </svg>`;  //STAR
    } else if (marker_type=="BTS") {
        // svgTemplate = svgTemplate + `<rect x="30" y="30" width="${shapeSize*2}" height="${shapeSize * .6}" fill="${svgColor }" stroke="black" stroke-width="1" /> </svg>`;  // RECTANGLE
        
        svgTemplate =svgTemplate + `<polygon points="${triPoints}"  width="${shapeSize*.8}" height="${shapeSize * 0.5}" fill="${svgColor}" stroke="yellow" stroke-width="2" /> </svg>`;  // TRIANCLE
    } else if (marker_type=="OLT") {
         svgTemplate = svgTemplate + `<rect x="30" y="30" width="${shapeSize*2}" height="${shapeSize * .6}" fill="${svgColor }" stroke="blue" stroke-width="2" /> </svg>`;  // RECTANGLE
    
    } else {
        svgTemplate =svgTemplate + `<circle cx="280" cy="60" r="${shapeSize/2}" fill="${svgColor }" stroke="black" stroke-width="2" /> </svg>`  // Circle

    }    
    const dataUri = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svgTemplate);

    return dataUri;

}

function createInfoWindow(dataObj, titleKey) {
    const title = dataObj[MY_MAP[titleKey].title_fields[0]] || "Details";
    // Build table rows
    let rows = "";
    for (const [key, value] of Object.entries(dataObj)) {
      if (key === titleKey) continue; // skip title field
      rows += `
        <tr>
          <td class="key-cell">${key}</td>
          <td class="value-cell">${value}</td>
        </tr>
      `;
    }
  
    // Build complete HTML
    const content = `
      <div class="infowindow-container">
        <h3 class="infowindow-title">${title}</h3>
        <table class="infowindow-table">
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
      <style>
        .infowindow-container {
          font-family: Arial, sans-serif;
          padding: 8px;
          max-width: 330px;
        }
        .infowindow-title {
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: bold;
          color: #2c3e50;
          text-align: center;
          border-bottom: 1px solid #ddd;
          padding-bottom: 4px;
        }
        .infowindow-table {
          border-collapse: collapse;
          width: 100%;
        }
        .infowindow-table td {
          padding: 4px 6px;
          border-bottom: 1px solid #eee;
          font-size: 13px;
        }
        .infowindow-table .key-cell {
          font-weight: bold;
          color: #34495e;
          width: 40%;
        }
        .infowindow-table .value-cell {
          color: #555;
        }
      </style>
    `;
  
    return content;
}

///////////////////////////////////////////////////////
function getData(sql,fn,name){
    let postData = {query : sql};

    $.ajax({
        url: 'php/query.php',
        type: 'POST',
        data: postData,
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                fn(response.data, name);
            } else {
                showAlert('Error loading all faults: ' + response.error, 'danger');
            }
        },
        error: function() {
            showAlert('Failed to load data from database', 'danger');
        }
    });
}

function showAlert(message, type) {

    toastr.options = {
        "closeButton": false,
        "debug": false,
        "newestOnTop": false,
        "progressBar": false,
        "positionClass": "toast-top-center",
        "preventDuplicates": false,
        "onclick": null,
        "showDuration": "300",
        "hideDuration": "1000",
        "timeOut": "3000",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
      }
    // alert(message)
    // info,danger,warning,success
    switch(type) {
        case 'danger':
          toastr.error(message)
          break;
        case 'success':
          toastr.success(message)
          break;
        case 'info':
          toastr.info(message)
          break;
        case 'warning':
          toastr.warning(message)
          break;
        default:
          toastr.info(message)
          break;
            
    }


    // const alertDiv = $('<div class="alert alert-' + type + ' alert-dismissible fade show" role="alert">' +
    //     message +
    //     '<button type="button" class="btn-close" data-bs-dismiss="alert"></button>' +
    //     '</div>');
    
    // $('#page-content').prepend(alertDiv);
    
    // Auto-hide after 5 seconds
    // setTimeout(function() {
    //     // toastr.clear();
    //     // toastr.remove();
    //     // alertDiv.alert('close');
    // }, 5000);
}

function buildSQLQuery(filters) {
    let conditions = [];
  
    for (let [key, value] of Object.entries(filters)) {
      if (Array.isArray(value)) {
        // Multiple values -> IN
        const inValues = value.map(v => `'${v}'`).join(", ");
        conditions.push(`${key} IN (${inValues})`);
      } else {
        // Single value -> =
        conditions.push(`${key} = '${value}'`);
      }
    }
  
    const whereClause = conditions.length ? " WHERE " + conditions.join(" AND ") : "";
    return `SELECT * FROM faults${whereClause};`;
}


////////////////////////////////////////////////////////////

class LabelOverlay extends google.maps.OverlayView {
    constructor(position, text, map, minZoom = 14) {
      super();
      this.position = position;
      this.text = text;
      this.minZoom = minZoom; // minimum zoom level to show the label
      this.div = null;
      this.map = map;
      this.setMap(map);
    }
  
    onAdd() {
      this.div = document.createElement("div");
      this.div.style.position = "absolute";
      this.div.style.whiteSpace = "nowrap";
      this.div.style.fontSize = "14px";
      this.div.style.fontWeight = "bold";
      this.div.style.color = "black";
      this.div.style.webkitTextStroke = ".05px yellow"; // white border
      this.div.style.textStroke = "2px white";       // fallback
      this.div.innerHTML = this.text;
  
      this.getPanes().overlayLayer.appendChild(this.div);
  
      // toggle initially
      this.updateVisibility();
  
      // listen to zoom changes
      google.maps.event.addListener(this.map, "zoom_changed", () => {
        this.updateVisibility();
      });
    }
  
    draw() {
      if (!this.div) return;
  
      const proj = this.getProjection();
      const pos = proj.fromLatLngToDivPixel(this.position);
  
      // Position label to the right of marker
      this.div.style.left = (pos.x + 10) + "px";
      this.div.style.top = (pos.y - 20) + "px";
    }
  
    updateVisibility() {
      const currentZoom = this.map.getZoom();
      if (currentZoom >= this.minZoom) {
        this.div.style.display = "block";
      } else {
        this.div.style.display = "none";
      }
    }
  
    onRemove() {
      if (this.div) {
        this.div.parentNode.removeChild(this.div);
        this.div = null;
      }
    }
  }
  