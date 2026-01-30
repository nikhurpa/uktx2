
/**
 * PolylineManager.js
 * Freehand drawing + smooth polyline editing for Google Maps
 * Features:
 * - Smooth freehand drawing (distance throttling)
 * - Start/stop drawing on mouse down/up
 * - Create new polyline segments on new draw
 * - Select nearest vertex by clicking polyline or marker
 * - Drag vertex to reshape polyline
 * - Drag on map to insert vertices between selected vertices
 */

class PolylineManager {

  constructor(map, options = {}) {
    this.map = map;

    this.polyline = new google.maps.Polyline({
      map,
      strokeColor: options.color || "#0000FF",
      strokeWeight: options.weight || 3
    });

    this.vertices = [];
    this.markers = [];

    // States
    this.drawing = false;
    this.isMouseDown = false;
    this.activeDraw = false;
    this.editMode = false;

    this.selectedVertexIndex = null;
    this.insertIndex = null;

    // Undo/Redo
    this.undoStack = [];
    this.redoStack = [];

    // Smoothing config
    this.minDrawDistance = options.minDrawDistance || 3; // meters

    this._bindEvents();
    this._bindPolylineEvents();
  }

  /* ================= DRAW MODE ================= */

  enableDraw() {
    this.drawing = true;
    this.map.setOptions({
      draggable: false,
      gestureHandling: "none",
      draggableCursor: "crosshair"
    });
  }

  disableDraw() {
    this.drawing = false;
    this.isMouseDown = false;
    this.activeDraw = false;

    this.map.setOptions({
      draggable: true,
      gestureHandling: "auto",
      draggableCursor: null
    });
  }

  /* ================= EVENTS ================= */

  _bindEvents() {
    this.map.addListener("mousedown", e => this._onMouseDown(e));
    this.map.addListener("mousemove", e => this._onMouseMove(e));
    this.map.addListener("mouseup", () => this._onMouseUp());
  }

  _bindPolylineEvents() {
    this.polyline.addListener("mousedown", e => {
      if (this.drawing) return;
      const idx = this._findNearestVertex(e.latLng);
      if (idx !== null) {
        this.selectedVertexIndex = idx;
        this.editMode = true;
      }
    });
  }

  _onMouseDown(e) {
    if (this.editMode && this.selectedVertexIndex !== null) {
      this.isMouseDown = true;
      this.insertIndex = this.selectedVertexIndex + 1;
      return;
    }

    if (!this.drawing) return;

    this.isMouseDown = true;
    this.activeDraw = true;
    this._saveState();

    this._addVertex(e.latLng, true);
  }

  _onMouseMove(e) {
    if (!this.isMouseDown) return;

    if (this.editMode && this.insertIndex !== null) {
      this._insertVertexAt(e.latLng, this.insertIndex);
      this.insertIndex++;
      return;
    }

    if (this.drawing) {
      this._addVertex(e.latLng);
    }
  }

  _onMouseUp() {
    this.isMouseDown = false;

    if (this.editMode) {
      this.editMode = false;
      this.selectedVertexIndex = null;
      this.insertIndex = null;
      return;
    }

    if (this.activeDraw) {
      this.disableDraw();
    }
  }

  /* ================= VERTEX OPS ================= */

  _addVertex(latLng, force = false) {
    if (!force && this.vertices.length > 0) {
      const last = this.vertices[this.vertices.length - 1];
      const d = google.maps.geometry.spherical.computeDistanceBetween(last, latLng);
      if (d < this.minDrawDistance) return;
    }

    this.vertices.push(latLng);
    this.polyline.setPath(this.vertices);

    const marker = this._createMarker(latLng);
    this.markers.push(marker);
  }

  _insertVertexAt(latLng, index) {
    const prev = this.vertices[index - 1];
    if (!prev) return;

    const d = google.maps.geometry.spherical.computeDistanceBetween(prev, latLng);
    if (d < this.minDrawDistance) return;

    this.vertices.splice(index, 0, latLng);
    const marker = this._createMarker(latLng);
    this.markers.splice(index, 0, marker);

    this.polyline.setPath(this.vertices);
  }

  _createMarker(latLng) {
    const marker = new google.maps.Marker({
      position: latLng,
      map: this.map,
      draggable: true,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 5,
        fillColor: "red",
        fillOpacity: 1,
        strokeColor: "white",
        strokeWeight: 1
      }
    });

    marker.addListener("drag", () => this._updateFromMarkers());
    marker.addListener("mousedown", e => {
      e.domEvent.stopPropagation();
      this.selectedVertexIndex = this.markers.indexOf(marker);
      this.editMode = true;
    });

    marker.addListener("rightclick", () => this._removeVertex(marker));

    return marker;
  }

  _removeVertex(marker) {
    this._saveState();
    const i = this.markers.indexOf(marker);
    if (i === -1) return;

    marker.setMap(null);
    this.markers.splice(i, 1);
    this.vertices.splice(i, 1);
    this.polyline.setPath(this.vertices);
  }

  _updateFromMarkers() {
    this.vertices = this.markers.map(m => m.getPosition());
    this.polyline.setPath(this.vertices);
  }

  _findNearestVertex(latLng) {
    let min = Infinity;
    let idx = null;

    this.vertices.forEach((v, i) => {
      const d = google.maps.geometry.spherical.computeDistanceBetween(v, latLng);
      if (d < min && d < 10) {
        min = d;
        idx = i;
      }
    });
    return idx;
  }

  /* ================= UNDO / REDO ================= */

  _saveState() {
    this.undoStack.push(this._serialize());
    this.redoStack = [];
  }

  undo() {
    if (!this.undoStack.length) return;
    this.redoStack.push(this._serialize());
    this._loadState(this.undoStack.pop());
  }

  redo() {
    if (!this.redoStack.length) return;
    this.undoStack.push(this._serialize());
    this._loadState(this.redoStack.pop());
  }

  _serialize() {
    return JSON.stringify(this.vertices.map(v => ({ lat: v.lat(), lng: v.lng() })));
  }

  _loadState(state) {
    this.clear();
    JSON.parse(state).forEach(p =>
      this._addVertex(new google.maps.LatLng(p.lat, p.lng), true)
    );
  }

  /* ================= HELPERS ================= */

  clear() {
    this.markers.forEach(m => m.setMap(null));
    this.markers = [];
    this.vertices = [];
    this.polyline.setPath([]);
  }

  getPath() {
    return JSON.parse(this._serialize());
  }
}

export { PolylineManager };
