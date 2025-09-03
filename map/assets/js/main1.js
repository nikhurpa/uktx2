// Global variables
let map;
let drawingManager;
let selectedShape = null;
const drawnShapes = new Map(); // Use a Map to store drawn shapes by their ID
let infoWindow;
let ssa_name=[[]];
ssa_name["ALMORA"]	= {lat:"29.59552",lng:"79.65575"};
ssa_name["DEHRADUN"]	= {lat:"30.29370",lng:"78.04350"};
ssa_name["HARIDWAR"]	= {lat:"29.97431",lng:"78.01722"};
ssa_name["NAINITAL"]	= {lat:"29.38025",lng:"79.45576"};
ssa_name["UTTARKASHI"]	= {lat:"30.72966",lng:"78.44757"};
ssa_name["KOTDWARA"]	= {lat:"30.5426",lng:"79.58046"};

// Initialize the map and drawing tools


function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 22.5726, lng: 88.3639 }, // Default to Kolkata
        zoom: 12,
        mapTypeControl: true,
        mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
            position: google.maps.ControlPosition.TOP_RIGHT,
            mapTypeIds: [
                google.maps.MapTypeId.ROADMAP,
                google.maps.MapTypeId.SATELLITE,
                google.maps.MapTypeId.HYBRID,
                google.maps.MapTypeId.TERRAIN
              ]
         }
    });


  // Create info window
  infoWindow = new google.maps.InfoWindow();

// Initialize drawing manager
    drawingManager = new google.maps.drawing.DrawingManager({
        drawingMode: null,
        drawingControl: false,
        markerOptions: { draggable: true },
        polylineOptions: { editable: true, draggable: true },
        polygonOptions: { editable: true, draggable: true },
    });
    drawingManager.setMap(map);

    
    
//--------------------------------------------------------------------------------------------------

  // Add event listeners
  google.maps.event.addListener(drawingManager, 'markercomplete', onMarkerComplete);
  google.maps.event.addListener(drawingManager, 'polylinecomplete', onPolylineComplete);
  google.maps.event.addListener(drawingManager, 'polygoncomplete', onPolygonComplete);
  google.maps.event.addListener(drawingManager, 'overlaycomplete', onOverlayComplete);

  // Add map click listener for manual drawing
  google.maps.event.addListener(map, 'click', onMapClick);
  google.maps.event.addListener(map, 'rightclick', onMapRightClick);

  // Load existing elements
//   loadMapElements();
  
  // Initialize fullscreen button
  fullscreenButton = document.getElementById('btn-fullscreen');
  
//   // Add fullscreen change event listener
//   document.addEventListener('fullscreenchange', handleFullscreenChange);
//   document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
//   document.addEventListener('mozfullscreenchange', handleFullscreenChange);
//   document.addEventListener('MSFullscreenChange', handleFullscreenChange);
  
//   // Add keyboard shortcuts
//   document.addEventListener('keydown', handleKeyboardShortcuts);
createToolbox();



}

function selectOA (selectedValue) {    
    // console.log("hi" )
    // var selectedValue = $(this).val();
    // console.log(selectedValue )
    // var selectedText = $(this).find('option:selected').text();
    var ssaLat=Number(ssa_name[selectedValue].lat);
	var ssaLng=Number(ssa_name[selectedValue].lng);
    map.panTo(new google.maps.LatLng(ssaLat, ssaLng));
	map.setZoom(10);
  };


// Handles the completion of a drawing
function onOverlayComplete(event) {
    const newShape = event.overlay;
    const type = event.type.toUpperCase();
    const id = 'shape_' + new Date().getTime();

    newShape.id = id;
    newShape.type = type;
    
    // Switch off drawing mode
    drawingManager.setDrawingMode(null);
    setActiveTool(null);
    
    const name = prompt("Enter a name for this element:", "New " + type.toLowerCase());
    if (name) {
        saveShape(newShape, name);
        addShapeToList(id, name, type);
        addListenersToShape(newShape);
        drawnShapes.set(id, newShape);
    } else {
        // If user cancels, remove the drawn shape
        newShape.setMap(null);
    }
}

