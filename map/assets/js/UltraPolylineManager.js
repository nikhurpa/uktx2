class UltraPolylineManager {

  constructor(map, options = {}) {
    this.map = map;

    this.opts = {
      minDistance: options.minDistance ?? 10,
      smoothing: options.smoothing ?? false
    };
    // this.active = false;
    this.polylines = new Map();
    this.activeId = null;

    this.drawing = false;
    this.active = false;

    this.isPointerDown = false;

    // projection helper
    this.overlay = new google.maps.OverlayView();
    this.overlay.onAdd = () => {};
    this.overlay.draw = () => {};
    this.overlay.setMap(map);

    // this._bindPointerEvents();
  }

  /* =================================
     POLYLINE MANAGEMENT
  ================================= */

  createPolyline(id) {
    if (this.polylines.has(id) || id !== "TEMP" ) return;

    const polyline = new google.maps.Polyline({
      map: this.map,
      strokeColor: "#0066ff",
      strokeWeight: 3,
      clickable: false
    });

    this.polylines.set(id, {
      polyline,
      vertices: [],
      markers: [],
      midMarkers: [],
      undoStack: [],
      redoStack: [],

      visible: true,
      markerindex:0,
      prmarkerindex:null,
      nextmarkerindex:null,
      curmarker:null,
      prmarkercolor:null,
     
    });

    this.setActive(id);
    console.log("Polyline created with ID:", this.activeId);  
  }

  setActive(id) {
     if (!this.polylines.has(id)) return;
    this.activeId = id;
    // this._refreshMidpoints();
  }

  getActive() {
    return this.polylines.get(this.activeId);
  }

  /* =================================
     DRAW MODE (MOUSE + TOUCH)
  ================================= */

  enableDraw() {

    if (this.activeId) return;

    this.drawing = true;
    this.active = true;

    this.map.setOptions({
      // draggable: false,
      draggableCursor: "crosshair",
      draggingCursor: "crosshair" ,
      scrollwheel: true, 
      gestureHandling: "greedy",
    });
    console.log("Draw mode enabled");
    if(this.activeId != "TEMP") this.createPolyline("TEMP");
    this._bindEvents();
  }

  disableDraw() {
    this.activeId=null
    this.drawing = false;
    this.active = false;
    this.isPointerDown = false;

    this.map.setOptions({
      // draggable: true,
      draggableCursor: null,
      cursor: "default" , 
      draggableCursor: "grab", 
      draggingCursor: "grabbing" ,
      scrollwheel: true, 
      gestureHandling: "greedy"
    });
  }

  _bindPointerEvents() {
    const div = this.map.getDiv();

    const down = e => {
      if (!this.drawing || !this.active) return;
      e.preventDefault();

      this.isPointerDown = true;
      this._saveState();
      this._addVertex(this._eventToLatLng(e));
    };

    const move = e => {
      if (!this.drawing || !this.isPointerDown || !this.active) return;
      this._addVertex(this._eventToLatLng(e));
    };

    const up = () => {
      if (!this.drawing) return;
      this.disableDraw();
    };

    // mouse
    div.addEventListener("mousedown", down);
    div.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);

    // touch
    div.addEventListener("touchstart", down, { passive: false });
    div.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", up);
  }


  _bindEvents() {
      // MOUSE DOWN → start drawing
      this.map.addListener('mousedown', (e) => {
        if (!this.active) return;
        // console.log("Mouse down at:", e.latLng);
        this.isDragging = true;

        // 🔴 stop map from moving while drawing
        // this.map.setOptions({ draggable: false });
        this.map.setOptions( { gestureHandling: "none" });
      
        // ⭐ IMPORTANT: first vertex starts here
        this._addVertex(e.latLng);
      });

      // MOUSE MOVE → continue drawing
      this.map.addListener('mousemove', (e) => {
     
        if (!this.active || !this.isDragging) return;
        // console.log("Mouse move at:", e.latLng);
        this.isDrawing = true;
        this._addVertex(e.latLng);
      });

      // MOUSE UP → stop drawing
      this.map.addListener('mouseup', () => {
        if (!this.active) return;
        // console.log("Mouse up ");
        this.isDrawing = false;
        this.isDragging = false;

        // ✅ re-enable map drag
        // this.map.setOptions({ draggable: true });
        this.map.setOptions({ gestureHandling: "greedy" });
      });
  }


  _addVertex2(latLng) {
  this.currentPath.push(latLng);

  // create polyline if first point
  if (!this.currentPolyline) {
    this.currentPolyline = new google.maps.Polyline({
      map: this.map,
      path: this.currentPath,
      strokeColor: '#ff0000',
      strokeWeight: 2
    });
  } else {
    this.currentPolyline.setPath(this.currentPath);
  }

  // create red draggable vertex marker
  const marker = new google.maps.Marker({
    position: latLng,
    map: this.map,
    draggable: true,
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 4,
      fillColor: 'red',
      fillOpacity: 1,
      strokeWeight: 0
    }
  });

  this._bindVertexEvents(marker);

  this.vertexMarkers.push(marker);
}

