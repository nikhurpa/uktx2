// ─────────────────────────────────────────────────────────────────────────────
// SAVE / LOAD / EXPORT  —  add this block into load_kml.js
// Hooks into the existing treeEdit() context menu: "💾 Save To my Place"
// and "🗂️ Export Node as KML"
// ─────────────────────────────────────────────────────────────────────────────


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1 — SAVE NODE TO DATABASE
// Called from treeEdit() when user clicks "💾 Save To my Place"
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Collects a node and ALL its descendants from the jqxTree,
 * builds a flat rows array preserving the full folder path,
 * then POSTs to save_myplace.php.
 *
 * @param {string} nodeId  — the li#id of the right-clicked tree node
 */
window.saveNodeToMyPlace = async function (nodeId) {
    const tree  = $('#jqxTree');
    const rows  = [];
    let   order = 0;

    // ── Recursive walker ────────────────────────────────────────────────────
    function walkNode(id, parentDbId) {
        const liEl = document.getElementById(id);
        if (!liEl) return;

        const item = tree.jqxTree('getItem', liEl);
        if (!item)  return;

        order++;
        const myOrder = order;

        // ── Determine geometry type + coordinates ──────────────────────────
        let geomType  = 'Folder';
        let coords    = '';
        let style     = {};

        const overlays = featureLayers[id];
        if (overlays && overlays.length) {
            const first = overlays[0];

            if (first instanceof L.Marker) {
                const ll  = first.getLatLng();
                geomType  = 'Point';
                coords    = `${ll.lng},${ll.lat}`;          // KML = lon,lat

            } else if (first instanceof L.Polygon) {
                const ring = first.getLatLngs()[0] || [];
                geomType   = 'Polygon';
                coords     = ring.map(ll => `${ll.lng},${ll.lat},0`).join(' ');
                style      = { stroke: first.options.color,
                               strokeWidth: first.options.weight,
                               fill: first.options.fillColor,
                               fillOpacity: first.options.fillOpacity };

            } else if (first instanceof L.Polyline) {
                geomType  = 'LineString';
                coords    = first.getLatLngs().map(ll => `${ll.lng},${ll.lat},0`).join(' ');
                style     = { stroke: first.options.color,
                               strokeWidth: first.options.weight };
            }
        }

        // Also check kmlLayers (uploaded KML files stored as L.geoJSON)
        const kmlEntry = kmlLayers[id];
        if (kmlEntry && kmlEntry.layer && geomType === 'Folder') {
            geomType = 'KmlLayer';   // treat whole uploaded file as one record
        }

        // ── Build row ──────────────────────────────────────────────────────
        const row = {
            client_id:    id,
            parent_id:    parentDbId || null,
            label:        item.label || '',
            geom_type:    geomType,
            coordinates:  coords,
            style:        JSON.stringify(style),
            icon:         item.icon  || '',
            checked:      item.checked ? 1 : 0,
            sort_order:   myOrder,
            user_id:      window.currentUser ? window.currentUser.id : 1,
        };
        rows.push(row);

        // ── Recurse into children ──────────────────────────────────────────
        liEl.querySelectorAll(':scope > ul > li').forEach(childLi => {
            walkNode(childLi.id, id);
        });
    }

    walkNode(nodeId, null);

    if (!rows.length) { alert('Nothing to save.'); return; }

    try {
        const resp = await fetch('./newassets/js/editmap/js/upload/save_myplace.php', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ nodes: rows }),
        });
        const json = await resp.json();
        if (json.success) {
            alert(`✅ Saved ${json.saved} item(s) to My Places.`);
        } else {
            alert('❌ Save failed: ' + (json.message || 'Unknown error'));
        }
    } catch (err) {
        console.error('saveNodeToMyPlace error:', err);
        alert('Network error: ' + err.message);
    }
};


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2 — LOAD FROM DATABASE BACK INTO TREE + MAP
// Call window.loadMyPlaces() from a toolbar button or on page load
// ═══════════════════════════════════════════════════════════════════════════════

