class PolylineManager {
    constructor(map){
        // this.map = new google.maps.Map(document.getElementById(mapElementId), {
        //     center: { lat: 0, lng: 0 },
        //     zoom: 3,
        //     mapTypeId: 'satellite'
        // });
        this.map=map;
        this.polylines = new Map(); // id => polyline
        this.activePolyline = null;

        this.isDrawing = false;
        this.drawPath = [];
        this.tempPolyline = null;

        this.undoStack = [];
        this.redoStack = [];

        this._bindMapEvents();
    }

    /* ================= CREATE ================= */
    startCreate() {
        this.clearSelection();
        this.isDrawing = true;
        this.drawPath = [];

        this.tempPolyline = new google.maps.Polyline({
            map: this.map,
            path: [],
            strokeColor: '#00ffff',
            strokeWeight: 2
        });
    }

    finishCreate() {
        if (this.drawPath.length < 2) return;

        this.tempPolyline.setMap(null);

        const polyline = this._createPolyline(this.drawPath);
        this.select(polyline);

        this.isDrawing = false;
        this.drawPath = [];
    }

    /* ================= SELECT ================= */
    select(polyline) {
        this.clearSelection();
        this.activePolyline = polyline;
        polyline.setEditable(true);
        polyline.setOptions({ strokeColor: '#00ff00' });
        this._snapshot();
    }

    clearSelection() {
        if (this.activePolyline) {
            this.activePolyline.setEditable(false);
            this.activePolyline.setOptions({ strokeColor: '#ff0000' });
        }
        this.activePolyline = null;
    }

    /* ================= DELETE ================= */
    delete(polyline) {
        polyline.setMap(null);
        this.polylines.delete(polyline.__id);
        if (this.activePolyline === polyline) this.activePolyline = null;
    }

    /* ================= UNDO / REDO ================= */
    undo() {
        if (!this.activePolyline || this.undoStack.length === 0) return;
        this.redoStack.push(this._getPath());
        this._setPath(this.undoStack.pop());
    }

    redo() {
        if (!this.activePolyline || this.redoStack.length === 0) return;
        this.undoStack.push(this._getPath());
        this._setPath(this.redoStack.pop());
    }

    _snapshot() {
        this.undoStack.push(this._getPath());
        this.redoStack = [];
    }

    _getPath() {
        return this.activePolyline.getPath().getArray().map(p => ({
            lat: p.lat(),
            lng: p.lng()
        }));
    }

    _setPath(path) {
        this.activePolyline.setPath(path);
    }

    /* ================= SAVE (INSERT / UPDATE) ================= */
    async save(polyline, name = '') {
        const payload = {
            id: polyline.__id || null,
            name,
            path: polyline.getPath().getArray().map(p => ({
                lat: p.lat(),
                lng: p.lng()
            }))
        };

        const res = await fetch('save_polyline.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        polyline.__id = data.id;
        this.polylines.set(data.id, polyline);
    }

    /* ================= LOAD ================= */
    async loadAll() {
        const res = await fetch('load_polylines.php');
        const data = await res.json();

        data.forEach(row => {
            const polyline = this._createPolyline(row.path, row.id);
            this.polylines.set(row.id, polyline);
        });
    }

    /* ================= INTERNAL ================= */
    _createPolyline(path, id = null) {
        const polyline = new google.maps.Polyline({
            map: this.map,
            path,
            editable: false,
            draggable: true,
            strokeColor: '#ff0000',
            strokeWeight: 2
        });

        polyline.__id = id;
        this._attachPolylineEvents(polyline);
        return polyline;
    }

    _bindMapEvents() {
        this.map.addListener('click', e => {
            if (this.isDrawing) {
                this.drawPath.push(e.latLng);
                this.tempPolyline.getPath().push(e.latLng);
            } else {
                this.clearSelection();
            }
        });

        this.map.addListener('dblclick', e => {
            if (this.isDrawing) {
                e.stop();
                this.finishCreate();
            }
        });
    }

    _attachPolylineEvents(polyline) {
        polyline.addListener('click', e => {
            e.stop();
            this.select(polyline);
        });

        polyline.getPath().addListener('insert_at', () => this._snapshot());
        polyline.getPath().addListener('set_at', () => this._snapshot());
        polyline.getPath().addListener('remove_at', () => this._snapshot());
        

        polyline.addListener('rightclick', e => {
            if (e.vertex !== undefined) {
                polyline.getPath().removeAt(e.vertex);
            } else if (confirm('Delete this polyline?')) {
                this.delete(polyline);
            }
        });
    }
}




class PolylineManager2 {
  constructor(map,activePolyline) {
    this.map = map;
    this.polylines=[];
    this.activePolyline=activePolyline;
    this.editors = [];
    this.activeEditor = null;
    this.enabled = false;  
  }

