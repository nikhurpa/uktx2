// loadkml_leaflet.js
// Converted from Google Maps API → Leaflet API
// Requires: Leaflet.js, jQuery, jqxTree, JSZip

let currentTool = 'pan';
let mode = null, oldMode = null, statusEl, ctxMenu, selectedTarget, isMouseDown, isDragging = false, arrowMarker, isDrawing = false;
let tempTree;

// ─── Global Leaflet state ────────────────────────────────────────────────────
// `map` and `featureGroup` must be initialised in your map bootstrap file, e.g.:
//   const map = L.map('map').setView([20, 0], 2);
//   const featureGroup = L.featureGroup().addTo(map);
// They are referenced here via `window.map` / `window.featureGroup`.

const folderIcon   = "./plugins/jqwidgets/images/folder.png";
const documentIcon = "./img/doc.png";
const kmlIcon      = "./img/kml1.png";

const featureLayers   = {};   // itemId → Leaflet layer (or array of layers)
let   idCounter       = 0;
let   suppressCheckChange = false;

// Leaflet popup reused across all features (equivalent to Google's InfoWindow)
let   leafletPopup = L.popup();

// Equivalent of google.maps.LatLngBounds – we accumulate points then fitBounds
let   boundsLatLngs = [];      // array of [lat, lng] pairs collected during KML parse
let kmlLayer = null;
let kmlLayers = {};
let kmlLabelMarkers={};
let labelMarkers = [];

let mapElements={element:null,id:null,type:null,metadata:null,node:null };
let elementIdcounter=0;

// ─── Map / Toolbar Init ──────────────────────────────────────────────────────

let treeSource = [
    { label: "My Places",        expanded: true, checked: true, icon: "./img/earth.jpg",  id: "myplaces",   value: "main_folder" },
    { label: "Temporary Places", expanded: true, checked: true, icon: "./img/folder.png", id: "tempplaces", value: "temp_folder" },
    { label: "Loaded Layers", expanded: true, checked: true, icon: "./img/kml1.png", id: "kmllayers", value: "kml_layers" },
];
window.initMapEdit = function () {

    // setupModals();
    // setupUpload();
    if (window.initDbUploadTreeMenu) window.initDbUploadTreeMenu();

    $("#jqxTree").jqxTree({ source: treeSource, width: "95%", height: "300px", checkboxes: true, allowDrag: true, allowDrop: true });

    $("#mode-ui").verticalToolbar({
        tools: [
            { id: "tool-point",   title: "Point",   icon: "./img/point.svg" },
            { id: "tool-direction",   title: "Direction",   html: '<i class="fas fa-route"></i>' },
            { id: "tool-route",    title: "Polyline",    icon: "./img/polyline.svg" },
            { id: "tool-polygon", title: "Polygon", icon: "./img/polygon.png" },
            { id: "tool-scale",   title: "Scale",   html: '<i class="fas fa-ruler-horizontal"></i>' },
            { id: "tool-pan",  title: "Pan",  icon: "./img/select.svg" },
            { id: "tool-edit",  title: "Edit",   html: '<i class="fa-solid fa-pen-to-square"></i>' },  //icon: "./img/resize.svg",
            { id: "tool-delete",  title: "Delete",  icon: "./img/delete.svg" },
            { id: "tool-undo",    title: "Undo",    icon: "./img/undo.svg" },
            { id: "tool-save",  title: "Save",   html: '<i class="fa-solid fa-save"></i>' },  //icon: "./img/resize.svg",
            { id: "tool-export",  title: "Export",  icon: "./img/download.svg" },
            { id: "tool-maps",    title: "Maps",    html: '<i class="fas fa-globe"></i>' },
            { id: "tool-upload",  title: "Upload KML layer",  icon: "./img/upload.svg" },
            { id: "tool-kml",     title: "Load KML",     html: '<i class="fas fa-map" ></i>' },
        ],
        onSelect: function ({ id }) {
            if (toolActions[id.replace(/^tool-/, "")]) {
                oldMode = mode;
                mode    = id.replace(/^tool-/, "");;
                // statusEl.textContent = `Mode: ${mode}`;
                toolActions[id.replace(/^tool-/, "")]();
            } else {
                console.warn("No action defined for:", id);
            }
        }
    });

    const toolActions = {
        point()   { console.log("Point mode activated");   currentTool ='add-point' ; window.editorToolChanged(currentTool)},
        route()   { console.log("Route mode activated");   currentTool ='add-polyline';  ; window.editorToolChanged(currentTool)},
        direction()    { console.log("Direction mode activated"); currentTool ='add-direction';  ; window.editorToolChanged(currentTool)},
        polygon() { console.log("Polygon mode activated"); currentTool ='add-polygon';  ; window.editorToolChanged(currentTool)},
        scale()   { console.log("Scale tool activated"); currentTool ='add-scale';  ; window.editorToolChanged(currentTool)},
        pan()  { console.log("Pan tool activated"); currentTool ='pan';  ; window.editorToolChanged(currentTool)},
        edit()  { console.log("Edit tool activated"); currentTool ='edit';  ; window.editorToolChanged(currentTool)},
        delete()  {
            console.log("Delete all");
            if (mode === "point") editMarker.remove();
            if (mode === "route") ultraPolyManager.delete(1);
        },
        undo()    { console.log("Undo");   },
        redo()    { console.log("Redo");   },
        export()  { console.log("Export data");  exportMapToKm();},
        save()    { console.log("Save data"); openSaveModal(); },
        load()    { console.log("Load data");   },
        upload()  { document.getElementById('kml-layer').click(); },
        maps()    { console.log("maps");  Router.go("uktx/map/#/maps"); },
        kml()     { document.getElementById('kml-upload').click(); },
    };

    ctxMenu = document.getElementById("contextMenu");

    kml_upload.loadKml();

};

