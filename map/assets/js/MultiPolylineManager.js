class MultiPolylineManager {

  constructor(map) {
    this.map = map;
    this.polylines = new Map();
    this.activeId = null;

    this.drawing = false;
    this.isMouseDown = false;

    // projection helper
    this.overlay = new google.maps.OverlayView();
    this.overlay.onAdd = () => {};
    this.overlay.draw = () => {};
    this.overlay.setMap(map);

    this._bindMouseEvents();
  }

  /* ===============================
     POLYLINE MANAGEMENT
  =============================== */

  createPolyline(id) {
    if (this.polylines.has(id)) return;

    const polyline = new google.maps.Polyline({
      map: this.map,
      strokeColor: "#0066ff",
      strokeWeight: 3
    });

    this.polylines.set(id, {
      polyline,
      vertices: [],
      markers: [],
      undoStack: [],
      redoStack: [],
      visible: true
    });

    this.setActive(id);
  }

  setActive(id) {
    if (!this.polylines.has(id)) return;
    this.activeId = id;
  }

  get active() {
    return this.polylines.get(this.activeId);
  }

  listPolylines() {
    return Array.from(this.polylines.keys());
  }

  /* ===============================
     DRAW MODE
  =============================== */

  enableDraw() {
    if (!this.active) return;

    this.drawing = true;
    this.map.setOptions({
      draggable: false,
      draggableCursor: "crosshair"
    });
  }

  disableDraw() {
    this.drawing = false;
    this.isMouseDown = false;

    this.map.setOptions({
      draggable: true,
      draggableCursor: null
    });
  }

  _bindMouseEvents() {
    const div = this.map.getDiv();

    div.addEventListener("mousedown", e => {
      if (!this.drawing || e.button !== 0 || !this.active) return;

      e.preventDefault();
      this.isMouseDown = true;

      this._saveState();
      this._addVertex(this._pixelToLatLng(e));
    });

    div.addEventListener("mousemove", e => {
      if (!this.drawing || !this.isMouseDown || !this.active) return;
      this._addVertex(this._pixelToLatLng(e));
    });

    window.addEventListener("mouseup", () => {
      if (!this.drawing) return;
      this.disableDraw();
    });
  }

  /* ===============================
     VERTEX HANDLING
  =============================== */

  _addVertex(latLng) {
    const a = this.active;
    if (!a) return;

    a.vertices.push(latLng);
    a.polyline.setPath(a.vertices);

    const marker = new google.maps.Marker({
      position: latLng,
      map: this.map,
      draggable: true,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 5,
        fillColor: "red",
        fillOpacity: 1,
        strokeWeight: 0
      }
    });

    marker.addListener("drag", () => this._updateFromMarkers());
    marker.addListener("rightclick", () => this._removeVertex(marker));

    a.markers.push(marker);
  }

  _removeVertex(marker) {
    const a = this.active;
    if (!a) return;

    this._saveState();

    const i = a.markers.indexOf(marker);
    if (i === -1) return;

    marker.setMap(null);
    a.markers.splice(i, 1);
    a.vertices.splice(i, 1);
    a.polyline.setPath(a.vertices);
  }

  _updateFromMarkers() {
    const a = this.active;
    if (!a) return;

    a.vertices = a.markers.map(m => m.getPosition());
    a.polyline.setPath(a.vertices);
  }

  /* ===============================
     UNDO / REDO
  =============================== */

  _saveState() {
    const a = this.active;
    if (!a) return;

    a.undoStack.push(this._serialize(a));
    a.redoStack = [];
  }

  undo() {
    const a = this.active;
    if (!a || !a.undoStack.length) return;

    a.redoStack.push(this._serialize(a));
    this._loadState(a.undoStack.pop());
  }

  redo() {
    const a = this.active;
    if (!a || !a.redoStack.length) return;

    a.undoStack.push(this._serialize(a));
    this._loadState(a.redoStack.pop());
  }

  _serialize(a) {
    return JSON.stringify(
      a.vertices.map(v => ({ lat: v.lat(), lng: v.lng() }))
    );
  }

  _loadState(state) {
    const a = this.active;
    if (!a) return;

    this._clearActive();

    JSON.parse(state).forEach(p =>
      this._addVertex(new google.maps.LatLng(p.lat, p.lng))
    );
  }

  /* ===============================
     VISIBILITY & FIT
  =============================== */

  setVisible(id, visible) {
    const p = this.polylines.get(id);
    if (!p) return;

    p.visible = visible;
    p.polyline.setMap(visible ? this.map : null);
    p.markers.forEach(m => m.setMap(visible ? this.map : null));
  }

  fitToActive() {
    const a = this.active;
    if (!a || !a.vertices.length) return;

    const bounds = new google.maps.LatLngBounds();
    a.vertices.forEach(v => bounds.extend(v));
    this.map.fitBounds(bounds);
  }

  /* ===============================
     DATABASE
  =============================== */

  async saveActive(name) {
    const a = this.active;
    if (!a) return;

    await fetch("save.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        path: JSON.parse(this._serialize(a))
      })
    });
  }

  async loadFromDB(id) {
    const res = await fetch(`load.php?id=${id}`);
    const data = await res.json();

    this.createPolyline("loaded_" + id);
    const a = this.active;

    data.forEach(p =>
      this._addVertex(new google.maps.LatLng(p.lat, p.lng))
    );
  }

  deleteActive() {
    const a = this.active;
    if (!a) return;

    this._clearActive();
    this.polylines.delete(this.activeId);
    this.activeId = null;
  }

  /* ===============================
     HELPERS
  =============================== */

  _clearActive() {
    const a = this.active;
    if (!a) return;

    a.markers.forEach(m => m.setMap(null));
    a.markers = [];
    a.vertices = [];
    a.polyline.setPath([]);
  }

  _pixelToLatLng(event) {
    const projection = this.overlay.getProjection();
    const rect = this.map.getDiv().getBoundingClientRect();
    const OFFSET = 8;

    const point = new google.maps.Point(
      event.clientX - rect.left - OFFSET,
      event.clientY - rect.top - OFFSET
    );

    return projection.fromDivPixelToLatLng(point);
  }
}
export { MultiPolylineManager };