  enable() {
      this.enabled = true;  
      let mapoptions_startroute={draggableCursor: "crosshair",draggingCursor: "crosshair" };  
      this.map.setOptions(mapoptions_startroute);
      // if(!this.activeEditor) this.createEditor();
      if(!this.activePolyline) this.createPolyline();

      // this.map.addListener("mousedown", (e) => {this.mouseDownLines(e)});
        
      // // mouse move → only log if dragging
      // this.map.addListener("mousemove", (e) => {this.mouseMovePath(e)} );

      // // mouse up → stop drag mode
      // document.getElementById("map").addEventListener("mouseup", this.mouseUpRoute);

      // // right click on map to show context menu  
      // this.map.addListener("rightclick", (e) => {
      //   //showContextMenu(e.domEvent, mode);
      // });  
  }

  disable() {
  
      this.enabled = false;
      this.selectedPolyline = null;
      this.polylineSelected=false

  }

  createPolyline(path = [],metadata = {}) {
   
    // if (this.polyline) this.remove();
     let id = this.polylines.length+1
     metadata ={id:id,index:id-1,visible:true}
     let polyline = new google.maps.Polyline({
      map: this.map,
      path,
      strokeColor: "yellow",
      strokeWeight: 2,
      geodesic: true,
      metadata:metadata,
      vertexMarkers:[],
      undoMarkers:[],
      markerindex:0,  
      prmarkerindex:null,
      nextmarkerindex:null,
      curmarker:null, 
      parent:this 
    });

    //  this._attachPolylineEvents(polyline,this.setMode);
    //  this._addVertexMarkers(polyline);
     this.activePolyline=polyline;
     this.polylines.push(polyline)

  }

    removePolyline() {
      if (this.polyline) this.polyline.setMap(null);
      this.vertexMarkers.forEach(m => m.setMap(null));
     
      this.activePolyline = null;
    }


  createEditor() {
    const editor = new PolylineEditor(this.map);
    this.editors.push(editor);
    this.setActive(editor);
    return editor;
  }

  setActive(editor) {
    if (this.activeEditor) {
      this.activeEditor.disable();
    }
    this.activeEditor = editor;
    editor.enable();
  }

  removeEditor(editor) {
    editor.destroy();
    this.editors = this.editors.filter(e => e !== editor);
    if (this.activeEditor === editor) {
      this.activeEditor = null;
    }
  }

  async loadEditorFromDB(apiUrl, id) {
    const editor = new PolylineEditor(this.map);
    await editor.loadFromDB(apiUrl, id);
    this.editors.push(editor);
    this.setActive(editor);
    return editor;
  }

  exportAllKML() {
    return this.editors.map(e => e.exportKML()).join("\n");
  }


}


class PolylineEditor {
  constructor(map, id = null) {
    this.map = map;
    this.id = id; // DB id (null for new)
    this.path = new google.maps.MVCArray();
    this.polyline = new google.maps.Polyline({
      map: null,
      path: this.path,
      editable: true,
      strokeWeight: 4
    });

    this.enabled = false;
    this.mapClickListener = null;
    this.mapMoveListener = null;
    this.undoStack = [];
    this.redoStack = [];
  }

    enable() {
    if (this.enabled) return;
    this.enabled = true;
    this.polyline.setMap(this.map);

    this.isDrawing = false;

    this.downListener = this.map.addListener("mousedown", (e) => {
        this.isDrawing = true;
        this.path.push(e.latLng);
    });

    this.moveListener = this.map.addListener("mousemove", (e) => {
        if (this.isDrawing) {
        this.path.push(e.latLng);
        }
    });

    this.upListener = this.map.addListener("mouseup", () => {
        this.isDrawing = false;
    });
    }


