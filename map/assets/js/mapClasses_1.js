class PolylineManager {
  constructor(map) {
    this.map = map;
    this.polyline = null;
    this.vertexMarkers = [];
    this.markersVisible=false;
    this.infoWindow = new google.maps.InfoWindow();
    this.isDrawing = false;
    this.tempPath = [];
    this.metadata={};
  }

  /** Create polyline from array of LatLngs */
  create(path = [],metadata = {}) {
    if (this.polyline) this.remove();

    this.polyline = new google.maps.Polyline({
      map: this.map,
      path,
      strokeColor: "#f53a3aff",
      strokeWeight: 3,
    //   editable: false ,// off initially
      geodesic: true,
    });
     this.polyline.metadata=metadata;
     this.polyline.parent=this;

    // this._attachPolylineEvents();
    // this._addVertexMarkers();
  }

  /** Remove everything */
  remove() {
    if (this.polyline) this.polyline.setMap(null);
    this.vertexMarkers.forEach(m => m.setMap(null));
    this.vertexMarkers = [];
    this.polyline = null;
  }

  select(){
    this.polyline.setOptions({strokeColor: "#3af594ff"})
    this.setMarkersVisibility(true)
  }
  unselect(){
    this.polyline.setOptions({strokeColor: "#f53a3aff"})
    this.setMarkersVisibility(false)
  }

  getPath(){
    return this.polyline.getPath();

  }

  pushPath(latlng,index=null){
    if(index){
    this.polyline.getPath().slice(index,0,latlng);
    this.addVertexMarker(latlng, index)
    } else {
      this.polyline.getPath().push(latlng);
      this.addVertexMarker(latlng)

    }

  }
  /** Enable editing */
  enableEdit() {
    if (!this.polyline) return;
    this.polyline.setEditable(true);
    this._addVertexMarkers();
  }

  /** Disable editing */
  disableEdit() {
    if (!this.polyline) return;
    this.polyline.setEditable(false);
    this._clearVertexMarkers();
  }

  /** Save handler (you’d POST encoded path to DB here) */
  save() {
    if (!this.polyline) return;
    const path = this.polyline.getPath();
    const encoded = google.maps.geometry.encoding.encodePath(path);
    console.log("Saving polyline encoded:", encoded);

    // TODO: fetch("/api/path/update", { body: JSON.stringify({ encoded }) })
    alert("Polyline saved! (see console)");
  }

  /** Clear path */
  clear() {
    if (!this.polyline) return;
    this.polyline.setPath([]);
    this._clearVertexMarkers();
  }

  addVertexMarker(position, idx=null) {
      const squareDiv = document.createElement("div");
        squareDiv.style.width = "6px";
        squareDiv.style.height = "6px";
        squareDiv.style.backgroundColor = "red";
        squareDiv.style.border = "1px solid black";
        squareDiv.style.boxSizing = "border-box";


        squareDiv.style.transform = "translate(2px, 2px)"; // align tip to latLng

        // const m = new DraggableAdvancedMarker(this.map,position,squareDiv);

      const m = new google.maps.marker.AdvancedMarkerElement({
        position: position,
        map: this.map,
        content:squareDiv,
        gmpDraggable: true
      });
        m.metadata = {index:null} // m.metadata = {index:null}
        m.metadata.index = idx;
                
        m.addListener("dragstart", () => {
            console.log("Drag started");
        });

        m.addListener("drag", () => {
            console.log("Dragging:", m.position);
            const newPoint = new google.maps.LatLng({lat:m.position.lat,lng:m.position.lng});
            this.polyline.getPath().setAt(idx-1,newPoint)
        });

        m.addListener("dragend", () => {
            console.log("Final position:", m.position);
            const newPoint = new google.maps.LatLng({lat:m.position.lat,lng:m.position.lng});
            this.polyline.getPath().setAt(idx-1,newPoint)

        });
        m.addListener("click", (e) => {
            console.log("Marker clicked at:", m.position.toJSON());
            alert("Red square marker clicked!");
        });


    //   m.addListener("drag", (ev) => {
    //     this.metadata.index=m.metadata.index;
    //   });

    //   m.addListener("gmp-click", (e) => {
    //     // path.setAt(idx, e.latLng);
    //      this.metadata.index=m.metadata.index;
    //     console.log(e.latLng)
    //     });

      if(idx) {
        this.vertexMarkers.slice(idx,0,m);
      } else {
      this.vertexMarkers.push(m);
      }
      return m;

//   const dot = document.createElement("div");
//     dot.style.width = "8px";
//     dot.style.height = "8px";
//     dot.style.borderRadius = "50%";
//     dot.style.background = "red";
//     dot.style.border = "1px solid white";

//    const marker = new google.maps.marker.AdvancedMarkerElement({
//     position,
//     map: null, // start invisible
//     content: dot,
//     gmpDraggable: true
//   });

  // // keep polyline in sync while dragging
  //   marker.addListener("gmp-click", (e) => {
  //     polyline.getPath().setAt(idx, e.latLng);
  //    console.log(e.latLng)
  //   });

  }

   selectMarker(mrk,idx) {
    mrk.enableDragging()
    m.map.setOptions({gestureHandling: "greedy"});
   }

    unselectMarker(mrk,idx) {
    mrk.disableDragging()
    m.map.setOptions({gestureHandling: "greedy"});
   }


  setMarkersVisibility(visible) {
    this.markersVisible = visible;
    this.vertexMarkers.forEach(m => {
        m.map = visible ? this.map : null;
    });
    }

  /** Draw polyline interactively by clicking map */
  startDrawing() {
    this.isDrawing = true;
    this.tempPath = [];

    const listener = this.map.addListener("click", (e) => {
      if (!this.isDrawing) return;
      this.tempPath.push(e.latLng);

      if (!this.polyline) {
        this.create(this.tempPath);
      } else {
        this.polyline.setPath(this.tempPath);
      }
      this._addVertexMarkers();
    });

    this.drawingListener = listener;
  }

  stopDrawing() {
    this.isDrawing = false;
    if (this.drawingListener) google.maps.event.removeListener(this.drawingListener);
  }

  // ---------------- private helpers ---------------- //

  _attachPolylineEvents() {
    if (!this.polyline) return;

    this.polyline.addListener("click", (e) => {
      this.infoWindow.setContent(this._getInfoWindowHTML());
      this.infoWindow.setPosition(e.latLng);
      this.infoWindow.open(this.map);
      this._wireInfoWindowButtons();
    });
  }

  _addVertexMarkers() {
    this._clearVertexMarkers();
    if (!this.polyline) return;
    const path = this.polyline.getPath();

    path.forEach((latLng, i) => {
      const m = new google.maps.Marker({
        position: latLng,
        map: this.map,
        icon: {
          path: google.maps.SymbolPath.SQUARE,
          scale: 6,
          fillColor: "red",
          fillOpacity: 1,
          strokeColor: "black",
          strokeWeight: 1
        },
        draggable: true
      });

      m.addListener("drag", (ev) => {
        path.setAt(i, ev.latLng);
      });

      this.vertexMarkers.push(m);
    });
  }

  _clearVertexMarkers() {
    this.vertexMarkers.forEach(m => m.setMap(null));
    this.vertexMarkers = [];
  }

  _getInfoWindowHTML() {
    return `
      <div style="min-width:150px">
        <b>Polyline</b><br/>
        <button id="btnEdit">Edit</button>
        <button id="btnSave">Save</button>
        <button id="btnClear">Clear</button>
      </div>
    `;
  }

  _wireInfoWindowButtons() {
    google.maps.event.addListenerOnce(this.infoWindow, "domready", () => {
      document.getElementById("btnEdit").onclick = () => this.enableEdit();
      document.getElementById("btnSave").onclick = () => this.save();
      document.getElementById("btnClear").onclick = () => this.clear();
    });
  }
}


