// db_upload.js
// Uploads a selected jqxTree node (and all its feature descendants) to the
// backend REST API.
//
// Integrates with the existing kmlLayers / featureLayers registries from
// load_kml.js and the addNodeToTree pattern used in editor.js.
//
// ─── Public API ──────────────────────────────────────────────────────────────
//   window.dbUploadNode(nodeId, options)   Upload one node subtree
//   window.dbUploadAll()                   Upload every checked feature
// ─────────────────────────────────────────────────────────────────────────────
//
// Expected backend endpoint: POST /api/features/save
//   Body: { features: GeoJSON FeatureCollection, meta: { nodeId, label, … } }
//   Response: { success: true, saved: <count> }
//
// You can override the endpoint:
//   window.DB_UPLOAD_ENDPOINT = '/your/custom/endpoint';
// ─────────────────────────────────────────────────────────────────────────────

// window.DB_UPLOAD_ENDPOINT = window.DB_UPLOAD_ENDPOINT || '/api/features/save';
window.DB_UPLOAD_ENDPOINT = '/map/newassets/js/editmap/js/php/api.php?action=save_features';

// ─────────────────────────────────────────────────────────────────────────────
// Inject Upload button into the tree right-click context menu
// (uses the same #feature-ctx-menu panel from context_menu.js,
//  but we add a separate mini-menu for the tree panel)
// ─────────────────────────────────────────────────────────────────────────────
// (function injectTreeContextMenu() {
//     if (document.getElementById('tree-ctx-menu')) return;

//     const menu = document.createElement('div');
//     menu.id = 'tree-ctx-menu';
//     menu.style.cssText = `
//         display:none; position:fixed; z-index:9200;
//         background:#fff; border:1px solid #ccc; border-radius:6px;
//         box-shadow:0 4px 14px rgba(0,0,0,.25); min-width:210px;
//         font:13px/1.4 sans-serif; overflow:hidden;`;
//     menu.innerHTML = `
//         <div class="ctx-item" data-action="upload-node">
//             <span>☁️</span> Upload Node to Database
//         </div>
//         <div class="ctx-item" data-action="upload-all">
//             <span>📤</span> Upload All Checked Features
//         </div>
//         <hr style="margin:4px 0;">
//         <div class="ctx-item" data-action="zoom-to-node">
//             <span>🔍</span> Zoom To Node
//         </div>
//         <div class="ctx-item" data-action="export-node-kml">
//             <span>💾</span> Export Node as KML
//         </div>`;
//     document.body.appendChild(menu);

//     // Close on outside click
//     document.addEventListener('click', (e) => {
//         if (!e.target.closest('#tree-ctx-menu')) {
//             menu.style.display = 'none';
//         }
//     });

//     menu.addEventListener('click', async (e) => {
//         const item = e.target.closest('[data-action]');
//         if (!item) return;
//         menu.style.display = 'none';

//         const nodeId = menu.dataset.nodeId;
//         switch (item.dataset.action) {
//             case 'upload-node':     await window.dbUploadNode(nodeId); break;
//             case 'upload-all':      await window.dbUploadAll();        break;
//             case 'zoom-to-node':    zoomToNode(nodeId);                break;
//             case 'export-node-kml': exportNodeKml(nodeId);             break;
//         }
//     });
// })();


// ─────────────────────────────────────────────────────────────────────────────
// Hook jqxTree right-click to show the tree context menu
// ─────────────────────────────────────────────────────────────────────────────
window.initDbUploadTreeMenu = function () {
    const tree = document.getElementById('jqxTree');
    if (!tree) return;

    tree.addEventListener('contextmenu', (e) => {
        // Find the hovered tree item
        const li = e.target.closest('li[id]');
        if (!li) return;
        e.preventDefault();
        e.stopPropagation();

        const menu = document.getElementById('tree-ctx-menu');
        menu.dataset.nodeId = li.id;
        menu.style.display  = 'block';
        menu.style.left     = e.clientX + 'px';
        menu.style.top      = e.clientY + 'px';

        // Keep on screen
        const rect = menu.getBoundingClientRect();
        if (rect.right  > window.innerWidth)  menu.style.left = (e.clientX - rect.width)  + 'px';
        if (rect.bottom > window.innerHeight) menu.style.top  = (e.clientY - rect.height) + 'px';
    });
};


// ─────────────────────────────────────────────────────────────────────────────
// Core helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Return all jqxTree items that are descendants of parentId (inclusive).
 */
function getSubtreeItems(parentId) {
    const all = $('#jqxTree').jqxTree('getItems');

    function collect(pid) {
        const results = [];
        all.forEach(item => {
            if (item.parentId === pid) {
                results.push(item);
                results.push(...collect(item.id));
            }
        });
        return results;
    }

    const root = all.find(i => i.id === parentId);
    return root ? [root, ...collect(parentId)] : [];
}


/**
 * Convert a Leaflet layer to a GeoJSON Feature with metadata.
 * Supports L.Marker, L.Polyline, L.Polygon.
 */