window.loadMyPlaces = async function () {
    try {
        const userId = window.currentUser ? window.currentUser.id : 1;
        const resp   = await fetch(`./newassets/js/editmap/js/upload/load_myplace.php?user_id=${userId}`);
        const json   = await resp.json();

        if (!json.success) {
            alert('❌ Load failed: ' + (json.message || 'Unknown error'));
            return;
        }

        const nodes = json.nodes;   // flat array, ordered by sort_order
        if (!nodes.length) { alert('No saved places found.'); return; }

        // ── Find or create "My Places" root node in tree ───────────────────
        const myPlacesEl = document.getElementById('myplaces');
        if (!myPlacesEl) { console.error('myplaces node not found'); return; }

        // Map client_id → newly created jqxTree element id
        // (DB client_id may clash with current session ids, so we remap)
        const idMap = {};   // db_client_id → new local id

        nodes.forEach(node => {
            const newId    = 'db_' + node.id;   // prefix avoids collisions
            idMap[node.client_id] = newId;

            const parentEl = node.parent_id
                ? document.getElementById(idMap[node.parent_id])
                : myPlacesEl;

            // ── Rebuild Leaflet layer ──────────────────────────────────────
            let layer  = null;
            let icon   = node.icon || kmlIcon;

            if (node.geom_type === 'Point' && node.coordinates) {
                const parts = node.coordinates.split(',').map(parseFloat);
                const ll    = [parts[1], parts[0]];  // lat,lng
                const style = safeParseJSON(node.style);

                layer = L.marker(ll, {
                    icon: L.icon({
                        iconUrl:    style.iconHref || './img/point_icon.png',
                        iconSize:   [20, 20],
                        iconAnchor: [10, 10],
                    })
                }).addTo(map);
                boundsLatLngs.push(ll);
                icon = './img/point_icon.png';

            } else if (node.geom_type === 'LineString' && node.coordinates) {
                const latLngs = parseCoordString(node.coordinates);
                const style   = safeParseJSON(node.style);

                layer = L.polyline(latLngs, {
                    color:  style.stroke      || '#0000ff',
                    weight: style.strokeWidth || 3,
                }).addTo(map);
                latLngs.forEach(ll => boundsLatLngs.push(ll));
                attachClickHandler(layer);
                icon = './img/polyline.svg';

            } else if (node.geom_type === 'Polygon' && node.coordinates) {
                const latLngs = parseCoordString(node.coordinates);
                const style   = safeParseJSON(node.style);

                layer = L.polygon(latLngs, {
                    color:       style.stroke      || '#ff0000',
                    weight:      style.strokeWidth || 2,
                    fillColor:   style.fill        || '#ffcccc',
                    fillOpacity: style.fillOpacity || 0.5,
                }).addTo(map);
                latLngs.forEach(ll => boundsLatLngs.push(ll));
                attachClickHandler(layer);
                icon = './img/polygon.png';
            }

            if (layer) {
                featureLayers[newId] = [layer];
                if (window.attachContextMenu) window.attachContextMenu(layer);
            }

            // ── Add to jqxTree ─────────────────────────────────────────────
            const treeNode = {
                id:      newId,
                label:   node.label,
                icon:    icon,
                checked: !!node.checked,
                items:   [],
            };

            if (parentEl) {
                $('#jqxTree').jqxTree('addTo', treeNode, parentEl);
            }
        });

        // Zoom to loaded features
        if (boundsLatLngs.length) {
            map.fitBounds(L.latLngBounds(boundsLatLngs), { padding: [20, 20] });
        }

        alert(`✅ Loaded ${nodes.length} item(s) from My Places.`);

    } catch (err) {
        console.error('loadMyPlaces error:', err);
        alert('Network error: ' + err.message);
    }
};


// ── Small helpers ────────────────────────────────────────────────────────────

/** Parse "lon,lat,alt lon,lat,alt …" into Leaflet [[lat,lng], …] */
function parseCoordString(str) {
    return str.trim().split(/\s+/).map(pair => {
        const p = pair.split(',').map(parseFloat);
        return [p[1], p[0]];   // Leaflet = [lat, lng]
    });
}

function safeParseJSON(str) {
    try { return JSON.parse(str) || {}; } catch (_) { return {}; }
}

function attachClickHandler(layer) {
    layer.on('click', e => {
        try {
            L.DomEvent.stopPropagation(e);
            if (window.selectFeature) window.selectFeature(layer, e.latlng);
        } catch (err) { console.warn('select failed', err); }
    });
}


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3 — EXPORT NODE AS KML  (preserves folder structure)
// Called from treeEdit() "🗂️ Export Node as KML"
// ═══════════════════════════════════════════════════════════════════════════════

