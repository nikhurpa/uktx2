// context_menu.js
// Right-click context menu for polylines and markers.
// Provides: Get Length, Elevation Profile, Get Directions (OSRM),
//           Delete Feature, Copy Coordinates, and Zoom To feature.
//
// Dependencies: Leaflet, Chart.js (for elevation chart),
//               map.js (window.map, window.featureGroup),
//               editor.js (window.selectFeature, window.clearSelection),
//               load_kml.js (kmlLayers, featureLayers)

// ─────────────────────────────────────────────────────────────────────────────
// DOM: inject context-menu panel + elevation modal once
// ─────────────────────────────────────────────────────────────────────────────
(function injectContextMenuHTML() {

    // ── Context menu ──────────────────────────────────────────────────────────
    if (!document.getElementById('feature-ctx-menu')) {
        const menu = document.createElement('div');
        menu.id = 'feature-ctx-menu';
        menu.style.cssText = `
            display:none; position:fixed; z-index:9000;
            background:#fff; border:1px solid #ccc; border-radius:6px;
            box-shadow:0 4px 14px rgba(0,0,0,.25); min-width:190px;
            font:13px/1.4 sans-serif; overflow:hidden;`;
        menu.innerHTML = `
            <div class="ctx-item" data-action="length">
                <span>📏</span> Get Length
            </div>
            <div class="ctx-item" data-action="elevation">
                <span>⛰️</span> Elevation Profile
            </div>
            <!-- <div class="ctx-item" data-action="directions">
            //     <span>🗺️</span> Get Directions (OSRM)
            // </div> -->
            <div class="ctx-item" data-action="directionsFromHere">
                <span>➡️</span> Direction from here
            </div>
                        <div class="ctx-item" data-action="directionsToHere">
                <span>⬆️</span> Direction to Here
            </div>
                        <div class="ctx-item" data-action="directionsWaypoint">
                <span>🛣️</span> Set Direction way point
            </div>
            <hr style="margin:4px 0;">
            <div class="ctx-item" data-action="zoom-to">
                <span>🔍</span> Zoom To Feature
            </div>
            <div class="ctx-item" data-action="copy-coords">
                <span>📋</span> Copy Coordinates
            </div>
             <div class="ctx-item" data-action="properties">
                <span>⚙️</span> Properties
            </div>
            <hr style="margin:4px 0;">
            <div class="ctx-item ctx-danger" data-action="delete">
                <span>🗑️</span> Delete Feature
            </div>`;
        document.body.appendChild(menu);
    }

    // ── Elevation modal ───────────────────────────────────────────────────────
    if (!document.getElementById('elevation-modal')) {
        const modal = document.createElement('div');
        modal.id = 'elevation-modal';
        modal.style.cssText = `
            display:none; position:fixed; z-index:9100; inset:0;
            background:rgba(0,0,0,.5); align-items:center; justify-content:center;`;
        modal.innerHTML = `
            <div style="background:#fff;border-radius:10px;padding:20px;
                        width:min(700px,95vw);max-height:90vh;overflow-y:auto;
                        box-shadow:0 8px 32px rgba(0,0,0,.35);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                    <h3 style="margin:0;font-size:16px;">Elevation Profile</h3>
                    <button id="elevation-modal-close"
                        style="border:none;background:none;font-size:20px;cursor:pointer;padding:0 4px;">✕</button>
                </div>
                <div id="elevation-stats"
                    style="display:flex;gap:20px;margin-bottom:12px;font-size:13px;color:#555;flex-wrap:wrap;"></div>
                <div style="position:relative;height:260px;">
                    <canvas id="elevation-chart"></canvas>
                </div>
                <p id="elevation-note"
                    style="font-size:11px;color:#999;margin-top:8px;">
                    Elevation data from Open-Elevation API. Sampled every ~500 m.
                </p>
            </div>`;
        document.body.appendChild(modal);
    }

    // ── Directions panel ─────────────────────────────────────────────────────
    if (!document.getElementById('directions-panel')) {
        const panel = document.createElement('div');
        panel.id = 'directions-panel';
        panel.style.cssText = `
            display:none; position:fixed; top:60px; right:16px; z-index:8900;
            background:#fff; border:1px solid #ccc; border-radius:8px;
            box-shadow:0 4px 18px rgba(0,0,0,.2);
            width:300px; max-height:70vh; overflow-y:auto;
            font:13px/1.5 sans-serif; padding:14px;`;
        panel.innerHTML = `
            <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
                <strong>Directions (OSRM)</strong>
                <button id="directions-panel-close"
                    style="border:none;background:none;font-size:18px;cursor:pointer;line-height:1;">✕</button>
            </div>
            <div id="directions-summary"
                style="font-size:12px;color:#555;margin-bottom:10px;"></div>
            <ol id="directions-steps"
                style="margin:0;padding-left:18px;font-size:12px;color:#333;"></ol>`;
        document.body.appendChild(panel);
    }

    // ── Shared CSS for menu items ─────────────────────────────────────────────
    if (!document.getElementById('ctx-menu-style')) {
        const style = document.createElement('style');
        style.id = 'ctx-menu-style';
        style.textContent = `
            .ctx-item {
                padding: 8px 14px; cursor: pointer;
                display: flex; gap: 8px; align-items: center; white-space: nowrap;
            }
            .ctx-item:hover { background: #f0f4ff; }
            .ctx-danger { color: #d32f2f; }
            .ctx-danger:hover { background: #fff0f0; }`;
        document.head.appendChild(style);
    }
})();


