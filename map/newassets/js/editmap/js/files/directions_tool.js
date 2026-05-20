// directions_tool.js
// "Add Direction" tool — draw a routed polyline snapped to the road network
// using the free OSRM demo server (no API key required).
//
// Works alongside editor.js and load_kml.js.
// Activated when currentTool === 'add-direction'  (matches tool-direction button)
//
// UX:
//   • Click map → add a waypoint marker (draggable)
//   • OSRM route is drawn between consecutive waypoints in real time
//   • Double-click last waypoint → finalise route
//   • Right-click → remove last waypoint
//   • Escape → cancel route entirely
//   • Finished route is added to featureGroup and the jqxTree
//
// ─── Public API ──────────────────────────────────────────────────────────────
//   window.initDirectionsTool()   Call once after map is ready
//   window.editorToolChanged()    Already handles 'add-direction' via this module
// ─────────────────────────────────────────────────────────────────────────────

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

// ─────────────────────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────────────────────
let _dirWaypoints   = [];   // Array of L.LatLng
let _dirMarkers     = [];   // Waypoint markers on map
let _dirRouteLayer  = null; // Current drawn route (L.Polyline)
let _dirActive      = false;
let _dirIdCounter   = 0;


// ─────────────────────────────────────────────────────────────────────────────
// Inject UI: waypoint info bar
// ─────────────────────────────────────────────────────────────────────────────
(function injectDirectionsUI() {
    if (document.getElementById('dir-info-bar')) return;

    const bar = document.createElement('div');
    bar.id = 'dir-info-bar';
    bar.style.cssText = `
        display:none; position:fixed; bottom:52px; left:50%; transform:translateX(-50%);
        background:rgba(30,30,30,.88); color:#fff; padding:7px 18px;
        border-radius:20px; font:13px/1.5 sans-serif; z-index:8000;
        pointer-events:none; white-space:nowrap; backdrop-filter:blur(4px);`;
    bar.innerHTML = `
        <span id="dir-bar-text">Click to add waypoints • Double-click to finish • Esc to cancel</span>
        &nbsp;|&nbsp;
        <span id="dir-bar-stats"></span>`;
    document.body.appendChild(bar);
})();


// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function dirSetBarVisible(v) {
    document.getElementById('dir-info-bar').style.display = v ? 'block' : 'none';
}

function dirUpdateStats(dist, dur) {
    const el = document.getElementById('dir-bar-stats');
    if (!el) return;
    if (dist == null) { el.textContent = ''; return; }
    const km   = (dist / 1000).toFixed(1);
    const mins = Math.round(dur / 60);
    el.textContent = `${km} km · ~${mins} min`;
}