function createToolbox() {
    // const toolbox = document.getElementById('map-toolbox');
    const toolbox = document.createElement('div');
    toolbox.className = 'drawing-controls';
    const box =`                                      
                                            <div class="toolbox-header">
                                           
                                                <i id="toolheading" class="fas fa-pencil-alt" > </i>  <span id="head_tool" class="px-3 py-3"> Drawing Tools </span>  
                                              
                                                <button onclick="hideToolbox()" id="btn-hide" title="Keyboard Shortcuts" style="float: right; background: none; border: none; color: #666; font-size: 10px; padding: 0; margin: 0; min-width: auto;">
                                                    <i id="ikonhide" class="fa fa-minus-square px-2"></i>
                                                </button>
                                                
                                            </div>

                                            <div class="toolbox-row">
                                                <button onclick="setDrawingMode('point')" id="btn-point" title="Add Point (Ctrl+P)">
                                                    <i class="fas fa-map-marker-alt"></i>
                                                    <span>Point</span>
                                                </button>
                                            </div>
                                            <div class="toolbox-row">
                                                <button onclick="setDrawingMode('line')" id="btn-line" title="Draw Line (Ctrl+L)">
                                                    <i class="fas fa-minus"></i>
                                                    <span>Line</span>
                                                </button>
                                            </div>
                                            <div class="toolbox-row">
                                                <button onclick="setDrawingMode('path')" id="btn-path" title="Draw Path (Ctrl+R)">
                                                    <i class="fas fa-route"></i>
                                                    <span>Path</span>
                                                </button>
                                            </div>
                                            <div class="toolbox-row">
                                                <button onclick="setDrawingMode('polygon')" id="btn-polygon" title="Draw Polygon (Ctrl+G)">
                                                    <i class="fas fa-draw-polygon"></i>
                                                    <span>Polygon</span>
                                                </button>
                                            </div>
                                            <div class="toolbox-row">
                                                <button onclick="clearDrawing()" id="btn-clear" title="Clear Drawing Mode (Esc)">
                                                    <i class="fa-regular fa-hand"></i>
                                                    <span>Clear</span>
                                                </button>
                                            </div>
                                            <div class="toolbox-row">                                                
                                                <button onclick="setDrawingMode('ruler')" id="btn-ruler" title="Measure Distance adn Area (F11)">
                                                    <i class="fas fa-ruler-horizontal"></i>
                                                    <span>Measure</span>
                                                </button>
                                            </div>
                                                  `
const newtoolbox = document.createElement('div');
newtoolbox.className = 'drawing-controls';
const newbox =`                                      
                                        <div class="toolbox-header">
                                            <i class="fas fa-upload"></i> <span id="head_load" class="px-3 py-3">Load Data </span>
                                            <button onclick="hidenewToolbox()" id="btn_load" title="Keyboard Shortcuts" style="float: right; background: none; border: none; color: #000; font-size: 10px; padding: 0; margin: 0; min-width: auto;">
                                                <i id="ikonhide_loaddata" class="fa fa-minus-square px-2"></i>
                                            </button>
                                        </div>
                                        <div class="toolbox2-row">
                                            <button onclick="setDrawingMode('bts')" id="btn-bts" title="add BTS">
                                                <i class='fas fa-broadcast-tower'></i>
                                                <span>BTS</span>
                                            </button>
                                         </div>
                                        <div class="toolbox2-row">    
                                            <button onclick="setDrawingMode('route')" id="btn-route" title="Add Route">
                                                <i class="fas fa-code-branch"></i>
                                                <span>Routes</span>
                                            </button>
                                        </div>
                                        <div class="toolbox2-row">
                                            <button onclick="setDrawingMode('olt')" id="btn-olt" title="Add OLT">
                                                <i class="far fa-hdd"></i>
                                                <span>OLT</span>
                                            </button>
                                         </div>
                                        <div class="toolbox2-row">
                                            <button onclick="setDrawingMode('tx')" id="btn-tx" title="Add System">
                                                <i class="fas fa-ethernet"></i>
                                                <span>Tx Systems</span>
                                            </button>
                                        </div>
                                        <div class="toolbox2-row">
                                           
                                            <select name= "selectOA"" id="selectOA" onchange="selectOA(this.value)">
                                                        <option value="">Select OA</option>
                                                        <option value="ALMORA">ALM</option>
                                                        <option value="DEHRADUN">DDN</option>
                                                        <option value="HARIDWAR">HWR</option>
                                                        <option value="NAINITAL">NTL</option>
                                                        <option value="UTTARKASHI">NWT</option>
                                                        <option value="KOTDWARA">SGR</option>
                                            </select>
                                         </div>


                                        
                                    `




     toolbox.innerHTML=box;
     newtoolbox.innerHTML=newbox;

    const tools = [
        { type: 'MARKER', title: 'Add Point', icon: 'fas fa-map-marker-alt' },
        { type: 'POLYLINE', title: 'Add Line/Path', icon: 'fas fa-wave-square' },
        { type: 'POLYGON', title: 'Add Polygon', icon: 'fas fa-draw-polygon' },
        { type: null, title: 'Deselect (Hand Tool)', icon: 'fas fa-hand-paper' }
    ];

    
    map.controls[google.maps.ControlPosition.LEFT_TOP].push(toolbox);
    map.controls[google.maps.ControlPosition.LEFT_TOP].push(newtoolbox);
    // map.controls[google.maps.ControlPosition.BOTTOM_LEFT].push(toolbox);
    $('#selectOA').on('change', function() {
        var selectedValue = $(this).val();
        console.log(selectedValue ) 
 });

}
function hideToolbox() {
    if ( $('#ikonhide').hasClass("fa fa-minus-square") ) {
        $('#ikonhide').removeClass("fa fa-minus-square")
        $('#ikonhide').addClass("fa fa-plus-square")
       
        $('.toolbox-row ' ).hide(1000)
        $('#head_tool' ).hide()


  
    } else {
        $('#ikonhide').removeClass("fa fa-plus-square")
        $('#ikonhide').addClass("fa fa-minus-square")

        $('.toolbox-row ').show(1000);
        $('#head_tool' ).show();

    }

}
function hidenewToolbox() {
    if ( $('#ikonhide_loaddata').hasClass("fa fa-minus-square") ) {
        $('#ikonhide_loaddata').removeClass("fa fa-minus-square")
        $('#ikonhide_loaddata').addClass("fa fa-plus-square")
       
        $('.toolbox2-row ' ).hide(1000)
        $('#head_load' ).hide()


  
    } else {
        $('#ikonhide_loaddata').removeClass("fa fa-plus-square")
        $('#ikonhide_loaddata').addClass("fa fa-minus-square")

        $('.toolbox2-row ').show(1000);
        $('#head_load' ).show();

    }

}

