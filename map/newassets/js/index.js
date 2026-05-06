import { loadJS, loadCSS, loadModule, addDiv, Router } from "./loader.js";
import { loadStyles, loadAllDependencies } from "./scripts_css.js";
import { initRightPanel } from "./rightpanel.js";

// import { ribbon, initializeRibbon } from "./jqxRibbon.js";
// import { tab, initializeTabs } from "./jqxTab.js";
// import { initMap, loadMapData, loadHierarchy, loadTypeMap } from "./m.js";
// import { datatoolbar, datagrid } from "./datatable.js";


// Router.add("/maps", () => initMap());
Router.add("/", () => console.log("Home"));
Router.add("/maps", () => console.log("maps page"));

Router.add("/main", () => {
    console.log("main page");
  
    window.closeInfoWindow = () => {
      if (window.infoWindow) {
        window.infoWindow.close();
      }
    };


  window.onload = async function () {
    try {

        

        await loadStyles();
        await loadAllDependencies();
        addDiv({ id: "main", parent: document.body });
        // addDiv({ id: "dataTable", className: "container-fluid", parent: document.body,
        //            innerHTML: `<div class="card-header bg-white" id="toolbardiv"><div id="toolbar"></div></div>
        //             <!-- card-body -->
        //             <div id="cardbody" class="card-body table-responsive p-1 ms-1"></div>` });
        // addDiv({ id: "status", className: "status", parent: document.body, text: "Select a mode…" });
        // addDiv({ id: "contextMenu", className: "context-menu", parent: document.body,
        //             innerHTML: ` <div id="menuView">View details</div>
        //                        <div id="menuEdit">Edit details</div>`});
        // addDiv({ id: "contextMenu1", className: "context-menu", parent: document.body,
        //             innerHTML: `<div class="context-item" id="ctxEdit">Edit</div>
        //                   <div class="context-item" id="ctxDelete">Delete</div>
        //                   <div class="context-item" id="ctxSave">Save to My Places</div>
        //                 `});
        // add right panel with tabs                
        // addDiv({ id: "right-panel", parent: document.body,
        //           innerHTML: ` <div id='jqxtabs'>
        //                       <ul style='margin-left: 20px;'>
        //                         <li>Map</li>
        //                         <li>Information</li>
        //                         <li>Data</li>
        //                       </ul>
        //                       <div id="sidepanel" class="card">
        //                                 <h2>Places</h2>
        //                               <button  id="btn-hide" title="Hide Boxs" style="float:right; background: none; border: none; color: #666; font-size: 20px; padding: 5; margin: 5; min-width: auto;">
        //                               </button>  
        //                               <div class="controls">
        //                                 <button id="saveSelected" class="btn small">Save Selected</button>
        //                                 <button id="saveAll" class="btn primary small">Save All</button>
        //                                 <button id="clearTemp" class="btn small">Clear Temp</button>
        //                               </div> 
        //                               <input id="kmlFile" type="file" accept=".kml" />
        //                               <div style="height:10px"></div>
        //                               <div id="jqxTree" class="card-body"></div>
        //                         </div>
        //                         <div id="infoPanel">
        //                             <div id='elementForm' style="width: 280px; height: auto;"></div>   
        //                             <div id='elementSubForm' style="width: 280px; height: auto;"></div>   
        //                         </div>
        //                         <div id="data" class="card">
        //                             <div id='dataElementForm' style="width: 280px; height: auto;"></div>   
        //                             <div id='dataElementSubForm' style="width: 280px; height: auto;"></div>   
        //                         </div>

        //                       </div>`, });

        //  Top-right mode selection UI
        // addDiv({ id: "mode-ui", parent: document.body, });
    


      // await loadModule("./assets/js/m.js");
      // // await loadModule("./assets/js/m_mapelements.js");
      // await loadModule("./assets/js/datatable.js");

      // await loadHierarchy();
      // await loadTypeMap();
      // await initMap();
      // datatoolbar();

      // loadMapData("GP","Hawalbag","Almora");
      // loadMapData("OLT","Hawalbag","Almora");
      // loadMapData("BTS","Hawalbag","Almora");
      // loadMapData("OFC","","Almora");


      initRightPanel();

      console.log("All resources loaded");
    } catch (err) {
      console.error("Loading failed:", err);
    }
  };




});

Router.add("/map/draw", () => {
  //   initMap();
  //   enableDrawing();
});
Router.start();