document.getElementById('kml-layer').addEventListener('change', async function (e) {

    const file = e.target.files[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();

    labelMarkers = [];

    try {

        let kmlText = '';

        // ─────────────────────────────────────────────────────────────
        // KMZ FILE
        // ─────────────────────────────────────────────────────────────
        if (fileName.endsWith('.kmz')) {

            const arrayBuffer = await file.arrayBuffer();
            const zip = await JSZip.loadAsync(arrayBuffer);

            // Find first .kml file
            const kmlFileName = Object.keys(zip.files).find(name =>
                name.toLowerCase().endsWith('.kml')
            );

            if (!kmlFileName) {
                alert('No KML file found inside the KMZ.');
                return;
            }

            kmlText = await zip.files[kmlFileName].async('text');

        // ─────────────────────────────────────────────────────────────
        // KML FILE
        // ─────────────────────────────────────────────────────────────
        } else if (fileName.endsWith('.kml')) {

            kmlText = await file.text();

        } else {

            alert('Unsupported file type. Please upload a .kml or .kmz file.');
            return;
        }

        // ─────────────────────────────────────────────────────────────
        // FIX INVALID xsi NAMESPACE
        // Some KMZ/KML exports contain:
        // xsi:schemaLocation
        // but forget:
        // xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        // ─────────────────────────────────────────────────────────────
        if (
            kmlText.includes('xsi:schemaLocation') &&
            !kmlText.includes('xmlns:xsi=')
        ) {

            kmlText = kmlText.replace(
                /<kml([^>]*)>/i,
                '<kml$1 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
            );
        }

        // ─────────────────────────────────────────────────────────────
        // PARSE XML
        // ─────────────────────────────────────────────────────────────
        const kmlDom = new DOMParser().parseFromString(kmlText, 'text/xml');

        // ─────────────────────────────────────────────────────────────
        // CHECK XML ERRORS
        // ─────────────────────────────────────────────────────────────
        const parseError = kmlDom.querySelector('parsererror');

        if (parseError) {
            console.error('XML parse error:', parseError.textContent);
            alert('Failed to parse KML/KMZ file. File may be corrupted.');
            return;
        }

        // ─────────────────────────────────────────────────────────────
        // CONVERT KML → GEOJSON
        // ─────────────────────────────────────────────────────────────
        const geojson = toGeoJSON.kml(kmlDom);

        console.log('Features loaded:', geojson.features.length);

        if (!geojson.features.length) {
            alert('No features found in the KML file.');
            return;
        }

        // ─────────────────────────────────────────────────────────────
        // CREATE LEAFLET LAYER
        // ─────────────────────────────────────────────────────────────
        kmlLayer = L.geoJSON(geojson, {

            style: function (feature) {

                const p = feature.properties || {};

                return {
                    color: p.stroke || '#3388ff',
                    weight: p['stroke-width'] || 3,
                    opacity: p['stroke-opacity'] || 1,
                    fillColor: p.fill || '#3388ff',
                    fillOpacity: p['fill-opacity'] || 0.2,
                };
            },

            
            pointToLayer: function (feature, latlng) {

                const p = feature.properties || {};
                const iconUrl = p.icon || null;
                const name = p.name || '';

                // Add label marker
                if (name) {
                    const label = createLabelMarker(latlng, name);
                    labelMarkers.push(label);
                }

                // Default Leaflet icon
                const defaultIcon = L.icon({
                    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                    iconSize: [16, 26],
                    iconAnchor: [8, 26],
                    popupAnchor: [1, -20],
                    shadowSize: [26, 26]
                });

                // If no icon in KML
                if (!iconUrl) {
                    return L.marker(latlng, {
                        icon: defaultIcon
                    });
                }

                // Create custom icon
                const customIcon = L.icon({
                    iconUrl: iconUrl,
                    iconSize: [14, 14],      // smaller size
                    iconAnchor: [7, 7],      // half of size
                    popupAnchor: [0, -7]
                });

                const marker = L.marker(latlng, {
                    icon: customIcon
                });

                // Fallback if icon fails to load
                const testImg = new Image();

                testImg.onload = function () {
                    // icon exists → do nothing
                };

                testImg.onerror = function () {

                    console.warn('Icon not found:', iconUrl);

                    marker.setIcon(defaultIcon);
                };

                testImg.src = iconUrl;

                return marker;
            },
            onEachFeature: function (feature, layer) {

                const p = feature.properties || {};
                const name = p.name || '';

                // Labels for polygons/lines
                if (feature.geometry.type !== 'Point' && name) {

                    let latlng;

                    if (layer.getBounds) {
                        latlng = layer.getBounds().getCenter();
                    }

                    if (latlng) {
                        const label = createLabelMarker(latlng, name);
                        labelMarkers.push(label);
                    }
                }

                // Popup
                const skipKeys = [
                    'name', 'description', 'styleUrl',
                    'stroke', 'stroke-width', 'stroke-opacity',
                    'fill', 'fill-opacity', 'icon',
                    'icon-opacity', 'icon-color', 'icon-scale',
                    'marker-color', 'marker-size', 'marker-symbol',
                ];

                let content = '';

                if (name) {
                    content += `<strong style="font-size:14px;">${name}</strong><hr>`;
                }

                if (p.description) {

                    const desc = typeof p.description === 'object'
                        ? (p.description.value || '')
                        : p.description;

                    if (desc) {
                        content += `<div style="margin-bottom:6px;">${desc}</div>`;
                    }
                }

                const dataEntries = Object.entries(p).filter(([key, val]) =>
                    !skipKeys.includes(key) &&
                    val !== null &&
                    val !== undefined &&
                    val !== ''
                );

                if (dataEntries.length) {

                    content += `
                        <table style="width:100%;font-size:12px;border-collapse:collapse;">
                            ${dataEntries.map(([key, val]) => `
                                <tr style="border-bottom:1px solid #eee;">
                                    <td style="padding:3px 6px;font-weight:bold;white-space:nowrap;color:#555;">
                                        ${key}
                                    </td>
                                    <td style="padding:3px 6px;">
                                        ${val}
                                    </td>
                                </tr>
                            `).join('')}
                        </table>
                    `;
                }

                if (!content) {
                    content = '<em>No information available</em>';
                }

                layer.bindPopup(content, {
                    maxWidth: 320,
                    maxHeight: 250
                });

                // Feature selection
                layer.on('click', (e) => {

                    try {

                        L.DomEvent.stopPropagation(e);

                        if (window.selectFeature) {
                            window.selectFeature(layer, e.latlng);
                        }

                        currentTool = 'edit';

                        if (window.editorToolChanged) {
                            window.editorToolChanged('edit');
                        }

                    } catch (err) {

                        console.warn('Select feature failed', err);
                    }
                });
            }

        }).addTo(map);

        // ─────────────────────────────────────────────────────────────
        // LABELS + LAYER TREE
        // ─────────────────────────────────────────────────────────────
        updateLabels(12);

        addLayerToTree(fileName, kmlLayer, labelMarkers);

        // ─────────────────────────────────────────────────────────────
        // FIT MAP TO FEATURES
        // ─────────────────────────────────────────────────────────────
        const bounds = kmlLayer.getBounds();

        if (bounds.isValid()) {
            map.fitBounds(bounds, {
                padding: [20, 20]
            });
        }

    } catch (err) {

        console.error('KML/KMZ load error:', err);

        alert('Error loading file: ' + err.message);
    }
});


function addLayerToTree(fileName,layer,label){

        const kmlFileNodeId = "kml" + (++idCounter);

          kmlLayers[kmlFileNodeId] = {
            layer: layer,
            label: label
        };
        // kmlLayers[kmlFileNodeId].layer =layer;
        // kmlLayers[kmlFileNodeId].labelMarkers = label;
        
        const kmlFileNode = {
            id: kmlFileNodeId,
            label: fileName,
            icon: kmlIcon,
            checked: true,
            // items: source,
            value:"kml_" + fileName
        };

        // {label: "Temporary Places"}
        let elementByID = $('#jqxTree').find("#kmllayers")[0];
        $("#jqxTree").jqxTree("addTo",  kmlFileNode,  elementByID);
        $("#jqxTree").on("checkChange", (event) => {
            if (suppressCheckChange) return;
            const element = event.args.element;
            const id = $(element).attr("id");
            const checked = event.args.checked;
           
            if (id) setVisibilityRecursively(id, checked);
           
        });

    

}

// ── Remove layer helper ─────────────────────────────────────────────────────
function removeKmlLayer(kmlId) {
    let layer = kmlLayers[kmlId].layer;
    let label =kmlLayers[kmlId].label;
  if (layer) {
    map.removeLayer(layer);
    kmlLayers[kmlId].layer=null;
  }

  // Remove all label markers
  label.forEach(m => {
    if (map.hasLayer(m)) map.removeLayer(m);
  });
  kmlLayers[kmlId].label = [];
}

// ── Helper: create a label marker at a position ───────────────────────────────
function createLabelMarker(latlng, name) {
  return L.marker(latlng, {
    icon: L.divIcon({
      className: 'kml-label',
      html: `<span>${name}</span>`,
      iconAnchor: [0, 0],
    }),
    interactive: false,   // don't intercept clicks
    zIndexOffset: -1000,  // keep below regular markers
  });
}

// ── Show or hide labels based on current zoom ─────────────────────────────────
function updateLabels(showAtZoom = 12) {
  const currentZoom = map.getZoom();

  if (currentZoom >= showAtZoom) {
    // Add labels if not already added
    if (labelMarkers.length > 0 && !map.hasLayer(labelMarkers[0])) {
      labelMarkers.forEach(m => m.addTo(map));
    }
  } else {
    // Remove labels when zoomed out
    labelMarkers.forEach(m => {
      if (map.hasLayer(m)) map.removeLayer(m);
    });
  }
}


// ─── KML File Upload ─────────────────────────────────────────────────────────

let kml_upload = {
  loadKml:function() {

    $("#kml-upload").on("change", async (e) => {
          const file = e.target.files[0];
        if (!file) return;

        try {
          const xmlDoc = await parseFile(file);
          console.log("KML file parsed successfully:", xmlDoc);
          const styleMap = extractStyles(xmlDoc);
          console.log("Styles extracted from KML:", styleMap);
          const source = buildTreeDataFromKML(xmlDoc, styleMap);
          
          console.log("Tree data built from KML:", source);   
              // Wrap inside a root node named after the file
            const fileNodeId = "file" + (++idCounter);
            const fileNode = {
              id: fileNodeId,
              label: file.name,
              icon: kmlIcon,
              checked: true,
              items: source,
              value:"file_" + file.name
            };

            // {label: "Temporary Places"}
            let elementByID = $('#jqxTree').find("#tempplaces")[0];
            $("#jqxTree").jqxTree("addTo", fileNode,  elementByID);

            // wire up events once
            $("#jqxTree").on("checkChange", (event) => {
              if (suppressCheckChange) return;
              const element = event.args.element;
              const id = $(element).attr("id");
              const checked = event.args.checked;
              if (id) setVisibilityRecursively(id, checked);
            });

            // listen for dragEnd
            $("#jqxTree").on("dragEnd", function (event) {
              const item = event.args.item;
              const dropItem = event.args.dropItem;
              console.log("Dragged", item, "→ dropped into", dropItem ? dropItem.label : "root");
            });

            // $("#jqxTree").on("itemClick", (event) => {
            //   const element = event.args.element;
            //   const id = $(element).attr("id");
            //   if (!id) return;
            //   const entry = featureLayers[id];
            //   if (!entry) return;
            //   const first = Array.isArray(entry) ? entry[0] : entry;
            //   if (first instanceof google.maps.Marker) {
            //     map.panTo(first.getPosition());
            //     map.setZoom(Math.max(map.getZoom(), 10));
            //   } else {
            //     const shapeBounds = new google.maps.LatLngBounds();
            //     if (first.getPath) first.getPath().forEach(p => shapeBounds.extend(p));
            //     if (first.getPaths) first.getPaths().forEach(path => path.forEach(p => shapeBounds.extend(p)));
            //     if (!shapeBounds.isEmpty()) map.fitBounds(shapeBounds);
            //   }
            // });

         
            if (boundsLatLngs.length > 0 && window.map) {
            window.map.fitBounds(L.latLngBounds(boundsLatLngs));
             }

                // Upload kml data to database
                // this.uploadKml("file103")
                // console.log("done")
            


                    } catch (err) {
                    alert("Error parsing file: " + err.message);
                    console.error(err);
                    }
                });
   
        
     treeEdit()
     
  

    
    
    
  },
  uploadKml:function(id){
    let items = $('#jqxTree').jqxTree('getItems');
    const fileToMatch = ["blocks.kml"];

    const fileNode = this.createSql(items,id)

    console.log(fileNode);

  }   ,
  getDescendants: function (items, parentId) {
    const descendants = [];

    function collectChildren(parentId) {
        items.forEach(item => {
            if (item.parentId === parentId) {
                descendants.push(item);
                collectChildren(item.id); // recurse for deeper children
            }
        });
    }

    collectChildren(parentId);
    return descendants;
  },
  getParentChain: function (items,parentId) {
     const parent = [];
    
    // let items = $('#jqxTree').jqxTree('getItems');
    function collectionParent(parentId){
      items.forEach(item => {
            if (item.id === parentId) {
                parent.push(item.parentId);
                
                collectionParent(item.parentId);
                 // recurse for deeper children
            }
        });
    }
    collectionParent(parentId);
    return parent ;

  },
  createSql: function(items,parentId){
    let desc = this.getDescendants(items,parentId);
    let map_elements=["point","polyline","polygon"];
    let rows=[];
    const mapItems = desc.filter(item => map_elements.includes(item.value));
    console.log(mapItems)
    mapItems.forEach(item => {
            item.parentChain= JSON.stringify(this.getParentChain(items,item.parentId))
// // populate row fields
//           rows.push({
//             id: item.id,
//             temp: '',
//             file: rootFile,
//             fileid: `file_${rootFile}`,
//             parentfolder: item.parentChain,
//             element_type: item.value,
//             element_name: item.label,
//             description: '', // we don't capture description into tree label here; extend if needed
//             ikon: item.icon || '',
//             style: '',
//             coordinates: coords,
//             open: (item.checked ? 'true' : 'false'),
//             user_created: 'webuser',
//             user_updated: 'webuser',
//             creation_date_time: new Date().toISOString().slice(0,19).replace('T',' '),
//             updation_date_time: new Date().toISOString().slice(0,19).replace('T',' '),
//             element_sl: index + 1
//           });

        });
    
   console.log(mapItems) 
   
   



  },

}



async function parseFile(file) {
    const name = file.name.toLowerCase();

    let kmlText;

    if (name.endsWith(".kml")) {
        kmlText = await file.text();

    } else if (name.endsWith(".kmz")) {
        const buffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(buffer);

        // Find first KML file
        const kmlFileName = Object.keys(zip.files)
            .find(n => n.toLowerCase().endsWith(".kml"));

        if (!kmlFileName) {
            throw new Error("No KML found inside KMZ");
        }

        kmlText = await zip.files[kmlFileName].async("text");

    } else {
        throw new Error("Unsupported file type");
    }

    // Fix missing xsi namespace
    if (
        kmlText.includes("xsi:schemaLocation") &&
        !kmlText.includes('xmlns:xsi=')
    ) {
        kmlText = kmlText.replace(
            /<kml([^>]*)>/i,
            '<kml$1 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
        );
    }

    const xml = new DOMParser().parseFromString(kmlText, "text/xml");

    // Detect actual parse errors
    const parserError = xml.querySelector("parsererror");

    if (parserError) {
        console.error(parserError.textContent);
        throw new Error("Invalid XML/KML");
    }

    return xml;
}


/** Return the <name> text of a KML node, or fall back to tag name. */
function nodeLabel(node) {
    const nameNode = node.getElementsByTagName("name")[0];
    return nameNode && nameNode.textContent ? nameNode.textContent : node.tagName;
}

/** Return the icon href from a Placemark's <Icon><href>, or null. */
function getIconHrefFromPlacemark(placemarkNode) {
    const iconNode = placemarkNode.getElementsByTagName("Icon")[0];
    if (!iconNode) return null;
    const href = iconNode.getElementsByTagName("href")[0];
    return href ? href.textContent : null;
}


// ─── Build Leaflet Layers from a <Placemark> node ────────────────────────────

/**
 * Replaces buildOverlaysFromPlacemark().
 * Returns an array of Leaflet layers (Marker / Polyline / Polygon).
 *
 * GOOGLE → LEAFLET mapping
 *   google.maps.marker.AdvancedMarkerElement  →  L.marker  with L.icon
 *   google.maps.Polyline                      →  L.polyline
 *   google.maps.Polygon                       →  L.polygon
 *   marker.addListener("click", …)            →  layer.on("click", …)
 *   infoWindow.open(map, marker)              →  L.popup bound to layer
 *   bounds.extend(latLng)                     →  boundsLatLngs.push([lat, lng])
 *   ov.setMap(map) / ov.setMap(null)          →  layer.addTo(map) / map.removeLayer(layer)
 */
function buildOverlaysFromPlacemark(node,style) {
    const layers = [];
   
    const coordsNode = node.getElementsByTagName("coordinates")[0];
    const nameNode =  node.getElementsByTagName("name")[0];

    const name = nameNode ? nameNode.textContent.trim() : "";
    
    if (!coordsNode) return layers;

    // KML coordinates are  lon,lat[,alt]  whitespace-separated
    const coordsText = coordsNode.textContent.trim();
    const coordPairs = coordsText.split(/\s+/).map(s => s.trim()).filter(Boolean);

    // Convert to Leaflet [lat, lng] pairs
    const latLngs = coordPairs.map(c => {
        const parts = c.split(",").map(parseFloat);
        return [parts[1], parts[0]]; // Leaflet uses [lat, lng]
    });

    const descNode   = node.getElementsByTagName("description")[0];
    const description = descNode ? descNode.textContent : "";
    const map         = window.map; // reference to global Leaflet map

    // ── Point ──────────────────────────────────────────────────────────────
    if (node.getElementsByTagName("Point").length > 0) {
        const iconHref = getIconHrefFromPlacemark(node) || "./img/point_icon.png";

        // L.icon replaces google.maps.Icon / AdvancedMarkerElement content
        const leafletIcon = L.icon({
            iconUrl:     iconHref,
            iconSize:    [20, 20],   // scaledSize
            iconAnchor:  [10, 10],   // anchor (centre of image)
            popupAnchor: [0, -10],
        });

        const marker = L.marker(latLngs[0], { icon: leafletIcon }).addTo(map);
        // Add label marker
            if (name) {
                const label = createLabelMarker(latLngs[0], name).addTo(map);
                layers.push(label);
            }

        if (description) {
            marker.on("click", () => {
                // Equivalent of infoWindow.setContent(…).open(map, marker)
                marker.bindPopup(description).openPopup();
            });
        }

        // Collect for fitBounds (replaces bounds.extend)
        boundsLatLngs.push(latLngs[0]);
        layers.push(marker);
        if (window.attachContextMenu) window.attachContextMenu(marker);
        
        // //----- extra code------
        // const elnode = nodeLabel(node);
        // const elid    = "el" + (++elementIdcounter);
        // marker.metadata = {id:elid,node:elnode}
        // mapElements[elid]={element:marker,id:elid,type:"marker",metadata:null,node:elnode };

        
    }

    // ── LineString ─────────────────────────────────────────────────────────
    if (node.getElementsByTagName("LineString").length > 0) {
        const polyline = L.polyline(latLngs, {
            color:  style.stroke || "#0000FF",
            weight: style.strokeWidth || 3,
        }).addTo(map);

        if (description) {
            polyline.on("click", e => {
                // e.latlng is the click position — equivalent of e.latLng in Google Maps
                L.popup()
                    .setLatLng(e.latlng)
                    .setContent(description)
                    .openOn(map);
            });
        }

        latLngs.forEach(ll => boundsLatLngs.push(ll));
        layers.push(polyline);
         if (window.attachContextMenu) window.attachContextMenu(polyline);
        // Allow selecting this polyline in the editor
       
        polyline.on('click', (e) => {
            try {
                L.DomEvent.stopPropagation(e);
                if (window.selectFeature) window.selectFeature(polyline, e.latlng);
                document.getElementById('tool-route').click();
            } catch (err) { console.warn('Select polyline failed', err); }
        });
      
        
    }

    // ── Polygon ────────────────────────────────────────────────────────────
    if (node.getElementsByTagName("Polygon").length > 0) {
        const polygon = L.polygon(latLngs, {
            color:       "#FF0000",  // strokeColor
            weight:      2,          // strokeWeight
            fillColor:   "#FFCCCC",
            fillOpacity: 0.5,
        }).addTo(map);

        if (description) {
            polygon.on("click", e => {
                L.popup()
                    .setLatLng(e.latlng)
                    .setContent(description)
                    .openOn(map);
            });
        }

        latLngs.forEach(ll => boundsLatLngs.push(ll));
        layers.push(polygon);
        // Allow selecting this polygon in the editor
        polygon.on('click', (e) => {
            try {
                L.DomEvent.stopPropagation(e);
                if (window.selectFeature) window.selectFeature(polygon, e.latlng);
                if (window.editorToolChanged) window.editorToolChanged('edit');
            } catch (err) { console.warn('polygon select failed', err); }
        });
        
       
    }

    return layers;
}


/**
 * Recursively builds a jqxTree item (and its Leaflet overlays) from a KML node.
 * featureLayers[id] is always set to an ARRAY of Leaflet layers.
 */
function buildTreeDataFromKML(xmlDoc, styleMap = {}) {
    const docNode =
        xmlDoc.getElementsByTagName("Document")[0] ||
        xmlDoc.getElementsByTagName("Folder")[0]   ||
        xmlDoc.documentElement;

    return [buildTreeFromNode(docNode, styleMap)];
}

function buildTreeFromNode(node, styleMap = {}) {

    const label = nodeLabel(node);

    const id = "item" + (++idCounter);

    const item = {
        id,
        label,
        items: []
    };

    // =====================================================
    // FOLDER / DOCUMENT
    // =====================================================
    if (
        node.tagName === "Folder" ||
        node.tagName === "Document"
    ) {

        item.icon =
            node.tagName === "Folder"
                ? folderIcon
                : documentIcon;

        item.value =
            node.tagName === "Folder"
                ? "folder"
                : "document";

        item.checked = true;

        // Extract styles defined inside this folder/document
        const styles =
            extractStyles(node);

        // Merge into global style map
        Object.assign(styleMap, styles);

        // Children
        for (const child of node.children) {

            if (
                ["Folder", "Document", "Placemark"]
                    .includes(child.tagName)
            ) {

                item.items.push(
                    buildTreeFromNode(child, styleMap)
                );
            }
        }

    // =====================================================
    // PLACEMARK
    // =====================================================
    } else if (node.tagName === "Placemark") {

        const geom =
            node.getElementsByTagName("Point")[0] ??
            node.getElementsByTagName("LineString")[0] ??
            node.getElementsByTagName("Polygon")[0];

        // ==========================================
        // GEOMETRY ICON
        // ==========================================
        if (geom) {

            if (geom.tagName === "Point") {

                item.icon = "./img/point_icon.png";
                item.value = "point";

            } else if (geom.tagName === "LineString") {

                item.icon = "./img/polyline.svg";
                item.value = "polyline";

            } else if (geom.tagName === "Polygon") {

                item.icon = "./img/polygon.png";
                item.value = "polygon";
            }
        }

        // ==========================================
        // STYLE EXTRACTION
        // ==========================================
        item.style = extractPlacemarkStyle(
            node,
            styleMap
        );
        console.log("Extracted style for", item.label, ":", item.style);
        // ==========================================
        // OVERLAYS
        // ==========================================
        const overlays =
            buildOverlaysFromPlacemark(node, item.style);

        if (overlays.length) {

            featureLayers[id] = overlays;

            item.checked = true;

            item.overlay = overlays;
        }
    }

    return item;
}

function extractStyles(root) {

    const styles = {};

    // ======================================
    // STYLE
    // ======================================
    root.querySelectorAll("Style").forEach(styleNode => {

        const id = styleNode.getAttribute("id");

        if (!id) return;

        styles["#" + id] = parseStyle(styleNode);
    });

    // ======================================
    // STYLEMAP
    // ======================================
    root.querySelectorAll("StyleMap").forEach(styleMapNode => {

        const id =
            styleMapNode.getAttribute("id");

        if (!id) return;

        const pair =
            styleMapNode.querySelector("Pair key");

        const styleUrl =
            styleMapNode.querySelector("styleUrl");

        if (styleUrl) {

            styles["#" + id] = {
                styleUrl:
                    styleUrl.textContent.trim()
            };
        }
    });

    return styles;
}

function parseStyle(styleNode) {

    const style = {};

    // ==========================================
    // LINE STYLE
    // ==========================================
    const line =
        styleNode.querySelector('LineStyle');

    if (line) {

        const colorNode =
            line.querySelector('color');

        if (colorNode) {

            const parsed =
                parseKmlColor(
                    colorNode.textContent
                );

            style.stroke =
                parsed.color;

            style.strokeOpacity =
                parsed.opacity;
        }

        style.strokeWidth =
            Number(
                line.querySelector('width')
                    ?.textContent
            ) || 3;
    }

    // ==========================================
    // POLY STYLE
    // ==========================================
    const poly =
        styleNode.querySelector('PolyStyle');

    if (poly) {

        const colorNode =
            poly.querySelector('color');

        if (colorNode) {

            const parsed =
                parseKmlColor(
                    colorNode.textContent
                );

            style.fill =
                parsed.color;

            style.fillOpacity =
                parsed.opacity;
        }
    }

    // ==========================================
    // ICON STYLE
    // ==========================================
    const icon =
        styleNode.querySelector('IconStyle');

    if (icon) {

        style.iconScale =
            Number(
                icon.querySelector('scale')
                    ?.textContent
            ) || 1;

        style.iconHref =
            icon.querySelector('href')
                ?.textContent
                ?.trim();
    }

    return style;
}

function parseKmlColor(kmlColor) {

    if (!kmlColor) {

        return {
            color: '#000000',
            opacity: 1
        };
    }

    // Remove spaces
    kmlColor = kmlColor.trim();

    // KML format:
    // aabbggrr

    // Ensure length
    while (kmlColor.length < 8) {
        kmlColor = 'f' + kmlColor;
    }

    const aa = kmlColor.substring(0, 2);
    const bb = kmlColor.substring(2, 4);
    const gg = kmlColor.substring(4, 6);
    const rr = kmlColor.substring(6, 8);

    return {

        color: `#${rr}${gg}${bb}`,

        opacity:
            parseInt(aa, 16) / 255
    };
}
function extractPlacemarkStyle( placemark,styleMap) {

    // ======================================
    // INLINE STYLE
    // ======================================
    const inlineStyle =
        placemark.querySelector(":scope > Style");

    if (inlineStyle) {

        return parseStyle(inlineStyle);
    }

    // ======================================
    // STYLE URL
    // ======================================
    const styleUrlNode =
        placemark.querySelector(":scope > styleUrl");

    if (styleUrlNode) {

        const styleUrl =
            styleUrlNode.textContent.trim();

        let style =
            styleMap[styleUrl];

        // Resolve StyleMap
        if (
            style &&
            style.styleUrl
        ) {

            style =
                styleMap[style.styleUrl];
        }

        return style || {};
    }

    return {};
}
// ─── Visibility (show / hide layers) ─────────────────────────────────────────

/**
 * Show or hide all Leaflet layers for a nodeId, then propagate to descendants.
 *
 * GOOGLE → LEAFLET
 *   ov.setMap(map)  →  window.map.addLayer(layer)   (or layer.addTo(map))
 *   ov.setMap(null) →  window.map.removeLayer(layer)
 */
function setVisibilityRecursively(nodeId, visible) {
    const map   = window.map;
    const entry = featureLayers[nodeId];
    const layer = kmlLayers[nodeId];
    console.log("node:",nodeId,", visible:",visible)
     if (layer) {
        if (visible) {
                map.addLayer(layer.layer);
            } else {
                map.removeLayer(layer.layer);
            }
     }  

    if (entry) {
        const arr = Array.isArray(entry) ? entry : [entry];
        arr.forEach(layer => {
            if (visible) {
                if (!map.hasLayer(layer)) map.addLayer(layer);
            } else {
                if (map.hasLayer(layer))  map.removeLayer(layer);
            }
        });
    }

    const parentLi = document.getElementById(nodeId);
    if (!parentLi) return;

    const childLis = parentLi.querySelectorAll("li");
    if (childLis && childLis.length) {
        suppressCheckChange = true;
        childLis.forEach(child => {
            const childId = child.id;
            if (!childId) return;
            const childEntry = featureLayers[childId];
            if (childEntry) {
                const arr = Array.isArray(childEntry) ? childEntry : [childEntry];
                arr.forEach(layer => {
                    if (visible) {
                        if (!map.hasLayer(layer)) map.addLayer(layer);
                    } else {
                        if (map.hasLayer(layer))  map.removeLayer(layer);
                    }
                });
            }
            try {
                if (visible) $("#jqxTree").jqxTree("checkItem",   document.getElementById(childId));
                else         $("#jqxTree").jqxTree("uncheckItem", document.getElementById(childId));
            } catch (e) { /* ignore */ }
        });
        suppressCheckChange = false;
    }
}


// ─── jqxTree checkbox handler ─────────────────────────────────────────────────

/**
 * Wire up the jqxTree checkChange event after the tree is populated.
 * Call this once after calling  $("#jqxTree").jqxTree("addTo", …)  for KML data.
 */
function bindTreeCheckboxes() {
    $("#jqxTree").on("checkChange", function (event) {
      
        if (suppressCheckChange) return;
        const item    = event.args;
        const checked = item.checked;           // true / false / indeterminate
        const nodeId  = item.element ? item.element.id : null;
        if (!nodeId) return;
       
        setVisibilityRecursively(nodeId, !!checked);
    });
}


// ─── Helper utilities ─────────────────────────────────────────────────────────

/** Build a label chain like "File1 - Folder A - Point 1" */
function getParentChainLabelByItem(tree, item) {
    const labels = [];
    let current  = item;
    while (current) {
        labels.unshift(current.label);
        current = tree.jqxTree('getParentItem', current.element);
    }
    return labels.join(" - ");
}

/** Return the first Leaflet layer stored for an item id, or null. */
function getFirstOverlay(itemId) {
    const e = featureLayers[itemId];
    if (!e) return null;
    return Array.isArray(e) ? e[0] : e;
}

// ─── Context menu (treeEdit) ──────────────────────────────────────────────────

/**
 * Right-click context menu for the jqxTree.
 *
 * GOOGLE → LEAFLET
 *   ov instanceof google.maps.Marker    →  layer instanceof L.Marker
 *   ov instanceof google.maps.Polyline  →  layer instanceof L.Polyline
 *   ov instanceof google.maps.Polygon   →  layer instanceof L.Polygon
 *   ov.setIcon(url)                     →  layer.setIcon(L.icon({iconUrl: url, iconSize:[20,20]}))
 *   ov.setOptions({strokeColor})        →  layer.setStyle({color})
 *   ov.setOptions({fillColor})          →  layer.setStyle({fillColor})
 */

function treeEdit() {
    const menuHtml = `
        <div id="treeMenu" style="display:none; position:absolute; background:#fff; border:1px solid #ccc; padding:5px; z-index:9999;">
          <div class="hover-box" id="addFolder">➕ Add Folder</div>
          <div class="hover-box" id="renameItem">✏️ Rename</div>
          <div class="hover-box" id="deleteItem">🗑️ Delete</div>
          <div class="hover-box" id="saveItem">💾 Save</div>
          <hr>
          <div class="hover-box" id="changeMarkerIcon">📍 Change Marker Icon</div>
          <div class="hover-box" id="changePolylineColor">〰️ Change Line Color</div>
          <div class="hover-box" id="changePolygonColor">⬛ Change Polygon Color</div>
        </div>`;
    $("body").append(menuHtml);

    let contextTargetId = null;

    // Right-click opens the menu
    $("#jqxTree").on("contextmenu", e => {
        const li = $(e.target).closest("li");
        if (!li.length) return true;
        contextTargetId = li.attr("id");
        $("#treeMenu").css({ top: e.pageY, left: e.pageX }).show();
        return false;
    });

    $(document).on("click", () => $("#treeMenu").hide());

    // ── Add Folder ──────────────────────────────────────────────────────────
    $("#addFolder").on("click", () => {
        if (!contextTargetId) return;
        const newId   = "item" + (++idCounter);
        const newNode = { id: newId, label: "New Folder", icon: folderIcon, items: [], checked: true };
        $("#jqxTree").jqxTree("addTo", newNode, $("#" + contextTargetId)[0]);
    });

    // ── Rename ──────────────────────────────────────────────────────────────
    $("#renameItem").on("click", () => {
        if (!contextTargetId) return;
         const ids = treeSource.map(item => item.id);
         if (ids.includes(contextTargetId)) {

            alert("Can't Rename");
            return;
        } 
        const newName = prompt("Enter new name:");
        if (newName) {
            const item = $("#jqxTree").jqxTree("getItem", $("#" + contextTargetId)[0]);
            $("#jqxTree").jqxTree("updateItem", item, { label: newName });
        }
    });

    // ── Delete ──────────────────────────────────────────────────────────────
    $("#deleteItem").on("click", () => {

        if (!contextTargetId) return;
        const ids = treeSource.map(item => item.id);
        if (ids.includes(contextTargetId)) {

            alert("Can't Delete");
            return;
        } 
        
            // Remove Leaflet layers from the map before removing tree node
            applyToDescendants(contextTargetId, layer => {
                if (window.map && window.map.hasLayer(layer)) window.map.removeLayer(layer);
            });
            delete  (featureLayers[contextTargetId]) ? featureLayers[contextTargetId]: null;
            (kmlLayers[contextTargetId]) ? removeKmlLayer(contextTargetId):null;
            delete  (kmlLayers[contextTargetId]) ? kmlLayers[contextTargetId]: null;
            $("#jqxTree").jqxTree("removeItem", $("#" + contextTargetId)[0]);
        
    });
     
   
    // ── Utility: walk a node and all its descendants, applying fn to each layer ──
    function applyToDescendants(nodeId, fn) {
        const li      = document.getElementById(nodeId);
        if (!li) return;
        const overlays = featureLayers[nodeId];
        if (overlays) {
            (Array.isArray(overlays) ? overlays : [overlays]).forEach(fn);
        }
        li.querySelectorAll("li").forEach(child => applyToDescendants(child.id, fn));
    }


    // ── Change Marker Icon ──────────────────────────────────────────────────
    $("#changeMarkerIcon").on("click", () => {
        const url = prompt("Enter marker icon URL:");
        if (!url) return;
        applyToDescendants(contextTargetId, layer => {
            if (layer instanceof L.Marker) {
                // Replaces ov.setIcon(url) from Google Maps
                layer.setIcon(L.icon({
                    iconUrl:    url,
                    iconSize:   [20, 20],
                    iconAnchor: [10, 10],
                }));
            }
        });
    });

    // ── Change Polyline Colour ──────────────────────────────────────────────
    $("#changePolylineColor").on("click", () => {
        const color = prompt("Enter line color (e.g. #ff0000):");
        if (!color) return;
        applyToDescendants(contextTargetId, layer => {
            // Check Polygon first because L.Polygon extends L.Polyline
            if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
                // Replaces ov.setOptions({ strokeColor: color })
                layer.setStyle({ color });
            }
        });
    });

    // ── Change Polygon Fill Colour ──────────────────────────────────────────
    $("#changePolygonColor").on("click", () => {
        const color = prompt("Enter polygon fill color (e.g. #00ff00):");
        if (!color) return;
        applyToDescendants(contextTargetId, layer => {
            if (layer instanceof L.Polygon) {
                // Replaces ov.setOptions({ fillColor: color })
                layer.setStyle({ fillColor: color, fillOpacity: 0.5 });
            }
        });
    });
}
// ─── Export Tree to Server ────────────────────────────────────────────────────