// main functions

// Drawing mode functions
function setDrawingMode(mode) {
    // Clear active buttons
    document.querySelectorAll('.drawing-controls button').forEach(btn => {
        btn.classList.remove('active');
    });

    // Set active button
    document.getElementById('btn-' + mode).classList.add('active');

    if (mode === 'point') {
        drawingManager.setDrawingMode(google.maps.drawing.OverlayType.MARKER);
    } else if (mode === 'line') {
        drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYLINE);
    } else if (mode === 'path') {
        drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYLINE);
    } else if (mode === 'polygon') {
        drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
    }

    currentDrawingMode = mode;
}

function clearDrawing() {
    drawingManager.setDrawingMode(null);
    currentDrawingMode = null;
    document.querySelectorAll('.drawing-controls button').forEach(btn => {
        if (btn.id !== 'btn-fullscreen') {
            btn.classList.remove('active');
        }
    });
}

// Fullscreen functionality
function toggleFullscreen() {
    const mapContainer = document.querySelector('.map-container');
    
    if (!isFullscreen) {
        // Enter fullscreen
        if (mapContainer.requestFullscreen) {
            mapContainer.requestFullscreen();
        } else if (mapContainer.webkitRequestFullscreen) {
            mapContainer.webkitRequestFullscreen();
        } else if (mapContainer.mozRequestFullScreen) {
            mapContainer.mozRequestFullScreen();
        } else if (mapContainer.msRequestFullscreen) {
            mapContainer.msRequestFullscreen();
        }
    } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
}