// ─────────────────────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────────────────────
let _ctxLayer        = null;   // the layer the user right-clicked
let _ctxLatlng       = null;   // click latlng (for markers)
let _directionsRoute = null;   // current OSRM route polyline on map
let _elevationChart  = null;   // Chart.js instance
let _directionFrom       =null;
let _directionTo        =null;
let _directionWaypoint  =[];


// ─────────────────────────────────────────────────────────────────────────────
// Helper utilities
// ─────────────────────────────────────────────────────────────────────────────

/** Haversine distance in metres between two Leaflet LatLng objects */
function haversineMetres(a, b) {
    const R = 6371000;
    const φ1 = a.lat * Math.PI / 180, φ2 = b.lat * Math.PI / 180;
    const Δφ = (b.lat - a.lat) * Math.PI / 180;
    const Δλ = (b.lng - a.lng) * Math.PI / 180;
    const sin2 = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(sin2), Math.sqrt(1 - sin2));
}

/** Total length of a polyline (metres) */
function polylineLength(layer) {
    const lls = layer.getLatLngs().flat(Infinity);
    let total = 0;
    for (let i = 1; i < lls.length; i++) total += haversineMetres(lls[i - 1], lls[i]);
    return total;
}

/** Format metres → readable string */
function formatDistance(m) {
    return m >= 1000 ? (m / 1000).toFixed(2) + ' km' : Math.round(m) + ' m';
}

/** Sample up to maxPts points evenly from a LatLngs array */
function sampleLatLngs(lls, maxPts = 100) {
    lls = lls.flat(Infinity);
    if (lls.length <= maxPts) return lls;
    const step = (lls.length - 1) / (maxPts - 1);
    return Array.from({ length: maxPts }, (_, i) => lls[Math.round(i * step)]);
}

/** Hide the floating context menu */
function hideCtxMenu() {
    document.getElementById('feature-ctx-menu').style.display = 'none';
}

/** Close elevation modal */
function closeElevationModal() {
    document.getElementById('elevation-modal').style.display = 'none';
    if (_elevationChart) { _elevationChart.destroy(); _elevationChart = null; }
}


// ─────────────────────────────────────────────────────────────────────────────
// Action implementations
// ─────────────────────────────────────────────────────────────────────────────

/* ── 1. Get Length ──────────────────────────────────────────────────────────── */
function actionLength(layer) {
    if (!(layer instanceof L.Polyline)) {
        alert('Length is only available for polylines / polygons.');
        return;
    }
    const m = polylineLength(layer);
    const lls = layer.getLatLngs().flat(Infinity);
    const ptCount = lls.length;
    alert(
        `📏 Feature Length\n\n` +
        `Total distance : ${formatDistance(m)}\n` +
        `Vertex count   : ${ptCount}`
    );
}


