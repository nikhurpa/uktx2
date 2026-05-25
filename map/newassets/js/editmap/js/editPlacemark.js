// editPlacemark.js
// Google Earth-style Edit Placemark dialog for Leaflet
// Supports: Markers, Polylines, Polygons
// Usage: editPlacemark.open(layer, map)

const editPlacemark = (function () {

    // ── Inject CSS once ───────────────────────────────────────────────────────
    const CSS = `
        #ep-overlay {
            position: fixed; inset: 0;
            background: rgba(0,0,0,0.45);
            z-index: 99998;
            display: flex; align-items: center; justify-content: center;
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 13px;
        }
        #ep-dialog {
            background: #f0f0f0;
            border: 1px solid #888;
            border-radius: 4px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.45);
            width: 560px;
            max-width: 98vw;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            z-index: 99999;
        }
        /* Title bar */
        #ep-titlebar {
            background: linear-gradient(to bottom, #4a90d9, #2a6db5);
            color: #fff;
            padding: 8px 12px;
            display: flex; align-items: center; justify-content: space-between;
            cursor: move;
            user-select: none;
        }
        #ep-titlebar span { font-size: 14px; font-weight: bold; letter-spacing: 0.3px; }
        #ep-close {
            background: #cc3333; border: none; color: #fff;
            width: 22px; height: 22px; border-radius: 3px;
            cursor: pointer; font-size: 14px; line-height: 1;
            display: flex; align-items: center; justify-content: center;
        }
        #ep-close:hover { background: #aa1111; }

        /* Name row */
        #ep-name-row {
            display: flex; align-items: center; gap: 8px;
            padding: 10px 14px 6px;
            background: #f0f0f0;
        }
        #ep-name-row label { font-weight: bold; white-space: nowrap; }
        #ep-name {
            flex: 1; padding: 4px 6px;
            border: 1px solid #aaa; border-radius: 3px;
            font-size: 13px;
        }
        #ep-icon-btn {
            width: 30px; height: 30px; border: 1px solid #aaa;
            border-radius: 3px; cursor: pointer; background: #fff;
            display: flex; align-items: center; justify-content: center;
            font-size: 18px; flex-shrink: 0;
        }

        /* Lat/Lng row (markers only) */
        #ep-latlng-row {
            display: flex; gap: 20px; padding: 4px 14px 8px;
            background: #f0f0f0;
        }
        .ep-coord { display: flex; align-items: center; gap: 6px; }
        .ep-coord label { font-weight: bold; white-space: nowrap; }
        .ep-coord input {
            width: 120px; padding: 3px 6px;
            border: 1px solid #aaa; border-radius: 3px; font-size: 13px;
        }

        /* Tabs */
        #ep-tabs {
            display: flex; border-bottom: 1px solid #aaa;
            background: #dde3ea; padding: 0 14px;
        }
        .ep-tab {
            padding: 6px 14px; cursor: pointer;
            border: 1px solid transparent; border-bottom: none;
            margin-bottom: -1px; border-radius: 3px 3px 0 0;
            color: #333; font-size: 13px;
        }
        .ep-tab.active {
            background: #f8f8f8; border-color: #aaa;
            color: #000; font-weight: bold;
        }
        .ep-tab:hover:not(.active) { background: #ccd3da; }

        /* Tab panels */
        #ep-panels { flex: 1; overflow-y: auto; background: #f8f8f8; }
        .ep-panel { display: none; padding: 12px 14px; }
        .ep-panel.active { display: block; }

        /* Description panel */
        #ep-desc {
            width: 100%; height: 160px;
            border: 1px solid #aaa; border-radius: 3px;
            font-size: 12px; font-family: monospace; resize: vertical;
            padding: 6px; box-sizing: border-box;
        }

        /* Style panel */
        .ep-style-grid {
            display: grid; grid-template-columns: 140px 1fr; gap: 10px 14px;
            align-items: center;
        }
        .ep-style-grid label { font-weight: bold; text-align: right; }
        .ep-style-grid input[type=color] {
            width: 48px; height: 28px; border: 1px solid #aaa;
            border-radius: 3px; cursor: pointer; padding: 1px;
        }
        .ep-style-grid input[type=range] { width: 140px; }
        .ep-style-grid input[type=number] {
            width: 70px; padding: 3px 6px;
            border: 1px solid #aaa; border-radius: 3px;
        }
        .ep-style-grid select {
            padding: 3px 6px; border: 1px solid #aaa; border-radius: 3px;
        }
        .ep-range-row { display: flex; align-items: center; gap: 8px; }
        .ep-range-val { width: 32px; text-align: center; font-weight: bold; }

        /* Extended data panel */
        #ep-extdata-table { width: 100%; border-collapse: collapse; }
        #ep-extdata-table th {
            background: #dde; padding: 5px 8px; text-align: left;
            border: 1px solid #aaa; font-size: 12px;
        }
        #ep-extdata-table td {
            padding: 4px 6px; border: 1px solid #ccc; font-size: 12px;
        }
        #ep-extdata-table input {
            width: 100%; border: none; background: transparent;
            font-size: 12px; padding: 0;
        }
        #ep-extdata-table input:focus { outline: 1px solid #4a90d9; }
        .ep-add-row-btn {
            margin-top: 8px; padding: 4px 10px;
            background: #4a90d9; color: #fff; border: none;
            border-radius: 3px; cursor: pointer; font-size: 12px;
        }
        .ep-add-row-btn:hover { background: #2a6db5; }
        .ep-del-btn {
            background: #cc3333; color: #fff; border: none;
            border-radius: 2px; cursor: pointer; padding: 2px 6px; font-size: 11px;
        }

        /* Icon picker panel */
        #ep-icon-grid {
            display: flex; flex-wrap: wrap; gap: 8px; padding: 8px 0;
        }
        .ep-icon-opt {
            width: 36px; height: 36px; border: 2px solid #ccc;
            border-radius: 4px; cursor: pointer; display: flex;
            align-items: center; justify-content: center; font-size: 20px;
            background: #fff;
        }
        .ep-icon-opt:hover, .ep-icon-opt.selected { border-color: #4a90d9; background: #e8f0fb; }
        #ep-icon-custom-url {
            width: 100%; margin-top: 8px; padding: 4px 6px;
            border: 1px solid #aaa; border-radius: 3px; font-size: 12px;
            box-sizing: border-box;
        }

        /* Bottom buttons */
        #ep-footer {
            display: flex; justify-content: flex-end; gap: 8px;
            padding: 10px 14px; background: #e0e0e0;
            border-top: 1px solid #bbb;
        }
        .ep-btn {
            padding: 5px 18px; border-radius: 3px; cursor: pointer;
            font-size: 13px; border: 1px solid #999;
        }
        .ep-btn-ok { background: #4a90d9; color: #fff; border-color: #2a6db5; }
        .ep-btn-ok:hover { background: #2a6db5; }
        .ep-btn-cancel { background: #e8e8e8; }
        .ep-btn-cancel:hover { background: #d0d0d0; }

        /* Section headers */
        .ep-section-title {
            font-weight: bold; color: #2a5080;
            margin: 0 0 10px; font-size: 12px; text-transform: uppercase;
            letter-spacing: 0.5px;
        }
    `;

    let styleInjected = false;
    function injectStyle() {
        if (styleInjected) return;
        const s = document.createElement('style');
        s.textContent = CSS;
        document.head.appendChild(s);
        styleInjected = true;
    }

    // ── Built-in icon options (emoji + common Leaflet icons) ──────────────────
    const BUILTIN_ICONS = [
        { label: '📍', value: 'pin' },
        { label: '⭐', value: 'star' },
        { label: '🔵', value: 'circle-blue' },
        { label: '🔴', value: 'circle-red' },
        { label: '🟢', value: 'circle-green' },
        { label: '🟡', value: 'circle-yellow' },
        { label: '🏠', value: 'home' },
        { label: '🏢', value: 'building' },
        { label: '📡', value: 'antenna' },
        { label: '⚡', value: 'power' },
        { label: '🔧', value: 'tool' },
        { label: '📶', value: 'signal' },
        { label: '🗼', value: 'tower' },
        { label: '⚠️', value: 'warning' },
        { label: '✅', value: 'ok' },
        { label: '❌', value: 'error' },
    ];

    // Detect layer type
    function getLayerType(layer) {
        if (layer instanceof L.Marker)   return 'marker';
        if (layer instanceof L.Polygon)  return 'polygon';   // before Polyline
        if (layer instanceof L.Polyline) return 'polyline';
        return 'unknown';
    }

    // Get current properties from layer
    function getProps(layer) {
        return (layer.feature && layer.feature.properties) || {};
    }

    // ── Build the dialog HTML ─────────────────────────────────────────────────
    function buildDialog(layer, map) {
        const type  = getLayerType(layer);
        const props = getProps(layer);

        // Current style
        const curStyle = layer.options || {};
        const curLatLng = type === 'marker' ? layer.getLatLng() : null;

        // Which tabs to show
        const showStyleTab = true;
        const showViewTab  = type === 'marker';

        // Extended data — skip internal style keys
        const skipKeys = [
            'name','description','styleUrl','stroke','stroke-width',
            'stroke-opacity','fill','fill-opacity','icon',
            'icon-opacity','icon-color','icon-scale',
            'marker-color','marker-size','marker-symbol',
        ];
        const extEntries = Object.entries(props).filter(([k]) => !skipKeys.includes(k));

        const html = `
        <div id="ep-overlay">
          <div id="ep-dialog">

            <!-- Title bar -->
            <div id="ep-titlebar">
              <span>Edit Placemark</span>
              <button id="ep-close" title="Close">✕</button>
            </div>

            <!-- Name + icon button -->
            <div id="ep-name-row">
              <label>Name:</label>
              <input id="ep-name" type="text" value="${escHtml(props.name || '')}" />
              ${type === 'marker' ? `<div id="ep-icon-btn" title="Change Icon">📍</div>` : ''}
            </div>

            <!-- Lat/Lng (marker only) -->
            ${type === 'marker' ? `
            <div id="ep-latlng-row">
              <div class="ep-coord">
                <label>Latitude:</label>
                <input id="ep-lat" type="number" step="0.000001"
                  value="${curLatLng ? curLatLng.lat.toFixed(6) : ''}" />
              </div>
              <div class="ep-coord">
                <label>Longitude:</label>
                <input id="ep-lng" type="number" step="0.000001"
                  value="${curLatLng ? curLatLng.lng.toFixed(6) : ''}" />
              </div>
            </div>` : ''}

            <!-- Tabs -->
            <div id="ep-tabs">
              <div class="ep-tab active" data-tab="description">Description</div>
              <div class="ep-tab" data-tab="style">Style, Color</div>
              ${type === 'marker' ? `<div class="ep-tab" data-tab="icon">Icon</div>` : ''}
              <div class="ep-tab" data-tab="extdata">Properties</div>
            </div>

            <!-- Panels -->
            <div id="ep-panels">

              <!-- Description -->
              <div class="ep-panel active" data-panel="description">
                <p class="ep-section-title">Description</p>
                <textarea id="ep-desc">${escHtml(
                    typeof props.description === 'object'
                        ? (props.description.value || '')
                        : (props.description || '')
                )}</textarea>
              </div>

              <!-- Style -->
              <div class="ep-panel" data-panel="style">
                <p class="ep-section-title">Style &amp; Color</p>
                <div class="ep-style-grid">

                  ${type === 'marker' ? `
                  <label>Icon Opacity:</label>
                  <div class="ep-range-row">
                    <input type="range" id="ep-icon-opacity" min="0" max="1" step="0.05"
                      value="${props['icon-opacity'] || 1}" />
                    <span class="ep-range-val" id="ep-icon-opacity-val">
                      ${props['icon-opacity'] || 1}
                    </span>
                  </div>
                  <label>Icon Scale:</label>
                  <div class="ep-range-row">
                    <input type="range" id="ep-icon-scale" min="0.5" max="3" step="0.1"
                      value="${props['icon-scale'] || 1}" />
                    <span class="ep-range-val" id="ep-icon-scale-val">
                      ${props['icon-scale'] || 1}
                    </span>
                  </div>
                  <label>Icon Color:</label>
                  <input type="color" id="ep-icon-color"
                    value="${rgbToHex(props['icon-color'] || '#ffff00')}" />
                  ` : ''}

                  ${type !== 'marker' ? `
                  <label>Line Color:</label>
                  <input type="color" id="ep-stroke-color"
                    value="${curStyle.color || '#3388ff'}" />
                  <label>Line Width:</label>
                  <div class="ep-range-row">
                    <input type="range" id="ep-stroke-width" min="1" max="20" step="1"
                      value="${curStyle.weight || 3}" />
                    <span class="ep-range-val" id="ep-stroke-width-val">
                      ${curStyle.weight || 3}
                    </span>
                  </div>
                  <label>Line Opacity:</label>
                  <div class="ep-range-row">
                    <input type="range" id="ep-stroke-opacity" min="0" max="1" step="0.05"
                      value="${curStyle.opacity || 1}" />
                    <span class="ep-range-val" id="ep-stroke-opacity-val">
                      ${curStyle.opacity || 1}
                    </span>
                  </div>
                  ` : ''}

                  ${type === 'polygon' ? `
                  <label>Fill Color:</label>
                  <input type="color" id="ep-fill-color"
                    value="${curStyle.fillColor || '#3388ff'}" />
                  <label>Fill Opacity:</label>
                  <div class="ep-range-row">
                    <input type="range" id="ep-fill-opacity" min="0" max="1" step="0.05"
                      value="${curStyle.fillOpacity || 0.2}" />
                    <span class="ep-range-val" id="ep-fill-opacity-val">
                      ${curStyle.fillOpacity || 0.2}
                    </span>
                  </div>
                  ` : ''}

                </div>
              </div>

              <!-- Icon picker (marker only) -->
              ${type === 'marker' ? `
              <div class="ep-panel" data-panel="icon">
                <p class="ep-section-title">Choose Icon</p>
                <div id="ep-icon-grid">
                  ${BUILTIN_ICONS.map(ic => `
                    <div class="ep-icon-opt" data-icon="${ic.value}" title="${ic.value}">
                      ${ic.label}
                    </div>`).join('')}
                </div>
                <input id="ep-icon-custom-url" type="text"
                  placeholder="Or paste a custom icon URL here…"
                  value="${props.icon || ''}" />
              </div>` : ''}

              <!-- Extended Properties -->
              <div class="ep-panel" data-panel="extdata">
                <p class="ep-section-title">Extended Properties</p>
                <table id="ep-extdata-table">
                  <thead>
                    <tr>
                      <th style="width:45%">Property Name</th>
                      <th>Value</th>
                      <th style="width:40px"></th>
                    </tr>
                  </thead>
                  <tbody id="ep-extdata-body">
                    ${extEntries.map(([k, v]) => extDataRow(k, v)).join('')}
                  </tbody>
                </table>
                <button class="ep-add-row-btn" id="ep-add-row">+ Add Property</button>
              </div>

            </div><!-- /panels -->

            <!-- Footer -->
            <div id="ep-footer">
              <button class="ep-btn ep-btn-cancel" id="ep-cancel">Cancel</button>
              <button class="ep-btn ep-btn-ok"     id="ep-ok">OK</button>
            </div>

          </div><!-- /dialog -->
        </div><!-- /overlay -->`;

        return html;
    }

    function extDataRow(key, val) {
        return `<tr>
          <td><input type="text" class="ep-prop-key"   value="${escHtml(key)}" /></td>
          <td><input type="text" class="ep-prop-val"   value="${escHtml(String(val))}" /></td>
          <td><button class="ep-del-btn" onclick="this.closest('tr').remove()">✕</button></td>
        </tr>`;
    }

    // ── Wire up events ────────────────────────────────────────────────────────
    function wireEvents(layer, map, resolve) {
        const dlg  = document.getElementById('ep-dialog');
        const type = getLayerType(layer);

        // Tabs
        document.querySelectorAll('.ep-tab').forEach(tab => {
            tab.addEventListener('click', function () {
                document.querySelectorAll('.ep-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.ep-panel').forEach(p => p.classList.remove('active'));
                this.classList.add('active');
                const panelName = this.dataset.tab;
                document.querySelector(`.ep-panel[data-panel="${panelName}"]`).classList.add('active');
            });
        });

        // Range sliders → live value display
        const rangeMap = [
            ['ep-icon-opacity', 'ep-icon-opacity-val'],
            ['ep-icon-scale',   'ep-icon-scale-val'],
            ['ep-stroke-width', 'ep-stroke-width-val'],
            ['ep-stroke-opacity','ep-stroke-opacity-val'],
            ['ep-fill-opacity', 'ep-fill-opacity-val'],
        ];
        rangeMap.forEach(([inputId, valId]) => {
            const inp = document.getElementById(inputId);
            const val = document.getElementById(valId);
            if (inp && val) {
                inp.addEventListener('input', () => { val.textContent = inp.value; });
            }
        });

        // Icon picker grid
        document.querySelectorAll('.ep-icon-opt').forEach(opt => {
            opt.addEventListener('click', function () {
                document.querySelectorAll('.ep-icon-opt').forEach(o => o.classList.remove('selected'));
                this.classList.add('selected');
                const urlInput = document.getElementById('ep-icon-custom-url');
                if (urlInput) urlInput.value = '';
            });
        });

        // Icon button opens icon tab
        const iconBtn = document.getElementById('ep-icon-btn');
        if (iconBtn) {
            iconBtn.addEventListener('click', () => {
                document.querySelectorAll('.ep-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.ep-panel').forEach(p => p.classList.remove('active'));
                document.querySelector('.ep-tab[data-tab="icon"]').classList.add('active');
                document.querySelector('.ep-panel[data-panel="icon"]').classList.add('active');
            });
        }

        // Add property row
        const addRowBtn = document.getElementById('ep-add-row');
        if (addRowBtn) {
            addRowBtn.addEventListener('click', () => {
                const tbody = document.getElementById('ep-extdata-body');
                tbody.insertAdjacentHTML('beforeend', extDataRow('', ''));
            });
        }

        // Dragging title bar
        makeDraggable(document.getElementById('ep-titlebar'), dlg);

        // Cancel
        document.getElementById('ep-cancel').addEventListener('click', () => {
            close(); resolve(null);
        });
        document.getElementById('ep-close').addEventListener('click', () => {
            close(); resolve(null);
        });

        // OK — apply changes
        document.getElementById('ep-ok').addEventListener('click', () => {
            applyChanges(layer, map);
            close();
            resolve(layer);
        });

        // Click outside dialog to cancel
        document.getElementById('ep-overlay').addEventListener('click', function (e) {
            if (e.target === this) { close(); resolve(null); }
        });
    }

    // ── Apply all changes to the Leaflet layer ────────────────────────────────
    function applyChanges(layer, map) {
        const type  = getLayerType(layer);
        const props = layer.feature ? layer.feature.properties : {};

        // Name
        const name = document.getElementById('ep-name').value;
        props.name = name;

        // Description
        const desc = document.getElementById('ep-desc').value;
        props.description = desc;

        // Extended data
        const keys = document.querySelectorAll('.ep-prop-key');
        const vals = document.querySelectorAll('.ep-prop-val');
        const skipKeys = [
            'name','description','styleUrl','stroke','stroke-width',
            'stroke-opacity','fill','fill-opacity','icon',
            'icon-opacity','icon-color','icon-scale',
        ];
        // Clear existing ext data
        Object.keys(props).forEach(k => { if (!skipKeys.includes(k)) delete props[k]; });
        keys.forEach((keyEl, i) => {
            const k = keyEl.value.trim();
            const v = vals[i] ? vals[i].value.trim() : '';
            if (k) props[k] = v;
        });

        // ── Marker specific ───────────────────────────────────────────────────
        if (type === 'marker') {
            // Lat/Lng
            const lat = parseFloat(document.getElementById('ep-lat').value);
            const lng = parseFloat(document.getElementById('ep-lng').value);
            if (!isNaN(lat) && !isNaN(lng)) {
                layer.setLatLng([lat, lng]);
            }

            // Icon
            const selectedOpt = document.querySelector('.ep-icon-opt.selected');
            const customUrl   = document.getElementById('ep-icon-custom-url').value.trim();
            const iconScaleEl = document.getElementById('ep-icon-scale');
            const iconOpEl    = document.getElementById('ep-icon-opacity');
            const iconColorEl = document.getElementById('ep-icon-color');

            const scale   = iconScaleEl   ? parseFloat(iconScaleEl.value)   : 1;
            const opacity = iconOpEl      ? parseFloat(iconOpEl.value)       : 1;
            const color   = iconColorEl   ? iconColorEl.value                : '#ffff00';
            const size    = Math.round(20 * scale);

            props['icon-scale']   = scale;
            props['icon-opacity'] = opacity;
            props['icon-color']   = color;

            if (customUrl) {
                props.icon = customUrl;
                layer.setIcon(L.icon({
                    iconUrl:     customUrl,
                    iconSize:    [size, size],
                    iconAnchor:  [size / 2, size / 2],
                    popupAnchor: [0, -size / 2],
                }));
            } else if (selectedOpt) {
                // Use emoji as divIcon for built-in icons
                const emoji = selectedOpt.textContent.trim();
                layer.setIcon(L.divIcon({
                    html: `<span style="font-size:${size}px;opacity:${opacity}">${emoji}</span>`,
                    className: 'ep-emoji-icon',
                    iconSize:    [size, size],
                    iconAnchor:  [size / 2, size / 2],
                    popupAnchor: [0, -size / 2],
                }));
            }

            // Update marker opacity via CSS filter
            const el = layer.getElement();
            if (el) el.style.opacity = opacity;
        }

        // ── Polyline / Polygon ────────────────────────────────────────────────
        if (type === 'polyline' || type === 'polygon') {
            const colorEl   = document.getElementById('ep-stroke-color');
            const widthEl   = document.getElementById('ep-stroke-width');
            const opacityEl = document.getElementById('ep-stroke-opacity');

            const styleUpdate = {};
            if (colorEl)   styleUpdate.color   = colorEl.value;
            if (widthEl)   styleUpdate.weight  = parseInt(widthEl.value);
            if (opacityEl) styleUpdate.opacity = parseFloat(opacityEl.value);

            if (type === 'polygon') {
                const fillColorEl   = document.getElementById('ep-fill-color');
                const fillOpacityEl = document.getElementById('ep-fill-opacity');
                if (fillColorEl)   styleUpdate.fillColor   = fillColorEl.value;
                if (fillOpacityEl) styleUpdate.fillOpacity = parseFloat(fillOpacityEl.value);
            }

            layer.setStyle(styleUpdate);
        }

        // Refresh popup with new content
        rebuildPopup(layer, props);
    }

    // ── Rebuild popup after edit ──────────────────────────────────────────────
    function rebuildPopup(layer, props) {
        const skipKeys = [
            'name','description','styleUrl','stroke','stroke-width',
            'stroke-opacity','fill','fill-opacity','icon',
            'icon-opacity','icon-color','icon-scale',
            'marker-color','marker-size','marker-symbol',
        ];

        let content = '';
        if (props.name) content += `<strong style="font-size:14px;">${props.name}</strong><hr>`;

        if (props.description) {
            const desc = typeof props.description === 'object'
                ? (props.description.value || '')
                : props.description;
            if (desc) content += `<div style="margin-bottom:6px;">${desc}</div>`;
        }

        const dataEntries = Object.entries(props).filter(([key, val]) =>
            !skipKeys.includes(key) && val !== null && val !== undefined && val !== ''
        );

        if (dataEntries.length) {
            content += `
              <table style="width:100%;font-size:12px;border-collapse:collapse;">
                ${dataEntries.map(([key, val]) => `
                  <tr style="border-bottom:1px solid #eee;">
                    <td style="padding:3px 6px;font-weight:bold;white-space:nowrap;color:#555;">${key}</td>
                    <td style="padding:3px 6px;">${val}</td>
                  </tr>`).join('')}
              </table>`;
        }

        if (!content) content = '<em>No information available</em>';

        layer.unbindPopup();
        layer.bindPopup(content, { maxWidth: 320, maxHeight: 250 });
    }

    // ── Draggable dialog ──────────────────────────────────────────────────────
    function makeDraggable(handle, target) {
        let startX, startY, startLeft, startTop;
        handle.addEventListener('mousedown', function (e) {
            const rect = target.getBoundingClientRect();
            startX    = e.clientX; startY    = e.clientY;
            startLeft = rect.left; startTop  = rect.top;
            target.style.position = 'fixed';
            target.style.margin   = '0';
            target.style.left     = startLeft + 'px';
            target.style.top      = startTop  + 'px';

            function onMove(e) {
                target.style.left = (startLeft + e.clientX - startX) + 'px';
                target.style.top  = (startTop  + e.clientY - startY) + 'px';
            }
            function onUp() {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup',   onUp);
            }
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup',   onUp);
        });
    }

    // ── Open / Close ──────────────────────────────────────────────────────────
    function close() {
        const overlay = document.getElementById('ep-overlay');
        if (overlay) overlay.remove();
    }

    // ── Utility helpers ───────────────────────────────────────────────────────
    function escHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function rgbToHex(color) {
        // Already hex
        if (color && color.startsWith('#')) return color;
        // KML uses aabbggrr hex — convert if needed
        if (color && color.length === 8) {
            const r = color.slice(6, 8);
            const g = color.slice(4, 6);
            const b = color.slice(2, 4);
            return '#' + r + g + b;
        }
        return '#3388ff';
    }

    // ── Public API ────────────────────────────────────────────────────────────
    return {
        /**
         * Open the Edit Placemark dialog for a Leaflet layer.
         * Returns a Promise that resolves with the layer (OK) or null (Cancel).
         *
         * Usage:
         *   layer.on('click', () => editPlacemark.open(layer, map));
         *   // or right-click context menu:
         *   layer.on('contextmenu', () => editPlacemark.open(layer, map));
         */
        open(layer, map) {
            injectStyle();
            close(); // close any existing dialog

            // Ensure feature.properties exists
            if (!layer.feature) layer.feature = { type: 'Feature', properties: {} };
            if (!layer.feature.properties) layer.feature.properties = {};

            return new Promise(resolve => {
                document.body.insertAdjacentHTML('beforeend', buildDialog(layer, map));
                wireEvents(layer, map, resolve);
            });
        }
    };

})();