function handleFullscreenChange() {
    
    isFullscreen = !!document.fullscreenElement || 
                   !!document.webkitFullscreenElement || 
                   !!document.mozFullScreenElement || 
                   !!document.msFullscreenElement;
    
    if (fullscreenButton) {
        const icon = fullscreenButton.querySelector('i');
        const span = fullscreenButton.querySelector('span');
        
        if (isFullscreen) {
            icon.className = 'fas fa-compress';
            span.textContent = 'Exit';
            fullscreenButton.title = 'Exit Fullscreen';
        } else {
            icon.className = 'fas fa-expand';
            span.textContent = 'Full';
            fullscreenButton.title = 'Toggle Fullscreen';
        }
    }
    
    // Trigger map resize to ensure proper rendering
    if (map) {
        google.maps.event.trigger(map, 'resize');
    }
}

// Keyboard shortcuts
function handleKeyboardShortcuts(event) {
    // Only handle shortcuts when map is focused or in fullscreen
    if (!isFullscreen && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        switch(event.key.toLowerCase()) {
            case 'p':
                if (event.ctrlKey) {
                    event.preventDefault();
                    setDrawingMode('point');
                }
                break;
            case 'l':
                if (event.ctrlKey) {
                    event.preventDefault();
                    setDrawingMode('line');
                }
                break;
            case 'r':
                if (event.ctrlKey) {
                    event.preventDefault();
                    setDrawingMode('path');
                }
                break;
            case 'g':
                if (event.ctrlKey) {
                    event.preventDefault();
                    setDrawingMode('polygon');
                }
                break;
            case 'escape':
                clearDrawing();
                break;
            case 'f11':
                event.preventDefault();
                toggleFullscreen();
                break;
        }
    }
}

// Show keyboard shortcuts help
function showKeyboardHelp() {
    const helpContent = `
        <div style="max-width: 300px; padding: 10px;">
            <h4 style="margin: 0 0 10px 0; color: #333;">Keyboard Shortcuts</h4>
            <div style="font-size: 12px; line-height: 1.4;">
                <div><strong>Ctrl+P:</strong> Add Point</div>
                <div><strong>Ctrl+L:</strong> Draw Line</div>
                <div><strong>Ctrl+R:</strong> Draw Path</div>
                <div><strong>Ctrl+G:</strong> Draw Polygon</div>
                <div><strong>Esc:</strong> Clear Drawing Mode</div>
                <div><strong>F11:</strong> Toggle Fullscreen</div>
                <hr style="margin: 8px 0;">
                <div><strong>Right-click:</strong> Finish path drawing</div>
                <div><strong>Drag:</strong> Move elements</div>
            </div>
        </div>
    `;
    
    if (infoWindow) {
        infoWindow.setContent(helpContent);
        infoWindow.setPosition(map.getCenter());
        infoWindow.open(map);
    }
}

// Drawing completion handlers
function onMarkerComplete(marker) {
    const id = 'marker_' + Date.now();
    const name = prompt('Enter marker name:', 'New Point');
    if (name) {
        const details = {
            description: prompt('Enter description:', ''),
            color: '#FF0000',
            icon: 'default'
        };

        marker.set('id', id);
        marker.set('name', name);
        marker.set('details', details);

        // Add click listener for editing
        google.maps.event.addListener(marker, 'click', () => showMarkerInfoWindow(marker));
        google.maps.event.addListener(marker, 'dragend', () => updateMarkerPosition(marker));

        // Save to database
        saveMapElement(id, name, 'POINT', 'POINT', 
            marker.getPosition().lat() + ',' + marker.getPosition().lng(), 
            JSON.stringify(details));

        markers.push(marker);
    } else {
        marker.setMap(null);
    }
}

