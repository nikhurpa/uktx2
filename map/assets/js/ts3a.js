import { PolylineManager , MarkerManager , DraggableAdvancedMarker , LayerManager } from "./mapClasses.js";

// ------------------- Asynch Loader-------------------
(g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams;
const f=()=>h||(h=new Promise(async(n,o)=>{await (a=m.createElement("script"));
e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);
e.set("callback",c+".maps."+q);a.src=`https://maps.googleapis.com/maps/api/js?`+e;
d[q]=n;a.onerror=()=>o(Error(p+" could not load."));m.head.append(a)}));
d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(n,...o)=>r.add(n)&&f().then(()=>d[l](n,...o))})
({key:"AIzaSyAH06384nr0EpGqBZXDmkbGxHoWtpKjGPE", v:"weekly"});

let map, mode = null, statusEl, ctxMenu, selectedTarget,isMouseDown,isDragging=false,arrowMarker,isDrawing = false;
let polylineSelected=false,markerSelected=false;
let selectedPolyline,selectedMarker;
let curpolyline,curmarker,prpolyline,prmarker;
let lastPoint = null;
const minPixelDistance = 8; 
let pathCoords = [];
let polyline,marker;
let polylines=[],markers=[];
let polylineindex=0;
let nextmarkerindex,prmarkerindex,markerindex;
let mapoptions_clear={cursor: "default" , draggableCursor: "grab",     // 👈 normal hand cursor for map panning
                            draggingCursor: "grabbing" ,scrollwheel: true, gestureHandling: "greedy"}

let mapoptions_startroute={draggableCursor: "crosshair",draggingCursor: "crosshair" 
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


  statusEl = document.getElementById("status");
  ctxMenu = document.getElementById("contextMenu");

  bindToolButtons(Marker);

  document.getElementById("undo-button").addEventListener("click",()=>{
 
   editPolyline.undo();
  })

     map.addListener('rightclick', () => {
      setMode("Clear");
    });



}

function bindToolButtons(AdvancedMarkerElement) {
  
  document.getElementById("btnMarker").onclick = () => setMode("Marker");
  document.getElementById("btnLine").onclick = () => setMode("Line");
  document.getElementById("btnRoute").onclick = () => setMode("Route");
  document.getElementById("btnClear").onclick = () => setMode("Clear");
  
}

function setMode(newMode) {
  mode = newMode;
  ["btnMarker","btnLine","btnRoute","btnClear"].forEach(id=>{
    document.getElementById(id).classList.toggle("active", id==="btn"+newMode);
  });
  statusEl.textContent = `Mode: ${newMode}`;
  google.maps.event.clearInstanceListeners(map);

      if(mode=="Clear") {
          editPolyline.clearDrawing()
        }

  
      if(mode=="Route") {
          // document.getElementById("undo-button").addEventListener("click",editPolyline.undo())
          editPolyline.setRoute()
         
        }

      if(mode=="Marker") {
          drawmarker()
 
        }


}

function clear () {
        google.maps.event.clearInstanceListeners(map);
        document.getElementById("map").removeEventListener("mouseup", mouseuproute);

        isDrawing = false;
        map.setOptions( mapoptions_clear);
        lastPoint=null;
        polylines.forEach( p2 => {p2.setMarkersVisibility(false)})
        // if(polylines[curpolyline].getPath().length !== 0){
        // addDrawnPath(polyline.getPath());
        // }
}


