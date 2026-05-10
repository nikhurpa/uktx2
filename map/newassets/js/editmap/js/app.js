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

document.getElementById("kml-upload").addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('kml_file', file);
    
    fetch('./php/upload_kml.php', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.success && window.parseKML) {
            window.parseKML(data.kmlContent, file.name);
        } else {
            alert('Upload failed: ' + (data.message || 'Unknown error'));
        }
    })
    .catch(err => {
        console.error('Upload error:', err);
        alert('Upload failed: ' + err.message);
    });
});

document.addEventListener('DOMContentLoaded', () => {
    // initMapEdit();
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
        // google.maps.event.clearInstanceListeners(map);
        // manager.disable();
        toolActions[id]();
      } else {
        console.warn("No action defined for:", id);
      }
    }
  });

  `<input class="d-none" type="file" id="excelFile" accept=".xlsx, .xls, .csv"></input>`
  
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
      if (mode == "route") ultraPolyManager.load(1);
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

//  setupUpload();
}

/// new function 
// function setMode(newMode) {
//   $("#" + newMode).trigger("click");
// }



// function setupToolbar() {
//     const tools = ['pan', 'add-point', 'add-polyline', 'edit'];
//     const infoText = document.getElementById('toolbar-info');

//     tools.forEach(tool => {
//         document.getElementById(`tool-${tool}`).addEventListener('click', (e) => {
//             // Update UI
//             document.querySelectorAll('.tool-btn:not(.action)').forEach(btn => btn.classList.remove('active'));
//             e.currentTarget.classList.add('active');
            
//             // Set state
//             currentTool = tool;
            
//             // Notify editor script
//             if(window.editorToolChanged) {
//                 window.editorToolChanged(tool);
//             }

//             // Update info
//             if(tool === 'pan') infoText.innerText = "Drag map to pan.";
//             if(tool === 'add-point') infoText.innerText = "Click on map to add a point.";
//             if(tool === 'add-polyline') infoText.innerText = "Left-click to add, drag to free-draw. Right-click to undo. Click existing line to extend.";
//             if(tool === 'edit') infoText.innerText = "Click features to edit.";
//         });
//     });

//     // Save and Export
//     document.getElementById('tool-save').addEventListener('click', () => {
//         if(window.editorGetCurrentFeature) {
//             const feature = window.editorGetCurrentFeature();
//             if(!feature) {
//                 alert("No active feature to save. Draw or select a feature first.");
//                 return;
//             }
//             openSaveModal();
//         }
//     });

//     document.getElementById('tool-export').addEventListener('click', () => {
//         exportMapToKml();
//     });
// }

// function setupModals() {
//     const modal = document.getElementById('save-modal');
//     const closeBtn = document.querySelector('.close-modal');

//     closeBtn.onclick = function() {
//         modal.style.display = "none";
//     }

//     window.onclick = function(event) {
//         if (event.target == modal) {
//             modal.style.display = "none";
//         }
//     }

//     document.getElementById('save-form').addEventListener('submit', (e) => {
//         e.preventDefault();
//         saveFeature();
//     });
// }

// function openSaveModal() {
//     document.getElementById('save-modal').style.display = 'block';
//     // Clear previous
//     document.getElementById('feature-name').value = '';
//     document.getElementById('feature-desc').value = '';
// }

// function saveFeature() {
//     const name = document.getElementById('feature-name').value;
//     const desc = document.getElementById('feature-desc').value;
//     const dest = document.getElementById('save-destination').value;
    
//     const feature = window.editorGetCurrentFeature();
//     let geojson = null;
//     if(feature) {
//         geojson = feature.toGeoJSON();
//         geojson.properties.name = name;
//         geojson.properties.description = desc;
//     }

//     if(!geojson) return;

//     fetch('php/api.php?action=save_feature', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//             destination: dest,
//             feature: geojson
//         })
//     })
//     .then(res => res.json())
//     .then(data => {
//         if(data.success) {
//             alert('Saved successfully!');
//             document.getElementById('save-modal').style.display = 'none';
//             // Finalize feature in editor
//             if(window.editorFinalizeFeature) window.editorFinalizeFeature(name);
//         } else {
//             alert('Error saving: ' + data.message);
//         }
//     })
//     .catch(err => {
//         console.error(err);
//         alert('Server error while saving.');
//     });
// }