/**
 * Walk the jqxTree, collect layer metadata, POST to PHP.
 *
 * GOOGLE → LEAFLET
 *   first instanceof google.maps.Marker    →  first instanceof L.Marker
 *   first instanceof google.maps.Polyline  →  first instanceof L.Polyline (note: L.Polygon extends L.Polyline)
 *   first instanceof google.maps.Polygon   →  first instanceof L.Polygon
 *   marker.getPosition()                   →  marker.getLatLng()
 *   polyline.getPath().getArray()          →  polyline.getLatLngs()  (returns [LatLng, …])
 *   polygon.getPath().getArray()           →  polygon.getLatLngs()[0]  (outer ring)
 *   p.lat() / p.lng()                      →  latLng.lat / latLng.lng
 */
async function exportTreeToServer() {
    if (!$('#jqxTree').data('jqxTree')) { alert("Tree is empty"); return; }
    const tree = $('#jqxTree');
    const rows = [];

    $('#jqxTree li').each(function (index, li) {
        const id = li.id;
        if (!id) return;
        const item = tree.jqxTree('getItem', li);
        if (!item) return;

        const parentPath   = getParentChainLabelByItem(tree, item);
        const rootFile     = parentPath.split(' - ')[0] || '';
        let coords         = '';
        let element_type   = 'Folder';

        const overlays = featureLayers[id];
        if (overlays && overlays.length) {
            const first = overlays[0];

            if (first instanceof L.Marker) {
                // L.Marker → getLatLng() returns a LatLng object with .lat / .lng
                const ll = first.getLatLng();
                coords       = `${ll.lat},${ll.lng}`;
                element_type = 'Point';

            } else if (first instanceof L.Polygon) {
                // L.Polygon extends L.Polyline; check Polygon FIRST
                // getLatLngs() returns [[LatLng, …]] for a simple polygon (outer ring)
                const ring = first.getLatLngs()[0] || [];
                coords       = ring.map(ll => `${ll.lat},${ll.lng}`).join(' ');
                element_type = 'Polygon';

            } else if (first instanceof L.Polyline) {
                // L.Polyline → getLatLngs() returns [LatLng, …]
                coords       = first.getLatLngs().map(ll => `${ll.lat},${ll.lng}`).join(' ');
                element_type = 'LineString';
            }
        }

        rows.push({
            id,
            temp:                '',
            file:                rootFile,
            fileid:              `file_${rootFile}`,
            parentfolder:        parentPath,
            element_type,
            element_name:        item.label,
            description:         '',
            ikon:                item.icon || '',
            style:               '',
            coordinates:         coords,
            open:                item.checked ? 'true' : 'false',
            user_created:        'webuser',
            user_updated:        'webuser',
            creation_date_time:  new Date().toISOString().slice(0, 19).replace('T', ' '),
            updation_date_time:  new Date().toISOString().slice(0, 19).replace('T', ' '),
            element_sl:          index + 1,
        });
    });

    if (!rows.length) { alert("No elements to export"); return; }

    try {
        const resp = await fetch('save_kml_elements.php', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(rows),
        });
        const json = await resp.json();
        if (json.success) alert(`Inserted/updated ${json.inserted} rows`);
        else              alert('Server error: ' + (json.error || 'unknown'));
    } catch (err) {
        console.error(err);
        alert('Network error: ' + err.message);
    }
}