    enableSelectMode() {
  this.polyline.addListener("click", () => {
    this.manager.setActive(this);
  });
}


    addVertexHandles() {
  this.handles = [];

  this.path.forEach((latLng, index) => {
    const marker = new google.maps.Marker({
      position: latLng,
      map: this.map,
      draggable: true,
      icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
    });

    marker.addListener("drag", (e) => {
      this.path.setAt(index, e.latLng);
    });

    this.handles.push(marker);
  });
}

clearHandles() {
  this.handles.forEach(m => m.setMap(null));
  this.handles = [];
}

saveState() {
  this.undoStack.push(this.getCoordinates());
  this.redoStack = [];
}

undo() {
  if (!this.undoStack.length) return;
  this.redoStack.push(this.getCoordinates());
  const prev = this.undoStack.pop();
  this.loadFromCoords(prev);
}

redo() {
  if (!this.redoStack.length) return;
  this.undoStack.push(this.getCoordinates());
  const next = this.redoStack.pop();
  this.loadFromCoords(next);
}

loadFromCoords(coords) {
  this.clear();
  coords.forEach(c =>
    this.path.push(new google.maps.LatLng(c.lat, c.lng))
  );
}

exportKML() {
    const coords = this.getCoordinates()
        .map(p => `${p.lng},${p.lat},0`)
        .join(" ");

    return `
    <kml><Document>
    <Placemark><LineString>
    <coordinates>${coords}</coordinates>
    </LineString></Placemark>
    </Document></kml>`;
}

disable() {
  this.enabled = false;
  google.maps.event.removeListener(this.downListener);
  google.maps.event.removeListener(this.moveListener);
  google.maps.event.removeListener(this.upListener);
}

  attachEvents() {
    // Click to add point
    this.map.addListener("click", (e) => {
      this.path.push(e.latLng);
    });

    // Right-click to remove last point
    this.map.addListener("rightclick", () => {
      this.path.pop();
    });

    // Polyline mouseover
    this.polyline.addListener("mouseover", () => {
      this.polyline.setOptions({ strokeWeight: 6 });
    });

    this.polyline.addListener("mouseout", () => {
      this.polyline.setOptions({ strokeWeight: 3 });
    });
  }


  disable() {
    if (!this.enabled) return;
    this.enabled = false;

    google.maps.event.removeListener(this.mapClickListener);
    google.maps.event.removeListener(this.mapMoveListener);

    this.mapClickListener = null;
    this.mapMoveListener = null;
  }

  clear() {
    this.path.clear();
  }

  getCoordinates() {
    return this.path.getArray().map(p => ({
      lat: p.lat(),
      lng: p.lng()
    }));
  }

  async saveToDB(apiUrl) {
    const payload = {
      id: this.id,
      coordinates: this.getCoordinates()
    };

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    this.id = data.id; // save returned id
    return data;
  }

  async loadFromDB(apiUrl, id) {
    const res = await fetch(`${apiUrl}?id=${id}`);
    const data = await res.json();

    this.id = data.id;
    this.clear();

    data.coordinates.forEach(pt => {
      this.path.push(new google.maps.LatLng(pt.lat, pt.lng));
    });

    this.polyline.setMap(this.map);
  }

//   destroy() {
//     this.disable();
//     this.polyline.setMap(null);
//   }



  attachMapEvents() {
    // Map click event for THIS object
    this.mapClickListener = this.map.addListener("click", (e) => {
      this.onMapClick(e);
    });

    // Mouse move for preview drawing
    this.mapMoveListener = this.map.addListener("mousemove", (e) => {
      this.onMouseMove(e);
    });
  }

  onMapClick(e) {
    this.path.push(e.latLng);
    console.log("Point added to this polyline object");
  }

  onMouseMove(e) {
    // live preview logic
  }

  destroy() {
    // Clean up events for THIS object only
    google.maps.event.removeListener(this.mapClickListener);
    google.maps.event.removeListener(this.mapMoveListener);
    this.disable();
    this.polyline.setMap(null);
  }
}


export { PolylineManager , PolylineEditor} 