_bindVertexEvents(marker) {
  // drag to edit
  marker.addListener('drag', () => {
    const index = this.vertexMarkers.indexOf(marker);
    if (index === -1) return;

    this.currentPath[index] = marker.getPosition();
    this.currentPolyline.setPath(this.currentPath);
  });

  // right click to remove vertex
  marker.addListener('rightclick', () => {
    const index = this.vertexMarkers.indexOf(marker);
    if (index === -1) return;

    marker.setMap(null);
    this.vertexMarkers.splice(index, 1);
    this.currentPath.splice(index, 1);

    this.currentPolyline.setPath(this.currentPath);
  });
}
  /* =================================
     VERTEX SYSTEM
  ================================= */

_addVertex(latLng) {
   
    const a = this.getActive(); 
   console.log("activeId:", this.activeId,",Adding vertex at:", latLng.toString());
    if (!a) return;
    let d=this.opts.minDistance;
 
    // distance throttle
    if (a.vertices.length) {
      const last = a.vertices[a.vertices.length - 1];
      d = google.maps.geometry.spherical.computeDistanceBetween(last, latLng);
    }
    console.log("Distance to last vertex:", d);

    if (d < this.opts.minDistance) return;
    
    let idx = a.markerindex ? a.markerindex:   a.vertices.length;
    // a.vertices.insertAt(idx,latLng);
    a.vertices.splice(idx,0,latLng);

    a.polyline.setPath(a.vertices);

    const marker = this._createVertexMarker(a,latLng,idx);
    // a.markers.insertAt(idx,marker);
    a.markers.splice(idx,0,marker);

    console.log("Vertex added at:", latLng.toString(), "Total vertices:", a.vertices.length);
    // this._refreshMidpoints();
}

  _createVertexMarker(p,latLng,idx) {

     const dot = document.createElement("div");
        dot.style.width = "6px";
        dot.style.height = "6px";
        dot.style.borderRadius = "50%";
        dot.style.backgroundColor = "red";
        dot.style.border = "1px solid white";
        dot.style.transform = "translate(3px, 3px)";

        const m = new google.maps.marker.AdvancedMarkerElement({
          position: latLng,
          map: this.map,
          content:dot,
          gmpDraggable: false,
          zIndex : 1000,
        });

          p.curmarker=m;
        
            m.element.addEventListener("click", (e) => {
                console.log("Marker clicked at:", m.position.toJSON());
                e.stopPropagation();  // 👈 prevent bubbling to map
                const indx = p.markers.findIndex(vm => vm === m);

                if(p.prmarkerindex) _unselectMarker(p,p.prmarkerindex)
                p.markerindex=indx;
                p.nextmarkerindex=p.markerindex+1;
                this.isDragging = true;
               
                _selectMarker(p,indx)
                p.prmarkerindex=indx
                p.curmarker=m; 
              

            });

            m.element.addEventListener("mouseenter", (e) => {
             if (e.buttons != 1) {
             const indx = p.markers.findIndex(vm => vm === m);
              
              console.log("mouse over", indx, "pr col/",p.prmarkercolor);
              p.prmarkercolor=m.content.style.backgroundColor;
              m.content.style.backgroundColor = "yellow";
              let mapoptions_clear={cursor: "pointer" , scrollwheel: true, gestureHandling: "greedy"}
              this.map.setOptions( mapoptions_clear);
              m.gmpDraggable= true

              }
              });

            m.element.addEventListener("mouseout", (e) => {
               if (e.buttons != 1) {
               const indx = p.markers.findIndex(vm => vm === m);
              console.log("mouse out", indx, "pr col/",p.prmarkercolor);
              m.content.style.backgroundColor = p.prmarkercolor;
              let mapoptions_startroute={draggableCursor: "crosshair",draggingCursor: "crosshair" 
                            ,scrollwheel: true, gestureHandling: "greedy"}
              this.map.setOptions( mapoptions_startroute);
              m.gmpDraggable= false
               }
              });

            m.addListener("dragstart", () => {
                console.log("marker Drag started");
             this.markerDragging=true
             this.markerOldPosition=m.position;
            });

            m.addListener("drag", () => {
              this.markerDragging=true
                // console.log("Dragging:", m.position);
                const newPoint = new google.maps.LatLng({lat:m.position.lat,lng:m.position.lng});
                const indx = p.markers.findIndex(vm => vm === m);
                p.polyline.getPath().setAt(indx,newPoint)
            });

            m.addListener("dragend", () => {
                
                const newPoint = new google.maps.LatLng({lat:m.position.lat,lng:m.position.lng});
                const indx = p.markers.findIndex(vm => vm === m);
                p.polyline.getPath().setAt(indx,newPoint)
                console.log("marker drag end Final position:", indx);
               
                p.polyline.undoStack.push({marker:m,type:"drag",index: indx, oldposition:this.markerOldPosition});
                this.markerDragging=false
            });

     
            p.markers.splice(idx,0,m);
            p.undoStack.push({marker:m,type:"add",index: idx, position:null});

   
    // hover highlight
    // marker.addListener("mouseover", () => marker.setOpacity(0.6));
    // marker.addListener("mouseout", () => marker.setOpacity(1));

    // marker.addListener("drag", () => this._updateFromMarkers());
    // marker.addListener("rightclick", () => this._removeVertex(marker));

    return m;
  }

  _selectMarker(p,idx) {

    p.vertexMarkers[idx].content.style.backgroundColor = "blue";
    p.curmarker=idx
    p.vertexMarkers[idx].gmpDraggable=true;

   
   }

  _unselectMarker(p,idx) {
      console.log("Uncelect:", idx)
      p.vertexMarkers[idx].gmpDraggable=false
     
      p.vertexMarkers[idx].content.style.backgroundColor = "red";
    
  }

  _removeVertex(marker) {
     const a = this.getActive(); 
    if (!a) return;

    this._saveState();

    const i = a.markers.indexOf(marker);
    if (i === -1) return;

    marker.setMap(null);
    a.markers.splice(i, 1);
    a.vertices.splice(i, 1);
    a.polyline.setPath(a.vertices);

    this._refreshMidpoints();
  }

  _updateFromMarkers() {
    const a = this.active;
    if (!a) return;

    a.vertices = a.markers.map(m => m.getPosition());
    a.polyline.setPath(a.vertices);
    this._refreshMidpoints();
  }

  /* =================================
     MIDPOINT INSERTION
  ================================= */

  _refreshMidpoints() {
    const a = this.getActive(); 
    if (!a) return;

    a.midMarkers.forEach(m => m.setMap(null));
    a.midMarkers = [];

    for (let i = 0; i < a.vertices.length - 1; i++) {
      const mid = this._midPoint(a.vertices[i], a.vertices[i + 1]);

      const marker = new google.maps.Marker({
        position: mid,
        map: this.map,
        zIndex: 900,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 4,
          fillColor: "#00aaff",
          fillOpacity: 0.9,
          strokeWeight: 0
        }
      });

      marker.addListener("click", () => this._insertVertex(i + 1, mid));
      a.midMarkers.push(marker);
    }
  }

  _insertVertex(index, latLng) {
      const a = this.getActive(); 
    if (!a) return;

    this._saveState();

    a.vertices.splice(index, 0, latLng);
    a.polyline.setPath(a.vertices);

    const marker = this._createVertexMarker(latLng);
    a.markers.splice(index, 0, marker);

    this._refreshMidpoints();
  }

  _midPoint(a, b) {
    return new google.maps.LatLng(
      (a.lat() + b.lat()) / 2,
      (a.lng() + b.lng()) / 2
    );
  }

  /* =================================
     GEOJSON
  ================================= */

  exportGeoJSON() {
     const a = this.getActive(); 
    if (!a) return null;

    return {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: a.vertices.map(v => [v.lng(), v.lat()])
      }
    };
  }

  importGeoJSON(feature, id = "geojson") {
    if (!feature?.geometry?.coordinates) return;

    this.createPolyline(id);
     const a = this.getActive(); 

    feature.geometry.coordinates.forEach(c => {
      this._addVertex(new google.maps.LatLng(c[1], c[0]));
    });
  }

  /* =================================
     UNDO / REDO
  ================================= */

  _saveState() {
      const a = this.getActive(); 
    if (!a) return;

    a.undoStack.push(JSON.stringify(a.vertices.map(v => ({
      lat: v.lat(),
      lng: v.lng()
    }))));

    a.redoStack = [];
  }

  undo() {
     const a = this.getActive(); 
    if (!a || !a.undoStack.length) return;

    a.redoStack.push(this._serialize());
    this._loadState(a.undoStack.pop());
  }

  redo() {
     const a = this.getActive(); 
    if (!a || !a.redoStack.length) return;

    a.undoStack.push(this._serialize());
    this._loadState(a.redoStack.pop());
  }

  _serialize() {
     const a = this.getActive(); 
    return JSON.stringify(a.vertices.map(v => ({
      lat: v.lat(),
      lng: v.lng()
    })));
  }

  _loadState(state) {
     const a = this.getActive(); 
    if (!a) return;

    this._clearActive();

    JSON.parse(state).forEach(p =>
      this._addVertex(new google.maps.LatLng(p.lat, p.lng))
    );
  }

  /* =================================
     HELPERS
  ================================= */

  _clearActive() {
      const a = this.getActive(); 
    if (!a) return;

    a.markers.forEach(m => m.setMap(null));
    a.midMarkers.forEach(m => m.setMap(null));
    a.markers = [];
    a.midMarkers = [];
    a.vertices = [];
    a.polyline.setPath([]);
  }

  _eventToLatLng(e) {
    const rect = this.map.getDiv().getBoundingClientRect();
    const proj = this.overlay.getProjection();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const OFFSET = 8;

    const point = new google.maps.Point(
      clientX - rect.left - OFFSET,
      clientY - rect.top - OFFSET
    );

    return proj.fromDivPixelToLatLng(point);
  }
}

export { UltraPolylineManager };