/* ── 2. Elevation Profile ───────────────────────────────────────────────────── */
async function actionElevation(layer) {
    if (!(layer instanceof L.Polyline)) {
        alert('Elevation profile is only available for polylines.');
        return;
    }

    const modal = document.getElementById('elevation-modal');
    const note  = document.getElementById('elevation-note');
    const stats = document.getElementById('elevation-stats');
    modal.style.display = 'flex';
    stats.innerHTML     = '<em>Fetching elevation data…</em>';
    note.textContent    = '';

    const sampled = sampleLatLngs(layer.getLatLngs(), 100);
    const locations = sampled.map(ll => ({ latitude: ll.lat, longitude: ll.lng }));

    try {
        // Open-Elevation (free, no API key needed)
        const res = await fetch('https://api.open-elevation.com/api/v1/lookup', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ locations })
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const elevations = data.results.map(r => r.elevation);

        // Cumulative distances for X axis
        const xDistances = [0];
        for (let i = 1; i < sampled.length; i++) {
            xDistances.push(xDistances[i - 1] + haversineMetres(sampled[i - 1], sampled[i]));
        }
        const totalDist = xDistations => xDistances[xDistances.length - 1];

        const minElev = Math.min(...elevations);
        const maxElev = Math.max(...elevations);
        const gain    = elevations.reduce((acc, e, i) =>
            i > 0 && e > elevations[i - 1] ? acc + (e - elevations[i - 1]) : acc, 0);
        const loss    = elevations.reduce((acc, e, i) =>
            i > 0 && e < elevations[i - 1] ? acc + (elevations[i - 1] - e) : acc, 0);

        stats.innerHTML = `
            <span>📏 Length: <strong>${formatDistance(xDistances[xDistances.length - 1])}</strong></span>
            <span>⬆️ Gain: <strong>${Math.round(gain)} m</strong></span>
            <span>⬇️ Loss: <strong>${Math.round(loss)} m</strong></span>
            <span>↕️ Range: <strong>${Math.round(minElev)}–${Math.round(maxElev)} m</strong></span>`;

        // Draw Chart.js chart
        const ctx = document.getElementById('elevation-chart').getContext('2d');
        if (_elevationChart) _elevationChart.destroy();
        _elevationChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: xDistances.map(d => formatDistance(d)),
                datasets: [{
                    label: 'Elevation (m)',
                    data: elevations,
                    fill: true,
                    backgroundColor: 'rgba(66,133,244,0.15)',
                    borderColor: '#4285f4',
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: {
                        ticks: {
                            maxTicksLimit: 8,
                            maxRotation: 0,
                            font: { size: 11 }
                        },
                        title: { display: true, text: 'Distance', font: { size: 12 } }
                    },
                    y: {
                        title: { display: true, text: 'Elevation (m)', font: { size: 12 } }
                    }
                }
            }
        });

        note.textContent = 'Elevation data from Open-Elevation API (SRTM). Sampled at up to 100 points.';

    } catch (err) {
        stats.innerHTML = `<span style="color:red;">⚠️ Failed to load elevation: ${err.message}</span>`;
        console.error('Elevation fetch error:', err);
    }
}


