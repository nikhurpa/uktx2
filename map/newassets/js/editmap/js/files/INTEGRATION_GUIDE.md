# New Feature Modules — Integration Guide

Three new files drop into your existing codebase with minimal changes to existing files.

---

## Files

| File | What it does |
|---|---|
| `context_menu.js` | Right-click context menu on polylines & markers |
| `db_upload.js` | Upload any tree node (and all its features) to your backend |
| `directions_tool.js` | Click-to-route polyline using OSRM (free, no API key) |

---

## 1. Add `<script>` tags

Load the new files **after** your existing scripts:

```html
<!-- existing scripts -->
<script src="map.js"></script>
<script src="load_kml.js"></script>
<script src="editor.js"></script>

<!-- new scripts — order matters -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>  <!-- for elevation chart -->
<script src="context_menu.js"></script>
<script src="db_upload.js"></script>
<script src="directions_tool.js"></script>
```

Chart.js is only needed for the elevation profile. If you already load it, skip the CDN tag.

---

## 2. One-line changes in `load_kml.js`

### A. Attach context menu to KML-loaded polylines

In `buildOverlaysFromPlacemark`, after each `layers.push(polyline)` / `layers.push(marker)`:

```js
// after: layers.push(polyline);
if (window.attachContextMenu) window.attachContextMenu(polyline);

// after: layers.push(marker);
if (window.attachContextMenu) window.attachContextMenu(marker);
```

### B. Init the tree right-click menu

At the end of `window.initMapEdit` (inside `load_kml.js`):

```js
if (window.initDbUploadTreeMenu) window.initDbUploadTreeMenu();
```

---

## 3. One-line change in `editor.js`

In the `map.on('mousedown')` block where a new polyline is created, attach the context menu:

```js
let pl = L.polyline([e.latlng], {color: 'cyan', weight: 4}).addTo(map);
// ADD THIS LINE:
if (window.attachContextMenu) window.attachContextMenu(pl);
```

Same for the marker created in `map.on('click')`:

```js
const marker = L.marker(e.latlng, { draggable: true });
// ADD THIS LINE:
if (window.attachContextMenu) window.attachContextMenu(marker);
```

---

## 4. Backend endpoint for DB upload

`db_upload.js` POSTs to `/api/features/save` by default.
Override before the script loads, or set it at any time:

```js
window.DB_UPLOAD_ENDPOINT = '/your/php/api.php?action=save_features';
```

Expected request body:

```json
{
  "meta": {
    "nodeId": "kml42",
    "label": "My Road Layer",
    "count": 17,
    "uploadedBy": "webuser",
    "uploadedAt": "2025-01-01T12:00:00Z"
  },
  "features": {
    "type": "FeatureCollection",
    "features": [ /* GeoJSON Feature objects */ ]
  }
}
```

Expected response:

```json
{ "success": true, "saved": 17 }
```

The existing `saveFeature()` / `exportMapToKml()` pattern in your PHP API is a close fit — just accept the FeatureCollection body instead of a single feature.

---

## 5. Feature summary

### Context menu (right-click on any polyline or marker)

| Menu item | Notes |
|---|---|
| 📏 Get Length | Alerts total length (km / m) and vertex count |
| ⛰️ Elevation Profile | Fetches Open-Elevation API, draws Chart.js profile |
| 🗺️ Get Directions | Routes via OSRM between first and last vertex, shows turn-by-turn panel |
| 🔍 Zoom To Feature | fitBounds / setView |
| 📋 Copy Coordinates | Copies lat,lng string to clipboard |
| 🗑️ Delete Feature | Removes from map, featureGroup, and kmlLayers registry |

Polyline-only items (Length, Elevation, Directions) are hidden automatically for markers.

### DB Upload (right-click on tree node)

| Menu item | Notes |
|---|---|
| ☁️ Upload Node to Database | Uploads selected node + all descendants |
| 📤 Upload All Checked Features | Uploads every checked item in the tree |
| 🔍 Zoom To Node | fitBounds to all features under node |
| 💾 Export Node as KML | Client-side KML download, no server needed |

### Directions tool (`tool-direction` button)

| Action | Gesture |
|---|---|
| Add waypoint | Click map |
| Update route | Drag any waypoint marker |
| Finish route | Double-click last waypoint, or double-click map |
| Remove last waypoint | Right-click map |
| Cancel | Press Escape |

The finished route is added to `featureGroup` and the jqxTree under "Temporary Places", with a popup showing distance and estimated drive time. It is fully editable with the existing Edit tool.

---

## 6. No API keys required

| Service | Used for | Key needed? |
|---|---|---|
| OSRM demo server | Directions + snap to road | ❌ No |
| Open-Elevation | Elevation profile | ❌ No |

For production traffic, self-host OSRM or switch to a paid provider. Change `OSRM_BASE` in `directions_tool.js` and the fetch URL in `context_menu.js → actionElevation`.