class MarkerManager {
  constructor(map) {
    this.map = map;
    this.markers = [];
    this.infoWindow = new google.maps.InfoWindow();
  }

  /** Create marker(s) */
  create(latLng, props = {}) {
    const marker = new google.maps.Marker({
      position: latLng,
      map: this.map,
      draggable: true,
      icon: props.icon || null
    });

    marker.__props = props; // custom properties (like DB id, name, etc.)

    this._attachMarkerEvents(marker);
    this.markers.push(marker);
    return marker;
  }

  /** Remove all markers */
  clearAll() {
    this.markers.forEach(m => m.setMap(null));
    this.markers = [];
  }

  /** Delete one marker */
  delete(marker) {
    marker.setMap(null);
    this.markers = this.markers.filter(m => m !== marker);

    if (marker.__props && marker.__props.id) {
      // Example: delete in DB
      fetch("/api/point/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: marker.__props.id, table: marker.__props.table })
      }).then(r => r.json()).then(res => {
        console.log("Deleted from DB:", res);
      });
    }
  }

  /** Save marker to DB */
  save(marker) {
    const pos = marker.getPosition();
    const payload = {
      id: marker.__props.id,
      table: marker.__props.table,
      lat: pos.lat(),
      lng: pos.lng(),
      attributes: marker.__props
    };

    fetch("/api/point/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(r => r.json()).then(res => {
      console.log("Saved marker:", res);
      alert("Marker saved!");
    });
  }

  // ---------------- private helpers ---------------- //

  _attachMarkerEvents(marker) {
    marker.addListener("click", (e) => {
      this.infoWindow.setContent(this._getInfoWindowHTML(marker));
      this.infoWindow.open(this.map, marker);
      this._wireInfoWindowButtons(marker);
    });

    // Dragend = update coordinates
    marker.addListener("dragend", () => {
      console.log("Marker moved:", marker.getPosition().toString());
    });
  }

  _getInfoWindowHTML(marker) {
    return `
      <div style="min-width:150px">
        <b>Marker</b><br/>
        Lat: ${marker.getPosition().lat().toFixed(5)}<br/>
        Lng: ${marker.getPosition().lng().toFixed(5)}<br/>
        <button id="btnSave">Save</button>
        <button id="btnDelete">Delete</button>
      </div>
    `;
  }

  _wireInfoWindowButtons(marker) {
    google.maps.event.addListenerOnce(this.infoWindow, "domready", () => {
      document.getElementById("btnSave").onclick = () => this.save(marker);
      document.getElementById("btnDelete").onclick = () => this.delete(marker);
    });
  }
}