/* ── 3. Get Directions (OSRM) ──────────────────────────────────────────────── */
async function actionDirections(layer) {
    let waypoints = [];

    if (layer instanceof L.Polyline) {
        // Use first and last vertex as origin/destination
        const lls = layer.getLatLngs().flat(Infinity);
        waypoints = [lls[0], lls[lls.length - 1]];
    } else if (layer instanceof L.Marker) {
        alert('For directions, right-click a polyline to route between its endpoints.\n\nFor a marker, select it together with another marker or use the Directions tool.');
        return;
    } else {
        alert('Directions requires a polyline feature.');
        return;
    }

    const panel   = document.getElementById('directions-panel');
    const summary = document.getElementById('directions-summary');
    const steps   = document.getElementById('directions-steps');
    panel.style.display = 'block';
    summary.innerHTML   = '<em>Calculating route…</em>';
    steps.innerHTML     = '';

    // Remove old route
    if (_directionsRoute) { window.map.removeLayer(_directionsRoute); _directionsRoute = null; }

    try {
        const coords = waypoints.map(ll => `${ll.lng},${ll.lat}`).join(';');
        const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=true`;

        const res  = await fetch(url);
        const data = await res.json();

        if (data.code !== 'Ok' || !data.routes.length) {
            throw new Error(data.message || 'No route found');
        }

        const route    = data.routes[0];
        const distKm   = (route.distance / 1000).toFixed(1);
        const durMins  = Math.round(route.duration / 60);

        summary.innerHTML = `
            <strong>${distKm} km</strong> &nbsp;·&nbsp; approx <strong>${durMins} min</strong>
            (driving, via OSRM)`;

        // Draw route on map
        const geom = route.geometry.coordinates.map(c => [c[1], c[0]]);
        _directionsRoute = L.polyline(geom, {
            color: '#1a73e8', weight: 5, opacity: 0.8, dashArray: '8 4'
        }).addTo(window.map);
        window.map.fitBounds(_directionsRoute.getBounds(), { padding: [30, 30] });

        // Step-by-step instructions
        const allSteps = route.legs.flatMap(leg => leg.steps);
        steps.innerHTML = allSteps.map(step => {
            const d = step.distance >= 1000
                ? (step.distance / 1000).toFixed(1) + ' km'
                : Math.round(step.distance) + ' m';
            return `<li style="margin-bottom:6px;">
                        ${step.maneuver.instruction || step.name || '—'}
                        <span style="color:#888;font-size:11px;">(${d})</span>
                    </li>`;
        }).join('');

    } catch (err) {
        summary.innerHTML = `<span style="color:red;">⚠️ ${err.message}</span>`;
        console.error('OSRM directions error:', err);
    }
}

async function actionDirectionsFromHere(layer) {
    if (layer instanceof L.Marker) {
      _directionFrom = layer.getLatLng();
       
    } else {
        alert('Right-click a marker to set it as the starting point for directions.');
    }       
}

async function actionDirectionsToHere(layer) {

    if(!_directionFrom){
       alert('Select Starting Point.');
       return;
    }
    if (layer instanceof L.Marker) {
      _directionTo = layer.getLatLng(); 
      waypoints = [_directionFrom, ..._directionWaypoint, _directionTo];
  
    const panel   = document.getElementById('directions-panel');
    const summary = document.getElementById('directions-summary');
    const steps   = document.getElementById('directions-steps');
    panel.style.display = 'block';
    summary.innerHTML   = '<em>Calculating route…</em>';
    steps.innerHTML     = '';

    // Remove old route
    if (_directionsRoute) { window.map.removeLayer(_directionsRoute); _directionsRoute = null; }

    try {
        const coords = waypoints.map(ll => `${ll.lng},${ll.lat}`).join(';');
        const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=true`;

        const res  = await fetch(url);
        const data = await res.json();

        if (data.code !== 'Ok' || !data.routes.length) {
            throw new Error(data.message || 'No route found');
        }

        const route    = data.routes[0];
        const distKm   = (route.distance / 1000).toFixed(1);
        const durMins  = Math.round(route.duration / 60);

        summary.innerHTML = `
            <strong>${distKm} km</strong> &nbsp;·&nbsp; approx <strong>${durMins} min</strong>
            (driving, via OSRM)`;

        // Draw route on map
        const geom = route.geometry.coordinates.map(c => [c[1], c[0]]);
        _directionsRoute = L.polyline(geom, {
            color: '#1a73e8', weight: 5, opacity: 0.8, dashArray: '8 4'
        }).addTo(window.map);
        window.map.fitBounds(_directionsRoute.getBounds(), { padding: [30, 30] });

        // Step-by-step instructions
        const allSteps = route.legs.flatMap(leg => leg.steps);
        steps.innerHTML = allSteps.map(step => {
            const d = step.distance >= 1000
                ? (step.distance / 1000).toFixed(1) + ' km'
                : Math.round(step.distance) + ' m';
            return `<li style="margin-bottom:6px;">
                        ${step.maneuver.instruction || step.name || '—'}
                        <span style="color:#888;font-size:11px;">(${d})</span>
                    </li>`;
        }).join('');

        _directionFrom = null;
        _directionTo = null;
        _directionWaypoint = [];

    } catch (err) {
        summary.innerHTML = `<span style="color:red;">⚠️ ${err.message}</span>`;
        console.error('OSRM directions error:', err);
    }

  } else {






   
        alert('Right-click a marker to set it as the destination for directions.');
    }       
}       
async function actionDirectionsWaypoint(layer) {
    if (layer instanceof L.Marker) {
        _directionWaypoint.push(layer.getLatLng()); 
     
    } else {
        alert('Right-click a marker to set it as a waypoint for directions.');
    }   
}          