function layerToGeoJSONFeature(layer, meta = {}) {
    let geometry = null;

    if (layer instanceof L.Marker) {
        const ll = layer.getLatLng();
        geometry = { type: 'Point', coordinates: [ll.lng, ll.lat] };

    } else if (layer instanceof L.Polygon) {
        // Polygon before Polyline (Polygon extends Polyline)
        const lls = layer.getLatLngs();
        const rings = (Array.isArray(lls[0]) ? lls : [lls]).map(ring =>
            ring.map(ll => [ll.lng, ll.lat])
        );
        // Close rings
        rings.forEach(ring => { if (ring[0].join() !== ring[ring.length - 1].join()) ring.push(ring[0]); });
        geometry = { type: 'Polygon', coordinates: rings };

    } else if (layer instanceof L.Polyline) {
        const lls = layer.getLatLngs().flat(Infinity);
        geometry = { type: 'LineString', coordinates: lls.map(ll => [ll.lng, ll.lat]) };
    }

    if (!geometry) return null;

    return {
        type: 'Feature',
        geometry,
        properties: {
            name:        meta.label  || layer.meta?.name || 'Unnamed',
            id:          meta.id     || layer.meta?.id   || null,
            description: meta.desc   || '',
            nodeId:      meta.nodeId || null,
            style:       layer.options ? {
                color:       layer.options.color,
                weight:      layer.options.weight,
                fillColor:   layer.options.fillColor,
                fillOpacity: layer.options.fillOpacity,
            } : {},
            uploadedAt: new Date().toISOString()
        }
    };
}


/**
 * Collect GeoJSON features for a given list of tree items.
 * Looks up layers in both kmlLayers and featureLayers registries.
 */
function collectFeatures(treeItems) {
    const features = [];

    treeItems.forEach(item => {
        // kmlLayers registry (load_kml.js / addLayerToTree)
        if (typeof kmlLayers !== 'undefined' && kmlLayers[item.id]) {
            const entry = kmlLayers[item.id];
            const layers = Array.isArray(entry.layer)
                ? entry.layer
                : entry.layer
                    ? [entry.layer]
                    : [];

            layers.forEach(layer => {
                if (layer && (layer instanceof L.Polyline || layer instanceof L.Marker)) {
                    const f = layerToGeoJSONFeature(layer, { label: item.label, nodeId: item.id });
                    if (f) features.push(f);
                }
                // L.GeoJSON group — iterate sub-layers
                if (layer && layer.eachLayer) {
                    layer.eachLayer(sub => {
                        const f = layerToGeoJSONFeature(sub, { label: item.label, nodeId: item.id });
                        if (f) features.push(f);
                    });
                }
            });
        }

        // featureLayers registry (load_kml.js / buildOverlaysFromPlacemark)
        if (typeof featureLayers !== 'undefined' && featureLayers[item.id]) {
            const entries = [].concat(featureLayers[item.id]);
            entries.forEach(layer => {
                if (!layer) return;
                if (layer instanceof L.Polyline || layer instanceof L.Marker) {
                    const f = layerToGeoJSONFeature(layer, { label: item.label, nodeId: item.id });
                    if (f) features.push(f);
                }
            });
        }
    });

    return features;
}


// ─────────────────────────────────────────────────────────────────────────────
// Upload functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Upload all features under a given tree node.
 *
 * @param {string}  nodeId    jqxTree node id
 * @param {object}  [opts]
 * @param {boolean} [opts.checkedOnly=false]  Only upload checked items
 * @param {boolean} [opts.silent=false]       Suppress success alert
 */
window.dbUploadNode = async function (nodeId, opts = {}) {
    if (!nodeId) { alert('No node selected.'); return; }

    const { checkedOnly = false, silent = false } = opts;

    const items = getSubtreeItems(nodeId).filter(
        item => !checkedOnly || item.checked
    );

    const features = collectFeatures(items);

    if (!features.length) {
        if (!silent) alert('No uploadable features found under this node.');
        return;
    }

    const rootItem = items[0];
    const payload = {
        meta: {
            nodeId,
            label:    rootItem ? rootItem.label : nodeId,
            count:    features.length,
            uploadedBy: (window.currentUser && window.currentUser.id) || 'webuser',
            uploadedAt: new Date().toISOString()
        },
        features: {
            type: 'FeatureCollection',
            features
        }
    };

    showUploadProgress(true, `Uploading ${features.length} feature(s)…`);

    try {
        const res = await fetch(window.DB_UPLOAD_ENDPOINT, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(payload)
        });

        const data = await res.json();

        showUploadProgress(false);

        if (data.success) {
            if (!silent) {
                showToast(`✅ Uploaded ${data.saved ?? features.length} feature(s) to database.`);
            }
            console.log('[db_upload] Upload success:', data);
        } else {
            alert('Upload failed: ' + (data.message || 'Unknown error'));
        }

    } catch (err) {
        showUploadProgress(false);
        console.error('[db_upload] Upload error:', err);
        alert('Upload error: ' + err.message);
    }
};