function haversineM(a, b) {
    const R  = 6371000;
    const f1 = a.lat * Math.PI / 180, f2 = b.lat * Math.PI / 180;
    const df = (b.lat - a.lat) * Math.PI / 180;
    const dl = (b.lng - a.lng) * Math.PI / 180;
    const x  = Math.sin(df/2)**2 + Math.cos(f1)*Math.cos(f2)*Math.sin(dl/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
}

/**
 * Fetch OSRM route between an ordered array of L.LatLng waypoints.
 * Returns { distance, duration, latLngs } or null on error.
 */
async function fetchOsrmRoute(waypoints) {
    if (waypoints.length < 2) return null;
    const coords = waypoints.map(ll => `${ll.lng},${ll.lat}`).join(';');
    const url    = `${OSRM_BASE}/${coords}?overview=full&geometries=geojson`;

    try {
        const res  = await fetch(url);
        const data = await res.json();
        if (data.code !== 'Ok' || !data.routes.length) return null;

        const route = data.routes[0];
        const lls   = route.geometry.coordinates.map(c => L.latLng(c[1], c[0]));
        return {
            distance: route.distance,
            duration: route.duration,
            latLngs:  lls,
            legs:     route.legs
        };
    } catch {
        return null;
    }
}


// ─────────────────────────────────────────────────────────────────────────────
// Waypoint marker factory
// ─────────────────────────────────────────────────────────────────────────────
function createWaypointMarker(latlng, index) {
    const isFirst = (index === 0);
    const color   = isFirst ? '#22c55e' : '#ef4444';
    const label   = isFirst ? 'A' : String.fromCharCode(65 + index);

    const icon = L.divIcon({
        className: '',
        html: `<div style="
            width:26px;height:26px;border-radius:50% 50% 50% 0;
            background:${color};border:2px solid #fff;
            box-shadow:0 2px 6px rgba(0,0,0,.4);
            transform:rotate(-45deg);
            display:flex;align-items:center;justify-content:center;">
            <span style="transform:rotate(45deg);color:#fff;font-weight:700;font-size:10px;">${label}</span>
        </div>`,
        iconSize:   [26, 26],
        iconAnchor: [13, 26]
    });

    const marker = L.marker(latlng, { icon, draggable: true, zIndexOffset: 2000 });

    // Dragging a waypoint rerouts
    marker.on('drag', async () => {
        _dirWaypoints[index] = marker.getLatLng();
        await redrawRoute();
    });

    // Double-click a waypoint to finalise
    marker.on('dblclick', (e) => {
        L.DomEvent.stopPropagation(e);
        finaliseRoute();
    });

    return marker;
}


// ─────────────────────────────────────────────────────────────────────────────
// Core drawing logic
// ─────────────────────────────────────────────────────────────────────────────

async function addWaypoint(latlng) {
    const index  = _dirWaypoints.length;
    _dirWaypoints.push(latlng);

    const marker = createWaypointMarker(latlng, index);
    marker.addTo(window.map);
    _dirMarkers.push(marker);

    if (_dirWaypoints.length >= 2) {
        await redrawRoute();
    }
}

async function redrawRoute() {
    const result = await fetchOsrmRoute(_dirWaypoints);

    if (_dirRouteLayer) {
        window.map.removeLayer(_dirRouteLayer);
        _dirRouteLayer = null;
    }

    if (!result) {
        // Fall back to straight-line preview
        if (_dirWaypoints.length >= 2) {
            _dirRouteLayer = L.polyline(_dirWaypoints, {
                color: '#94a3b8', weight: 3, dashArray: '6 4'
            }).addTo(window.map);
        }
        dirUpdateStats(null, null);
        return;
    }

    _dirRouteLayer = L.polyline(result.latLngs, {
        color: '#1d4ed8', weight: 5, opacity: 0.85
    }).addTo(window.map);

    dirUpdateStats(result.distance, result.duration);
}

function removeLastWaypoint() {
    if (!_dirWaypoints.length) return;
    _dirWaypoints.pop();

    const m = _dirMarkers.pop();
    if (m) window.map.removeLayer(m);

    if (_dirWaypoints.length >= 2) {
        redrawRoute();
    } else {
        if (_dirRouteLayer) { window.map.removeLayer(_dirRouteLayer); _dirRouteLayer = null; }
        dirUpdateStats(null, null);
    }
}

function cancelRoute() {
    _dirWaypoints = [];
    _dirMarkers.forEach(m => window.map.removeLayer(m));
    _dirMarkers = [];
    if (_dirRouteLayer) { window.map.removeLayer(_dirRouteLayer); _dirRouteLayer = null; }
    dirSetBarVisible(false);
    dirUpdateStats(null, null);
    _dirActive = false;
}

async function finaliseRoute() {
    if (_dirWaypoints.length < 2) {
        alert('Add at least 2 waypoints to create a route.');
        return;
    }

    // Fetch final high-quality route
    const result = await fetchOsrmRoute(_dirWaypoints);
    const lls    = result ? result.latLngs : _dirWaypoints;

    // Remove draft layers
    if (_dirRouteLayer) { window.map.removeLayer(_dirRouteLayer); _dirRouteLayer = null; }
    _dirMarkers.forEach(m => window.map.removeLayer(m));

    // Create permanent polyline
    const name     = 'Route ' + (++_dirIdCounter);
    const polyline = L.polyline(lls, { color: '#1d4ed8', weight: 4, opacity: 0.9 });
    polyline.meta  = { name, id: 'direction_' + _dirIdCounter };

    polyline.addTo(window.featureGroup);

    // Bind popup with route stats
    if (result) {
        const km   = (result.distance / 1000).toFixed(2);
        const mins = Math.round(result.duration / 60);
        polyline.bindPopup(
            `<strong>${name}</strong><br>
             📏 ${km} km &nbsp;·&nbsp; ⏱ ~${mins} min (driving)<br>
             <em style="font-size:11px;color:#888;">OSRM road route</em>`
        );
    }

    // Add to jqxTree if the helper is available
    if (typeof addElementToTree === 'function') {
        addElementToTree(polyline);
    } else if (typeof addNodeToTree === 'function') {
        addNodeToTree('Temporary Places', name, polyline);
    }

    // Attach context menu
    if (window.attachContextMenu) window.attachContextMenu(polyline);

    // Allow editing
    polyline.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        if (window.selectFeature) window.selectFeature(polyline, e.latlng);
        currentTool = 'edit';
        if (window.editorToolChanged) window.editorToolChanged('edit');
    });

    // Fit map
    window.map.fitBounds(polyline.getBounds(), { padding: [30, 30] });

    // Reset state
    _dirWaypoints = [];
    _dirMarkers   = [];
    dirSetBarVisible(false);
    _dirActive    = false;

    // Show toast with stats
    if (result && window.showToast) {
        const km   = (result.distance / 1000).toFixed(2);
        const mins = Math.round(result.duration / 60);
        window.showToast(`✅ ${name} saved — ${km} km, ~${mins} min`);
    }
}


