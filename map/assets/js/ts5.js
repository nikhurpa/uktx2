// ------------------- Asynch Loader-------------------
(g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams;
const f=()=>h||(h=new Promise(async(n,o)=>{await (a=m.createElement("script"));
e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);
e.set("callback",c+".maps."+q);a.src=`https://maps.googleapis.com/maps/api/js?`+e;
d[q]=n;a.onerror=()=>o(Error(p+" could not load."));m.head.append(a)}));
d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(n,...o)=>r.add(n)&&f().then(()=>d[l](n,...o))})
({key:"AIzaSyAH06384nr0EpGqBZXDmkbGxHoWtpKjGPE", v:"weekly"});

let map, mode = null, statusEl, ctxMenu, selectedTarget;

async function initMap() {
  const { Map } = await google.maps.importLibrary("maps");
  const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

  map = new Map(document.getElementById("map"), {
    center: { lat: 28.6139, lng: 77.2090 },
    zoom: 14,
    mapId: "DEMO_MAP_ID"
  });

  statusEl = document.getElementById("status");
  ctxMenu = document.getElementById("contextMenu");

  bindToolButtons(AdvancedMarkerElement);

  // Hide context menu globally
  map.addListener("click", () => hideContextMenu());
  document.body.addEventListener("click", () => hideContextMenu());
}

function bindToolButtons(AdvancedMarkerElement) {

  google.maps.event.clearInstanceListeners(map);
  
  document.getElementById("btnMarker").onclick = () => setMode("Marker");
  document.getElementById("btnLine").onclick = () => setMode("Line");
  document.getElementById("btnRoute").onclick = () => setMode("Route");


  // Marker mode
  map.addListener("click", (e) => {
    if (mode !== "Marker") return;

    const dot = document.createElement("div");
    dot.style.width = "14px"; dot.style.height = "14px";
    dot.style.borderRadius = "50%"; dot.style.background = "red";
    dot.style.border = "2px solid white";

    const marker = new AdvancedMarkerElement({
      position: e.latLng,
      map,
      content: dot
    });

    // Right-click via DOM event
    marker.content.addEventListener("contextmenu", (evt) => {
      evt.preventDefault();
      selectedTarget = marker;
      showContextMenu(evt, "Marker");
    });
  });

  // Line mode: click 2 points
  let linePoints = [];
  map.addListener("click", (e) => {
    if (mode !== "Line") return;

    linePoints.push(e.latLng);
    if (linePoints.length === 2) {
      const line = new google.maps.Polyline({
        path: linePoints, map,
        strokeColor: "blue", strokeWeight: 3
      });
      linePoints = [];

      line.addListener("rightclick", (ev) => {
        selectedTarget = line;
        showContextMenu(ev.domEvent, "Line");
      });
    }
  });

  // Route mode: drag polyline
  let drawing = false, routePath = [];
  const polyline = new google.maps.Polyline({
    map, strokeColor: "green", strokeWeight: 3
  });

  map.addListener("mousedown", (e) => {
    if (mode !== "Route") return;
    drawing = true;
    routePath = [e.latLng];
    polyline.setPath(routePath);
  });
  map.addListener("mousemove", (e) => {
    if (mode !== "Route" || !drawing) return;
    routePath.push(e.latLng);
    polyline.setPath(routePath);
  });
  map.addListener("mouseup", () => {
    if (mode !== "Route") return;
    drawing = false;
  });

  polyline.addListener("rightclick", (ev) => {
    selectedTarget = polyline;
    showContextMenu(ev.domEvent, "Route");
  });
}

function setMode(newMode) {
  mode = newMode;
  ["btnMarker","btnLine","btnRoute"].forEach(id=>{
    document.getElementById(id).classList.toggle("active", id==="btn"+newMode);
  });
  statusEl.textContent = `Mode: ${newMode}`;
}

function showContextMenu(domEvent, type) {
  ctxMenu.style.display = "block";
  ctxMenu.style.left = domEvent.pageX + "px";
  ctxMenu.style.top = domEvent.pageY + "px";
  statusEl.textContent = `${type} right-clicked`;
}

function hideContextMenu() {
  ctxMenu.style.display = "none";
}
//--------------------

// === Toolbox ===
function bindToolButtons1() {
    const bMarker = document.getElementById('btnMarker');
    const bLine = document.getElementById('btnLine');
    const bRoute = document.getElementById('btnRoute');
    const bDir = document.getElementById('btnDir');

    bMarker.onclick = () => setMode('Marker');
    bLine.onclick = () => setMode('Line');
    bRoute.onclick = () => setMode('Route');
    bDir.onclick = () => setMode('Direction');
}

