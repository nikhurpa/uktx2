import { PolylineManager , AdvanceMarkerManager , DraggableAdvancedMarker , LayerManager ,KMLViewer,KMLParser,  TreeManager, LayerManager1} from "./mapClasses.js";
// import { kml } from "https://cdn.jsdelivr.net/npm/@tmcw/togeojson@5.0.1/dist/togeojson.esm.js"
 import { kml } from "https://unpkg.com/@tmcw/togeojson@7.1.2?module";
import JSZip from "https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm";

// ------------------- Asynch Loader-------------------
(g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams;
const f=()=>h||(h=new Promise(async(n,o)=>{await (a=m.createElement("script"));
e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);
e.set("callback",c+".maps."+q);a.src=`https://maps.googleapis.com/maps/api/js?`+e;
d[q]=n;a.onerror=()=>o(Error(p+" could not load."));m.head.append(a)}));
d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(n,...o)=>r.add(n)&&f().then(()=>d[l](n,...o))})
({key:"AIzaSyAH06384nr0EpGqBZXDmkbGxHoWtpKjGPE", v:"weekly"});
// ------------------- End Asynch Loader-------------------

const minPixelDistance = 8; 
let map, mode = null,oldMode=null, statusEl, ctxMenu, selectedTarget,isMouseDown,isDragging=false,arrowMarker,isDrawing = false;
let polylineSelected=false,markerSelected=false;
let selectedPolyline,selectedMarker;
let curpolyline,curmarker,prpolyline,prmarker;
let lastPoint = null;
let pathCoords = [];
let polyline,marker,bounds,infoWindow;
let polylines=[],markers=[];
let polylineindex=0;
let nextmarkerindex,prmarkerindex,markerindex;
let tempTree;




let mapoptions_clear={cursor: "default" , draggableCursor: "grab",     // 👈 normal hand cursor for map panning
                            draggingCursor: "grabbing" ,scrollwheel: true, gestureHandling: "greedy"}

let mapoptions_startroute={draggableCursor: "crosshair",draggingCursor: "crosshair" 
                            ,scrollwheel: true, gestureHandling: "greedy"}
let mapoptions_startmarker={draggableCursor: "crosshair",draggingCursor: "crosshair" 
                            ,scrollwheel: true, gestureHandling: "greedy"}                            

async function initMap() {
  const { Map } = await google.maps.importLibrary("maps");
  const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
  const { Marker } = await google.maps.importLibrary("marker");

  map = new Map(document.getElementById("map"), {
    center: { lat: 28.6139, lng: 77.2090 },
    zoom: 14,
    mapId: "DEMO_MAP_ID"
  });

    bounds = new google.maps.LatLngBounds();
    infoWindow = new google.maps.InfoWindow();

  marker = new AdvanceMarkerManager(map);
  polyline = new PolylineManager(map,editPolyline.handleVertexClick,null,setMode)

  statusEl = document.getElementById("status");
  
  $("#right-panel").rightPullPanel({
    width: 300,
    topOffset: 60
  });


   let treeSource= [
    {label: "My Places", expanded: true,checked: true ,icon:"./img/earth.jpg",id:"myplaces",value:"main_folder"},
    {label: "Temporary Places", expanded: true,checked: true,icon:"./img/folder.png",id:"tempplaces",value:"temp_folder" },

  ];

    $("#jqxTree").jqxTree({ source: treeSource, width: "100%", height: "300px", checkboxes: true ,allowDrag: true, allowDrop: true});



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
      { id: "maps", title: "Maps", html: '<i class="fas fa-globe"></i>', href:"#/map" },
      { id: "kml", title: "KML", html: '<i class="fas fa-map"></i>', href:"#/kml" },
    ],

      onSelect: function ({ id }) {
      if (toolActions[id]) {
          oldMode=mode;
          mode = id;
          statusEl.textContent = `Mode: ${mode}`;
          google.maps.event.clearInstanceListeners(map);
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
      editPolyline.setRoute()
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
       if(oldMode=="Route")  editPolyline.clearDrawing();

        
    },

    resize() {
      console.log("Resize tool activated");
    },

    delete() {
      console.log("Delete all");
        if(mode=="point") editMarker.remove();
        if(mode=="route") editPolyline.remove();
    },

    undo() {
      console.log("Undo last action");
        if(mode=="route") editPolyline.undo();
    },

    redo() {
      console.log("Redo last action");
    },

    export() {
      console.log("Export data");
    },

    upload() {
      console.log("Upload data");
    }
   };
 
   document.getElementById("clearTemp").addEventListener("click",()=>{

    var items = $('#jqxTree').jqxTree('getItems');
    console.log(items)
   })

  
  ctxMenu = document.getElementById("contextMenu");
  

   
  panel.loadKml()

