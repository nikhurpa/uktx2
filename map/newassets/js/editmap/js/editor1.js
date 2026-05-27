// editor.js
// Handles map interactions, drawing tools, and editing
// Supports: Markers, Polylines, Polygons

let drawingPolyline = null;
let drawingPolygon  = null;   // ← NEW: active polygon being drawn
let currentActiveLayer = null;
let editModeEnabled = false;
let isDrawingDrag = false;
let lastDrawLatLng = null;

// Selection tracking
let selectedFeature = null;
let vertexMarkers = [];
let selectedVertexIndex = -1;

// ── Polygon drawing state ─────────────────────────────────────────────────────
let polygonPoints      = [];   // array of [lat,lng] collected so far
let polygonPreviewLine = null; // thin dashed line from last point to cursor
let polygonCloseLine   = null; // thin dashed line from cursor back to first point


// ─── Tool changed ─────────────────────────────────────────────────────────────

window.editorToolChanged = function(tool) {
    console.log("Selected Feature:", selectedFeature);
    // Re-enable map dragging unless drawing polyline
    if (tool !== 'add-polyline' && tool !== 'add-polygon') {
        map.dragging.enable();
    } else {
        map.dragging.disable();
    }

    // Cancel any in-progress polygon when switching away
    // if (tool !== 'add-polygon') {
    //     cancelPolygonDraw();
    // }

    if (tool !== 'add-polyline' && tool !== 'edit' && tool !== 'add-polygon') {
        clearSelection();
    }

    currentActiveLayer = null;
    editModeEnabled    = (tool === 'edit');
};

window.editorGetCurrentFeature = function() {
    return selectedFeature || currentActiveLayer;
};

window.editorFinalizeFeature = function(name) {
    const featureToSave = selectedFeature || currentActiveLayer;
    if (featureToSave) {
        if (!featureGroup.hasLayer(featureToSave)) {
            featureToSave.addTo(featureGroup);
            addNodeToTree('New Features', name, featureToSave);
        } else {
            featureToSave.bindPopup(name);
        }
        clearSelection();
    }
};

window.clearSelection = function() {
    if (selectedFeature instanceof L.Polygon) {
        selectedFeature.setStyle({ color: 'blue', weight: 2, fillOpacity: 0.2 });
        clearPolygonPreview();

    } else if (selectedFeature instanceof L.Polyline) {
        selectedFeature.setStyle({ color: 'blue', weight: 3 });
    }
    console.log("clear selection:", vertexMarkers.length);
    vertexMarkers.forEach(m => map.removeLayer(m));
    vertexMarkers          = [];
    selectedFeature        = null;
    drawingPolyline        = null;
    drawingPolygon         = null;
    selectedVertexIndex    = -1;
};

window.createVertexIcon = function(isSelected) {
    return L.divIcon({
        className: 'vertex-marker',
        html: `<div style="width:12px;height:12px;background:${isSelected ? '#00d2ff' : '#ff0000'};border:2px solid white;border-radius:50%;box-shadow:0 0 3px rgba(0,0,0,0.5);"></div>`,
        iconSize:   [12, 12],
        iconAnchor: [6, 6]
    });
};

window.renderVertexMarkers = function() {
    vertexMarkers.forEach(m => map.removeLayer(m));
    vertexMarkers = [];

    if (!selectedFeature) return;

    let latlngs = [];

    if (selectedFeature instanceof L.Polygon) {
        // L.Polygon.getLatLngs() returns [[ring]], take outer ring
        const rings = selectedFeature.getLatLngs();
        latlngs = rings[0] || [];
    } else if (selectedFeature instanceof L.Polyline) {
        latlngs = selectedFeature.getLatLngs();
    } else {
        return;
    }

    latlngs.forEach((ll, index) => {
        const isSelected = (index === selectedVertexIndex);
        const marker = L.marker(ll, {
            icon: createVertexIcon(isSelected),
            draggable: true,
            zIndexOffset: 1000
        }).addTo(map);

        marker.on('mousedown', (e) => {
            L.DomEvent.stopPropagation(e);
            if (currentTool === 'add-polyline' || currentTool === 'edit' || currentTool === 'add-polygon') {
                selectedVertexIndex = index;
            }
        });

        marker.on('dragstart', (e) => {
            L.DomEvent.stopPropagation(e);
            if (currentTool === 'add-polyline' || currentTool === 'edit' || currentTool === 'add-polygon') {
                selectedVertexIndex = index;
            }
        });

        marker.on('drag', (e) => {
            if (selectedFeature instanceof L.Polygon) {
                const rings = selectedFeature.getLatLngs();
                rings[0][index] = marker.getLatLng();
                selectedFeature.setLatLngs(rings);
            } else if (selectedFeature instanceof L.Polyline) {
                const newLatLngs = selectedFeature.getLatLngs();
                newLatLngs[index] = marker.getLatLng();
                selectedFeature.setLatLngs(newLatLngs);
            }
            selectedVertexIndex = index;
        });

        marker.on('dragend', () => {
            renderVertexMarkers();
        });

        vertexMarkers.push(marker);
    });
};