function onPolylineComplete(polyline) {
    const id = 'polyline_' + Date.now();
    const name = prompt('Enter line name:', 'New Line');
    if (name) {
        const details = {
            description: prompt('Enter description:', ''),
            color: '#0000FF',
            weight: 3
        };

        polyline.set('id', id);
        polyline.set('name', name);
        polyline.set('details', details);

        // Add click listener for editing
        google.maps.event.addListener(polyline, 'click', () => showPolylineInfoWindow(polyline));
        google.maps.event.addListener(polyline.getPath(), 'set_at', () => updatePolylinePath(polyline));
        google.maps.event.addListener(polyline.getPath(), 'insert_at', () => updatePolylinePath(polyline));

        // Get encoded path
        const path = polyline.getPath();
        const coordinates = [];
        for (let i = 0; i < path.getLength(); i++) {
            const point = path.getAt(i);
            coordinates.push(point.lat() + ',' + point.lng());
        }

        // Save to database
        saveMapElement(id, name, 'LINE', 'LINE', coordinates.join(' '), JSON.stringify(details));

        polylines.push(polyline);
    } else {
        polyline.setMap(null);
    }
}

function onPolygonComplete(polygon) {
    const id = 'polygon_' + Date.now();
    const name = prompt('Enter polygon name:', 'New Polygon');
    if (name) {
        const details = {
            description: prompt('Enter description:', ''),
            color: '#00FF00',
            fillColor: '#00FF00',
            fillOpacity: 0.3
        };

        polygon.set('id', id);
        polygon.set('name', name);
        polygon.set('details', details);

        // Add click listener for editing
        google.maps.event.addListener(polygon, 'click', () => showPolygonInfoWindow(polygon));
        google.maps.event.addListener(polygon.getPath(), 'set_at', () => updatePolygonPath(polygon));
        google.maps.event.addListener(polygon.getPath(), 'insert_at', () => updatePolygonPath(polygon));

        // Get encoded path
        const path = polygon.getPath();
        const coordinates = [];
        for (let i = 0; i < path.getLength(); i++) {
            const point = path.getAt(i);
            coordinates.push(point.lat() + ',' + point.lng());
        }

        // Save to database
        saveMapElement(id, name, 'POLYGON', 'POLYGON', coordinates.join(' '), JSON.stringify(details));

        polygons.push(polygon);
    } else {
        polygon.setMap(null);
    }
}

// Manual drawing functions
function onMapClick(event) {
    if (currentDrawingMode === 'path' && isDrawing) {
        drawingPath.push(event.latLng);
        
        if (drawingPath.length === 1) {
            // Start drawing
            drawingPolygon = new google.maps.Polyline({
                path: drawingPath,
                map: map,
                strokeColor: '#FF0000',
                strokeWeight: 3,
                editable: true
            });
        } else {
            drawingPolygon.setPath(drawingPath);
        }
    }
}

function onMapRightClick(event) {
    if (currentDrawingMode === 'path' && isDrawing && drawingPath.length > 1) {
        // Finish drawing
        finishPathDrawing();
    }
}

function startPathDrawing() {
    isDrawing = true;
    drawingPath = [];
    if (drawingPolygon) {
        drawingPolygon.setMap(null);
    }
}

function finishPathDrawing() {
    if (drawingPath.length > 1) {
        const id = 'path_' + Date.now();
        const name = prompt('Enter path name:', 'New Path');
        if (name) {
            const details = {
                description: prompt('Enter description:', ''),
                color: '#FF0000',
                weight: 3
            };

            drawingPolygon.set('id', id);
            drawingPolygon.set('name', name);
            drawingPolygon.set('details', details);

            // Add click listener for editing
            google.maps.event.addListener(drawingPolygon, 'click', () => showPolylineInfoWindow(drawingPolygon));
            google.maps.event.addListener(drawingPolygon.getPath(), 'set_at', () => updatePolylinePath(drawingPolygon));
            google.maps.event.addListener(drawingPolygon.getPath(), 'insert_at', () => updatePolylinePath(drawingPolygon));

            // Get encoded path
            const coordinates = [];
            for (let i = 0; i < drawingPath.length; i++) {
                coordinates.push(drawingPath[i].lat() + ',' + drawingPath[i].lng());
            }

            // Save to database
            saveMapElement(id, name, 'PATH', 'PATH', coordinates.join(' '), JSON.stringify(details));

            polylines.push(drawingPolygon);
        } else {
            drawingPolygon.setMap(null);
        }
    }
    
    isDrawing = false;
    drawingPath = [];
    drawingPolygon = null;
}