class DraggableAdvancedMarker {
  constructor(map, position, content) {
    this.map = map;
    this.position = position;
    this.metadata={};
    this.marker = new google.maps.marker.AdvancedMarkerElement({
      map: this.map,
      position: this.position,
      content: content,
    });

    this.isDragging = false;
    this.dragged = false;
    this.listeners = {};
    this.enableDragging();
  }

  enableDragging() {
    const markerEl = this.marker.content;

    // Mouse down
    markerEl.addEventListener("mousedown", (e) => {
      e.preventDefault();
      this.isDragging = true;
      this.dragged = false;
      markerEl.style.cursor = "grabbing";
      this.trigger("dragstart", this.marker.position);
    });

    // Move on map
    this.map.addListener("mousemove", (e) => {
      if (this.isDragging) {
        this.marker.position = e.latLng;
        this.dragged = true; // movement happened
        this.trigger("drag", e.latLng);
      }
    });

    // Mouse up
    this.map.addListener("mouseup", (e) => {
      if (this.isDragging) {
        this.isDragging = false;
        markerEl.style.cursor = "grab";

        if (this.dragged) {
          this.trigger("dragend", this.marker.position);
        } else {
          // count as normal click
          this.trigger("click", this.marker.position);
        }
      }
    });
  }
  disableDragging(){
    const markerEl = this.marker.content;

  }

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  trigger(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((cb) => cb(data));
    }
  }
}



class LayerManager {
  constructor(map) {
    this.map = map;
    this.layers = {}; // tableName -> { type, manager }
  }

  /** Add a layer by table name */
  async addLayer(table) {
    // Ask backend what type of geometry it has
    const inspect = await this._fetchJSON(`/api/inspect?table=${table}`);
    if (inspect.error || !inspect.geometry.type) {
      alert(inspect.error || "No geometry found in table");
      return;
    }

    const type = inspect.geometry.type; // "point" or "polyline"
    const data = await this._fetchJSON(`/api/features?table=${table}`);

    if (type === "point") {
      const mm = new MarkerManager(this.map);
      data.features.forEach(f => {
        if (!f.geometry) return;
        const [lng, lat] = f.geometry.coordinates;
        mm.create({ lat, lng }, { ...f.properties, id: f.id, table });
      });
      this.layers[table] = { type, manager: mm };
    }

    if (type === "polyline") {
      const pm = new PolylineManager(this.map);
      data.features.forEach(f => {
        if (!f.geometry) return;
        const path = google.maps.geometry.encoding.decodePath(f.geometry.encoded);
        pm.create(path);
        // attach props if needed
        if (pm.polyline) {
          pm.polyline.__id = f.id;
          pm.polyline.__table = table;
        }
      });
      this.layers[table] = { type, manager: pm };
    }

    return this.layers[table];
  }

  /** Show/hide a layer */
  toggleLayer(table, visible) {
    const layer = this.layers[table];
    if (!layer) return;
    if (layer.type === "point") {
      layer.manager.markers.forEach(m => m.setMap(visible ? this.map : null));
    }
    if (layer.type === "polyline") {
      if (layer.manager.polyline) {
        layer.manager.polyline.setMap(visible ? this.map : null);
        layer.manager.vertexMarkers.forEach(m => m.setMap(visible ? this.map : null));
      }
    }
  }

  /** Remove a layer completely */
  removeLayer(table) {
    const layer = this.layers[table];
    if (!layer) return;
    if (layer.type === "point") layer.manager.clearAll();
    if (layer.type === "polyline") layer.manager.remove();
    delete this.layers[table];
  }

  /** Add marker interactively to a point layer */
  addMarker(table, latLng, props = {}) {
    const layer = this.layers[table];
    if (layer && layer.type === "point") {
      return layer.manager.create(latLng, { ...props, table });
    }
  }

  /** Start drawing a new polyline for a polyline layer */
  startPolylineDrawing(table) {
    const layer = this.layers[table];
    if (layer && layer.type === "polyline") {
      layer.manager.startDrawing();
    }
  }

  stopPolylineDrawing(table) {
    const layer = this.layers[table];
    if (layer && layer.type === "polyline") {
      layer.manager.stopDrawing();
    }
  }

  // ---------------- helpers ---------------- //
  async _fetchJSON(url, opts = {}) {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...opts
    });
    return res.json();
  }
}

export { PolylineManager , MarkerManager , DraggableAdvancedMarker , LayerManager };  