function setMode1(newMode) {
    mode = newMode;
    // UI highlight
    ['btnMarker','btnLine','btnRoute','btnDir'].forEach(id => {
    const el = document.getElementById(id);
    el.classList.toggle('active', (
        (id==='btnMarker' && mode==='Marker') ||
        (id==='btnLine' && mode==='Line') ||
        (id==='btnRoute' && mode==='Route') ||
        (id==='btnDir' && mode==='Direction')
    ));
    });

    // Cursor / instructions
    hideContextMenu();
    switch (mode) {
    case 'Marker':
        map.setOptions({ draggableCursor: 'crosshair' });
        statusEl.textContent = 'Marker mode: Click on map to add a marker. Click a marker to select; right-click for details.';
        break;
    case 'Line':
        map.setOptions({ draggableCursor: 'crosshair' });
        alert('Line mode: Select first point and then second point to draw a line.');
        lineFirstPoint = null;
        statusEl.textContent = 'Line mode: Click first point, then click second point.';
        break;
    case 'Route':
        map.setOptions({ draggableCursor: 'crosshair' });
        statusEl.textContent = 'Route mode: Mouse down and drag to draw. Red dots are draggable; right-click a dot to delete. Click path to insert a point.';
        ensureRouteObjects();
        break;
    case 'Direction':
        map.setOptions({ draggableCursor: 'crosshair' });
        statusEl.textContent = 'Direction-Route (Measure): Click to add points; shows segment and total distance. Right-click map to finish.';
        ensureMeasureObjects();
        break;
    }
}

// === Marker Mode ===
function onMapClick(e) {
    if (mode === 'Marker') {
    const id = mid++;
    const m = new google.maps.Marker({
        position: e.latLng, map, draggable: false,
        icon: verticalArrowIcon
    });
    m.__id = id;
    m.addListener('click', () => selectMarker(m));
    m.addListener('rightclick', (evt) => {
        ctxTarget = { type: 'marker', obj: m, id: id };
        showContextMenu(evt.pixel.x, evt.pixel.y);
    });
    markers.push({ id, marker: m });
    }
    else if (mode === 'Line') {
    handleLineClick(e.latLng);
    }
    else if (mode === 'Direction') {
    addMeasurePoint(e.latLng);
    }
    else if (mode === 'Route') {
    // Clicking the polyline will insert a point; we handle that in polyline listener
    }
}

function selectMarker(m) {
    // Visual hint (bounce briefly)
    m.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(() => m.setAnimation(null), 600);
}

// === Line Mode (two points) ===
function handleLineClick(latLng) {
    if (!lineFirstPoint) {
    lineFirstPoint = latLng;
    statusEl.textContent = 'Line mode: Now click the second point.';
    } else {
    const id = lid++;
    const line = new google.maps.Polyline({
        path: [lineFirstPoint, latLng],
        map,
        ...normalLineStyle
    });
    line.__id = id;

    // Select on click
    line.addListener('click', (evt) => selectLine(line));

    // Context menu on rightclick
    line.addListener('rightclick', (evt) => {
        ctxTarget = { type: 'line', obj: line, id };
        showContextMenu(evt.pixel.x, evt.pixel.y);
    });

    lines.push({ id, polyline: line });
    lineFirstPoint = null;
    statusEl.textContent = 'Line drawn. Click again to start another.';
    }
}

function selectLine(line) {
    lines.forEach(l => l.polyline.setOptions(normalLineStyle));
    line.setOptions(selectedLineStyle);
    // Quick distance info
    const p = line.getPath();
    if (p.getLength() === 2) {
    const d = google.maps.geometry.spherical.computeDistanceBetween(p.getAt(0), p.getAt(1));
    statusEl.textContent = `Selected line: ${formatMeters(d)}.`;
    }
}

// === Route Mode (mousedown drag) ===
function ensureRouteObjects() {
    if (!routePath) {
    routePath = new google.maps.Polyline({
        path: routePoints,
        map,
        ...normalLineStyle
    });

    // Select route on click, and insert a point at clicked path
    routePath.addListener('click', (evt) => {
        selectRoute(true);
        insertRoutePointAt(evt.latLng, evt);
    });

    // Right-click anywhere on route: show path context (if you want)
    routePath.addListener('rightclick', (evt) => {
        ctxTarget = { type: 'routePath', obj: routePath, id: 'route' };
        showContextMenu(evt.pixel.x, evt.pixel.y);
    });
    }
}