// Info window functions
function showMarkerInfoWindow(marker) {
    const content = `
        <div class="info-window-content">
            <h5>Edit Point</h5>
            <input type="text" id="edit-name" value="${marker.get('name')}" placeholder="Name">
            <textarea id="edit-description" placeholder="Description">${marker.get('details').description || ''}</textarea>
            <button onclick="saveMarkerEdit('${marker.get('id')}')">Save</button>
            <button class="delete" onclick="deleteMapElement('${marker.get('id')}')">Delete</button>
        </div>
    `;
    infoWindow.setContent(content);
    infoWindow.open(map, marker);
}

function showPolylineInfoWindow(polyline) {
    const content = `
        <div class="info-window-content">
            <h5>Edit Line/Path</h5>
            <input type="text" id="edit-name" value="${polyline.get('name')}" placeholder="Name">
            <textarea id="edit-description" placeholder="Description">${polyline.get('details').description || ''}</textarea>
            <button onclick="savePolylineEdit('${polyline.get('id')}')">Save</button>
            <button class="delete" onclick="deleteMapElement('${polyline.get('id')}')">Delete</button>
        </div>
    `;
    infoWindow.setContent(content);
    infoWindow.open(map, polyline);
}

function showPolygonInfoWindow(polygon) {
    const content = `
        <div class="info-window-content">
            <h5>Edit Polygon</h5>
            <input type="text" id="edit-name" value="${polygon.get('name')}" placeholder="Name">
            <textarea id="edit-description" placeholder="Description">${polygon.get('details').description || ''}</textarea>
            <button onclick="savePolygonEdit('${polygon.get('id')}')">Save</button>
            <button class="delete" onclick="deleteMapElement('${polygon.get('id')}')">Delete</button>
        </div>
    `;
    infoWindow.setContent(content);
    infoWindow.open(map, polygon);
}

// Save edit functions
function saveMarkerEdit(id) {
    const name = document.getElementById('edit-name').value;
    const description = document.getElementById('edit-description').value;
    
    const marker = markers.find(m => m.get('id') === id);
    if (marker) {
        const details = marker.get('details');
        details.description = description;
        
        marker.set('name', name);
        marker.set('details', details);
        
        saveMapElement(id, name, 'POINT', 'POINT', 
            marker.getPosition().lat() + ',' + marker.getPosition().lng(), 
            JSON.stringify(details));
        
        infoWindow.close();
    }
}

function savePolylineEdit(id) {
    const name = document.getElementById('edit-name').value;
    const description = document.getElementById('edit-description').value;
    
    const polyline = polylines.find(p => p.get('id') === id);
    if (polyline) {
        const details = polyline.get('details');
        details.description = description;
        
        polyline.set('name', name);
        polyline.set('details', details);
        
        updatePolylinePath(polyline);
        infoWindow.close();
    }
}

function savePolygonEdit(id) {
    const name = document.getElementById('edit-name').value;
    const description = document.getElementById('edit-description').value;
    
    const polygon = polygons.find(p => p.get('id') === id);
    if (polygon) {
        const details = polygon.get('details');
        details.description = description;
        
        polygon.set('name', name);
        polygon.set('details', details);
        
        updatePolygonPath(polygon);
        infoWindow.close();
    }
}

// Update position/path functions
function updateMarkerPosition(marker) {
    const id = marker.get('id');
    const name = marker.get('name');
    const details = marker.get('details');
    
    saveMapElement(id, name, 'POINT', 'POINT', 
        marker.getPosition().lat() + ',' + marker.getPosition().lng(), 
        JSON.stringify(details));
}