// ─────────────────────────────────────────────────────────────────────────────
// Map event listeners for the directions tool
// ─────────────────────────────────────────────────────────────────────────────

window.initDirectionsTool = function () {

    window.map.on('click', async (e) => {
        if (window.currentTool !== 'add-direction') return;
        await addWaypoint(e.latlng);
    });

    window.map.on('dblclick', (e) => {
        if (window.currentTool !== 'add-direction') return;
        L.DomEvent.stopPropagation(e);
        finaliseRoute();
    });

    window.map.on('contextmenu', (e) => {
        if (window.currentTool !== 'add-direction') return;
        L.DomEvent.stopPropagation(e);
        removeLastWaypoint();
    });

    // Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && window.currentTool === 'add-direction') {
            cancelRoute();
        }
    });
};


// ─────────────────────────────────────────────────────────────────────────────
// Integration with editorToolChanged
// ─────────────────────────────────────────────────────────────────────────────
// Patch editorToolChanged to handle 'add-direction'
const _origEditorToolChanged = window.editorToolChanged;
window.editorToolChanged = function (tool) {
    if (tool === 'add-direction') {
        // Activate directions tool
        _dirActive = true;
        dirSetBarVisible(true);
        window.map.dragging.enable(); // keep pan enabled (click for waypoints)
        window.map.doubleClickZoom.disable();
    } else {
        if (_dirActive) {
            // User switched away mid-route — cancel cleanly
            cancelRoute();
        }
        window.map.doubleClickZoom.enable();
        if (_origEditorToolChanged) _origEditorToolChanged(tool);
    }
};


// ─────────────────────────────────────────────────────────────────────────────
// Auto-init once the map is available
// ─────────────────────────────────────────────────────────────────────────────
(function waitForMap() {
    if (window.map) {
        window.initDirectionsTool();
    } else {
        // map.js fires DOMContentLoaded; wait a tick after that
        window.addEventListener('load', () => {
            window.initDirectionsTool();
        });
    }
})();
