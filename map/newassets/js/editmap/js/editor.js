// editor.js
// Handles map interactions, drawing tools, and editing

let drawingPolyline = null;
let currentActiveLayer = null;
let editModeEnabled = false;
let isDrawingDrag = false;
let lastDrawLatLng = null;

// Selection tracking
let selectedFeature = null;
let vertexMarkers = [];
let selectedVertexIndex = -1;

// API for app.js
window.editorToolChanged = function(tool) {
    if(tool !== 'add-polyline') {
        map.dragging.enable();
    } else {
        map.dragging.disable();
    }
    
    if(tool !== 'add-polyline' && tool !== 'edit') {
        clearSelection();
    }
    currentActiveLayer = null;
    editModeEnabled = (tool === 'edit');
};

window.editorGetCurrentFeature = function() {
    return selectedFeature || currentActiveLayer;
};

window.editorFinalizeFeature = function(name) {
    const featureToSave = selectedFeature || currentActiveLayer;
    if(featureToSave) {
        if(!featureGroup.hasLayer(featureToSave)) {
            featureToSave.addTo(featureGroup);
            addNodeToTree('New Features', name, featureToSave);
        } else {
            featureToSave.bindPopup(name);
        }
        clearSelection();
        document.getElementById('tool-pan').click(); 
    }
};

function clearSelection() {
    if(selectedFeature instanceof L.Polyline) {
        selectedFeature.setStyle({ color: 'blue', weight: 3 }); 
    }
    vertexMarkers.forEach(m => map.removeLayer(m));
    vertexMarkers = [];
    selectedFeature = null;
    drawingPolyline = null;
    selectedVertexIndex = -1;
}

function createVertexIcon(isSelected) {
    return L.divIcon({
        className: 'vertex-marker',
        html: `<div style="width:12px;height:12px;background:${isSelected?'#00d2ff':'#ff0000'};border:2px solid white;border-radius:50%;box-shadow:0 0 3px rgba(0,0,0,0.5);"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
    });
}

function renderVertexMarkers() {
    vertexMarkers.forEach(m => map.removeLayer(m));
    vertexMarkers = [];
    
    if(!selectedFeature || !(selectedFeature instanceof L.Polyline)) return;
    
    let latlngs = selectedFeature.getLatLngs();
    latlngs.forEach((ll, index) => {
        let isSelected = (index === selectedVertexIndex);
        let marker = L.marker(ll, {
            icon: createVertexIcon(isSelected),
            draggable: true,
            zIndexOffset: 1000
        }).addTo(map);
        
        marker.on('mousedown', (e) => {
            L.DomEvent.stopPropagation(e);
            if(currentTool === 'add-polyline' || currentTool === 'edit') {
                selectedVertexIndex = index;
                renderVertexMarkers();
            }
        });
        
        marker.on('drag', (e) => {
            let newLatLngs = selectedFeature.getLatLngs();
            newLatLngs[index] = marker.getLatLng();
            selectedFeature.setLatLngs(newLatLngs);
            selectedVertexIndex = index;
        });
        
        marker.on('dragend', (e) => {
            renderVertexMarkers();
        });

        vertexMarkers.push(marker);
    });
}

function selectFeature(layer, clickLatlng) {
    clearSelection();
    selectedFeature = layer;
    currentActiveLayer = layer;
    
    if (layer instanceof L.Polyline) {
        layer.setStyle({ color: 'cyan', weight: 4 });
        drawingPolyline = layer;
        
        let latlngs = layer.getLatLngs();
        let closestIndex = latlngs.length - 1; 
        
        if(clickLatlng && latlngs.length > 0) {
            let minDistance = Infinity;
            latlngs.forEach((ll, i) => {
                let p1 = map.latLngToLayerPoint(ll);
                let p2 = map.latLngToLayerPoint(clickLatlng);
                let dist = p1.distanceTo(p2);
                if(dist < minDistance) {
                    minDistance = dist;
                    closestIndex = i;
                }
            });
        }
        selectedVertexIndex = closestIndex;
        renderVertexMarkers();
    } else if (layer instanceof L.Marker) {
        // Just make marker draggable if editing
        if(currentTool === 'edit' || currentTool === 'add-point') {
            layer.dragging.enable();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    
    map.on('click', (e) => {
        if(currentTool === 'add-point') {
            const marker = L.marker(e.latlng, { draggable: true });
            marker.addTo(map);
            selectFeature(marker, null);
            document.getElementById('tool-save').click();
        }
    });

    map.on('mousedown', (e) => {
        if(currentTool === 'add-polyline' && e.originalEvent.button === 0) {
            isDrawingDrag = true;
            if(!drawingPolyline) {
                let pl = L.polyline([e.latlng], {color: 'cyan', weight: 4}).addTo(map);
                selectFeature(pl, e.latlng);
            } else {
                let latlngs = drawingPolyline.getLatLngs();
                latlngs.splice(selectedVertexIndex + 1, 0, e.latlng);
                drawingPolyline.setLatLngs(latlngs);
                selectedVertexIndex++;
                renderVertexMarkers();
            }
            lastDrawLatLng = e.latlng;
        }
    });

    map.on('mousemove', (e) => {
        if(currentTool === 'add-polyline' && isDrawingDrag && drawingPolyline) {
            const p1 = map.latLngToLayerPoint(lastDrawLatLng);
            const p2 = map.latLngToLayerPoint(e.latlng);
            if(p1.distanceTo(p2) > 15) { // Threshold to prevent too many points
                let latlngs = drawingPolyline.getLatLngs();
                latlngs.splice(selectedVertexIndex + 1, 0, e.latlng);
                drawingPolyline.setLatLngs(latlngs);
                selectedVertexIndex++;
                renderVertexMarkers();
                lastDrawLatLng = e.latlng;
            }
        }
    });

    map.on('mouseup', (e) => {
        if(e.originalEvent.button === 0) {
            isDrawingDrag = false;
        }
    });

    map.on('contextmenu', (e) => {
        if(currentTool === 'add-polyline') {
            if(drawingPolyline && selectedVertexIndex >= 0) {
                let latlngs = drawingPolyline.getLatLngs();
                latlngs.splice(selectedVertexIndex, 1);
                drawingPolyline.setLatLngs(latlngs);
                
                selectedVertexIndex = Math.max(0, selectedVertexIndex - 1);
                renderVertexMarkers();
                
                if(latlngs.length === 0) {
                    map.removeLayer(drawingPolyline);
                    clearSelection();
                }
            }
        }
    });

    map.on('dblclick', (e) => {
        if(currentTool === 'add-polyline' && drawingPolyline) {
            document.getElementById('tool-save').click();
        }
    });

    featureGroup.on('mousedown', (e) => {
        if(e.originalEvent.button === 0 && (currentTool === 'add-polyline' || currentTool === 'edit')) {
            L.DomEvent.stopPropagation(e);
            selectFeature(e.layer, e.latlng);
            
            if(currentTool === 'add-polyline') {
                isDrawingDrag = true;
                lastDrawLatLng = e.latlng;
            }
        }
    });
});