function updatePolylinePath(polyline) {
    const id = polyline.get('id');
    const name = polyline.get('name');
    const details = polyline.get('details');
    
    const path = polyline.getPath();
    const coordinates = [];
    for (let i = 0; i < path.getLength(); i++) {
        const point = path.getAt(i);
        coordinates.push(point.lat() + ',' + point.lng());
    }
    
    saveMapElement(id, name, 'LINE', 'LINE', coordinates.join(' '), JSON.stringify(details));
}

function updatePolygonPath(polygon) {
    const id = polygon.get('id');
    const name = polygon.get('name');
    const details = polygon.get('details');
    
    const path = polygon.getPath();
    const coordinates = [];
    for (let i = 0; i < path.getLength(); i++) {
        const point = path.getAt(i);
        coordinates.push(point.lat() + ',' + point.lng());
    }
    
    saveMapElement(id, name, 'POLYGON', 'POLYGON', coordinates.join(' '), JSON.stringify(details));
}

// Database operations
function saveMapElement(id, name, markerType, dataType, locationLatlngs, details) {
    $.ajax({
        url: 'api/map_data.php',
        method: 'POST',
        data: {
            action: 'save',
            id: id,
            name: name,
            marker_type: markerType,
            data_type: dataType,
            location_latlngs: locationLatlngs,
            details: details
        },
        success: function(response) {
            if (response.success) {
                console.log('Element saved successfully');
            } else {
                alert('Error saving element: ' + response.error);
            }
        },
        error: function() {
            alert('Error saving element');
        }
    });
}

function deleteMapElement(id) {
    if (confirm('Are you sure you want to delete this element?')) {
        $.ajax({
            url: 'api/map_data.php',
            method: 'POST',
            data: {
                action: 'delete',
                id: id
            },
            success: function(response) {
                if (response.success) {
                    // Remove from map
                    const marker = markers.find(m => m.get('id') === id);
                    if (marker) {
                        marker.setMap(null);
                        markers = markers.filter(m => m.get('id') !== id);
                    }
                    
                    const polyline = polylines.find(p => p.get('id') === id);
                    if (polyline) {
                        polyline.setMap(null);
                        polylines = polylines.filter(p => p.get('id') !== id);
                    }
                    
                    const polygon = polygons.find(p => p.get('id') === id);
                    if (polygon) {
                        polygon.setMap(null);
                        polygons = polygons.filter(p => p.get('id') !== id);
                    }
                    
                    infoWindow.close();
                    refreshElements();
                } else {
                    alert('Error deleting element: ' + response.error);
                }
            },
            error: function() {
                alert('Error deleting element');
            }
        });
    }
}

function loadMapElements() {
    $.ajax({
        url: 'api/map_data.php',
        method: 'POST',
        data: { action: 'get_all' },
        success: function(response) {
            if (response.success) {
                response.data.forEach(element => {
                    loadMapElement(element);
                });
            }
        },
        error: function() {
            console.log('Error loading map elements');
        }
    });
}

