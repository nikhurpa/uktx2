// app.js
// General UI interactions, toolbars, modals, and AJAX calls

let currentTool = 'pan';

let mode = null, oldMode = null, statusEl, ctxMenu, selectedTarget, isMouseDown, isDragging = false, arrowMarker, isDrawing = false;
// let polylineSelected = false, markerSelected = false;
// let selectedPolyline, selectedMarker;
// let curpolyline, curmarker, prpolyline, prmarker;
// let lastPoint = null;
// let pathCoords = [];
// // let polyline, marker, bounds, infoWindow;
// // let polylines = [], markers = [];
// let polylineindex = 0;
// let nextmarkerindex, prmarkerindex, markerindex;
let tempTree;


document.addEventListener('DOMContentLoaded', () => {
    // setupToolbar();
    // setupModals();
    // setupUpload();
});

window.initMapEdit= function (){

    let treeSource = [
    { label: "My Places", expanded: true, checked: true, icon: "./img/earth.jpg", id: "myplaces", value: "main_folder" },
    { label: "Temporary Places", expanded: true, checked: true, icon: "./img/folder.png", id: "tempplaces", value: "temp_folder" },

  ];

  $("#jqxTree").jqxTree({ source: treeSource, width: "95%", height: "300px", checkboxes: true, allowDrag: true, allowDrop: true });
  $("#mode-ui").verticalToolbar({
    tools: [
      { id: "point", title: "Point", icon: "./img/point.svg" },
      { id: "route", title: "Route", html: '<i class="fas fa-route"></i>' },
      { id: "line", title: "Line", icon: "./img/polyline.svg" },
      { id: "polygon", title: "Polygon", icon: "./img/polygon.png" },
      { id: "scale", title: "Scale", html: '<i class="fas fa-ruler-horizontal"></i>' },
      { id: "select", title: "Select", icon: "./img/select.svg" },
      { id: "resize", title: "Resize", icon: "./img/resize.svg" },
      { id: "delete", title: "Delete", icon: "./img/delete.svg" },
      { id: "undo", title: "Undo", icon: "./img/undo.svg" },
      { id: "redo", title: "Redo", icon: "./img/redo.svg" },
      { id: "export", title: "Export", icon: "./img/download.svg" },
      { id: "upload", title: "Upload", icon: "./img/upload.svg" },
      { id: "maps", title: "Maps", html: '<i class="fas fa-globe"></i>', href: "#/map" },
      { id: "kml", title: "KML", html: '<i class="fas fa-map"></i>', href: "#/kml" },
    ],

    onSelect: function ({ id }) {
      if (toolActions[id]) {
        oldMode = mode;
        mode = id;
        statusEl.textContent = `Mode: ${mode}`;
        google.maps.event.clearInstanceListeners(map);
        // manager.disable();
        toolActions[id]();
      } else {
        console.warn("No action defined for:", id);
      }
    }
  });

  const toolActions = {
    point() {
      console.log("Point mode activated");
      editMarker.setMarker()
      // activatePointMode();
    },

    route() {
      console.log("Route mode activated");
      // polyManager.enableDraw()
      ultraPolyManager.enableDraw();

      // manager.enable();
      // editPolyline.setRoute()
    },

    line() {
      console.log("Line mode activated");
    },

    polygon() {
      console.log("Polygon mode activated");
    },

    scale() {
      console.log("Scale tool activated");
    },

    select() {
      console.log("Select mode activated");
      // clear previous mode
      if (oldMode == "Route") ultraPolyManager.clearDrawing();


    },

    resize() {
      console.log("Resize tool activated");
    },

    delete() {
      console.log("Delete all");
      if (mode == "point") editMarker.remove();
      if (mode == "route") ultraPolyManager.delete(1);
    },

    undo() {
      console.log("Undo last action");
      if (mode == "route") ultraPolyManager.undo();
    },

    redo() {
      console.log("Redo last action");
      if (mode == "route") ultraPolyManager.redo();
    },

    export() {
      console.log("Export data");
    },
    save() {
      console.log("Save data");
      if (mode == "route") ultraPolyManager.save("Route 1")
    },
    load() {
      console.log("Load data");
      if (mode == "route") ultraPolyManager.load(1)
    },
    upload() {
      console.log("Upload data");
      if (mode == "route") ultraPolyManager.save("Route 1")
    },
    maps() {
      console.log("maps");
      Router.go("uktx/map/#/maps");
    },
    kml() {
      console.log("Upload data");
      Router.go("uktx/map/#/kml");
    },

  };

//   document.getElementById("clearTemp").addEventListener("click", () => {

//     var items = $('#jqxTree').jqxTree('getItems');
//     console.log(items)
//   })


  ctxMenu = document.getElementById("contextMenu");


  //   const viewer = new KMLViewer(map);

  //   document.getElementById("kmlFile").addEventListener("change", e => {
  //   viewer.loadFile(e.target.files[0]);
  // });


//   document.addEventListener('keydown', e => {
//     if (e.key === 'n') ultraPolyManager.startCreate();
//     if (e.ctrlKey && e.key === 'z') ultraPolyManager.undo();
//     if (e.ctrlKey && e.key === 'y') ultraPolyManager.redo();
//     if (e.key === 'Delete' && ultraPolyManager.activePolyline)
//       ultraPolyManager.delete(ultraPolyManager.activePolyline);
//     if (e.key === 's' && ultraPolyManager.activePolyline)
//       ultraPolyManager.save(ultraPolyManager.activePolyline, 'Polyline');
//   });


}