//   const viewer = new KMLViewer(map);

//   document.getElementById("kmlFile").addEventListener("change", e => {
//   viewer.loadFile(e.target.files[0]);
// });

  
}

/// new function 
function setMode(newMode) {
$("#" + newMode).trigger("click");
}


let editPolyline ={

  create: function(){
                
                let id = polyline.polylines.length+1
             
                let metadata ={id:id,index:id-1,visible:true}
                polyline.create(pathCoords,metadata,id-1);
                console.log("Created Polylines:" ,id )
                
  },
  remove:function(){
  },
  mouseDownLines:function(e){
  
                
            if ((e.domEvent.buttons & 1) && polyline.curpolyline) {
                  if(!polyline.curpolyline.markerDragging)  this.draw(e);
                    
                }

                isDragging = true;
                map.setOptions({ gestureHandling: "none" });
                console.log(isDragging)
              
  },
  mouseMovePath:function(e){
                  if(isDragging && polyline.curpolyline && (e.domEvent.buttons & 1) ){
                              if(!polyline.markerDragging)  this.draw(e); 
                  }

  },
  draw:function (e) {

                  let p=polyline.curpolyline
                  if(p.prmarkerindex) {
                    polyline.unselectMarker(p, p.prmarkerindex)
                  }
                  isDrawing = true;
                                    
                        const projection = map.getProjection();
                        if (!projection) return;

                        const newPoint = projection.fromLatLngToPoint(e.latLng);

                          if (!lastPoint) {
                          
                            prmarkerindex=markerindex
                            polyline.pushPath(p,e.latLng,p.nextmarkerindex)
                            p.markerindex=p.nextmarkerindex
                            p.nextmarkerindex=p.markerindex+1
                            lastPoint = newPoint;

                          } else {
                            const dx = newPoint.x - lastPoint.x;
                            const dy = newPoint.y - lastPoint.y;
                            if (Math.sqrt(dx*dx + dy*dy) > minPixelDistance / Math.pow(2, map.getZoom())) {
                            
                            p.prmarkerindex=p.markerindex
                            polyline.pushPath(p,e.latLng,p.nextmarkerindex)
                            p.markerindex=p.nextmarkerindex
                            p.nextmarkerindex=p.markerindex+1
                            lastPoint = newPoint;

                            }
                        }
                                   
  },
  mouseUpRoute:function(){
      let p=polyline.curpolyline
      console.log("Mouse UP:" , p.prmarkerindex)
      map.setOptions({ gestureHandling: "greedy" });
      if(p.prmarkerindex) polyline.unselectMarker(p,p.prmarkerindex)
      
    console.log("prmarker:",p.prmarkerindex," ,curmarker:", p.markerindex)
    polyline.selectMarker(p,p.markerindex)
    console.log("Final Path: dom mouseup",  p.getPath() ," isDragging:" ,isDragging );

  },    

  handleVertexClick:function(index, marker, p){
        
          if(p.prmarkerindex) polyline.unselectMarker(p,p.prmarkerindex)
          p.markerindex=index;
          p.nextmarkerindex=p.markerindex+1;
          isDragging = true;
          // poluline.curpolyline= wrapper.index;
          polyline.selectMarker(p,index)
          p.prmarkerindex=index
  },
  setRoute:function(){
              map.setOptions(mapoptions_startroute);
              if(!polyline.polylineSelected && !polyline.curpolyline) this.create();
        
              map.addListener("mousedown", (e) => {this.mouseDownLines(e)});
                
              // mouse move → only log if dragging
              map.addListener("mousemove", (e) => {this.mouseMovePath(e)} );

              // mouse up → stop drag mode
              document.getElementById("map").addEventListener("mouseup", this.mouseUpRoute);

              // right click on map to show context menu  
              map.addListener("rightclick", (e) => {
                //showContextMenu(e.domEvent, mode);
              });  
              // click on polyline

  },
  clearDrawing:function(){
        let p=polyline.curpolyline
          
          document.getElementById("map").removeEventListener("mouseup", this.mouseUpRoute);

          isDrawing = false;
          map.setOptions( mapoptions_clear);
          lastPoint=null;
          polyline.curpolyline=null;
          polyline.polylines.forEach( p2 => {polyline.setMarkersVisibility(p2,false)})
        
  },
  undo:function(){
    let p= polyline.curpolyline
    console.log(p)
    if(p) {
      polyline.removeVertexMarker(p)
    }
    p.markerindex= polyline.curpolyline.curmarker
    p.nextmarkerindex=p.markerindex+1
    p.prmarkerindex=null
  },
}