function onMapMouseDown(e) {
    if (mode !== 'Route') return;
    routeDrawing = true;
    selectRoute(true);
    clearRoute(); // start a new route each drag; remove this line to keep appending
    addRouteVertex(e.latLng, true);
}

function onMapMouseMove(e) {
    if (mode !== 'Route' || !routeDrawing) return;
    const last = routePoints.getLength() ? routePoints.getAt(routePoints.getLength()-1) : null;
    if (!last) { addRouteVertex(e.latLng, true); return; }
    const dist = google.maps.geometry.spherical.computeDistanceBetween(last, e.latLng);
    if (dist >= ROUTE_SAMPLE_MIN_M) {
    addRouteVertex(e.latLng, true);
    }
}

function onMapMouseUp(e) {
    if (mode !== 'Route') return;
    routeDrawing = false;
}

function clearRoute() {
    // remove red dots
    routeDots.forEach(d => d.setMap(null));
    routeDots = [];
    // clear polyline vertices
    while (routePoints.getLength()) routePoints.removeAt(routePoints.getLength()-1);
}

function selectRoute(sel) {
    routeSelected = sel;
    routePath && routePath.setOptions(sel ? selectedLineStyle : normalLineStyle);
}

// Add a route vertex + a draggable red dot
function addRouteVertex(latLng, tail = false, insertIndex = null) {
    let idx;
    if (insertIndex === null) {
    idx = routePoints.getLength();
    routePoints.push(latLng);
    } else {
    idx = insertIndex;
    routePoints.insertAt(idx, latLng);
    // Shift dot indices after idx
    routeDots.slice(idx).forEach(d => d.__idx++);
    }
    const dot = new google.maps.Marker({
    position: latLng, map,
    icon: smallRedDotIcon, draggable: true
    });
    dot.__idx = idx;

    // Drag to reshape
    dot.addListener('drag', (evt) => {
    const i = dot.__idx;
    routePoints.setAt(i, evt.latLng);
    });

    // Right-click to delete this vertex
    dot.addListener('rightclick', (evt) => {
    removeRouteVertex(dot.__idx);
    });

    // Click a dot to "select" route
    dot.addListener('click', () => selectRoute(true));

    routeDots.splice(idx, 0, dot);
}

function removeRouteVertex(index) {
    if (index < 0 || index >= routePoints.getLength()) return;
    // Remove dot
    const dot = routeDots[index];
    if (dot) dot.setMap(null);
    routeDots.splice(index, 1);
    // Remove vertex
    routePoints.removeAt(index);
    // Reindex dots after removed index
    routeDots.slice(index).forEach((d, k) => d.__idx = index + k);
}

// Insert a point at clicked location on polyline
function insertRoutePointAt(latLng, clickEvt) {
    // Find nearest segment index to insert between
    const path = routePoints;
    if (path.getLength() < 2) return;
    let best = { i: -1, proj: null, dist: Infinity };

    for (let i = 0; i < path.getLength()-1; i++) {
    const a = path.getAt(i), b = path.getAt(i+1);
    const proj = closestPointOnSegment(a, b, latLng);
    const d = google.maps.geometry.spherical.computeDistanceBetween(latLng, proj);
    if (d < best.dist) best = { i, proj, dist: d };
    }
    if (best.i >= 0 && best.proj) {
    addRouteVertex(best.proj, false, best.i+1);
    }
}

// Compute closest point on segment AB to P (geodesic approximation using projection)
function closestPointOnSegment(a, b, p) {
    // Use map projection to convert to planar points for small distances
    const proj = map.getProjection();
    const pa = proj.fromLatLngToPoint(a);
    const pb = proj.fromLatLngToPoint(b);
    const pp = proj.fromLatLngToPoint(p);

    const ax = pa.x, ay = pa.y, bx = pb.x, by = pb.y, px = pp.x, py = pp.y;
    const abx = bx - ax, aby = by - ay;
    const apx = px - ax, apy = py - ay;
    const ab2 = abx*abx + aby*aby;
    let t = ab2 ? ((apx*abx + apy*aby) / ab2) : 0;
    t = Math.max(0, Math.min(1, t));
    const qx = ax + t*abx, qy = ay + t*aby;
    return proj.fromPointToLatLng(new google.maps.Point(qx, qy));
}