// ─── Clear Everything ─────────────────────────────────────────────────────────

/**
 * Remove all Leaflet layers and reset the tree.
 *
 * GOOGLE → LEAFLET
 *   ov.setMap(null)                   →  window.map.removeLayer(layer)
 *   new google.maps.LatLngBounds()    →  boundsLatLngs = []
 *   map.setCenter(…) / map.setZoom(…) →  map.setView([lat, lng], zoom)
 */
function clearEverything() {
    const map = window.map;

    for (const k of Object.keys(featureLayers)) {
        const arr = Array.isArray(featureLayers[k]) ? featureLayers[k] : [featureLayers[k]];
        arr.forEach(layer => {
            if (layer && map.hasLayer(layer)) map.removeLayer(layer);
        });
        delete featureLayers[k];
    }

    try { $('#jqxTree').jqxTree('destroy'); } catch (_) {}
    $('#jqxTree').empty();
    idCounter    = 0;
    boundsLatLngs = [];                  // reset bounds accumulator

    // Reset map view — equivalent of map.setCenter({lat:20,lng:0}), map.setZoom(2)
    if (map) map.setView([20, 0], 2);
}


// ─── parseKML (entry point called after upload) ───────────────────────────────

/**
 * Parse KML text content and populate map + jqxTree.
 * Exposed on window so the upload handler can call window.parseKML(text, fileName).
 *
 * After adding all layers, we call map.fitBounds() to zoom to the content —
 * the Leaflet equivalent of map.fitBounds(bounds) in Google Maps.
 */
