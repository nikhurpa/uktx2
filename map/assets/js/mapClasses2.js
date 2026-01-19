class PolylineManager {
  constructor(map) {
    this.map = map;
    this.editors = [];
    this.activeEditor = null;
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
