import { loadJS, loadCSS, loadModule, addDiv, Router } from "./loader.js";
  const scripts = [
    "https://code.jquery.com/jquery-3.6.4.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js",
    // "./assets/js/jqverticaltoolbar.js",
    "./assets/js/jqrightpanel.js",
     "./grid/columns/tableConfigs.js" ,
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
    "./plugins/jqwidgets/jqxwindow.js",
   
  ];


  const cssFiles = [
    // External Libraries & Frameworks
    "https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css",
    "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css",
    "https://code.ionicframework.com/ionicons/2.0.1/css/ionicons.min.css",
    "./grid/bulkupload.css",

    // jQWidgets Core Styles
    "./plugins/jqwidgets/styles/jqx.base.css",
    "./plugins/jqwidgets/styles/jqx.light.css",

    // Custom Assets
    "./newassets/css/main.css",
    "./newassets/css/jqrightpanel.css",
    // "./newassets/css/jqadvanceTabs.css"
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


async function loadAllDependencies() {

  for (const src of scripts) {
    try {
      await loadJS(src); 
      // console.log(`Success: ${src}`);
    } catch (e) {
      console.error(`Critical Load Error: ${src}`);
      break; // Stop the loop if a dependency fails
    }
  }
}



export { loadStyles, loadAllDependencies };