/**
 * Upload ALL currently checked features in the tree.
 */
window.dbUploadAll = async function () {
    const all = $('#jqxTree').jqxTree('getItems');
    const checked = all.filter(i => i.checked);

    if (!checked.length) { alert('No checked items to upload.'); return; }

    const features = collectFeatures(checked);

    if (!features.length) { alert('No uploadable features found.'); return; }

    if (!confirm(`Upload all ${features.length} checked feature(s) to the database?`)) return;

    showUploadProgress(true, `Uploading ${features.length} feature(s)…`);

    const payload = {
        meta: {
            nodeId: 'all-checked',
            label:  'All Checked Features',
            count:  features.length,
            uploadedBy: (window.currentUser && window.currentUser.id) || 'webuser',
            uploadedAt: new Date().toISOString()
        },
        features: { type: 'FeatureCollection', features }
    };

    try {
        const res = await fetch(window.DB_UPLOAD_ENDPOINT, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(payload)
        });
        const data = await res.json();
        showUploadProgress(false);

        if (data.success) {
            showToast(`✅ Uploaded ${data.saved ?? features.length} feature(s).`);
        } else {
            alert('Upload failed: ' + (data.message || 'Unknown error'));
        }
    } catch (err) {
        showUploadProgress(false);
        alert('Upload error: ' + err.message);
    }
};


// ─────────────────────────────────────────────────────────────────────────────
// Zoom To Node
// ─────────────────────────────────────────────────────────────────────────────
window.zoomToNode = function(nodeId) {
    const items = getSubtreeItems(nodeId);
    const features = collectFeatures(items);
    if (!features.length) return;

    const coords = features.flatMap(f => {
        const g = f.geometry;
        if (g.type === 'Point') return [[g.coordinates[1], g.coordinates[0]]];
        if (g.type === 'LineString') return g.coordinates.map(c => [c[1], c[0]]);
        if (g.type === 'Polygon') return g.coordinates.flat().map(c => [c[1], c[0]]);
        return [];
    });

    if (coords.length) {
        window.map.fitBounds(L.latLngBounds(coords), { padding: [30, 30] });
    }
}


// ─────────────────────────────────────────────────────────────────────────────
// Export Node as KML
// ─────────────────────────────────────────────────────────────────────────────
window.exportNodeKml = function(nodeId) {
    const items    = getSubtreeItems(nodeId);
    const features = collectFeatures(items);
    if (!features.length) { alert('No features to export.'); return; }

    let kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${items[0]?.label || nodeId}</name>\n`;

    features.forEach(f => {
        const name  = f.properties.name || 'Feature';
        const desc  = f.properties.description || '';
        const geom  = f.geometry;
        let coordStr = '';

        if (geom.type === 'Point') {
            const [lng, lat] = geom.coordinates;
            coordStr = `<Point><coordinates>${lng},${lat},0</coordinates></Point>`;
        } else if (geom.type === 'LineString') {
            const pts = geom.coordinates.map(c => `${c[0]},${c[1]},0`).join(' ');
            coordStr = `<LineString><coordinates>${pts}</coordinates></LineString>`;
        } else if (geom.type === 'Polygon') {
            const pts = geom.coordinates[0].map(c => `${c[0]},${c[1]},0`).join(' ');
            coordStr = `<Polygon><outerBoundaryIs><LinearRing><coordinates>${pts}</coordinates></LinearRing></outerBoundaryIs></Polygon>`;
        }

        kml += `    <Placemark>
      <name>${escXml(name)}</name>
      <description>${escXml(desc)}</description>
      ${coordStr}
    </Placemark>\n`;
    });

    kml += `  </Document>\n</kml>`;

    const blob = new Blob([kml], { type: 'application/vnd.google-earth.kml+xml' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), {
        href: url, download: (items[0]?.label || 'export') + '.kml'
    });
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast(`💾 KML exported (${features.length} feature(s))`);
}

function escXml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}


// ─────────────────────────────────────────────────────────────────────────────
// Upload progress indicator
// ─────────────────────────────────────────────────────────────────────────────
function showUploadProgress(visible, msg = '') {
    let bar = document.getElementById('db-upload-progress');
    if (!bar) {
        bar = document.createElement('div');
        bar.id = 'db-upload-progress';
        bar.style.cssText = `
            position:fixed; top:0; left:0; right:0; z-index:10001;
            background:#1a73e8; color:#fff;
            padding:6px 16px; font-size:13px; text-align:center;
            display:none; transition: opacity .3s;`;
        document.body.appendChild(bar);
    }
    bar.textContent    = msg;
    bar.style.display  = visible ? 'block' : 'none';
}


// Expose showToast for other modules that may not load context_menu.js
if (!window.showToast) {
    window.showToast = function (msg, duration = 2500) {
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
    };
}


// Auto-init tree context menu once DOM is ready
// if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', window.initDbUploadTreeMenu);
// } else {
//     window.initDbUploadTreeMenu();
// }