/* ── 4. Zoom To ─────────────────────────────────────────────────────────────── */
function actionZoomTo(layer) {
    if (layer instanceof L.Polyline && layer.getBounds) {
        window.map.fitBounds(layer.getBounds(), { padding: [40, 40] });
    } else if (layer instanceof L.Marker) {
        window.map.setView(layer.getLatLng(), 16);
    }
}


/* ── 5. Copy Coordinates ────────────────────────────────────────────────────── */
function actionCopyCoords(layer) {
    let text = '';
    if (layer instanceof L.Marker) {
        const ll = layer.getLatLng();
        text = `${ll.lat.toFixed(6)}, ${ll.lng.toFixed(6)}`;
    } else if (layer instanceof L.Polyline) {
        const lls = layer.getLatLngs().flat(Infinity);
        text = lls.map(ll => `${ll.lat.toFixed(6)},${ll.lng.toFixed(6)}`).join('\n');
    }
    if (!text) return;
    navigator.clipboard.writeText(text)
        .then(() => {
            // Briefly flash a toast
            showToast('Coordinates copied to clipboard ✓');
        })
        .catch(() => {
            prompt('Copy coordinates:', text);
        });
}


/* ── 6. Delete ──────────────────────────────────────────────────────────────── */
function actionDelete(layer) {
    if (!confirm('Delete this feature from the map?')) return;
    if (window.clearSelection) window.clearSelection();
    window.map.removeLayer(layer);
    // Also remove from featureGroup if present
    if (window.featureGroup && window.featureGroup.hasLayer(layer)) {
        window.featureGroup.removeLayer(layer);
    }
    // Remove from kmlLayers registry
    if (typeof kmlLayers !== 'undefined') {
        for (const key of Object.keys(kmlLayers)) {
            const entry = kmlLayers[key];
            if (Array.isArray(entry)) {
                const idx = entry.indexOf(layer);
                if (idx !== -1) { entry.splice(idx, 1); break; }
            } else if (entry === layer) {
                delete kmlLayers[key]; break;
            }
        }
    }

     $("#jqxTree").jqxTree("removeItem", $("#" + layer.meta.id)[0]);
}
function actionProperties(layer) {
    if (layer instanceof L.Marker || layer instanceof L.Polyline    ) { 
        editPlacemark.open(layer, map);  
    } else {
        alert('Feature properties panel is not available.');
    }

}


// ─────────────────────────────────────────────────────────────────────────────
// Toast notification
// ─────────────────────────────────────────────────────────────────────────────
function showToast(msg, duration = 2500) {
    let toast = document.getElementById('ctx-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'ctx-toast';
        toast.style.cssText = `
            position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
            background:#333; color:#fff; padding:8px 18px; border-radius:20px;
            font-size:13px; z-index:10000; opacity:0; transition:opacity .25s;
            pointer-events:none;`;
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, duration);
}