// ─── Select a feature ─────────────────────────────────────────────────────────

function selectFeature(layer, clickLatlng) {
    clearSelection();
    selectedFeature    = layer;
    currentActiveLayer = layer;

    if (layer instanceof L.Polygon) {
        layer.setStyle({ color: 'cyan', weight: 3, fillOpacity: 0.3 });
        drawingPolygon = layer;

        const rings    = layer.getLatLngs();
        const latlngs  = rings[0] || [];
        let closestIndex = latlngs.length - 1;

        if (clickLatlng && latlngs.length > 0) {
            let minDist = Infinity;
            latlngs.forEach((ll, i) => {
                const p1   = map.latLngToLayerPoint(ll);
                const p2   = map.latLngToLayerPoint(clickLatlng);
                const dist = p1.distanceTo(p2);
                if (dist < minDist) { minDist = dist; closestIndex = i; }
            });
        }
        selectedVertexIndex = closestIndex;
        renderVertexMarkers();

    } else if (layer instanceof L.Polyline) {
        layer.setStyle({ color: 'cyan', weight: 4 });
        drawingPolyline = layer;

        const latlngs    = layer.getLatLngs();
        let closestIndex = latlngs.length - 1;

        if (clickLatlng && latlngs.length > 0) {
            let minDist = Infinity;
            latlngs.forEach((ll, i) => {
                const p1   = map.latLngToLayerPoint(ll);
                const p2   = map.latLngToLayerPoint(clickLatlng);
                const dist = p1.distanceTo(p2);
                if (dist < minDist) { minDist = dist; closestIndex = i; }
            });
        }
        selectedVertexIndex = closestIndex;
        renderVertexMarkers();

    } else if (layer instanceof L.Marker) {
        if (currentTool === 'edit' || currentTool === 'add-point') {
            layer.dragging.enable();
        }
    }
}


// ─── Polygon helpers ──────────────────────────────────────────────────────────

/** Remove temporary preview lines from the map */
function clearPolygonPreview() {
    if (polygonPreviewLine) { map.removeLayer(polygonPreviewLine); polygonPreviewLine = null; }
    if (polygonCloseLine)   { map.removeLayer(polygonCloseLine);   polygonCloseLine   = null; }
}

/** Cancel an in-progress polygon draw entirely */
function cancelPolygonDraw() {
    clearPolygonPreview();
    if (drawingPolygon && !featureGroup.hasLayer(drawingPolygon)) {
        map.removeLayer(drawingPolygon);
    }
    drawingPolygon  = null;
    polygonPoints   = [];
}

/**
 * Finish the polygon — close it, add to featureGroup, add to tree.
 * Called on double-click or when user clicks the first vertex again.
 */
function finalizePolygon() {
    if (!drawingPolygon || polygonPoints.length < 3) {
        cancelPolygonDraw();
        return;
    }
    clearPolygonPreview();

    // Remove temporary vertex dot markers used during drawing
    vertexMarkers.forEach(m => map.removeLayer(m));
    vertexMarkers = [];

    drawingPolygon.setStyle({ color: 'blue', weight: 2, fillColor: '#3388ff', fillOpacity: 0.2 });
    drawingPolygon.addTo(featureGroup);

    addElementToTree(drawingPolygon);

    if (window.attachContextMenu) window.attachContextMenu(drawingPolygon);

    // Switch to edit so user can immediately adjust vertices
    selectFeature(drawingPolygon, null);

    drawingPolygon = null;
    polygonPoints  = [];
}


// ─── Map initialisation ───────────────────────────────────────────────────────

