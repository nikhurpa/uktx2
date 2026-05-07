import { loadJS, loadCSS, loadModule, addDiv, Router } from "./loader.js";
import { loadStyles, loadTopDependencies ,loadBottomDependencies } from "./scripts_css.js";
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
        await loadTopDependencies();
        addDiv({ id: "main", parent: document.body });
        addDiv({ id: "map", parent: document.body });
        initRightPanel();
        loadBottomDependencies();


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