let editPolyline ={

create: function(){
              
              let id = polylines.length+1
              console.log("Polylines:" + polylines.length + ",ID:" + id)
              let metadata ={id:id,index:id-1,visible:true}

              polyline = new PolylineManager(map,this.handleVertexClick,id-1)
              polyline.create(pathCoords,metadata);
  
              polylines.push(polyline)
              curpolyline=id-1;
              nextmarkerindex=0;

              let p= polylines[curpolyline].polyline

              ///  click event on ployline
              google.maps.event.addListener(p, "click", (e) => {
              isDrawing=false;
              polylineSelected=true;
              
              markerindex=p.parent.curmarker;
              nextmarkerindex=markerindex+1
              curpolyline=p.metadata.index;
              console.log("click:"+p.metadata.index)
              polylines.forEach( p2 => {p2.setMarkersVisibility(false)})
              p.parent.select();
              
              console.log(markerindex)
              setMode("Route")

              });
},
mouseDownLines:function(e){
 {
               
           if ((e.domEvent.buttons & 1) && curpolyline+1) {
                if(!polylines[curpolyline].markerDragging)  this.draw(e);
                   
              }

              isDragging = true;
              map.setOptions({ gestureHandling: "none" });
              console.log(isDragging)
            }
},
mouseMovePath:function(e){
                 if(isDragging && curpolyline+1 && (e.domEvent.buttons & 1) ){
                 if(!polylines[curpolyline].markerDragging)  this.draw(e); 
            }

},
draw:function (e) {

 
                if(prmarkerindex) {
                  polylines[curpolyline].unselectMarker(prmarkerindex)
                }
                isDrawing = true;
            
                 console.log("mousemmove->" + curpolyline)
                  // arrowMarker.position = e.latLng;
                    
                      const projection = map.getProjection();
                      if (!projection) return;

                      const newPoint = projection.fromLatLngToPoint(e.latLng);

                        if (!lastPoint) {
                        
                          prmarkerindex=markerindex
                          polylines[curpolyline].pushPath(e.latLng,nextmarkerindex)
                          markerindex=nextmarkerindex
                          nextmarkerindex=markerindex+1
                          lastPoint = newPoint;

                        } else {
                          const dx = newPoint.x - lastPoint.x;
                          const dy = newPoint.y - lastPoint.y;
                          if (Math.sqrt(dx*dx + dy*dy) > minPixelDistance / Math.pow(2, map.getZoom())) {
                           
                          prmarkerindex=markerindex
                          polylines[curpolyline].pushPath(e.latLng,nextmarkerindex)
                          markerindex=nextmarkerindex
                          nextmarkerindex=markerindex+1
                          lastPoint = newPoint;

                          }
                      }
                   
},
mouseUpRoute:function(){
console.log("Mouse UP:" , prmarkerindex)
   map.setOptions({ gestureHandling: "greedy" });
     if(prmarkerindex) {
        polylines[curpolyline].unselectMarker(prmarkerindex)
     }
  console.log("prmarker:",prmarkerindex," ,curmarker:", markerindex)
  polylines[curpolyline].selectMarker(markerindex)

  console.log("Final Path: dom mouseup",  polylines[curpolyline].polyline.getPath() ," isDragging:" ,isDragging );

},      
handleVertexClick:function(index, marker, wrapper){
      console.log("cur marker:", markerindex, ", Clicked vertex index:", index ," of polyline :", wrapper.index);
        console.log("LatLng:", marker.position.toJSON());

        polylines[curpolyline].unselectMarker(prmarkerindex)
        markerindex=index;
        nextmarkerindex=markerindex+1;
        isDragging = true;
        isDragging = true;
        curpolyline= wrapper.index;
        polylines[curpolyline].selectMarker(index)
        prmarkerindex=index
},
setRoute:function(){
            map.setOptions(mapoptions_startroute);
            if(!polylineSelected && !curpolyline) this.create();
      
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
  
        // google.maps.event.clearInstanceListeners(map);
        document.getElementById("map").removeEventListener("mouseup", this.mouseUpRoute);

        isDrawing = false;
        prmarkerindex=null;
        markerindex=null;
        nextmarkerindex=null;
        curpolyline=null;
        curmarker=null;
        map.setOptions( mapoptions_clear);
        lastPoint=null;
        polylines.forEach( p2 => {p2.setMarkersVisibility(false)})
        // if(polylines[curpolyline].getPath().length !== 0){
        // addDrawnPath(polyline.getPath());
        // }  
},
undo:function(){
  console.log(curpolyline)
  if(curpolyline+1) polylines[curpolyline].removeVertexMarker()
  markerindex= polylines[curpolyline].curmarker
  nextmarkerindex=markerindex+1
  prmarkerindex=null
}        
}