// function setupUpload() {
//     const uploadInput = document.getElementById('kml-upload');
//     uploadInput.addEventListener('change', (e) => {
//         const file = e.target.files[0];
//         if(!file) return;

//         const formData = new FormData();
//         formData.append('kml_file', file);

//         fetch('./newassets/js/editmap/php/upload_kml.php', {
//             method: 'POST',
//             body: formData
//         })
//         .then(res => res.json())
//         .then(data => {
//             if(data.success) {
//                 // Pass KML text to parser
//                 if(window.parseKML) {
//                     window.parseKML(data.kmlContent, file.name);
//                 }
//             } else {
//                 alert('Upload failed: ' + data.message);
//             }
//         })
//         .catch(err => console.error(err));
//     });

//     document.getElementById('btn-load-db').addEventListener('click', () => {
//         loadFromDB();
//     });
// }

// function loadFromDB() {
//     fetch('php/api.php?action=load_db_features')
//     .then(res => res.json())
//     .then(data => {
//         if(data.success) {
//             if(window.loadGeoJSONFeatures) {
//                 window.loadGeoJSONFeatures(data.features, 'Database Features');
//             }
//         } else {
//             alert('Error loading DB: ' + data.message);
//         }
//     });
// }

// function exportMapToKml() {
//     if(!featureGroup || Object.keys(featureGroup._layers).length === 0) {
//         alert("No features to export.");
//         return;
//     }
    
//     const geojson = featureGroup.toGeoJSON();
    
