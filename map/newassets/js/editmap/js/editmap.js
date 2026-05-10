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
              
                  // console.log("mousemmove->" + curpolyline)
                    // arrowMarker.position = e.latLng;
                      
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
          // let p = wrapper.curpolyline
          // console.log("cur marker:", p.markerindex, ", Clicked vertex index:", p.index ," of polyline :", wrapper.index);
          // console.log("LatLng:", p.marker.position.toJSON());

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
          // google.maps.event.clearInstanceListeners(map);
          document.getElementById("map").removeEventListener("mouseup", this.mouseUpRoute);

          isDrawing = false;
          // p.prmarkerindex=null;
          // p.markerindex=null;
          // p.nextmarkerindex=null;
          // p.curmarker=null;
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
