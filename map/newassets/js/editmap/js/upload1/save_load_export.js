// ─────────────────────────────────────────────────────────────────────────────
// SAVE / LOAD / EXPORT  —  drop alongside load_kml.js
// ─────────────────────────────────────────────────────────────────────────────


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1 — SAVE NODE TO DATABASE + MOVE UNDER "My Places"
// ═══════════════════════════════════════════════════════════════════════════════

window.saveNodeToMyPlace = async function (nodeId) {
    const tree = $('#jqxTree');
    const rows = [];
    let order  = 0;

    // ── Read popup HTML from a Leaflet layer ─────────────────────────────────
    // getPopup() returns null if popup was never opened — use _popup as fallback
    function getPopupHtml(layer) {
        if (!layer) return '';
        try {
            console.log('Popup:', layer.getPopup(), 'Fallback _popup:', layer._popup);
            const p = (layer.getPopup && layer.getPopup()) || layer._popup || null;
            if (!p) return '';
            const c = p.getContent();
            // getContent() can return a string or a DOM node
            if (typeof c === 'string') return c;
            if (c && c.outerHTML) return c.outerHTML;
            // return '';
        } catch (_) { return ''; }
    }

    // ── Recursive walker ─────────────────────────────────────────────────────
    function walkNode(id, parentClientId) {
        const liEl = document.getElementById(id);
        if (!liEl) return;
        const item = tree.jqxTree('getItem', liEl);
        if (!item) return;

        order++;
        let geomType = 'Folder';
        let coords   = '';
        let style    = {};
        let popup    = '';

        const overlays = featureLayers[id];
        if (overlays && overlays.length) {
            // Skip divIcon label markers — find the real geometry layer
            const geomLayer = overlays.find(l =>
                (l instanceof L.Marker   && !(l.options.icon instanceof L.DivIcon)) ||
                l instanceof L.Polyline  ||
                l instanceof L.Polygon
            ) || null;
            console.log('Found overlays for node', id, 'geomLayer:', geomLayer);
            if (geomLayer) {
                popup = getPopupHtml(geomLayer);
                // console.log('Saving node', id, 'with popup:', popup);

                if (geomLayer instanceof L.Marker && !(geomLayer.options.icon instanceof L.DivIcon)) {
                    const ll = geomLayer.getLatLng();
                    geomType = 'Point';
                    coords   = `${ll.lng},${ll.lat},0`;
                    style    = { iconHref: geomLayer.options.icon?.options?.iconUrl || '' };

                } else if (geomLayer instanceof L.Polygon) {
                    const ring = geomLayer.getLatLngs()[0] || [];
                    geomType   = 'Polygon';
                    coords     = ring.map(ll => `${ll.lng},${ll.lat},0`).join(' ');
                    style      = {
                        stroke:        geomLayer.options.color        || '#ff0000',
                        strokeWidth:   geomLayer.options.weight       || 2,
                        strokeOpacity: geomLayer.options.opacity      || 1,
                        fill:          geomLayer.options.fillColor    || '#ffcccc',
                        fillOpacity:   geomLayer.options.fillOpacity  || 0.5
                    };

                } else if (geomLayer instanceof L.Polyline) {
                    geomType = 'LineString';
                    coords   = geomLayer.getLatLngs().map(ll => `${ll.lng},${ll.lat},0`).join(' ');
                    style    = {
                        stroke:        geomLayer.options.color    || '#0000ff',
                        strokeWidth:   geomLayer.options.weight   || 3,
                        strokeOpacity: geomLayer.options.opacity  || 1
                    };
                }
            }
        }

        const kmlEntry = kmlLayers[id];
        if (kmlEntry && kmlEntry.layer && geomType === 'Folder') {
            geomType = 'KmlLayer';
        }

        rows.push({
            client_id:   id,
            parent_id:   parentClientId || null,
            label:       item.label     || '',
            geom_type:   geomType,
            coordinates: coords,
            style:       JSON.stringify(style),
            popup:       popup,
            icon:        item.icon      || '',
            checked:     item.checked   ? 1 : 0,
            sort_order:  order,
            user_id:     window.currentUser ? window.currentUser.id : '1',
        });

        liEl.querySelectorAll(':scope > ul > li').forEach(childLi => {
            walkNode(childLi.id, id);
        });
    }

    walkNode(nodeId, null);


    console.log('Prepared rows for saving:', rows);
    if (!rows.length) { alert('Nothing to save.'); return; }

    try {
        const resp = await fetch('./newassets/js/editmap/js/upload1/save_myplace.php', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ nodes: rows }),
        });
        const json = await resp.json();

        if (!json.success) {
            alert('❌ Save failed: ' + (json.message || 'Unknown error'));
            return;
        }

        // Move node in tree to "My Places" after successful save
        const myPlacesEl = document.getElementById('myplaces');
        if (myPlacesEl) _moveNodeToMyPlaces(nodeId, myPlacesEl);

        alert(`✅ Saved ${json.saved} item(s) to My Places.`);

    } catch (err) {
        console.error('saveNodeToMyPlace:', err);
        alert('Network error: ' + err.message);
    }
};


