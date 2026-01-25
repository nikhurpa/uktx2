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

    this.drawing = false;
    this.undoStack = [];
    this.redoStack = [];
    
   this.overlay = new google.maps.OverlayView();

this.overlay.onAdd = () => {
  console.log("Overlay onAdd fired");

  this.overlayDiv = document.createElement("div");

  Object.assign(this.overlayDiv.style, {
    position: "absolute",
    top: "0",
    left: "0",
    right: "0",
    bottom: "0",
    background: "transparent",
    pointerEvents: "auto",
    cursor: "crosshair",
    zIndex: "9999"
  });
this.overlayDiv.style.outline = "2px solid red";
  // 🔴 MUST be overlayMouseTarget
  this.overlay.getPanes().overlayMouseTarget.appendChild(this.overlayDiv);

  this._bindOverlayEvents();
};

this.overlay.draw = () => {
  this.projectionReady = true;
};

this.overlay.onRemove = () => {
  this.overlayDiv?.remove();
};

this.overlay.setMap(this.map);





 
  }


  static mapoptions_clear={cursor: "default" , draggableCursor: "grab",     // 👈 normal hand cursor for map panning
                            draggingCursor: "grabbing" ,scrollwheel: true, gestureHandling: "greedy"}

  static mapoptions_startroute={draggableCursor: "crosshair",draggingCursor: "crosshair" 
                              ,scrollwheel: true, gestureHandling: "none"}
  static mapoptions_startmarker={draggableCursor: "crosshair",draggingCursor: "crosshair" 
                              ,scrollwheel: true, gestureHandling: "greedy"}   
  /* ------------------- Drawing Mode ------------------- */

enableDraw() {
  this.drawing = true;
  this.isMouseDown = false;

  this.map.setOptions({
    draggable: false,
    gestureHandling: "none",
    draggableCursor: "crosshair"
  });

}

disableDraw() {
  this.drawing = false;
  this.isMouseDown = false;

  this.map.setOptions({
    draggable: true,
    gestureHandling: "auto",
    draggableCursor: null
  });
}




  _bindOverlayEvents() {
    console.log("Binding overlay events");

    this.overlayDiv.addEventListener("mousedown", e => {
      console.log("mousedown fired"); // 🔥 MUST PRINT
      this._onMouseDown(e);
    });

    this.overlayDiv.addEventListener("mousemove", e => {
      console.log("mousemove fired"); // 🔥 MUST PRINT
      this._onMouseMove(e);
    });

    this.overlayDiv.addEventListener("mouseup", e => {
      console.log("mouseup fired");
      this._onMouseUp(e);
    });
  }


_onMouseDown(e) {

  if (!this.drawing || !this.projectionReady || e.button !== 0) return;
  console.log("on mousedown fired"); // 🔥 MUST PRINT
  e.preventDefault();
  this.isMouseDown = true;
  this._saveState();

  const latLng = this._pixelToLatLng(e);
  if (latLng) this._addVertex(latLng);
}


_onMouseMove(e) {
  if (!this.drawing || !this.isMouseDown) return;

  const latLng = this._pixelToLatLng(e);
  this._addVertex(latLng);
}

_onMouseUp() {
  if (!this.drawing) return;

  this.isMouseDown = false;
  this.disableDraw();
}

_pixelToLatLng(e) {
  const projection = this.overlay.getProjection();
  if (!projection) return null;

  return projection.fromDivPixelToLatLng(
    new google.maps.Point(e.offsetX, e.offsetY)
  );
}



  _startDraw(e) {
    if (!this.drawing || e.domEvent.button !== 0) return;
    this._saveState();
    this._addVertex(e.latLng);
  }

  _draw(e) {
    if (!this.drawing || e.domEvent.buttons !== 1) return;
    this._addVertex(e.latLng);
  }

 
  /* ------------------- Vertex Handling ------------------- */

  _addVertex(latLng) {

    // if (this.vertices.length) {
    //   const last = this.vertices[this.vertices.length - 1];
    //   if (google.maps.geometry.spherical.computeDistanceBetween(last, latLng) < 2)
    //     return;
    // }
    console.log("Adding vertex at ", latLng.toString());  
    this.vertices.push(latLng);
    this.polyline.setPath(this.vertices);

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

    this.markers.push(marker);
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

  /* ------------------- Undo / Redo ------------------- */

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
    return JSON.stringify(
      this.vertices.map(v => ({ lat: v.lat(), lng: v.lng() }))
    );
  }

  _loadState(state) {
    this.clear();
    JSON.parse(state).forEach(p =>
      this._addVertex(new google.maps.LatLng(p.lat, p.lng))
    );
  }

  /* ------------------- CRUD ------------------- */

  async save(name) {
    await fetch("save.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, path: JSON.parse(this._serialize()) })
    });
  }

  async load(id) {
    const res = await fetch(`load.php?id=${id}`);
    const data = await res.json();
    this.clear();
    data.forEach(p =>
      this._addVertex(new google.maps.LatLng(p.lat, p.lng))
    );
  }

  async delete(id) {
    await fetch(`delete.php?id=${id}`);
    this.clear();
  }

  /* ------------------- Helpers ------------------- */

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