//     fetch('php/api.php?action=export_kml', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ geojson: geojson })
//     })
//     .then(res => res.blob())
//     .then(blob => {
//         const url = window.URL.createObjectURL(blob);
//         const a = document.createElement('a');
//         a.href = url;
//         a.download = "export.kml";
//         document.body.appendChild(a);
//         a.click();
//         a.remove();
//     });
// }
///////////////////////////////////////////////////////////////////


    const folderIcon = "./plugins/jqwidgets/images/folder.png";
    const documentIcon = "./img/doc.png";
    const kmlIcon = "./img/kml1.png";
    const featureLayers = {}; // id → google maps overlay
    let idCounter = 0;
    let suppressCheckChange = false; // avoid recursion when we programmatically check/uncheck children


    // Read KML (text) or KMZ (zip -> extract .kml)
    async function parseFile(file) {
      const name = file.name.toLowerCase();
      if (name.endsWith(".kml")) {
        const text = await file.text();
        return new DOMParser().parseFromString(text, "text/xml");
      } else if (name.endsWith(".kmz")) {
        const buffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(buffer);
        const kmlFileName = Object.keys(zip.files).find(n => n.toLowerCase().endsWith(".kml"));
        if (!kmlFileName) throw new Error("No KML found inside KMZ");
        const kmlText = await zip.files[kmlFileName].async("text");
        return new DOMParser().parseFromString(kmlText, "text/xml");
      } else {
        throw new Error("Unsupported file type");
      }
    }

    // Helper to read <name> or fallback to tag
    function nodeLabel(node) {
      const nameNode = node.getElementsByTagName("name")[0];
      return nameNode && nameNode.textContent ? nameNode.textContent : node.tagName;
    }

    // Read optional <Icon><href> in Placemark (simple approach)
    function getIconHrefFromPlacemark(placemarkNode) {
      const iconNode = placemarkNode.getElementsByTagName("Icon")[0];
      if (!iconNode) return null;
      const href = iconNode.getElementsByTagName("href")[0];
      return href ? href.textContent : null;
    }

    // Build overlays for a single Placemark node. ALWAYS return an array (possibly empty).
    function buildOverlaysFromPlacemark(node) {
      const overlays = [];
      const coordsNode = node.getElementsByTagName("coordinates")[0];
      if (!coordsNode) return overlays;

      // coordinates: lon,lat[,alt] whitespace-separated
      const coordsText = coordsNode.textContent.trim();
      const coordPairs = coordsText.split(/\s+/).map(s => s.trim()).filter(Boolean);
      const latLngs = coordPairs.map(c => {
        const parts = c.split(",").map(p => parseFloat(p));
        return { lat: parts[1], lng: parts[0] }; // [lon,lat] -> {lat, lng}
      });

      const descriptionNode = node.getElementsByTagName("description")[0];
      const description = descriptionNode ? descriptionNode.textContent : "";

      // Point
      if (node.getElementsByTagName("Point").length > 0) {
        const iconHref = getIconHrefFromPlacemark(node) || "./img/point_icon.png";
       
       //         const iconUrl = getIconFromPlacemark(node) || "./img/point_icon.png";
        const icon = {
          url: iconHref, // URL of your custom image
          scaledSize: new google.maps.Size(20, 20), // Desired width and height in pixels
          origin: new google.maps.Point(0, 0), // Origin point (usually 0,0)
          anchor: new google.maps.Point(10, 10) // Anchor point (e.g., center of the image)
         };

        const content = document.createElement("img")
        content.src = iconHref;
        content.style.width = "20px";
        content.style.height = "20px";

        const marker = new google.maps.marker.AdvancedMarkerElement({
        // const marker = new google.maps.Marker({
          position: latLngs[0],
          // icon: icon,
          content :content ,
          map: map
        });
        if (description) {
          marker.addListener("click", () => {
            infoWindow.setContent(description);
            infoWindow.open(map, marker);
          });
        }
        bounds.extend(latLngs[0]);
        overlays.push(marker);
      }

      // LineString
      if (node.getElementsByTagName("LineString").length > 0) {
        const polyline = new google.maps.Polyline({
          path: latLngs,
          strokeColor: "#0000FF",
          strokeWeight: 3,
          map: map
        });
        if (description) {
          polyline.addListener("click", (e) => {
            infoWindow.setContent(description);
            infoWindow.setPosition(e.latLng);
            infoWindow.open(map);
          });
        }
        latLngs.forEach(l => bounds.extend(l));
        overlays.push(polyline);
      }

      // Polygon (we take outer boundary as list of coords)
      if (node.getElementsByTagName("Polygon").length > 0) {
        const polygon = new google.maps.Polygon({
          paths: latLngs,
          strokeColor: "#FF0000",
          strokeWeight: 2,
          fillColor: "#FFCCCC",
          map: map
        });
        if (description) {
          polygon.addListener("click", (e) => {
            infoWindow.setContent(description);
            infoWindow.setPosition(e.latLng);
            infoWindow.open(map);
          });
        }
        latLngs.forEach(l => bounds.extend(l));
        overlays.push(polygon);
      }

      return overlays;
    }

    // Recursively build data for jqxTree and build overlays — ensure featureLayers[id] is always an ARRAY
    function buildTreeFromNode(node) {
      const label = nodeLabel(node);
      const id = "item" + (++idCounter);
      const item = { id, label, items: [] };

      if (node.tagName === "Folder" || node.tagName === "Document") {
        if (node.tagName === "Folder"){
        item.icon = folderIcon;
        item.value="folder";
        } else if (node.tagName === "Document") {
        item.icon = documentIcon;
        item.value="document"  
        } 

        // default folder checked true (so children visible)
        item.checked = true;
        // add Folder/Document children
        for (const child of node.children) {
          if (["Folder", "Document", "Placemark"].includes(child.tagName)) {
            item.items.push(buildTreeFromNode(child));
          }
        }
      } else if (node.tagName === "Placemark") {
        // decide icon by geometry type (just for tree visual)
        const geom = node.getElementsByTagName("Point")[0] ?? node.getElementsByTagName("LineString")[0] ?? node.getElementsByTagName("Polygon")[0];
        if (geom) {
          if (geom.tagName === "Point") {item.icon = "./img/point_icon.png"; item.value="point"}
          else if (geom.tagName === "LineString") {item.icon = "./img/polyline.svg"; item.value="polyline"}
          else if (geom.tagName === "Polygon") {item.icon = "./img/polygon.png"; item.value="polygon"}
        }

        // Build overlays (array)
        const overlays = buildOverlaysFromPlacemark(node);
        if (overlays.length) {
          featureLayers[id] = overlays; // always array
          item.checked = true; // mark checked by default so checkbox matches visible overlays
          item.overlay=overlays;
        }
      }
      return item;
    }

    function buildTreeDataFromKML(xmlDoc) {
      const docNode = xmlDoc.getElementsByTagName("Document")[0] || xmlDoc.getElementsByTagName("Folder")[0]  || xmlDoc.documentElement;
      return [ buildTreeFromNode(docNode) ];
    }

    // Show/hide overlays for a nodeId; also propagate to descendants and mirror checkbox states.
    function setVisibilityRecursively(nodeId, visible) {
      // 1) set overlays for this node (support array or single)
      const entry = featureLayers[nodeId];
      if (entry) {
        if (Array.isArray(entry)) {
          entry.forEach(ov => {
            if (typeof ov.setMap === "function") ov.setMap(visible ? map : null);
          });
        } else if (typeof entry.setMap === "function") {
          entry.setMap(visible ? map : null);
        }
      }

      // 2) find child <li> elements (jqxTree uses li elements with id = item.id) and apply recursively
      const parentLi = document.getElementById(nodeId);
      if (!parentLi) return;

      // Use DOM to find descendant li elements (children of this folder/item)
      const childLis = parentLi.querySelectorAll("li");
      if (childLis && childLis.length) {
        // prevent checkChange recursion while we programmatically check/uncheck child items
        suppressCheckChange = true;
        childLis.forEach(child => {
          const childId = child.id;
          if (!childId) return;
          // set overlay visibility for child
          const childEntry = featureLayers[childId];
          if (childEntry) {
            if (Array.isArray(childEntry)) childEntry.forEach(ov => ov.setMap(visible ? map : null));
            else if (typeof childEntry.setMap === "function") childEntry.setMap(visible ? map : null);
          }
          // programmatically set tree checkbox state to match visibility
          try {
            if (visible) $("#jqxTree").jqxTree("checkItem", document.getElementById(childId));
            else $("#jqxTree").jqxTree("uncheckItem", document.getElementById(childId));
          } catch(e) {
            // ignore if JQX method not available — overlays still toggled
          }
        });
        suppressCheckChange = false;
      }
    }

     // Build parent chain label like "File1 - Folder A - Point 1"
    function getParentChainLabelByItem(tree, item) {
      const labels = [];
      let current = item;
      while (current) {
        labels.unshift(current.label);
        current = tree.jqxTree('getParentItem', current.element);
      }
      return labels.join(" - ");
    }

    // Find first overlay for an item id (returns first overlay or null)
    function getFirstOverlay(itemId) {
      const e = featureLayers[itemId];
      if (!e) return null;
      return Array.isArray(e) ? e[0] : e;
    }

    // Export all items currently in jqxTree to JSON rows and POST to PHP
    async function exportTreeToServer() {
      if (!$('#jqxTree').data('jqxTree')) { alert("Tree is empty"); return; }
      const tree = $('#jqxTree');
      const allItems = tree.jqxTree('getItems'); // array of items at root level
      // get flat list of all items by walking the DOM <li> or by recursion
      const rows = [];
      // use a helper to visit every LI in the tree
      $('#jqxTree li').each(function(index, li) {
        const id = li.id;
        if (!id) return;
        const item = tree.jqxTree('getItem', li);
        if (!item) return;
        // build parent chain
        const parentPath = getParentChainLabelByItem(tree, item);
        const rootFile = parentPath.split(' - ')[0] || '';
        // coordinates & element_type
        let coords = '';
        let element_type = 'Folder';
        const overlays = featureLayers[id];
        if (overlays && overlays.length) {
          // inspect first overlay to decide type
          const first = overlays[0];
          if (first instanceof google.maps.Marker) {
            const p = first.getPosition();
            coords = `${p.lat()},${p.lng()}`;
            element_type = 'Point';
          } else if (first instanceof google.maps.Polyline) {
            coords = first.getPath().getArray().map(p => `${p.lat()},${p.lng()}`).join(' ');
            element_type = 'LineString';
          } else if (first instanceof google.maps.Polygon) {
            // polygon path (single ring) - join coords with space
            const paths = first.getPath ? first.getPath().getArray() : [];
            coords = paths.map(p => `${p.lat()},${p.lng()}`).join(' ');
            element_type = 'Polygon';
          }
        }

        // populate row fields
        rows.push({
          id: id,
          temp: '',
          file: rootFile,
          fileid: `file_${rootFile}`,
          parentfolder: parentPath,
          element_type: element_type,
          element_name: item.label,
          description: '', // we don't capture description into tree label here; extend if needed
          ikon: item.icon || '',
          style: '',
          coordinates: coords,
          open: (item.checked ? 'true' : 'false'),
          user_created: 'webuser',
          user_updated: 'webuser',
          creation_date_time: new Date().toISOString().slice(0,19).replace('T',' '),
          updation_date_time: new Date().toISOString().slice(0,19).replace('T',' '),
          element_sl: index + 1
        });
      });

      if (!rows.length) { alert("No elements to export"); return; }

      // POST to PHP
      try {
        const resp = await fetch('save_kml_elements.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rows)
        });
        const json = await resp.json();
        if (json.success) alert(`Inserted/updated ${json.inserted} rows`);
        else alert('Server error: ' + (json.error || 'unknown'));
      } catch (err) {
        console.error(err);
        alert('Network error: ' + err.message);
      }
    }

    // Clear tree and overlays
    function clearEverything() {
      // remove overlays
      for (const k of Object.keys(featureLayers)) {
        const arr = featureLayers[k];
        if (Array.isArray(arr)) arr.forEach(o => { if (o && typeof o.setMap === 'function') o.setMap(null); });
        else if (arr && typeof arr.setMap === 'function') arr.setMap(null);
        delete featureLayers[k];
      }
      try { $('#jqxTree').jqxTree('destroy'); } catch (_) {}
      $('#jqxTree').empty();
      idCounter = 0;
      bounds = new google.maps.LatLngBounds();
      // reset map view
      if (map) map.setCenter({ lat:20, lng:0 }), map.setZoom(2);
    }

    