window.parseKML = function (kmlContent, fileName) {
    const xmlDoc   = new DOMParser().parseFromString(kmlContent, "text/xml");
    boundsLatLngs  = []; // reset per-file accumulator
    const treeData = buildTreeDataFromKML(xmlDoc);

    // Add the new file node under "Temporary Places"
    const tempPlacesEl = document.getElementById("tempplaces");
    if (tempPlacesEl && treeData.length) {
        const fileNode = {
            id:      "item" + (++idCounter),
            label:   fileName,
            icon:    kmlIcon,
            checked: true,
            items:   treeData,
        };
        $("#jqxTree").jqxTree("addTo", fileNode, tempPlacesEl);
        bindTreeCheckboxes();
    }

    // Zoom map to fit all loaded features
    if (boundsLatLngs.length > 0 && window.map) {
        window.map.fitBounds(L.latLngBounds(boundsLatLngs));
    }
};




///////////////////////////   to be deleted ////////////////////////////////////////////////////////////

// ─── Load from Database (Leaflet) ────────────────────────────────────────────

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


// ─── Export Map to KML (Leaflet) ──────────────────────────────────────────────

function exportMapToKml() {
    const fg = window.featureGroup;
    if (!fg || Object.keys(fg._layers).length === 0) {
        alert("No features to export.");
        return;
    }

    const geojson = fg.toGeoJSON();

    fetch('./php/api.php?action=export_kml', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ geojson }),
    })
    .then(res => res.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href     = url;
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


// ─── Toolbar Setup ────────────────────────────────────────────────────────────

function setupToolbar() {
    const tools    = ['pan', 'add-point', 'add-polyline', 'edit'];
    const infoText = document.getElementById('toolbar-info');

    tools.forEach(tool => {
        const btn = document.getElementById(`tool-${tool}`);
        if (!btn) return;
        btn.addEventListener('click', e => {
            document.querySelectorAll('.tool-btn:not(.action)').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            currentTool = tool;
            if (tool === 'pan')          infoText.innerText = "Drag map to pan.";
            if (tool === 'add-point')    infoText.innerText = "Click on map to add a point.";
            if (tool === 'add-polyline') infoText.innerText = "Click to start drawing polyline. Double-click to finish.";
            if (tool === 'edit')         infoText.innerText = "Click features to edit.";
        });
    });

    const saveBtn = document.getElementById('tool-save');
    if (saveBtn) saveBtn.addEventListener('click', openSaveModal);

    const exportBtn = document.getElementById('tool-export');
    if (exportBtn) exportBtn.addEventListener('click', exportMapToKml);
}


// ─── Modals ───────────────────────────────────────────────────────────────────

// function setupModals() {
//       // it is a popup form to enter feature name and description before saving to DB
//     const modal    = document.getElementById('save-modal');
//     if (!modal) return;
//     const closeBtn = document.querySelector('.close-modal');
//     if (closeBtn) closeBtn.onclick = () => modal.style.display = "none";
//     window.onclick = event => { if (event.target === modal) modal.style.display = "none"; };
//     const form = document.getElementById('save-form');
//     if (form) form.addEventListener('submit', e => { e.preventDefault(); saveFeature(); });
// }

// function openSaveModal() {
//     // it is a popup form to enter feature name and description before saving to DB
//     const modal = document.getElementById('save-modal');
//     if (!modal) return;
//     modal.style.display = 'block';
//     document.getElementById('feature-name').value = '';
//     document.getElementById('feature-desc').value = '';
// }


// ─── Save Feature ─────────────────────────────────────────────────────────────

function saveFeature() {
    // const name = document.getElementById('feature-name').value;
    // const desc = document.getElementById('feature-desc').value;
    // const dest = document.getElementById('save-destination').value;

    const fg = window.featureGroup;
    let layer = null;
    for (let layerId in fg._layers) {
        layer = fg._layers[layerId];
    }
    if (!layer) { alert('No feature to save'); return; }

    let geojson = layer.toGeoJSON();
    geojson.properties             = geojson.properties || {};
    geojson.properties.name        = "untitled"+ Math.floor(Math.random()*1000) ;
    geojson.properties.description = desc;

    fetch('./php/api.php?action=save_feature&user=' + encodeURIComponent(window.currentUser.id), {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ destination: dest, feature: geojson }),
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
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