function loadMapElement(element) {
    const details = JSON.parse(element.details || '{}');
    
    switch(element.marker_type) {
        case 'POINT':
            const coords = element.location_latlngs.split(',');
            const marker = new google.maps.Marker({
                position: { lat: parseFloat(coords[0]), lng: parseFloat(coords[1]) },
                map: map,
                title: element.name,
                draggable: true
            });
            
            marker.set('id', element.id);
            marker.set('name', element.name);
            marker.set('details', details);
            
            google.maps.event.addListener(marker, 'click', () => showMarkerInfoWindow(marker));
            google.maps.event.addListener(marker, 'dragend', () => updateMarkerPosition(marker));
            
            markers.push(marker);
            break;
            
        case 'LINE':
        case 'PATH':
            const lineCoords = element.location_latlngs.split(' ').map(coord => {
                const [lat, lng] = coord.split(',');
                return { lat: parseFloat(lat), lng: parseFloat(lng) };
            });
            
            const polyline = new google.maps.Polyline({
                path: lineCoords,
                map: map,
                strokeColor: details.color || '#0000FF',
                strokeWeight: details.weight || 3,
                editable: true,
                draggable: true
            });
            
            polyline.set('id', element.id);
            polyline.set('name', element.name);
            polyline.set('details', details);
            
            google.maps.event.addListener(polyline, 'click', () => showPolylineInfoWindow(polyline));
            google.maps.event.addListener(polyline.getPath(), 'set_at', () => updatePolylinePath(polyline));
            google.maps.event.addListener(polyline.getPath(), 'insert_at', () => updatePolylinePath(polyline));
            
            polylines.push(polyline);
            break;
            
        case 'POLYGON':
            const polygonCoords = element.location_latlngs.split(' ').map(coord => {
                const [lat, lng] = coord.split(',');
                return { lat: parseFloat(lat), lng: parseFloat(lng) };
            });
            
            const polygon = new google.maps.Polygon({
                paths: polygonCoords,
                map: map,
                strokeColor: details.color || '#00FF00',
                fillColor: details.fillColor || '#00FF00',
                fillOpacity: details.fillOpacity || 0.3,
                editable: true,
                draggable: true
            });
            
            polygon.set('id', element.id);
            polygon.set('name', element.name);
            polygon.set('details', details);
            
            google.maps.event.addListener(polygon, 'click', () => showPolygonInfoWindow(polygon));
            google.maps.event.addListener(polygon.getPath(), 'set_at', () => updatePolygonPath(polygon));
            google.maps.event.addListener(polygon.getPath(), 'insert_at', () => updatePolygonPath(polygon));
            
            polygons.push(polygon);
            break;
    }
}

// Export KML function
function exportKML() {
    $.ajax({
        url: 'api/map_data.php',
        method: 'POST',
        data: { action: 'export_kml' },
        success: function(response) {
            if (response.success) {
                const blob = new Blob([response.kml], { type: 'application/vnd.google-earth.kml+xml' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'map_export.kml';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            } else {
                alert('Error exporting KML: ' + response.error);
            }
        },
        error: function() {
            alert('Error exporting KML');
        }
    });
}

// UI functions
function showMap() {
    document.getElementById('map-view').style.display = 'block';
    document.getElementById('elements-view').style.display = 'none';
    document.querySelector('.nav-link[onclick="showMap()"]').classList.add('active');
    document.querySelector('.nav-link[onclick="showElements()"]').classList.remove('active');
}

function showElements() {
    document.getElementById('map-view').style.display = 'none';
    document.getElementById('elements-view').style.display = 'block';
    document.querySelector('.nav-link[onclick="showMap()"]').classList.remove('active');
    document.querySelector('.nav-link[onclick="showElements()"]').classList.add('active');
    refreshElements();
}

function refreshElements() {
    $.ajax({
        url: 'api/map_data.php',
        method: 'POST',
        data: { action: 'get_all' },
        success: function(response) {
            if (response.success) {
                const container = document.getElementById('elements-list');
                container.innerHTML = '';
                
                response.data.forEach(element => {
                    const item = document.createElement('div');
                    item.className = 'element-item';
                    item.innerHTML = `
                        <strong>${element.name}</strong> (${element.marker_type})<br>
                        <small>${element.location_latlngs.substring(0, 50)}...</small>
                    `;
                    item.onclick = () => selectElement(element);
                    container.appendChild(item);
                });
            }
        },
        error: function() {
            console.log('Error refreshing elements');
        }
    });
}

function selectElement(element) {
    // Remove previous selection
    document.querySelectorAll('.element-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // Add selection to clicked item
    event.target.closest('.element-item').classList.add('selected');
    
    // Center map on element
    switch(element.marker_type) {
        case 'POINT':
            const coords = element.location_latlngs.split(',');
            map.setCenter({ lat: parseFloat(coords[0]), lng: parseFloat(coords[1]) });
            map.setZoom(15);
            break;
        case 'LINE':
        case 'PATH':
        case 'POLYGON':
            const bounds = new google.maps.LatLngBounds();
            const points = element.location_latlngs.split(' ').map(coord => {
                const [lat, lng] = coord.split(',');
                return { lat: parseFloat(lat), lng: parseFloat(lng) };
            });
            points.forEach(point => bounds.extend(point));
            map.fitBounds(bounds);
            break;
    }
}


google.maps.event.addDomListener(window, 'load', initMap);