// // Example usage
// $('#jqxTree').on('select', function (event) {
//     let element = event.args.element;
//     let chainStr = getParentChainLabel('#jqxTree', element);
//     console.log("Chain:", chainStr);
// });


function treeEdit(){
  // --- Context menu for tree ---
  const menuHtml = `
        <div id="treeMenu" style="display:none; position:absolute; background:#fff; border:1px solid #ccc; padding:5px;">
          <div class="hover-box" id="addFolder">➕ Add Folder</div>
          <div class="hover-box" id="renameItem">✏️ Rename</div>
          <div class="hover-box" id="deleteItem">🗑️ Delete</div>
          <hr>
          <div class="hover-box" id="changeMarkerIcon">📍 Change Marker Icon</div>
          <div class="hover-box" id="changePolylineColor">〰️ Change Line Color</div>
          <div class="hover-box" id="changePolygonColor">⬛ Change Polygon Color</div>
        </div>
      `;
      $("body").append(menuHtml);

      let contextTargetId = null;

      // Right-click opens menu
      $("#jqxTree").on("contextmenu", (e) => {
        const li = $(e.target).closest("li");
        if (!li.length) return true;
        contextTargetId = li.attr("id");
        $("#treeMenu").css({ top: e.pageY, left: e.pageX }).show();
        return false;
      });

      // Hide on click elsewhere
      $(document).on("click", () => $("#treeMenu").hide());

      // Menu actions
      $("#addFolder").on("click", () => {
        if (!contextTargetId) return;
        const newId = "item" + (++idCounter);
        const newNode = { id: newId, label: "New Folder", icon: folderIcon, items: [], checked: true };
        $("#jqxTree").jqxTree("addTo", newNode, $("#" + contextTargetId)[0]);
      });

      $("#renameItem").on("click", () => {
        if (!contextTargetId) return;
        const newName = prompt("Enter new name:");
        if (newName) {
          const item = $("#jqxTree").jqxTree("getItem", $("#" + contextTargetId)[0]);
          $("#jqxTree").jqxTree("updateItem", item, { label: newName });
        }
      });

      $("#deleteItem").on("click", () => {
        if (!contextTargetId) return;
        $("#jqxTree").jqxTree("removeItem", $("#" + contextTargetId)[0]);
        // TODO: also remove overlays from map
      });

      // --- Style changes ---
      function applyToDescendants(nodeId, fn) {
        const li = document.getElementById(nodeId);
        if (!li) return;
        const overlays = featureLayers[nodeId];
        if (overlays) {
          (Array.isArray(overlays) ? overlays : [overlays]).forEach(fn);
        }
        li.querySelectorAll("li").forEach(child => applyToDescendants(child.id, fn));
      }

      $("#changeMarkerIcon").on("click", () => {
        const url = prompt("Enter marker icon URL:");
        if (!url) return;
        applyToDescendants(contextTargetId, (ov) => {
          if (ov instanceof google.maps.Marker) ov.setIcon(url);
        });
      });

      $("#changePolylineColor").on("click", () => {
        const color = prompt("Enter line color (e.g. #ff0000):");
        if (!color) return;
        applyToDescendants(contextTargetId, (ov) => {
          if (ov instanceof google.maps.Polyline) ov.setOptions({ strokeColor: color });
        });
      });

      $("#changePolygonColor").on("click", () => {
        const color = prompt("Enter polygon fill color (e.g. #00ff00):");
        if (!color) return;
        applyToDescendants(contextTargetId, (ov) => {
          if (ov instanceof google.maps.Polygon) ov.setOptions({ fillColor: color });
        });
      }); 

     
    
}