window.exportNodeKml = function (nodeId) {
    const liEl = document.getElementById(nodeId);
    if (!liEl) return;

    const item = $('#jqxTree').jqxTree('getItem', liEl);
    const name = item ? item.label : 'export';

    const kmlBody = buildKmlFromNode(nodeId);
    const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
${kmlBody}
</kml>`;

    downloadText(kml, name.replace(/[^a-z0-9_\-]/gi, '_') + '.kml', 'application/vnd.google-earth.kml+xml');
};

/**
 * Recursively build KML XML string for a tree node.
 * Folders become <Folder>, placemarks become <Placemark>.
 */
function buildKmlFromNode(nodeId) {
    const liEl = document.getElementById(nodeId);
    if (!liEl) return '';

    const item     = $('#jqxTree').jqxTree('getItem', liEl);
    const label    = item ? escXml(item.label) : 'Unnamed';
    const overlays = featureLayers[nodeId];
    const children = Array.from(liEl.querySelectorAll(':scope > ul > li'));

    // ── Leaf node with geometry ────────────────────────────────────────────
    if (overlays && overlays.length) {
        return buildPlacemark(label, overlays);
    }

    // ── Folder / Document node ─────────────────────────────────────────────
    if (children.length) {
        const inner = children.map(c => buildKmlFromNode(c.id)).join('\n');
        return `  <Folder>\n    <name>${label}</name>\n${inner}\n  </Folder>`;
    }

    // ── Empty folder ───────────────────────────────────────────────────────
    return `  <Folder>\n    <name>${label}</name>\n  </Folder>`;
}

function buildPlacemark(label, overlays) {
    const parts = [];

    overlays.forEach(layer => {
        if (layer instanceof L.Marker) {
            const ll = layer.getLatLng();
            const iconUrl = layer.options.icon?.options?.iconUrl || '';
            parts.push(`  <Placemark>
    <name>${label}</name>
    ${iconUrl ? `<Style><IconStyle><Icon><href>${escXml(iconUrl)}</href></Icon></IconStyle></Style>` : ''}
    <Point><coordinates>${ll.lng},${ll.lat},0</coordinates></Point>
  </Placemark>`);

        } else if (layer instanceof L.Polygon) {
            const ring   = layer.getLatLngs()[0] || [];
            const coords = [...ring, ring[0]]    // close the ring
                .map(ll => `${ll.lng},${ll.lat},0`).join(' ');
            const o = layer.options;
            parts.push(`  <Placemark>
    <name>${label}</name>
    <Style>
      <LineStyle><color>${hexToKmlColor(o.color, o.opacity)}</color><width>${o.weight||2}</width></LineStyle>
      <PolyStyle><color>${hexToKmlColor(o.fillColor, o.fillOpacity)}</color></PolyStyle>
    </Style>
    <Polygon><outerBoundaryIs><LinearRing>
      <coordinates>${coords}</coordinates>
    </LinearRing></outerBoundaryIs></Polygon>
  </Placemark>`);

        } else if (layer instanceof L.Polyline) {
            const lls   = layer.getLatLngs();
            const coords = lls.map(ll => `${ll.lng},${ll.lat},0`).join(' ');
            const o = layer.options;
            parts.push(`  <Placemark>
    <name>${label}</name>
    <Style>
      <LineStyle><color>${hexToKmlColor(o.color, o.opacity)}</color><width>${o.weight||3}</width></LineStyle>
    </Style>
    <LineString><coordinates>${coords}</coordinates></LineString>
  </Placemark>`);
        }
        // Label markers (L.divIcon) — skip, they're display-only
    });

    return parts.join('\n');
}

/** Convert CSS hex color + opacity to KML aabbggrr format */
function hexToKmlColor(hex, opacity) {
    if (!hex) return 'ff0000ff';
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c+c).join('');
    const r  = hex.substring(0, 2);
    const g  = hex.substring(2, 4);
    const b  = hex.substring(4, 6);
    const aa = Math.round((opacity === undefined ? 1 : opacity) * 255)
                  .toString(16).padStart(2, '0');
    return `${aa}${b}${g}${r}`;
}

function escXml(str) {
    return String(str)
        .replace(/&/g,  '&amp;')
        .replace(/</g,  '&lt;')
        .replace(/>/g,  '&gt;')
        .replace(/"/g,  '&quot;');
}

function downloadText(text, filename, mime) {
    const blob = new Blob([text], { type: mime });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4 — WIRE INTO EXISTING treeEdit() CONTEXT MENU
// Replace the two stub handlers inside treeEdit() with these calls:
//
//   $("#saveItem").on("click", () => {
//       if (!contextTargetId) return;
//       window.saveNodeToMyPlace(contextTargetId);
//   });
//
//   $("#exportAsKML").on("click", () => {
//       if (!contextTargetId) return;
//       window.exportNodeKml(contextTargetId);
//   });
// ═══════════════════════════════════════════════════════════════════════════════
