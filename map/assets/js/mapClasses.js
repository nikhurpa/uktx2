const KMLIcons = {
  file: "./img/kml.jpg",
  folder: "./img/folder.png",
  document: "./img/document.jpg",
  point: "./img/point_icon.png",
  polyline: "./img/polyline.svg",
  polygon: "./img/polygon.png",
  default: "./img/placemark.png"
};

class PolylineManager {
  constructor(map,onVertexClick,index,setMode) {

    this.map = map;
    this.polyline = null;
    this.polylines=[];
    this.vertexMarkers = [];
    this.markersVisible=false;
    this.infoWindow = new google.maps.InfoWindow();
    this.isDrawing = false;
    this.tempPath = [];
    this.metadata={};
    this.index=index;
    this.onVertexClick = onVertexClick; // callback passed in from main
    this.setMode=setMode;
    this.curmarker;
    this.curpolyline=null;
    this.markerDragging=false;
    this.markerOldPosition=null;
    this.prmarkercolor;
    this.undoMarkers=[];
  }

  /** Create polyline from array of LatLngs */
  create(path = [],metadata = {}) {
    // if (this.polyline) this.remove();

   let polyline = new google.maps.Polyline({
      map: this.map,
      path,
      strokeColor: "yellow",
      strokeWeight: 2,
    //   editable: false ,// off initially
      geodesic: true,
    });
     polyline.metadata=metadata;
     polyline.vertexMarkers=[];
     polyline.undoMarkers=[];
     polyline.markerindex=0;
     polyline.prmarkerindex=null;
     polyline.nextmarkerindex=null;
     polyline.curmarker=null;
     polyline.parent=this;
     this._attachPolylineEvents(polyline,this.setMode);
     this._addVertexMarkers(polyline);
     this.curpolyline=polyline
     this.polylines.push(polyline)
  }

  /** Remove everything */
  remove() {
    if (this.polyline) this.polyline.setMap(null);
    this.vertexMarkers.forEach(m => m.setMap(null));
    this.vertexMarkers = [];
    this.polyline = null;
  }

  select(p){
    // this.polyline.setOptions({strokeColor: "#3af594ff"})
    this.setMarkersVisibility(p,true)
  }
  unselect(p){
    // this.polyline.setOptions({strokeColor: "#f53a3aff"})
    this.setMarkersVisibility(p,false)
  }

  // getPath(){
  //   return this.polyline.getPath();

  // }