function drawroute(){


            map.setOptions(mapoptions_startroute);
            if(!polylineSelected && !curpolyline) editPolyline.create();
      
            map.addListener("mousedown", (e) => {editPolyline.mouseDownLines(e)});
              
            // mouse move → only log if dragging
            map.addListener("mousemove", (e) => {editPolyline.mouseMovePath(e)} );

            // mouse up → stop drag mode
            document.getElementById("map").addEventListener("mouseup", editPolyline.mouseUpRoute);

            // right click on map to show context menu  
            map.addListener("rightclick", (e) => {
               //showContextMenu(e.domEvent, mode);
             });  
             // click on polyline



}

function mouseuproute(e){
  console.log("Mouse UP:" , prmarkerindex)
   map.setOptions({ gestureHandling: "greedy" });
     if(prmarkerindex) {
        polylines[curpolyline].unselectMarker(prmarkerindex)
     }
  console.log("prmarker:",prmarkerindex," ,curmarker:", markerindex)
  polylines[curpolyline].selectMarker(markerindex)

  console.log("Final Path: dom mouseup",  polylines[curpolyline].polyline.getPath() ," isDragging:" ,isDragging );
}



function handleVertexClick(index, marker, wrapper) {
  console.log("cur marker:", markerindex, ", Clicked vertex index:", index ," of polyline :", wrapper.index);
  console.log("LatLng:", marker.position.toJSON());

  polylines[curpolyline].unselectMarker(prmarkerindex)
  markerindex=index+1;
  isDragging = true;
  isDragging = true;
  curpolyline= wrapper.index;
  polylines[curpolyline].selectMarker(index)
  prmarkerindex=index
  
  setMode("Route")

}

function drawmarker(){
            let mapoptions_startmarker={draggableCursor: "crosshair",draggingCursor: "crosshair" 
                            ,scrollwheel: true, gestureHandling: "greedy"}

            map.setOptions(mapoptions_startmarker);
            console.log("markerSelected:" + markerSelected + "," + curmarker)
            
            map.addListener("click", (e) => {
              const dot = document.createElement("div");
              dot.style.width = "8px";
              dot.style.height = "8px";
              dot.style.borderRadius = "50%";
              dot.style.background = "red";
              dot.style.border = "1px solid white";
              dot.style.cursor = "pointer";
              dot.style.pointerEvents = "auto";
              dot.style.display = "inline-block";

              let m = new google.maps.marker.AdvancedMarkerElement({
                position: e.latLng,
                map: map,
                content: dot,   // ✅ unique DOM node each time
                gmpDraggable: false,
              });

              markers.push(m);

              m.addListener("gmp-click", () => {   // ✅ use gmp-click for AdvancedMarker
                markerSelected = true;
                const indx = markers.findIndex(vm => vm === m);
                curmarker = indx;
                console.log("Marker clicked index:", indx);
              });

            m.element.addEventListener("mouseenter", (e) => {
            console.log("mouse over");
              m.content.style.backgroundColor = "yellow";

              });
            m.element.addEventListener("mouseleave", (e) => {
            console.log("mouseout");
              m.content.style.backgroundColor = "red";

              });



            });
              


}

/////////////////////////////////////////////////////////////

let vertexMarkers = [];  // store all vertex markers
let markersVisible = false;