// ── Move a jqxTree node + full subtree under myplaces ───────────────────────
function _moveNodeToMyPlaces(nodeId, myPlacesEl) {
    const tree = $('#jqxTree');

    function snapshotNode(id) {
        const liEl = document.getElementById(id);
        if (!liEl) return null;
        const item = tree.jqxTree('getItem', liEl);
        if (!item) return null;
        const node = {
            id:      id,
            label:   item.label,
            icon:    item.icon    || '',
            checked: !!item.checked,
            value:   item.value   || '',
            items:   []
        };
        liEl.querySelectorAll(':scope > ul > li').forEach(childLi => {
            const c = snapshotNode(childLi.id);
            if (c) node.items.push(c);
        });
        return node;
    }

    const snapshot = snapshotNode(nodeId);
    if (!snapshot) return;

    tree.jqxTree('removeItem', document.getElementById(nodeId));

    function insertNode(nodeData, parentEl) {
        tree.jqxTree('addTo', {
            id:      nodeData.id,
            label:   nodeData.label,
            icon:    nodeData.icon,
            checked: nodeData.checked,
            value:   nodeData.value,
        }, parentEl);
        const el = document.getElementById(nodeData.id);
        if (el && nodeData.items.length) {
            nodeData.items.forEach(child => insertNode(child, el));
        }
    }

    insertNode(snapshot, myPlacesEl);
    tree.jqxTree('expandItem', myPlacesEl);
}


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2 — LOAD FROM DATABASE → RESTORE FULL FOLDER + MAP LAYERS
// ═══════════════════════════════════════════════════════════════════════════════