/// new function 
// function setMode(newMode) {
//   $("#" + newMode).trigger("click");
// }



function setupToolbar() {
    const tools = ['pan', 'add-point', 'add-polyline', 'edit'];
    const infoText = document.getElementById('toolbar-info');

    tools.forEach(tool => {
        document.getElementById(`tool-${tool}`).addEventListener('click', (e) => {
            // Update UI
            document.querySelectorAll('.tool-btn:not(.action)').forEach(btn => btn.classList.remove('active'));
            e.currentTarget.classList.add('active');
            
            // Set state
            currentTool = tool;
            
            // Notify editor script
            if(window.editorToolChanged) {
                window.editorToolChanged(tool);
            }

            // Update info
            if(tool === 'pan') infoText.innerText = "Drag map to pan.";
            if(tool === 'add-point') infoText.innerText = "Click on map to add a point.";
            if(tool === 'add-polyline') infoText.innerText = "Left-click to add, drag to free-draw. Right-click to undo. Click existing line to extend.";
            if(tool === 'edit') infoText.innerText = "Click features to edit.";
        });
    });

    // Save and Export
    document.getElementById('tool-save').addEventListener('click', () => {
        if(window.editorGetCurrentFeature) {
            const feature = window.editorGetCurrentFeature();
            if(!feature) {
                alert("No active feature to save. Draw or select a feature first.");
                return;
            }
            openSaveModal();
        }
    });

    document.getElementById('tool-export').addEventListener('click', () => {
        exportMapToKml();
    });
}

function setupModals() {
    const modal = document.getElementById('save-modal');
    const closeBtn = document.querySelector('.close-modal');

    closeBtn.onclick = function() {
        modal.style.display = "none";
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    document.getElementById('save-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveFeature();
    });
}

function openSaveModal() {
    document.getElementById('save-modal').style.display = 'block';
    // Clear previous
    document.getElementById('feature-name').value = '';
    document.getElementById('feature-desc').value = '';
}

function saveFeature() {
    const name = document.getElementById('feature-name').value;
    const desc = document.getElementById('feature-desc').value;
    const dest = document.getElementById('save-destination').value;
    
    const feature = window.editorGetCurrentFeature();
    let geojson = null;
    if(feature) {
        geojson = feature.toGeoJSON();
        geojson.properties.name = name;
        geojson.properties.description = desc;
    }

    if(!geojson) return;

    fetch('php/api.php?action=save_feature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            destination: dest,
            feature: geojson
        })
    })
    .then(res => res.json())
    .then(data => {
        if(data.success) {
            alert('Saved successfully!');
            document.getElementById('save-modal').style.display = 'none';
            // Finalize feature in editor
            if(window.editorFinalizeFeature) window.editorFinalizeFeature(name);
        } else {
            alert('Error saving: ' + data.message);
        }
    })
    .catch(err => {
        console.error(err);
        alert('Server error while saving.');
    });
}

function setupUpload() {
    const uploadInput = document.getElementById('kml-upload');
    uploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if(!file) return;

        const formData = new FormData();
        formData.append('kml_file', file);

        fetch('php/upload_kml.php', {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            if(data.success) {
                // Pass KML text to parser
                if(window.parseKML) {
                    window.parseKML(data.kmlContent, file.name);
                }
            } else {
                alert('Upload failed: ' + data.message);
            }
        })
        .catch(err => console.error(err));
    });

    document.getElementById('btn-load-db').addEventListener('click', () => {
        loadFromDB();
    });
}

function loadFromDB() {
    fetch('php/api.php?action=load_db_features')
    .then(res => res.json())
    .then(data => {
        if(data.success) {
            if(window.loadGeoJSONFeatures) {
                window.loadGeoJSONFeatures(data.features, 'Database Features');
            }
        } else {
            alert('Error loading DB: ' + data.message);
        }
    });
}

function exportMapToKml() {
    if(!featureGroup || Object.keys(featureGroup._layers).length === 0) {
        alert("No features to export.");
        return;
    }
    
    const geojson = featureGroup.toGeoJSON();
    
    fetch('php/api.php?action=export_kml', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geojson: geojson })
    })
    .then(res => res.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "export.kml";
        document.body.appendChild(a);
        a.click();
        a.remove();
    });
}