function addVertexMarker(position, idx) {

  const dot = document.createElement("div");
  dot.style.width = "8px";
  dot.style.height = "8px";
  dot.style.borderRadius = "50%";
  dot.style.background = "red";
  dot.style.border = "1px solid white";

  // const marker =  new google.maps.Marker({
  //     position: position,
  //     map: null, // start invisible
  //     draggable: true, // allows dragging
  //      content: dot,
  //   });


  const marker = new google.maps.marker.AdvancedMarkerElement({
    position,
    map: null, // start invisible
    content: dot,
    gmpDraggable: true
  });

  // // keep polyline in sync while dragging
  //   marker.addListener("gmp-click", (e) => {
  //     polyline.getPath().setAt(idx, e.latLng);
  //    console.log(e.latLng)
  //   });

  vertexMarkers.push(marker);
  return marker;
}

// Toggle marker visibility
function setMarkersVisibility(visible) {
  markersVisible = visible;
  vertexMarkers.forEach(m => {
    m.map = visible ? map : null;
  });
}

// vertical marker
function createArrowMarker(position) {
  // Create SVG arrow
  const svg = document.createElement("div");
  svg.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="18" viewBox="0 0 14 18">
      <polygon points="10,0 13.5,6 11,6 11,18 9,18 9,6 6.5,6" 
               fill="#83F52C" stroke="black" stroke-width=".4"/>
   </svg>
  `;
  //  <polygon points="10,0 15,10 12,10 12,25 8,25 8,10 5,10" 
  svg.style.transform = "translate(-2px, 18px)"; // align tip to latLng
  


  const marker = new google.maps.marker.AdvancedMarkerElement({
    position,
    map,
    content: svg,
    gmpDraggable: true,
    // anchor: { x: -10, y: -10 },
 
  });

  return marker;
}

function removeArrowMarker(arrowMarker) {
  if (arrowMarker) {
    arrowMarker.map = null;   // detach from map
    arrowMarker = null;       // clear reference
  }
}
/// function to add dot on line
function addVertexMarker1(position) {
  const dot = document.createElement("div");
  dot.style.width = "6px";
  dot.style.height = "6px";
  dot.style.borderRadius = "50%";
  dot.style.background = "red";
  dot.style.border = "1px solid white";

  const vertex = new google.maps.marker.AdvancedMarkerElement({
    position,
    map,
    content: dot,
    gmpClickable: true
  });

  // later you can add drag/remove listeners here
}

function showContextMenu(domEvent, type) {
  ctxMenu.style.display = "block";
  ctxMenu.style.left = domEvent.pageX + "px";
  ctxMenu.style.top = domEvent.pageY + "px";
  statusEl.textContent = `${type} right-clicked`;
}

function hideContextMenu() {
  ctxMenu.style.display = "none";
}









function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000; // meters
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function setupModeButtons() {
    const modeUI = document.getElementById('mode-ui');
    if (!modeUI) {
        return;
    }
    const modeButtons = {
        'select-mode': 'select',
        'point-mode': 'point',
        'linestring-mode': 'linestring',
        'polygon-mode': 'polygon',
        'route-mode': 'polygon',
        'clear-mode': 'static'
    };
    for (const buttonId in modeButtons) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.onclick = () => {
                setActiveButton(buttonId);
                const modeName = modeButtons[buttonId];
                // if (!draw) {
                //     return;
                // }
                // if (modeName === 'static') {
                //     draw.clear();
                //     draw.setMode('static');
                // }
                // else if (modeName) {
                //     draw.setMode(modeName);
                // }

            };
        }
    }
}
function setActiveButton(buttonId) {
    const buttons = document.querySelectorAll('.mode-button');
    const resizeButton = document.getElementById('resize-button');
    const isResizeActive = resizeButton?.classList.contains('active');
    buttons.forEach(button => {
        if (button.id !== 'resize-button') {
            button.classList.remove('active');
        }
    });
    const activeButton = document.getElementById(buttonId);
    if (activeButton) {
        activeButton.classList.add('active');
    }
    if (isResizeActive) {
        resizeButton?.classList.add('active');
    }
}     

window.onload = initMap;