let editMarker = {
  setMarker:function(){
           map.setOptions(mapoptions_startmarker);
           map.addListener("mousedown", (e) => { 
              this.create(e)
           });
              
  },

  create:function(e){
            const dot = document.createElement("div");
              dot.style.width = "8px";
              dot.style.height = "8px";
              dot.style.borderRadius = "50%";
              dot.style.background = "red";
              dot.style.border = "1px solid white";
              dot.style.cursor = "pointer";
              dot.style.pointerEvents = "auto";
              dot.style.display = "inline-block";
           let markerMetadata={};   
           if(!marker.markerDragging) marker.create(e.latLng,dot,markerMetadata)
  }, 
  remove: function(){
          if(marker.curmarkerindex+1) marker.delete(marker.markers[marker.curmarkerindex])
  },
  editMarker:function(){

  }
}

////////////////////////////////////////////////////////////////////////////////////

let panel = {

  loadKml:function() {

        $("#kmlFile").on("change", async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
              const xmlDoc = await parseFile(file);
              const source = buildTreeDataFromKML(xmlDoc);

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

                $("#jqxTree").on("itemClick", (event) => {
                  const element = event.args.element;
                  const id = $(element).attr("id");
                  if (!id) return;
                  const entry = featureLayers[id];
                  if (!entry) return;
                  const first = Array.isArray(entry) ? entry[0] : entry;
                  if (first instanceof google.maps.Marker) {
                    map.panTo(first.getPosition());
                    map.setZoom(Math.max(map.getZoom(), 10));
                  } else {
                    const shapeBounds = new google.maps.LatLngBounds();
                    if (first.getPath) first.getPath().forEach(p => shapeBounds.extend(p));
                    if (first.getPaths) first.getPaths().forEach(path => path.forEach(p => shapeBounds.extend(p)));
                    if (!shapeBounds.isEmpty()) map.fitBounds(shapeBounds);
                  }
                });


              if ( !bounds.isEmpty()) {
                map.fitBounds(bounds);
              }


        this.uploadKml("file103")
        console.log("done")
      


            } catch (err) {
              alert("Error parsing file: " + err.message);
              console.error(err);
            }
        });
      
            
        // treeEdit()
        
      

        
        
        
  },

  uploadKml:function(id){
    let items = $('#jqxTree').jqxTree('getItems');
    const fileToMatch = ["blocks.kml"];

    const fileNode = this.createSql(items,id)

    console.log("f:" + fileNode);

  },

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


export { initMap};



