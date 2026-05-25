import { loadJS, loadCSS, loadModule, addDiv, Router } from "./loader.js";
  const scriptsT = [
    // "https://code.jquery.com/jquery-3.6.4.min.js",
    "./newassets/js/jquery-3.6.4.min.js",
         "./newassets/js/cookies.js",   


    // "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js",
     "./newassets/js/xlsx.full.min.js",
    // "./assets/js/jqverticaltoolbar.js",
    "./newassets/js/jqrightpanel.js",
    "./newassets/js/jqverticaltoolbar.js",

   
     // Leaflet Map
    //  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
     "https://unpkg.com/@mapbox/polyline",
     "./newassets/js/leaflet.js",
     "./newassets/js/L.KML.js",
     "./newassets/js/leaflet-omnivore.min.js",
     "./newassets/js/jszip.min.js",
     "./newassets/js/togeojson.umd.js",



    //  "https://cdn.jsdelivr.net/npm/leaflet-kml@1.0.0/L.KML.js",
    //  "https://cdnjs.cloudflare.com/ajax/libs/leaflet-omnivore/0.3.4/leaflet-omnivore.min.js",
    //  "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js",
    //  "https://cdn.jsdelivr.net/npm/@tmcw/togeojson@5.8.0/dist/togeojson.umd.js",
    //  "./editmap/js/app.js",

    //  "./grid/bulkupload.js",
    // "./assets/js/jqadvanceTabs.js",
    // jQWidgets Core Scripts
    "./plugins/jqwidgets/jqxcore.js",
    "./plugins/jqwidgets/jqxbuttons.js",
    "./plugins/jqwidgets/jqxcheckbox.js",
    "./plugins/jqwidgets/jqxscrollbar.js",
    "./plugins/jqwidgets/jqxpanel.js",
    "./plugins/jqwidgets/jqxtree.js",
    "./plugins/jqwidgets/jqxmenu.js",
    "./plugins/jqwidgets/jqxribbon.js",
    "./plugins/jqwidgets/jqxTabs.js",
    "./plugins/jqwidgets/scripts/demos.js",
    "./plugins/jqwidgets/jqxradiobutton.js",
    "./plugins/jqwidgets/jqxdragdrop.js",
    "./plugins/jqwidgets/jqxinput.js",
    "./plugins/jqwidgets/jqxlistbox.js",
    "./plugins/jqwidgets/jqxdropdownlist.js",
    "./plugins/jqwidgets/jqxpasswordinput.js",
    "./plugins/jqwidgets/jqxnumberinput.js",
    "./plugins/jqwidgets/jqxcalendar.js",
    "./plugins/jqwidgets/jqxdatetimeinput.js",
    "./plugins/jqwidgets/globalization/globalize.js",
    "./plugins/jqwidgets/jqxform.js",
    "./plugins/jqwidgets/jqxpopover.js",
    "./plugins/jqwidgets/jqxdata.js",
    "./plugins/jqwidgets/jqxgrid.js",
    "./plugins/jqwidgets/jqxgrid.filter.js",
    "./plugins/jqwidgets/jqxgrid.sort.js",
    "./plugins/jqwidgets/jqxgrid.pager.js",
    "./plugins/jqwidgets/jqxgrid.edit.js",
    "./plugins/jqwidgets/jqxgrid.selection.js",
    "./plugins/jqwidgets/jqxgrid.grouping.js",
    "./plugins/jqwidgets/jqxgrid.aggregates.js",
    "./plugins/jqwidgets/jqxexport.js",
    "./plugins/jqwidgets/jszip.min.js",
    "./plugins/jqwidgets/jqxdatatable.js",
    "./plugins/jqwidgets/jqxdata.export.js",
    "./plugins/jqwidgets/jqxgrid.export.js",
    "./plugins/jqwidgets/jqxwindow.js",
   
  ];
  
  const scriptsB = [
     "./newassets/js/columns/tableConfigs1.js" ,
     "./newassets/js/map.js",
     "./newassets/js/kml.js",
     "./newassets/js/myjqxform.js",
     "./newassets/js/bulkupload.js",


  // <!-- new scripts — order matters -->
  "https://cdn.jsdelivr.net/npm/chart.js", //  <!-- for elevation chart -->
   "./newassets/js/editmap/js/files/context_menu.js",
  "./newassets/js/editmap/js/files/db_upload.js",
  "./newassets/js/editmap/js/files/directions_tool.js",
  "./newassets/js/editmap/js/files/editPlacemark.js",
       "./newassets/js/editmap/js/load_kml.js",
    //  "./newassets/js/editmap/js/app.js",
    //  "./newassets/js/editmap/js/kml_parser.js",
     "./newassets/js/editmap/js/editor1.js",




  ];


  const modules =[
// "./newassets/js/map.js",
// "./newassets/js/myjqxform.js",
  ]
  const cssFiles = [
    // External Libraries & Frameworks
    "https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css",
    // "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css",
    "https://code.ionicframework.com/ionicons/2.0.1/css/ionicons.min.css",

    // "./newassets/css/bootstrap.min.css",
    // "./newassets/css/all.min.css",
    // "./newassets/css/ionicons.min.css",


    "./grid/bulkupload.css",
    "./newassets/css/kml.css",
    "./newassets/css/jqverticaltoolbar.css?v=1.1",

    //leaflet map
    "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
    "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css",
    "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap" ,

    //  "./newassets/css/leaflet.css",
    // "./newassets/css/all.min.css",

    // jQWidgets Core Styles
    "./plugins/jqwidgets/styles/jqx.base.css",
    "./plugins/jqwidgets/styles/jqx.light.css",

    // Custom Assets
    "./newassets/css/main.css",
    "./newassets/css/jqrightpanel.css",
    "./newassets/js/editmap/css/editmap.css",
    "./newassets/js/editmap/css/kml-label.css?v=1.3",

  ];


async function loadStyles() {

  for (let i = 0; i < cssFiles.length; i++) {
    try {
      // Assuming you have a helper function called loadCSS
      await loadCSS(cssFiles[i]); 
      // console.log(`Style loaded: ${cssFiles[i]}`);
    } catch (error) {
      console.error(`Failed to load CSS: ${cssFiles[i]}`, error);
    }
  }
}


async function loadTopDependencies() {

  for (const src of scriptsT) {
    try {
      await loadJS(src); 
      // console.log(`Success: ${src}`);
    } catch (e) {
      console.error(`Critical Load Error: ${src}`);
      break; // Stop the loop if a dependency fails
    }
  }
}

async function loadBottomDependencies() {

  for (const src of scriptsB) {
    try {
      await loadJS(src); 
      // console.log(`Success: ${src}`);
    } catch (e) {
      console.error(`Critical Load Error: ${src}`);
      break; // Stop the loop if a dependency fails
    }
  }
}



async function loadAllModules() {

  for (const src of modules) {
    try {
      await loadModule(src); 
      // console.log(`Success: ${src}`);
    } catch (e) {
      console.error(`Critical Load Error: ${src}`);
      break; // Stop the loop if a dependency fails
    }
  }
}

export { loadStyles, loadTopDependencies ,loadBottomDependencies,loadAllModules};