window.initMapEeditor = function () {
    console.log("map edit");

    // ── Click ────────────────────────────────────────────────────────────────
    map.on('click', (e) => {
        console.log(currentTool);

        // ── Add Point ────────────────────────────────────────────────────────
        if (currentTool === 'add-point') {
            const marker = L.marker(e.latlng, { draggable: true });
            marker.meta  = { name: 'New Point', id: 'point_' + (++idCounter) };
            addElementToTree(marker);
            marker.addTo(map);
            if (window.attachContextMenu) window.attachContextMenu(marker);
            selectFeature(marker, null);
        }

        // ── Add Polygon (click-to-add-vertex mode) ───────────────────────────
        if (currentTool === 'add-polygon') {
            // If clicking near the first point (within 15px) → close polygon
            if (drawingPolygon && polygonPoints.length >= 3) {
                const firstPt = map.latLngToLayerPoint(polygonPoints[0]);
                const clickPt = map.latLngToLayerPoint(e.latlng);
                if (firstPt.distanceTo(clickPt) < 15) {
                    finalizePolygon();
                    return;
                }
            }

            polygonPoints.push(e.latlng);

            if (!drawingPolygon) {
                // Create the polygon with the first point (needs ≥1 point)
                drawingPolygon = L.polygon([e.latlng], {
                    color:       'cyan',
                    weight:      2,
                    fillColor:   '#00d2ff',
                    fillOpacity: 0.15,
                }).addTo(map);
                drawingPolygon.meta = { name: 'New Polygon', id: 'polygon_' + (++idCounter) };

                // Click on existing polygon to select it
                drawingPolygon.on('click', function (e2) {
                    L.DomEvent.stopPropagation(e2);
                    selectFeature(drawingPolygon, e2.latlng);
                });
            } else {
                // Update polygon with all points so far
                drawingPolygon.setLatLngs([polygonPoints]);
            }

            // Draw a small vertex dot at the new point
            const dot = L.circleMarker(e.latlng, {
                radius: 5, color: '#fff', weight: 2,
                fillColor: '#ff0000', fillOpacity: 1
            }).addTo(map);
            vertexMarkers.push(dot);
        }

    });


    // ── Mousedown (polyline and polygon drag-draw) ───────────────────────────────────────
    map.on('mousedown', (e) => {
        if (currentTool === 'add-polyline' && e.originalEvent.button === 0) {
            isDrawingDrag = true;
            if (!drawingPolyline) {
                const pl = L.polyline([e.latlng], { color: 'cyan', weight: 4 }).addTo(map);
                pl.meta   = { name: 'New Polyline', id: 'polyline_' + (++idCounter) };
                addElementToTree(pl);
                if (window.attachContextMenu) window.attachContextMenu(pl);
                selectFeature(pl, e.latlng);
                pl.on('click', function (e2) {
                    document.getElementById('tool-route').click();
                    L.DomEvent.stopPropagation(e2);
                    selectFeature(pl, e2.latlng);
                });
            } else {
                const latlngs = drawingPolyline.getLatLngs();
                latlngs.splice(selectedVertexIndex + 1, 0, e.latlng);
                drawingPolyline.setLatLngs(latlngs);
                selectedVertexIndex++;
                renderVertexMarkers();
            }
            lastDrawLatLng = e.latlng;
        }
        //--------- Polygon ------------
        // if (currentTool === 'add-polygon' && e.originalEvent.button === 0) {
        //     isDrawingDrag = true;

        //     // If clicking near the first point (within 15px) → close polygon
        //     if (drawingPolygon && polygonPoints.length >= 3) {
        //         const firstPt = map.latLngToLayerPoint(polygonPoints[0]);
        //         const clickPt = map.latLngToLayerPoint(e.latlng);
        //         if (firstPt.distanceTo(clickPt) < 15) {
        //             finalizePolygon();
        //             return;
        //         }
        //     }



        //     if (!drawingPolygon) {
        //         const pg = L.polyline([e.latlng], { color: 'cyan', weight: 4 }).addTo(map);
        //         pg.meta   = { name: 'New Polygon', id: 'polygon_' + (++idCounter) };
        //         addElementToTree(pg);
        //         if (window.attachContextMenu) window.attachContextMenu(pg);
        //         selectFeature(pg, e.latlng);
        //         pg.on('click', function (e2) {
        //             document.getElementById('tool-route').click();
        //             L.DomEvent.stopPropagation(e2);
        //             selectFeature(pg, e2.latlng);
        //         });
        //     } else {
        //         const latlngs = drawingPolygon.getLatLngs();
        //         latlngs.splice(selectedVertexIndex + 1, 0, e.latlng);
        //         drawingPolygon.setLatLngs(latlngs);
        //         selectedVertexIndex++;
        //         renderVertexMarkers();
        //     }
        //     lastDrawLatLng = e.latlng;
        // }




    });


    // ── Mousemove ────────────────────────────────────────────────────────────
    map.on('mousemove', (e) => {

        // Polyline drag-draw
        if (currentTool === 'add-polyline' && isDrawingDrag && drawingPolyline) {
            const p1 = map.latLngToLayerPoint(lastDrawLatLng);
            const p2 = map.latLngToLayerPoint(e.latlng);
            if (p1.distanceTo(p2) > 15) {
                const latlngs = drawingPolyline.getLatLngs();
                latlngs.splice(selectedVertexIndex + 1, 0, e.latlng);
                drawingPolyline.setLatLngs(latlngs);
                selectedVertexIndex++;
                renderVertexMarkers();
                lastDrawLatLng = e.latlng;
            }
        }

        // Polygon — show rubber-band preview lines while cursor moves
        if (currentTool === 'add-polygon' && drawingPolygon && polygonPoints.length > 0) {
            clearPolygonPreview();

            const last  = polygonPoints[polygonPoints.length - 1];
            const first = polygonPoints[0];

            // Line from last point to cursor
            polygonPreviewLine = L.polyline([last, e.latlng], {
                color: 'cyan', weight: 1.5, dashArray: '6,4', opacity: 0.8
            }).addTo(map);

            // Closing line from cursor back to first point (only when ≥2 points)
            if (polygonPoints.length >= 2) {
                polygonCloseLine = L.polyline([e.latlng, first], {
                    color: '#aaa', weight: 1, dashArray: '4,6', opacity: 0.6
                }).addTo(map);
            }
        }
    });


    // ── Mouseup ──────────────────────────────────────────────────────────────
    map.on('mouseup', (e) => {
        if (e.originalEvent.button === 0) {
            isDrawingDrag = false;
        }
    });


    // ── Double-click ─────────────────────────────────────────────────────────
    map.on('dblclick', (e) => {
        // Finish polygon on double-click (last single-click already added a point)
        if (currentTool === 'add-polygon' && drawingPolygon) {
            // Remove the last point added by the first click of the dblclick
            if (polygonPoints.length > 0) polygonPoints.pop();
            if (drawingPolygon && polygonPoints.length >= 3) {
                drawingPolygon.setLatLngs([polygonPoints]);
            }
            finalizePolygon();
            L.DomEvent.stopPropagation(e); // prevent map zoom on dblclick
        }

        // Polyline — nothing extra needed (kept for future use)
        if (currentTool === 'add-polyline' && drawingPolyline) {
            // no-op; finalize handled elsewhere
        }
    });


    // ── Right-click on map — cancel polygon draw ──────────────────────────────
    map.on('contextmenu', (e) => {
        if (currentTool === 'add-polygon' && drawingPolygon) {
            // Right-click removes the last added vertex
            if (polygonPoints.length > 1) {
                polygonPoints.pop();
                drawingPolygon.setLatLngs([polygonPoints]);
                // Remove last vertex dot
                const lastDot = vertexMarkers.pop();
                if (lastDot) map.removeLayer(lastDot);
            } else {
                cancelPolygonDraw();
            }
            L.DomEvent.stopPropagation(e);
        }
    });


    // ── FeatureGroup mousedown (click existing feature to select) ─────────────
    featureGroup.on('mousedown', (e) => {
        if (e.originalEvent.button === 0 &&
            (currentTool === 'add-polyline' || currentTool === 'edit' || currentTool === 'add-polygon')) {

            L.DomEvent.stopPropagation(e);
            selectFeature(e.layer, e.latlng);

            if (currentTool === 'add-polyline') {
                isDrawingDrag  = true;
                lastDrawLatLng = e.latlng;
            }
        }
    });
};


// ─── Tree helper ─────────────────────────────────────────────────────────────

function addElementToTree(element) {
    const elementNodeId = element.meta.id;

    kmlLayers[elementNodeId] = {
        layer: element,
        label: element.meta.name
    };

    const elementNode = {
        id:      element.meta.id,
        label:   element.meta.name,
        icon:    kmlIcon,
        checked: true,
        value:   element.meta.name
    };

    const elementByID = $('#jqxTree').find('#tempplaces')[0];
    $('#jqxTree').jqxTree('addTo', elementNode, elementByID);

    $('#jqxTree').on('checkChange', (event) => {
        if (suppressCheckChange) return;
        const el      = event.args.element;
        const id      = $(el).attr('id');
        const checked = event.args.checked;
        document.getElementById('tool-pan').click();
        if (id) setVisibilityRecursively(id, checked);
    });
}

function addContextMenu(element) {
    // placeholder
}


// ─── Expose APIs ─────────────────────────────────────────────────────────────

window.selectFeature       = selectFeature;
window.renderVertexMarkers = renderVertexMarkers;
window.clearSelection      = clearSelection;
window.finalizePolygon     = finalizePolygon;
window.cancelPolygonDraw   = cancelPolygonDraw;
