import { loadJS, loadCSS, loadModule, addDiv, Router } from "./loader.js";
import { loadStyles, loadTopDependencies ,loadBottomDependencies,loadAllModules } from "./scripts_css.js";
import { initRightPanel } from "./rightpanel.js";
// import { initForm ,loadHierarchy,loadMapData,loadTypeMap} from "./myjqxform.js";
// import { initMap } from "./map.js";

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
        await loadTopDependencies();
        await loadAllModules();

        addDiv({ id: "main", parent: document.body });
        addDiv({ id: "map", parent: document.body });
        addDiv({ id: "mode-ui", parent: document.body, });
        //  addDiv({ id: "status", className: "status", parent: document.body, text: "Select a mode…" });

      addDiv({
        id: "contextMenu", className: "context-menu d-none", parent: document.body,
        innerHTML: ` <div id="menuView">View details</div>
        <div id="menuEdit">Edit details</div>`});
      addDiv({ id: "feature-ctx-menu", parent: document.body });
      addDiv({ id: "elevation-modal", parent: document.body });
      addDiv({ id: "tree-ctx-menu", parent: document.body });
      addDiv({ id: "dir-info-bar", parent: document.body });

      // addDiv({
      //   id: "contextMenu1", className: "context-menu", parent: document.body,
      //   innerHTML: `<div class="context-item" id="ctxEdit">Edit</div>
      //         <div class="context-item" id="ctxDelete">Delete</div>
      //         <div class="context-item" id="ctxSave">Save to My Places</div>
      //       `});

        initRightPanel();
        await loadBottomDependencies();
        await loadHierarchy()
        await loadTypeMap()
  
        // initForm();
        window.initMap();
        window.initForm();
        window.initMapEdit()
        // await loadMapData({type:"BTS",block:"Hawalbag",oa:"Almora"});
        
        // await loadMapData({type:"GP",block:"Takula",oa:"Almora"});
        // await loadMapData({type:"OLT",block:"Takula",oa:"Almora"});
        // await loadMapData({type:"OFC",block:"",oa:"Almora"});


   

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

