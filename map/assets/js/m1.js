import { loadJS, loadCSS, loadModule ,addDiv} from "./loader.js";
import { initMap } from "./m1map.js";


window.onload = async function () {
  try {
    console.log("Page loaded");

    // Load  CSS
    await loadCSS("./assets/css/m1map.css");
    await loadCSS("./assets/css/jqrightpanel.css");
    await loadCSS("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css");
    await loadCSS("./plugins/jqwidgets/styles/jqx.base.css");

    // Load  JS
    await loadJS("https://code.jquery.com/jquery-3.6.4.min.js");
    await loadJS("./plugins/jqwidgets/jqxcore.js");
    await loadJS("./plugins/jqwidgets/jqxbuttons.js");
    await loadJS("./plugins/jqwidgets/jqxcheckbox.js");
    await loadJS("./plugins/jqwidgets/jqxscrollbar.js");
    await loadJS("./plugins/jqwidgets/jqxpanel.js");
    await loadJS("./plugins/jqwidgets/jqxtree.js");
    await loadJS("./plugins/jqwidgets/jqxmenu.js");
    await loadJS("./plugins/jqwidgets/jqxdragdrop.js");
    await loadJS("./assets/js/jqverticaltoolbar.js");
    await loadJS("./assets/js/jqrightpanel.js");

    addDiv({ id: "map" , parent: document.body});
    addDiv({ id: "status", className: "status", parent: document.body,text: "Select a mode…" });

    addDiv({ id: "contextMenu", className: "context-menu", parent: document.body ,
      innerHTML: ` <div id="menuView">View details</div>
        <div id="menuEdit">Edit details</div>`});

    addDiv({ id: "contextMenu1", className: "context-menu", parent: document.body,
              innerHTML: `<div class="context-item" id="ctxEdit">Edit</div>
              <div class="context-item" id="ctxDelete">Delete</div>
              <div class="context-item" id="ctxSave">Save to My Places</div>
            `});

    addDiv({ id: "right-panel", parent: document.body,
        innerHTML: `    
        <button  id="btn-hide" title="Hide Boxs" style="float:right; background: none; border: none; color: #666; font-size: 20px; padding: 5; margin: 5; min-width: auto;">
       
        </button>  
        <div class="controls">
          <button id="saveSelected" class="btn small">Save Selected</button>
          <button id="saveAll" class="btn primary small">Save All</button>
          <button id="clearTemp" class="btn small">Clear Temp</button>
        </div>
        <div id="sidepanel" class="card"><h2>Places</h2> 
          <input id="kmlFile" type="file" accept=".kml" />
          <div style="height:10px"></div>
          <div id="jqxTree" class="card-body"></div>
        </div>`,
            });






//  Top-right mode selection UI
    addDiv({ id: "mode-ui", parent: document.body,
        // innerHTML: `<button id="btnMarker" class="mode-button" title="Point"><img src="./img/point.svg" alt="Point" draggable="false"></button>
        // <button id="btnRoute" class="mode-button" title="Route"> <i class="fas fa-route"></i></button>
        // <button id="btnLine" class="mode-button" title="Linestring"><img src="./img/polyline.svg" alt="Linestring" draggable="false"></button>
        // <button id="polygon-mode" class="mode-button" title="Polygon"><img src="./img/polygon.png" alt="Polygon" draggable="false"></button>
        // <button id="scale-mode" class="mode-button" title="Scale"><i class="fas fa-ruler-horizontal"></i></button>
        // <button id="btnClear" class="mode-button" title="Select"><img src="./img/select.svg" alt="Select" draggable="false"></button>
        // <button id="resize-button" class="mode-button" title="Resize"><img src="./img/resize.svg" alt="Resize" draggable="false"></button>
        // <button id="delete-button" class="mode-button" title="Clear"><img src="./img/delete.svg" alt="Clear" draggable="false"></button>
        // <button id="delete-selected-button" class="mode-button" title="Clear last or Selected"><img src="./img/delete-selected.svg" alt="Delete Selected" draggable="false"></button>
        // <button id="undo-button"  class="mode-button" title="Undo"><img src="./img/undo.svg" alt="Undo" draggable="false"></button>
        // <button id="redo-button" class="mode-button" title="Redo"><img src="./img/redo.svg" alt="Redo" draggable="false"></button>
        // <button id="export-button" class="mode-button" title="Export"><img src="./img/download.svg" alt="Export" draggable="false"></button>
        // <button id="upload-button" class="mode-button" title="Upload"><img src="./img/upload.svg" alt="Upload" draggable="false"></button>
        // <input type="file" id="upload-input" style="display: none;" accept=".geojson,.json">`
   });



    await loadModule("./assets/js/m1map.js");

    console.log("All resources loaded");
    initMap();
  } catch (err) {
    console.error("Loading failed:", err);
  }
};