window.loadMyPlaces = async function () {
    try {
        const userId = window.currentUser ? window.currentUser.id : '1';
        const resp   = await fetch(`./newassets/js/editmap/js/upload1/load_myplace.php?user_id=${encodeURIComponent(userId)}`);
        const json   = await resp.json();

        if (!json.success) {
            alert('❌ Load failed: ' + (json.message || 'Unknown error'));
            return;
        }

        const flat = json.nodes;
        if (!flat || !flat.length) { alert('No saved places found.'); return; }

        const myPlacesEl = document.getElementById('myplaces');
        if (!myPlacesEl) { console.error('#myplaces not found'); return; }

        // ── Build nested structure from flat array ───────────────────────────
        // KEY FIX: use DB numeric `id` as map key (always unique),
        // NOT client_id which can collide if the same tree was saved twice.
        const byDbId = {};   // db_id (int) → node object with .children[]
        const roots  = [];

        flat.forEach(n => {
            byDbId[n.id] = { ...n, children: [] };
        });

        flat.forEach(n => {
            if (n.parent_id && byDbId[n.parent_id]) {
                // parent_id here is the DB integer id of the parent row
                byDbId[n.parent_id].children.push(byDbId[n.id]);
            } else {
                roots.push(byDbId[n.id]);
            }
        });

        const loadedBounds = [];

        // ── Recursive insert ─────────────────────────────────────────────────
        function insertDbNode(dbNode, parentEl) {
            // Prefix with 'mp_' + db id to guarantee no clash with live session ids
            const newId     = 'mp_' + dbNode.id;
            const style     = safeParseJSON(dbNode.style);
            const popupHtml = dbNode.popup || '';
            let   layer     = null;
            let   icon      = dbNode.icon || kmlIcon;

            if (dbNode.geom_type === 'Point' && dbNode.coordinates) {
                const ll = parseCoordString(dbNode.coordinates)[0];
                if (ll) {
                    layer = L.marker(ll, {
                        icon: L.icon({
                            iconUrl:     style.iconHref || './img/point_icon.png',
                            iconSize:    [20, 20],
                            iconAnchor:  [10, 10],
                            popupAnchor: [0, -10],
                        })
                    }).addTo(map);
                    if (popupHtml) layer.bindPopup(popupHtml);
                    loadedBounds.push(ll);
                    icon = style.iconHref || './img/point_icon.png';
                }

            } else if (dbNode.geom_type === 'LineString' && dbNode.coordinates) {
                const lls = parseCoordString(dbNode.coordinates);
                if (lls.length) {
                    layer = L.polyline(lls, {
                        color:   style.stroke        || '#0000ff',
                        weight:  style.strokeWidth   || 3,
                        opacity: style.strokeOpacity || 1,
                    }).addTo(map);
                    if (popupHtml) layer.bindPopup(popupHtml);
                    lls.forEach(ll => loadedBounds.push(ll));
                    _attachLayerClick(layer);
                    icon = './img/polyline.svg';
                }

            } else if (dbNode.geom_type === 'Polygon' && dbNode.coordinates) {
                const lls = parseCoordString(dbNode.coordinates);
                if (lls.length) {
                    layer = L.polygon(lls, {
                        color:       style.stroke        || '#ff0000',
                        weight:      style.strokeWidth   || 2,
                        opacity:     style.strokeOpacity || 1,
                        fillColor:   style.fill          || '#ffcccc',
                        fillOpacity: style.fillOpacity   || 0.5,
                    }).addTo(map);
                    if (popupHtml) layer.bindPopup(popupHtml);
                    lls.forEach(ll => loadedBounds.push(ll));
                    _attachLayerClick(layer);
                    icon = './img/polygon.png';
                }
            }

            if (layer) {
                featureLayers[newId] = [layer];
                if (window.attachContextMenu) window.attachContextMenu(layer);
            }

            // Add tree node
            $('#jqxTree').jqxTree('addTo', {
                id:      newId,
                label:   dbNode.label,
                icon:    icon,
                checked: !!parseInt(dbNode.checked),
                value:   dbNode.geom_type === 'Folder' ? 'folder'
                                                       : dbNode.geom_type.toLowerCase(),
            }, parentEl);

            const insertedEl = document.getElementById(newId);

            // Recurse children sorted by sort_order
            if (insertedEl && dbNode.children.length) {
                dbNode.children
                    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                    .forEach(child => insertDbNode(child, insertedEl));
            }
        }

        roots.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
             .forEach(root => insertDbNode(root, myPlacesEl));

        $('#jqxTree').jqxTree('expandItem', myPlacesEl);

        if (loadedBounds.length) {
            map.fitBounds(L.latLngBounds(loadedBounds), { padding: [20, 20] });
        }

        alert(`✅ Loaded ${flat.length} item(s) from My Places.`);

    } catch (err) {
        console.error('loadMyPlaces:', err);
        alert('Network error: ' + err.message);
    }
};

function _attachLayerClick(layer) {
    layer.on('click', e => {
        try {
            L.DomEvent.stopPropagation(e);
            if (window.selectFeature) window.selectFeature(layer, e.latlng);
        } catch (_) {}
    });
}


// ── Shared helpers ────────────────────────────────────────────────────────────

function parseCoordString(str) {
    if (!str || !str.trim()) return [];
    return str.trim().split(/\s+/).map(pair => {
        const p = pair.split(',').map(parseFloat);
        return [p[1], p[0]];   // [lat, lng]
    }).filter(ll => !isNaN(ll[0]) && !isNaN(ll[1]));
}

function safeParseJSON(str) {
    try { return JSON.parse(str) || {}; } catch (_) { return {}; }
}


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3 — EXPORT NODE AS KML
// ═══════════════════════════════════════════════════════════════════════════════

