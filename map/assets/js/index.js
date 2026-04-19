import { loadJS, loadCSS, loadModule ,addDiv,Router} from "./loader.js";
import  { ribbon,initializeRibbon } from "./jqxRibbon.js";
import  { tab, initializeTabs } from "./jqxTab.js"  ;
import { initMap ,loadMapData,loadHierarchy, loadTypeMap} from "./m.js";


// Router.add("/maps", () => initMap());
Router.add("/", () => console.log("Home"));
Router.add("/maps", () => console.log("maps page"));

Router.add("/kml", () => {
console.log("KML page");
window.closeInfoWindow = () => {
  if (window.infoWindow) {
    window.infoWindow.close();
  }
};
window.onload = async function () {
  try {
    console.log("Page loaded");

    // Load  CSS
    await loadCSS("./assets/css/m1map.css");
    await loadCSS("./assets/css/jqrightpanel.css");
    await loadCSS("./assets/css/jqadvanceTabs.css");
    await loadCSS("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css");
    await loadCSS("./plugins/jqwidgets/styles/jqx.base.css");    // Load  JS
    await loadCSS("./plugins/jqwidgets/styles/jqx.light.css");    // Load  JS

    await loadJS("https://code.jquery.com/jquery-3.6.4.min.js");
    await loadJS("./plugins/jqwidgets/jqxcore.js");
    await loadJS("./plugins/jqwidgets/jqxbuttons.js");
    await loadJS("./plugins/jqwidgets/jqxcheckbox.js");
    await loadJS("./plugins/jqwidgets/jqxscrollbar.js");
    await loadJS("./plugins/jqwidgets/jqxpanel.js");
    await loadJS("./plugins/jqwidgets/jqxtree.js");
    await loadJS("./plugins/jqwidgets/jqxmenu.js");
    await loadJS("./plugins/jqwidgets/jqxribbon.js");
    await loadJS("./plugins/jqwidgets/jqxTabs.js");
    await loadJS("./plugins/jqwidgets/scripts/demos.js");

    await loadJS("./plugins/jqwidgets/jqxradiobutton.js");
    await loadJS("./plugins/jqwidgets/jqxdragdrop.js");


    await loadJS("./assets/js/jqverticaltoolbar.js");
    await loadJS("./assets/js/jqrightpanel.js");
    await loadJS("./assets/js/jqadvanceTabs.js");

  await loadJS("./plugins/jqwidgets/jqxinput.js");
  await loadJS("./plugins/jqwidgets/jqxlistbox.js");
  await loadJS("./plugins/jqwidgets/jqxdropdownlist.js");
  await loadJS("./plugins/jqwidgets/jqxradiobutton.js");
  await loadJS("./plugins/jqwidgets/jqxpasswordinput.js");
  await loadJS("./plugins/jqwidgets/jqxnumberinput.js");
  await loadJS("./plugins/jqwidgets/jqxcalendar.js");
  await loadJS("./plugins/jqwidgets/jqxdatetimeinput.js");
  await loadJS("./plugins/jqwidgets/globalization/globalize.js");
  await loadJS("./plugins/jqwidgets/jqxform.js");
  await loadJS("./plugins/jqwidgets/jqxpopover.js");




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

    addDiv({ id: "right-panel", parent: document.body ,

      //  innerHTML: `
        //  <div id="appTabs" class="card"></div>`,

        innerHTML: `    
 
        <div id='jqxtabs'>
                <ul style='margin-left: 20px;'>
                  <li>Map</li>
                    <li>Information</li>
                </ul>

          <div id="sidepanel" class="card"><h2>Places</h2>
                 <button  id="btn-hide" title="Hide Boxs" style="float:right; background: none; border: none; color: #666; font-size: 20px; padding: 5; margin: 5; min-width: auto;">
       
        </button>  
        <div class="controls">
          <button id="saveSelected" class="btn small">Save Selected</button>
          <button id="saveAll" class="btn primary small">Save All</button>
          <button id="clearTemp" class="btn small">Clear Temp</button>
        </div> 
            <input id="kmlFile" type="file" accept=".kml" />
            <div style="height:10px"></div>
            <div id="jqxTree" class="card-body"></div>
          </div>
          <div id="infoPanel">
          <div id='elementForm' style="width: 280px; height: auto;"></div>   
          <div id='elementSubForm' style="width: 280px; height: auto;"></div>   
          </div>

        </div>`,
            });

//  Top-right mode selection UI
    addDiv({ id: "mode-ui", parent: document.body, });
    addDiv({ id: "popover1", parent: document.body,innerHTML: `  <div id="popup1"></div>  ` });
    addDiv({ id: "popover2", parent: document.body,innerHTML: `  <div id="popup2"></div>  ` });
    addDiv({ id: "popover3", parent: document.body,innerHTML: `  <div id="popup3"></div>  ` });
    addDiv({ id: "popover4", parent: document.body,innerHTML: `  <div id="popup4"></div>  ` });
    addDiv({ id: "popover5", parent: document.body,innerHTML: `  <div id="popup5"></div>  ` });
    addDiv({ id: "popover6", parent: document.body,innerHTML: `  <div id="popup6"></div>  ` });
    addDiv({ id: "popover7", parent: document.body,innerHTML: `  <div id="popup7"></div>  ` });
    addDiv({ id: "popover8", parent: document.body,innerHTML: `  <div id="popup8"></div>  ` });
    addDiv({ id: "popover9", parent: document.body,innerHTML: `  <div id="popup9"></div>  ` });


    await loadModule("./assets/js/m.js");
    await loadModule("./assets/js/m_mapelements.js");
    
    await loadHierarchy();
    await loadTypeMap();
    await initMap();
    loadMapData("GP","Hawalbag","Almora");
    loadMapData("OLT","Hawalbag","Almora");
    loadMapData("BTS","Hawalbag","Almora");
    
    loadMapData("OFC","","Almora");

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