// === Direction / Measurement Mode ===
function ensureMeasureObjects() {
    if (!measurePath) {
    measurePath = new google.maps.Polyline({
        path: measurePoints, map,
        strokeColor: '#2563eb', strokeOpacity: 0.9, strokeWeight: 3
    });
    map.addListener('rightclick', () => finishMeasuring());
    }
}

function addMeasurePoint(latLng) {
    const n = measurePoints.getLength();
    measurePoints.push(latLng);

    // Segment from previous to this
    if (n >= 1) {
    const a = measurePoints.getAt(n-1), b = latLng;
    const dist = google.maps.geometry.spherical.computeDistanceBetween(a, b);

    // Draw thin overlay segment (optional, since polyline already updates)
    const seg = new google.maps.Polyline({
        path: [a, b], map,
        strokeColor: '#9ca3af', strokeOpacity: 0.7, strokeWeight: 2
    });

    // Label at midpoint
    const mid = google.maps.geometry.spherical.interpolate(a, b, 0.5);
    const iw = new google.maps.InfoWindow({
        content: `<div style="font-size:12px;">${formatMeters(dist)}</div>`,
        position: mid
    });
    iw.open({ map });

    measureSegments.push({ segLine: seg, labelInfoWindow: iw, distM: dist });
    totalDistanceM += dist;
    showTotal();
    }
}

function finishMeasuring() {
    if (!measurePath || measurePoints.getLength() === 0) return;
    // Keep the path as-is; to start a fresh measure, clear:
    // Clear overlays if you want fresh session:
    // clearMeasure();
    statusEl.textContent = 'Measurement finished. Click to start another; right-click to finish.';
}

function clearMeasure() {
    measureSegments.forEach(s => {
    s.segLine.setMap(null);
    s.labelInfoWindow.close();
    });
    measureSegments = [];
    while (measurePoints.getLength()) measurePoints.removeAt(measurePoints.getLength()-1);
    totalDistanceM = 0;
    showTotal();
}

function showTotal() {
    totalsEl.style.display = 'block';
    totalsEl.textContent = `Total: ${formatMeters(totalDistanceM)}`;
}

// === Context Menu ===
function showContextMenu2(px, py) {
    ctxMenu.style.left = px + 'px';
    ctxMenu.style.top = py + 'px';
    ctxMenu.style.display = 'block';
}
function hideContextMenu2() { ctxMenu.style.display = 'none'; ctxTarget = null; }

async function handleContext(action) {
    if (!ctxTarget) return;
    const { type, obj, id } = ctxTarget;
    hideContextMenu();

    // Example AJAX stubs — replace with your endpoints:
    // You can pass {type, id} to your server (PHP/Node) and fetch MySQL data.
    try {
    const res = await fetch(`/api/${type}/${action}?id=${encodeURIComponent(id)}`, { method: 'GET' });
    const data = await res.json().catch(()=>({ ok:false }));
    alert(`${type} ${action}: ${JSON.stringify(data || { ok:true }, null, 2)}`);
    } catch (e) {
    alert(`${type} ${action}: (demo) would call /api/${type}/${action}?id=${id}`);
    }
}

// === Helpers ===
function formatMeters(m) {
    if (m < 1000) return `${m.toFixed(1)} m`;
    return `${(m/1000).toFixed(3)} km`;
}


//==  Spderify ====
function spiderfy(latlng, map) {
    // Find all markers at the same latlng
    const overlapping = markers.filter(m =>
      m.position.lat === latlng.lat && m.position.lng === latlng.lng
    );

    if (overlapping.length <= 1) return; // nothing to spiderfy

    // Use projection to convert LatLng to pixel coordinates
    const projection = map.getProjection();
    if (!projection) return; // wait until projection is ready

    const point = projection.fromLatLngToPoint(latlng);

    // Spread markers around in a circle
    overlapping.forEach((m, i) => {
      const angle = (i / overlapping.length) * 2 * Math.PI;
      const offsetX = (spiderRadius / Math.pow(2, map.getZoom())) * Math.cos(angle);
      const offsetY = (spiderRadius / Math.pow(2, map.getZoom())) * Math.sin(angle);

      const newPoint = new google.maps.Point(point.x + offsetX, point.y + offsetY);
      const newLatLng = projection.fromPointToLatLng(newPoint);

      m.position = newLatLng;
    });

}
// Init
initMap();