// ================== LEAFLET KML HANDLING FUNCTIONS ==================

/**
 * Load from Database (Leaflet version)
 * Fetches GeoJSON features from database and adds them to the map
 */
function loadFromDB() {
    fetch('./php/api.php?action=load_db_features')
    .then(res => res.json())
    .then(data => {
        if (data.success && window.loadGeoJSONFeatures) {
            window.loadGeoJSONFeatures(data.features, 'Database Features');
        } else {
            alert('Error loading DB: ' + (data.message || 'Unknown error'));
        }
    })
    .catch(err => {
        console.error('DB Load error:', err);
        alert('Error loading database: ' + err.message);
    });
}

/**
 * Export Map to KML (Leaflet version)
 * Converts all featureGroup layers to GeoJSON and exports as KML
 */
function exportMapToKml() {
    if (!featureGroup || Object.keys(featureGroup._layers).length === 0) {
        alert("No features to export.");
        return;
    }
    
    const geojson = featureGroup.toGeoJSON();
    
    fetch('./php/api.php?action=export_kml', {
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
        window.URL.revokeObjectURL(url);
    })
    .catch(err => {
        console.error('Export error:', err);
        alert('Error exporting KML: ' + err.message);
    });
}

/**
 * Setup Toolbar for Leaflet
 * Handles tool selection and map interactions
 */