window.exportNodeKml = function (nodeId) {
    const liEl = document.getElementById(nodeId);
    if (!liEl) return;
    const item = $('#jqxTree').jqxTree('getItem', liEl);
    const name = item ? item.label : 'export';
    const kml  = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
${buildKmlFromNode(nodeId)}
</kml>`;
    downloadText(kml, name.replace(/[^a-z0-9_\-]/gi, '_') + '.kml',
                 'application/vnd.google-earth.kml+xml');
};

function buildKmlFromNode(nodeId) {
    const liEl    = document.getElementById(nodeId);
    if (!liEl) return '';
    const item     = $('#jqxTree').jqxTree('getItem', liEl);
    const label    = item ? escXml(item.label) : 'Unnamed';
    const overlays = featureLayers[nodeId];
    const children = Array.from(liEl.querySelectorAll(':scope > ul > li'));

    if (overlays && overlays.length) return buildPlacemark(label, overlays);

    if (children.length) {
        const inner = children.map(c => buildKmlFromNode(c.id)).join('\n');
        return `  <Folder>\n    <name>${label}</name>\n${inner}\n  </Folder>`;
    }
    return `  <Folder>\n    <name>${label}</name>\n  </Folder>`;
}

function buildPlacemark(label, overlays) {
    const parts = [];
    overlays.forEach(layer => {
        if (layer instanceof L.Marker && layer.options.icon instanceof L.DivIcon) return;

        // Read popup using _popup fallback same as save
        let popupHtml = '';
        try {
            const p = (layer.getPopup && layer.getPopup()) || layer._popup || null;
            if (p) {
                const c = p.getContent();
                popupHtml = typeof c === 'string' ? c : (c && c.outerHTML ? c.outerHTML : '');
            }
        } catch (_) {}
        const descTag = popupHtml
            ? `\n    <description><![CDATA[${popupHtml}]]></description>` : '';

        if (layer instanceof L.Marker) {
            const ll = layer.getLatLng();
            const iconUrl = layer.options.icon?.options?.iconUrl || '';
            parts.push(`  <Placemark>
    <name>${label}</name>${descTag}
    ${iconUrl ? `<Style><IconStyle><Icon><href>${escXml(iconUrl)}</href></Icon></IconStyle></Style>` : ''}
    <Point><coordinates>${ll.lng},${ll.lat},0</coordinates></Point>
  </Placemark>`);

        } else if (layer instanceof L.Polygon) {
            const ring   = layer.getLatLngs()[0] || [];
            const coords = [...ring, ring[0]].map(ll => `${ll.lng},${ll.lat},0`).join(' ');
            const o = layer.options;
            parts.push(`  <Placemark>
    <name>${label}</name>${descTag}
    <Style>
      <LineStyle><color>${hexToKmlColor(o.color, o.opacity)}</color><width>${o.weight||2}</width></LineStyle>
      <PolyStyle><color>${hexToKmlColor(o.fillColor, o.fillOpacity)}</color></PolyStyle>
    </Style>
    <Polygon><outerBoundaryIs><LinearRing>
      <coordinates>${coords}</coordinates>
    </LinearRing></outerBoundaryIs></Polygon>
  </Placemark>`);

        } else if (layer instanceof L.Polyline) {
            const coords = layer.getLatLngs().map(ll => `${ll.lng},${ll.lat},0`).join(' ');
            const o = layer.options;
            parts.push(`  <Placemark>
    <name>${label}</name>${descTag}
    <Style>
      <LineStyle><color>${hexToKmlColor(o.color, o.opacity)}</color><width>${o.weight||3}</width></LineStyle>
    </Style>
    <LineString><coordinates>${coords}</coordinates></LineString>
  </Placemark>`);
        }
    });
    return parts.join('\n');
}

function hexToKmlColor(hex, opacity) {
    if (!hex) return 'ff0000ff';
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const r  = hex.substring(0, 2);
    const g  = hex.substring(2, 4);
    const b  = hex.substring(4, 6);
    const aa = Math.round((opacity === undefined ? 1 : opacity) * 255)
                   .toString(16).padStart(2, '0');
    return `${aa}${b}${g}${r}`;
}

function escXml(str) {
    return String(str)
        .replace(/&/g,'&amp;').replace(/</g,'&lt;')
        .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function downloadText(text, filename, mime) {
    const blob = new Blob([text], { type: mime });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    a.remove(); URL.revokeObjectURL(url);
}


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4 — WIRE INTO treeEdit() context menu:
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