  pushPath(p,position,idx=null){
      idx = idx ? idx :   p.vertexMarkers.length;
      p.getPath().insertAt(idx,position);
      this.addVertexMarker( p,position,idx)
       
      // if(idx){
      //   this.polyline.getPath().insertAt(idx,position);
      //   this.addVertexMarker( position,idx)
      // } else {
      //   this.polyline.getPath().push(position);
      //   this.addVertexMarker(position)
      // }
 
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

 

  addVertexMarker(p, position,idx=null) {

        const dot = document.createElement("div");
        dot.style.width = "6px";
        dot.style.height = "6px";
        dot.style.borderRadius = "50%";
        dot.style.backgroundColor = "red";
        dot.style.border = "1px solid white";
        dot.style.transform = "translate(3px, 3px)";

        const m = new google.maps.marker.AdvancedMarkerElement({
          position: position,
          map: p.map,
          content:dot,
          gmpDraggable: false,
          zIndex : 9999,
        });
        // m.metadata = {index:null} // m.metadata = {index:null}
        // m.metadata.index = idx;
        p.curmarker=m;
        
            m.element.addEventListener("click", (e) => {
                console.log("Marker clicked at:", m.position.toJSON());
                e.stopPropagation();  // 👈 prevent bubbling to map
                const indx = p.vertexMarkers.findIndex(vm => vm === m);
                if (this.onVertexClick) {
                  this.onVertexClick(indx, m, p); 
                }
              p.curmarker=m; 
              

            });

            m.element.addEventListener("mouseenter", (e) => {
             if (e.buttons != 1) {
             const indx = p.vertexMarkers.findIndex(vm => vm === m);
              
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
               const indx = p.vertexMarkers.findIndex(vm => vm === m);
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
                const indx = this.curpolyline.vertexMarkers.findIndex(vm => vm === m);
                this.curpolyline.getPath().setAt(indx,newPoint)
            });

            m.addListener("dragend", () => {
                
                const newPoint = new google.maps.LatLng({lat:m.position.lat,lng:m.position.lng});
                const indx = this.curpolyline.vertexMarkers.findIndex(vm => vm === m);
                this.curpolyline.getPath().setAt(indx,newPoint)
                console.log("marker drag end Final position:", indx);
               
                this.curpolyline.undoMarkers.push({marker:m,type:"drag",index: indx, oldposition:this.markerOldPosition});
                this.markerDragging=false
            });

     
            p.vertexMarkers.splice(idx,0,m);
            p.undoMarkers.push({marker:m,type:"add",index: idx, position:null});
  }

  
  removeVertexMarker(p){
   
   let undoPop= p.undoMarkers.pop();
   let lastevent= undoPop.type
   let lastMarker= undoPop.marker
   let lastMarkerOldPosition = undoPop.oldposition

   if(lastevent=="add"){
   const indx = p.vertexMarkers.findIndex(vm => vm === lastMarker)
   console.log("unde index:",indx)
   p.vertexMarkers[indx].setMap(null);
   p.vertexMarkers.splice(indx,1)
   p.getPath().removeAt(indx);

   p.curmarker = p.vertexMarkers.findIndex(vm => vm === p.undoMarkers[p.undoMarkers.length - 1].marker)
   p.vertexMarkers[p.curmarker].content.style.backgroundColor = "blue";
   p.vertexMarkers[p.curmarker].gmpDraggable=true;
   }
    if(lastevent=="drag"){
      const indx = p.vertexMarkers.findIndex(vm => vm === lastMarker)
      lastMarker.position=lastMarkerOldPosition
      const oldPoint = new google.maps.LatLng({lat:lastMarkerOldPosition.lat,lng:lastMarkerOldPosition.lng});
      p.getPath().setAt(indx,oldPoint)
      p.curmarker=indx;
      p.vertexMarkers[p.curmarker].content.style.backgroundColor = "blue";
      p.vertexMarkers[p.curmarker].gmpDraggable=true;

    }

  }


  selectMarker(p,idx) {

    p.vertexMarkers[idx].content.style.backgroundColor = "blue";
    p.curmarker=idx
    p.vertexMarkers[idx].gmpDraggable=true;

   
   }

  unselectMarker(p,idx) {
      console.log("Uncelect:", idx)
      p.vertexMarkers[idx].gmpDraggable=false
     
      p.vertexMarkers[idx].content.style.backgroundColor = "red";
    
    
 

  }
    

  setMarkersVisibility(p,visible) {
    p.markersVisible = visible;
    p.vertexMarkers.forEach(m => {
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

  _attachPolylineEvents(p,setMode) {
    if (!p) return;

        p.addListener("click", (e) => {
      // this.infoWindow.setContent(this._getInfoWindowHTML());
      // this.infoWindow.setPosition(e.latLng);
      // this.infoWindow.open(this.map);
      // this._wireInfoWindowButtons();
 
        this.isDrawing=false;
        this.polylineSelected=true;
        this.curpolyline=p
        p.markerindex=p.curmarker;
        p.nextmarkerindex=p.markerindex+1
        // curpolyline=p.metadata.index;
        // console.log("click:"+p.metadata.index)
        this.polylines.forEach( p2 => {this.setMarkersVisibility(p2,false)})
        this.select(p);
        setMode("Route")
        console.log(p.metadata.index)




    });
  }

  _addVertexMarkers(p) {

    this._clearVertexMarkers();
    if (!p) return;
    const path = p.getPath();

    path.forEach((latLng, i) => {
      this.addVertexMarker(p,latLng,i)

     
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


class AdvanceMarkerManager {

constructor(map) {
    this.map = map;
    this.position = null;
    this.content=null;
    this.metadata={};
    this.markerDragging = false;
    this.listeners = {};
    this.markers=[];
    this.undoMarkers=[];
    this.markerSelected=false;
    this.curmarkerindex=null;
    this.marker = new google.maps.marker.AdvancedMarkerElement({
      map: this.map,
      position: this.position,
      content: this.content,
      gmpDraggable: false,
    });

  
  }

  /** Create marker(s) */
  create(position, content,props={}) {
    this.position = position;
    this.content=content;
    const marker =  new google.maps.marker.AdvancedMarkerElement({
      position: position,
      map: this.map,
      content: content,
      gmpDraggable: false,
    });

    marker.__props = props; // custom properties (like DB id, name, etc.)

    this._attachMarkerEvents(marker);
    this.markers.push(marker);
    let indx= this.markers.length-1
    this.undoMarkers.push({marker:marker,type:"add",index: indx, oldposition:null});

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

  _attachMarkerEvents(m) {

    // marker.addListener("click", (e) => {
    //   this.infoWindow.setContent(this._getInfoWindowHTML(marker));
    //   this.infoWindow.open(this.map, marker);
    //   this._wireInfoWindowButtons(marker);
    // });

    // // Dragend = update coordinates
    // marker.addListener("dragend", () => {
    //   console.log("Marker moved:", marker.getPosition().toString());
    // });

              m.addListener("gmp-click", () => {   // ✅ use gmp-click for AdvancedMarker
                this.markerSelected = true;
                const indx = this.markers.findIndex(vm => vm === m);
                this.curmarkerindex = indx;
                console.log("Marker clicked index:", indx);
              });

              m.element.addEventListener("mouseenter", (e) => {
                console.log("mouse over");
                m.content.style.backgroundColor = "yellow";
                m.gmpDraggable=true

                });
              m.element.addEventListener("mouseleave", (e) => {
                  console.log("mouseout");
                  m.content.style.backgroundColor = "red";
                  m.gmpDraggable=false
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
                  const indx = this.markers.findIndex(vm => vm === m);
                 
              });

            m.addListener("dragend", () => {
                
                const newPoint = new google.maps.LatLng({lat:m.position.lat,lng:m.position.lng});
                const indx = this.markers.findIndex(vm => vm === m);
               
                console.log("marker drag end Final position:", indx);
                this.markerDragging=false
                this.undoMarkers.push({marker:m,type:"drag",index: indx, oldposition:this.markerOldPosition});

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



class LayerManager1 {
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


// class KMLViewer {
//   constructor({ map, treeSelector }) {
//     this.map = map;
//     this.bounds = new google.maps.LatLngBounds();
//     this.infoWindow = new google.maps.InfoWindow();

//     this.layerManager = new LayerManager(map, this.bounds, this.infoWindow);
//     this.treeManager = new TreeManager(treeSelector, this.layerManager);
//   }

//   async loadFile(file) {
//     const xml = await KMLParser.parseFile(file);
//     const treeData = this.layerManager.buildFromKML(xml);
//     this.treeManager.load(treeData);
//     this.map.fitBounds(this.bounds);
//   }
// }

class KMLParser {

  static async parseFile(file) {
    const name = file.name.toLowerCase();

    if (name.endsWith(".kml")) {
      const text = await file.text();
      return new DOMParser().parseFromString(text, "text/xml");
    }

    if (name.endsWith(".kmz")) {
      const buffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(buffer);
      const kmlName = Object.keys(zip.files)
        .find(n => n.toLowerCase().endsWith(".kml"));

      if (!kmlName) {
        throw new Error("No KML found inside KMZ");
      }

      const kmlText = await zip.files[kmlName].async("text");
      return new DOMParser().parseFromString(kmlText, "text/xml");
    }

    throw new Error("Unsupported file type");
  }
}

class KMLViewer {

  constructor(map, treeSelector = "#jqxTree", fileInput = "#kmlFile") {
    this.map = map;
    this.treeSelector = treeSelector;
    this.fileInput = fileInput;

    this.featureLayers = {};
    this.bounds = new google.maps.LatLngBounds();
    this.idCounter = 0;
    this.suppressCheckChange = false;

    this.init();
  }

  init() {
    this.bindFileInput();
    this.bindTreeEvents();
  }

  bindFileInput() {
    $(this.fileInput).on("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const xml = await KMLParser.parseFile(file);
        this.loadKML(xml, file.name);
      } catch (err) {
        console.error(err);
        alert(err.message);
      }
    });
  }

  loadKML(xmlDoc, fileName) {
    const treeData = this.buildTreeData(xmlDoc);

    const fileNodeId = "file" + (++this.idCounter);
    const fileNode = {
      id: fileNodeId,
      label: fileName,
      checked: true,
      icon: KMLIcons.file,
      value: "file_" + fileName,
      items: treeData
    };

    const tempPlaces = $(this.treeSelector).find("#tempplaces")[0];
    $(this.treeSelector).jqxTree("addTo", fileNode, tempPlaces);

    if (!this.bounds.isEmpty()) {
      this.map.fitBounds(this.bounds);
    }
  }

  // ---------- TREE ----------
  bindTreeEvents() {
    const $tree = $(this.treeSelector);

    $tree.on("checkChange", (e) => {
      if (this.suppressCheckChange) return;
      const id = e.args.element?.id;
      if (!id) return;
      this.setVisibility(id, e.args.checked);
    });

    $tree.on("itemClick", (e) => {
      this.zoomToFeature(e.args.element?.id);
    });
  }

  // ---------- VISIBILITY ----------
  setVisibility(id, visible) {
    const overlays = this.featureLayers[id];
    if (!overlays) return;

    overlays.forEach(ov => ov.setMap(visible ? this.map : null));
  }

  // ---------- MAP ----------
  zoomToFeature(id) {
    const overlays = this.featureLayers[id];
    if (!overlays?.length) return;

    const first = overlays[0];

    if (first.getPosition) {
      this.map.panTo(first.getPosition());
      this.map.setZoom(10);
      return;
    }

    const b = new google.maps.LatLngBounds();
    if (first.getPath) first.getPath().forEach(p => b.extend(p));
    if (first.getPaths) first.getPaths().forEach(path => path.forEach(p => b.extend(p)));
    this.map.fitBounds(b);
  }

  // ---------- TREE BUILD ----------
  buildTreeData(xmlDoc) {
    const root =
      xmlDoc.getElementsByTagName("Document")[0] ||
      xmlDoc.getElementsByTagName("Folder")[0] ||
      xmlDoc.documentElement;

    return [this.buildTreeNode(root)];
  }

  buildTreeNodeold(node) {
    const id = "item" + (++this.idCounter);
    const item = {
      id,
      label: this.nodeLabel(node),
      items: []
    };

    if (node.tagName === "Folder" || node.tagName === "Document") {
      item.checked = true;

      [...node.children].forEach(child => {
        if (["Folder", "Document", "Placemark"].includes(child.tagName)) {
          item.items.push(this.buildTreeNode(child));
        }
      });
    }

    if (node.tagName === "Placemark") {
      const overlays = this.createOverlays(node);
      if (overlays.length) {
        this.featureLayers[id] = overlays;
        item.checked = true;
      }
    }

    return item;
  }

  buildTreeNode(node) {
    const id = "item" + (++this.idCounter);

    const item = {
      id,
      label: this.nodeLabel(node),
      items: []
    };

    // Folder / Document
    if (node.tagName === "Folder" || node.tagName === "Document") {
      item.checked = true;
      item.icon = node.tagName === "Folder"
        ? KMLIcons.folder
        : KMLIcons.document;

      [...node.children].forEach(child => {
        if (["Folder", "Document", "Placemark"].includes(child.tagName)) {
          item.items.push(this.buildTreeNode(child));
        }
      });
    }

    // Placemark
    if (node.tagName === "Placemark") {
      const overlays = this.createOverlays(node);
      if (overlays.length) {
        this.featureLayers[id] = overlays;
        item.checked = true;
        item.icon = this.getPlacemarkIcon(node);
      }
    }

    return item;
  }

getPlacemarkIcon(node) {
  if (node.getElementsByTagName("Point").length) {
    return KMLIcons.point;
  }
  if (node.getElementsByTagName("LineString").length) {
    return KMLIcons.polyline;
  }
  if (node.getElementsByTagName("Polygon").length) {
    return KMLIcons.polygon;
  }
  return KMLIcons.default;
}

  // ---------- OVERLAYS ----------
  createOverlays(node) {
    const overlays = [];
    const coordsNode = node.getElementsByTagName("coordinates")[0];
    if (!coordsNode) return overlays;

    const coords = coordsNode.textContent.trim()
      .split(/\s+/)
      .map(c => {
        const [lon, lat] = c.split(",").map(Number);
        return { lat, lng: lon };
      });

    if (node.getElementsByTagName("Point").length) {
      const marker = new google.maps.Marker({
        position: coords[0],
        map: this.map
      });
      overlays.push(marker);
      this.bounds.extend(coords[0]);
    }

    if (node.getElementsByTagName("LineString").length) {
      const line = new google.maps.Polyline({
        path: coords,
        map: this.map
      });
      overlays.push(line);
      coords.forEach(c => this.bounds.extend(c));
    }

    if (node.getElementsByTagName("Polygon").length) {
      const poly = new google.maps.Polygon({
        paths: coords,
        map: this.map
      });
      overlays.push(poly);
      coords.forEach(c => this.bounds.extend(c));
    }

    return overlays;
  }

  nodeLabel(node) {
    const name = node.getElementsByTagName("name")[0];
    return name?.textContent || node.tagName;
  }
}


class LayerManager {
  constructor(map, bounds, infoWindow) {
    this.map = map;
    this.bounds = bounds;
    this.infoWindow = infoWindow;
    this.layers = {};
    this.idCounter = 0;
  }

  buildFromKML(xml) {
    const root =
      xml.querySelector("Document") ||
      xml.querySelector("Folder") ||
      xml.documentElement;

    return [this._buildNode(root)];
  }

  _buildNode(node) {
    const id = "item" + (++this.idCounter);
    const label = node.querySelector("name")?.textContent || node.tagName;

    const item = { id, label, items: [] };
    this.layers[id] = { id, overlays: [], children: [], visible: true };

    if (node.tagName === "Folder" || node.tagName === "Document") {
      item.checked = true;

      [...node.children].forEach(child => {
        if (["Folder", "Document", "Placemark"].includes(child.tagName)) {
          const childItem = this._buildNode(child);
          item.items.push(childItem);
          this.layers[id].children.push(childItem.id);
        }
      });
    }

    if (node.tagName === "Placemark") {
      const overlays = this._buildPlacemark(node);
      this.layers[id].overlays = overlays;
      item.checked = true;
    }

    return item;
  }

  _buildPlacemark(node) {
    const overlays = [];
    const desc = node.querySelector("description")?.textContent ?? "";

    const parseCoords = text =>
      text.trim().split(/\s+/).map(c => {
        const [lon, lat] = c.split(",").map(Number);
        return { lat, lng: lon };
      });

    // Point
    const point = node.querySelector("Point coordinates");
    if (point) {
      const pos = parseCoords(point.textContent)[0];
      overlays.push(this._createMarker(pos, node, desc));
    }

    // LineString
    const line = node.querySelector("LineString coordinates");
    if (line) {
      overlays.push(this._createPolyline(parseCoords(line.textContent), desc));
    }

    // Polygon
    const poly = node.querySelector("Polygon outerBoundaryIs coordinates");
    if (poly) {
      overlays.push(this._createPolygon(parseCoords(poly.textContent), desc));
    }

    return overlays;
  }

  _createMarker(position, node, desc) {
    const icon = node.querySelector("Icon href")?.textContent || "./img/point_icon.png";
    const img = document.createElement("img");
    img.src = icon;
    img.style.width = "20px";

    const marker = new google.maps.marker.AdvancedMarkerElement({
      position,
      content: img,
      map: this.map
    });

    if (desc) {
      marker.addListener("click", () => {
        this.infoWindow.setContent(desc);
        this.infoWindow.open(this.map, marker);
      });
    }

    this.bounds.extend(position);
    return marker;
  }

  _createPolyline(path, desc) {
    const poly = new google.maps.Polyline({
      path,
      strokeColor: "#0000FF",
      strokeWeight: 3,
      map: this.map
    });

    if (desc) {
      poly.addListener("click", e => {
        this.infoWindow.setContent(desc);
        this.infoWindow.setPosition(e.latLng);
        this.infoWindow.open(this.map);
      });
    }

    path.forEach(p => this.bounds.extend(p));
    return poly;
  }

  _createPolygon(path, desc) {
    const poly = new google.maps.Polygon({
      paths: path,
      strokeColor: "#FF0000",
      fillColor: "#FFCCCC",
      map: this.map
    });

    if (desc) {
      poly.addListener("click", e => {
        this.infoWindow.setContent(desc);
        this.infoWindow.setPosition(e.latLng);
        this.infoWindow.open(this.map);
      });
    }

    path.forEach(p => this.bounds.extend(p));
    return poly;
  }

  setVisibility(id, visible) {
    const layer = this.layers[id];
    if (!layer) return;

    layer.visible = visible;
    layer.overlays.forEach(o => o.setMap(visible ? this.map : null));
    layer.children.forEach(cid => this.setVisibility(cid, visible));
  }
}

class TreeManager {
  constructor(selector, layerManager) {
    this.$tree = $(selector);
    this.layerManager = layerManager;
    this.suppress = false;

    this.$tree.on("checkChange", e => {
      if (this.suppress) return;
      this.layerManager.setVisibility(
        e.args.element.id,
        e.args.checked
      );
    });
  }

  load(data) {
    this.$tree.jqxTree({
      source: data,
      checkboxes: true
    });
  }

  syncCheck(id, checked) {
    this.suppress = true;
    checked
      ? this.$tree.jqxTree("checkItem", document.getElementById(id))
      : this.$tree.jqxTree("uncheckItem", document.getElementById(id));
    this.suppress = false;
  }
}



export { PolylineManager , AdvanceMarkerManager , DraggableAdvancedMarker , LayerManager , KMLParser, KMLViewer, TreeManager, LayerManager1};  