function setupToolbar() {
    const tools = ['pan', 'add-point', 'add-polyline', 'edit'];
    const infoText = document.getElementById('toolbar-info');

    tools.forEach(tool => {
        const btn = document.getElementById(`tool-${tool}`);
        if (!btn) return;
        
        btn.addEventListener('click', (e) => {
            // Update UI
            document.querySelectorAll('.tool-btn:not(.action)').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            
            // Set state
            currentTool = tool;
            
            // Update info text
            if(tool === 'pan') infoText.innerText = "Drag map to pan.";
            if(tool === 'add-point') infoText.innerText = "Click on map to add a point.";
            if(tool === 'add-polyline') infoText.innerText = "Click to start drawing polyline. Double-click to finish.";
            if(tool === 'edit') infoText.innerText = "Click features to edit.";
        });
    });

    // Save and Export
    const saveBtn = document.getElementById('tool-save');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            openSaveModal();
        });
    }

    const exportBtn = document.getElementById('tool-export');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            exportMapToKml();
        });
    }
}

/**
 * Setup Modals (Save Feature)
 */
function setupModals() {
    const modal = document.getElementById('save-modal');
    if (!modal) return;
    
    const closeBtn = document.querySelector('.close-modal');
    if (closeBtn) {
        closeBtn.onclick = function() {
            modal.style.display = "none";
        }
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    const form = document.getElementById('save-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            saveFeature();
        });
    }
}

/**
 * Open Save Modal
 */
function openSaveModal() {
    const modal = document.getElementById('save-modal');
    if (!modal) return;
    
    modal.style.display = 'block';
    document.getElementById('feature-name').value = '';
    document.getElementById('feature-desc').value = '';
}

/**
 * Save Feature to Database or KML (Leaflet version)
 */
function saveFeature() {
    const name = document.getElementById('feature-name').value;
    const desc = document.getElementById('feature-desc').value;
    const dest = document.getElementById('save-destination').value;
    
    // Get the most recently added layer
    let layer = null;
    for (let layerId in featureGroup._layers) {
        layer = featureGroup._layers[layerId];
    }
    
    if (!layer) {
        alert('No feature to save');
        return;
    }

    let geojson = layer.toGeoJSON();
    geojson.properties = geojson.properties || {};
    geojson.properties.name = name;
    geojson.properties.description = desc;

    fetch('./php/api.php?action=save_feature', {
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
        } else {
            alert('Error saving: ' + (data.message || 'Unknown error'));
        }
    })
    .catch(err => {
        console.error(err);
        alert('Server error while saving: ' + err.message);
    });
}