// ─────────────────────────────────────────────────────────────────────────────
// Show / position the context menu
// ─────────────────────────────────────────────────────────────────────────────
function showContextMenu(x, y, layer) {
    _ctxLayer = layer;
    const menu = document.getElementById('feature-ctx-menu');

    // Hide items that don't apply to markers
    const isPolyline = layer instanceof L.Polyline;
    const isMarker = layer instanceof L.Marker;
    
    menu.querySelectorAll('[data-action="length"],[data-action="elevation"]')
        .forEach(el => { el.style.display = isPolyline ? '' : 'none'; });
    menu.querySelectorAll('[data-action="directionsFromHere"],[data-action="directionsToHere"],[data-action="directionsWaypoint"]')
    .forEach(el => { el.style.display = isMarker ? '' : 'none'; });    

    menu.style.display = 'block';
    menu.style.left    = x + 'px';
    menu.style.top     = y + 'px';

    // Prevent menu from going off screen
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth)  menu.style.left = (x - rect.width)  + 'px';
    if (rect.bottom > window.innerHeight) menu.style.top = (y - rect.height) + 'px';
}


// ─────────────────────────────────────────────────────────────────────────────
// Wire up menu item clicks
// ─────────────────────────────────────────────────────────────────────────────
document.getElementById('feature-ctx-menu').addEventListener('click', async (e) => {
    const item = e.target.closest('[data-action]');
    if (!item || !_ctxLayer) return;
    hideCtxMenu();

    switch (item.dataset.action) {
        case 'length':     actionLength(_ctxLayer);           break;
        case 'elevation':  await actionElevation(_ctxLayer);  break;
        case 'directions': await actionDirections(_ctxLayer); break;
        case 'directionsFromHere': await actionDirectionsFromHere(_ctxLayer); break;
        case 'directionsToHere': await actionDirectionsToHere(_ctxLayer); break;
        case 'directionsWaypoint': await actionDirectionsWaypoint(_ctxLayer); break;
        case 'zoom-to':    actionZoomTo(_ctxLayer);           break;
        case 'copy-coords': actionCopyCoords(_ctxLayer);      break;
        case 'properties': actionProperties(_ctxLayer);      break;
        case 'delete':     actionDelete(_ctxLayer);           break;




    }
});

// Close menu on outside click
document.addEventListener('click', (e) => {
    if (!e.target.closest('#feature-ctx-menu')) hideCtxMenu();
});

// Close elevation modal
document.getElementById('elevation-modal-close')
    .addEventListener('click', closeElevationModal);
document.getElementById('elevation-modal')
    .addEventListener('click', (e) => {
        if (e.target === document.getElementById('elevation-modal')) closeElevationModal();
    });

// Close directions panel
document.getElementById('directions-panel-close').addEventListener('click', () => {
    document.getElementById('directions-panel').style.display = 'none';
    if (_directionsRoute) {
        window.map.removeLayer(_directionsRoute);
        _directionsRoute = null;
    }
});


// ─────────────────────────────────────────────────────────────────────────────
// Register context-menu on a Leaflet layer (called from editor / KML loader)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Attach the right-click context menu to any Leaflet layer.
 * Call this whenever you add a new polyline or marker.
 *
 * @param {L.Layer} layer  Leaflet Marker or Polyline / Polygon
 */
window.attachContextMenu = function (layer) {
    layer.on('contextmenu', (e) => {
        console.log('Right-clicked layer:', layer);
        L.DomEvent.stopPropagation(e);
        L.DomEvent.preventDefault(e);
        _ctxLatlng = e.latlng;
        const orig = e.originalEvent;
        showContextMenu(orig.clientX, orig.clientY, layer);
    });
};


// ─────────────────────────────────────────────────────────────────────────────
// Auto-attach to all layers already in featureGroup at init time,
// and to new layers via a monkey-patched addLayer
// ─────────────────────────────────────────────────────────────────────────────
window.addEventListener('load', () => {
    // Attach to existing layers
    if (window.featureGroup) {
        window.featureGroup.eachLayer(l => window.attachContextMenu(l));

        // Intercept future additions
        const _origAdd = window.featureGroup.addLayer.bind(window.featureGroup);
        window.featureGroup.addLayer = function (layer) {
            _origAdd(layer);
            window.attachContextMenu(layer);
        };
    }

    // Also hook into map-level layers (for KML-loaded layers added directly to map)
    const _origMapAdd = window.map.addLayer.bind(window.map);
    window.map.addLayer = function (layer) {
        _origMapAdd(layer);
        if (layer instanceof L.Polyline || layer instanceof L.Marker) {
            window.attachContextMenu(layer);
        }
        return this;
    };
});
