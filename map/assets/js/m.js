import { PolylineManager } from "./PolylineManager.js";
import { MultiPolylineManager } from "./MultiPolylineManager.js";
import { UltraPolylineManager } from "./UltraPolylineManager.js"; 

// import { kml } from "https://cdn.jsdelivr.net/npm/@tmcw/togeojson@5.0.1/dist/togeojson.esm.js"
 import { kml } from "https://unpkg.com/@tmcw/togeojson@7.1.2?module";
import JSZip from "https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm";
import { loadJS, loadCSS, loadModule ,addDiv,Router} from "./loader.js";
import  { ribbon,initializeRibbon } from "./jqxRibbon.js";
import { initializeTabs } from "./jqxTab.js";

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

//   marker = new AdvanceMarkerManager(map);
//   polyline = new PolylineManager(map,editPolyline.handleVertexClick,null,setMode)

  let  polyManager = new PolylineManager(map);
  let  multiPolyManager = new MultiPolylineManager(map);
  let  ultraPolyManager = new UltraPolylineManager(map);  

  $("#right-panel").rightPullPanel({
    width: 300,
    topOffset: 60
  });


    $('#jqxtabs').jqxTabs({ width:  295, height: '100%',
        // initTabContent: function (tab) {
        // //     if (tab === 0) {
        // //         google.maps.event.addDomListener(window, 'load', initialize);
        // //     }
        // }
    });

   ///////////////////////////////////////////////////////////////////////////////////////////////
            var formTamplate = [

                {
                    type: 'label',
                    bind: 'radiobuttonValue_out',
                    label: 'Select OA :',
                    rowHeight: '40px',
                },
                
                {
                        columns: [
                            {
                                columnWidth: '150px',
                                bind: 'checkboxValueDDN',
                                type: 'boolean',
                                label: 'DDN',
                                labelPosition: 'right',
                                align: 'left',
                                labelPadding: {left: 0, top: 5, right: 0, bottom: 5}
                            },
                            {
                                columnWidth: '150px',
                                bind: 'checkboxvalueHWR',
                                type: 'boolean',
                                label: 'HWR',
                                labelPosition: 'right',
                                align: 'left',
                                labelPadding: {left: 0, top: 5, right: 0, bottom: 5}
                            },
                            {
                                columnWidth: '150px',
                                bind: 'checkboxValueNTL',
                                type: 'boolean',
                                label: 'NTL',
                                labelPosition: 'right',
                                align: 'left',
                                labelPadding: {left: 0, top: 5, right: 0, bottom: 5}
                            }
                        ]
                },
                {
                        columns: [
                            {
                                columnWidth: '150px',
                                bind: 'checkboxValueNWT',
                                type: 'boolean',
                                label: 'NWT',
                                labelPosition: 'right',
                                align: 'left',
                                labelPadding: {left: 0, top: 5, right: 0, bottom: 5}
                            },
                            {
                                columnWidth: '150px',
                                bind: 'checkboxValueSGR',
                                type: 'boolean',
                                label: 'SGR',
                                labelPosition: 'right',
                                align: 'left',
                                labelPadding: {left: 0, top: 5, right: 0, bottom: 5}
                            },
                            {
                                columnWidth: '150px',
                                bind: 'checkboxValueALM',
                                type: 'boolean',
                                label: 'ALM',
                                labelPosition: 'right',
                                align: 'left',
                                labelPadding: {left: 0, top: 5, right: 0, bottom: 5}
                            }
                        ]
                },
                {
                        type: 'label',
                        bind: 'Select_District_Block',
                        label: 'Select District and Block :',
                        rowHeight: '40px',
                } ,
                {
                        bind: 'dropdownDistrict',
                        type: 'option',
                        label: 'District',
                        labelPosition: 'left',
                        labelWidth: '30%',
                        align: 'left',
                        width: '150px',
                        // required: true,
                        component: 'jqxDropDownList',
                        options: [
                            { label: 'Option 1', value: 'value1' },
                            { label: 'Option 2', value: 'value2' },
                            { label: 'Option 3', value: 'value3' }
                        ]
                },

                {
                        bind: 'dropdownBlock',
                        type: 'option',
                        label: 'Block',
                        checkboxes: true,
                        labelPosition: 'left',
                        labelWidth: '30%',
                        align: 'left',
                        width: '150px',
                        // required: true,
                        component: 'jqxDropDownList',
                        options: [
                            { label: 'Option 1', value: 'value1' },
                            { label: 'Option 2', value: 'value2' },
                            { label: 'Option 3', value: 'value3' }
                        ]
                },
                {
                        type: 'label',
                        bind: 'select_options',
                        label: 'Select Elements :',
                        rowHeight: '40px',
                },
                
                {
                        columns: [
                            {
                                columnWidth: '150px',
                                bind: 'checkboxGP',
                                type: 'boolean',
                                // label: 'GP',
                                labelPosition: 'right',
                                align: 'left',
                                labelPadding: {left: 0, top: 5, right: 0, bottom: 5}
                            },
                            {
                                type: 'button',
                                bind: 'buttonGP',
                                text: 'GP',
                                width: '40px',
                                height: '30px',
                                rowHeight: '30px',
                                // columnWidth: '50%',
                                align: 'left',
                            },
                            
                            {
                                columnWidth: '150px',
                                bind: 'checkboxVillage',
                                type: 'boolean',
                                // label: 'Village',
                                labelPosition: 'right',
                                align: 'left',
                                labelPadding: {left: 0, top: 5, right: 0, bottom: 5}
                            },
                            {
                                type: 'button',
                                bind: 'buttonVIL',
                                text: 'VIL',
                                width: '40px',
                                height: '30px',
                                rowHeight: '30px',
                                // columnWidth: '50%',
                                align: 'left',
                            },
                            {
                                columnWidth: '150px',
                                bind: 'checkboxBHQ',
                                type: 'boolean',
                                // label: 'BHQ',
                                labelPosition: 'right',
                                align: 'left',
                                labelPadding: {left: 0, top: 5, right: 0, bottom: 5}
                            },
                            {
                                type: 'button',
                                bind: 'buttonBHQ',
                                text: 'BHQ',
                                width: '40px',
                                height: '30px',
                                rowHeight: '30px',
                                // columnWidth: '50%',
                                align: 'left',
                            },
                        ]
                },
                {
                        columns: [
                            {
                                columnWidth: '150px',
                                bind: 'checkboxOFC',
                                type: 'boolean',
                                // label: 'Route',
                                labelPosition: 'right',
                                align: 'left',
                                labelPadding: {left: 0, top: 5, right: 0, bottom: 5}
                            },
                            {
                                type: 'button',
                                bind: 'buttonOFC',
                                text: 'OFC',
                                width: '40px',
                                height: '30px',
                                rowHeight: '30px',
                                // columnWidth: '50%',
                                align: 'left',
                            },
                            {
                                columnWidth: '150px',
                                bind: 'checkboxBTS',
                                type: 'boolean',
                                // label: 'BTS',
                                labelPosition: 'right',
                                align: 'left',
                                labelPadding: {left: 0, top: 5, right: 0, bottom: 5}
                            },
                            {
                                type: 'button',
                                bind: 'buttonBTS',
                                text: 'BTS',
                                width: '40px',
                                height: '30px',
                                rowHeight: '30px',
                                // columnWidth: '50%',
                                align: 'left',
                            },
                            {
                                columnWidth: '150px',
                                bind: 'checkboxOLT',
                                type: 'boolean',
                                // label: 'OLT',
                                labelPosition: 'right',
                                align: 'left',
                                labelPadding: {left: 0, top: 5, right: 0, bottom: 5}
                            },
                            {
                                type: 'button',
                                bind: 'buttonOLT',
                                text: 'OLT',
                                width: '40px',
                                height: '30px',
                                rowHeight: '30px',
                                // columnWidth: '50%',
                                align: 'left',
                            },
                        ]
                },                        
                {
                        columns: [
                            {
                                columnWidth: '10px',
                                bind: 'checkboxSAS',
                                type: 'boolean',
                                labelWidth: '10px',
                                label: '',
                                // labelPosition: 'right',
                                // align: 'left',
                                labelPadding: {left: 0, top: 5, right: 0, bottom: 5}
                            },
                            {
                                type: 'button',
                                bind: 'buttonSAS',
                                text: 'SAS',
                                width: '40px',
                                height: '30px',
                                rowHeight: '30px',
                                // columnWidth: '50%',
                                align: 'left',
                            },
                            {
                                columnWidth: '150px',
                                bind: 'checkboxSchools',
                                type: 'boolean',
                                // label: 'Schools',
                                labelPosition: 'right',
                                align: 'left',
                                labelPadding: {left: 0, top: 5, right: 0, bottom: 5}
                            },
                                {
                                type: 'button',
                                bind: 'buttonSCH',
                                text: 'SCH',
                                width: '40px',
                                height: '30px',
                                rowHeight: '30px',
                                // columnWidth: '50%',
                                align: 'left',
                            },
                            {
                                columnWidth: '150px',
                                bind: 'checkboxPHC',
                                type: 'boolean',
                                // label: 'PHC',
                                labelPosition: 'right',
                                align: 'left',
                                labelPadding: {left: 0, top: 5, right: 0, bottom: 5}
                            },
                                {
                                type: 'button',
                                bind: 'buttonPHC',
                                text: 'PHC',
                                width: '40px',
                                height: '30px',
                                rowHeight: '30px',
                                // columnWidth: '50%',
                                align: 'left',
                            },
                        ]
                },  
                ];

   
            var sampleValue = {
                'textBoxValue': 'text box value',
                'passwordBoxValue': 'password box',
                'nubmberBoxValue': 67.44,
                'datetimeBoxValue': '2018-06-01 14:05:23',
                'timeBoxValue': '2018-07-01 11:05:23',
                'dateBoxValue': '2018-07-04 15:05:23',
                'dropdownValue': 'value3',
                'radiobuttonValue': 'value2',
                'checkboxValue1': false,
                'checkboxValue2': false,
                'checkboxValue3': true,
            };
            $('#elementForm').jqxForm({
                template: formTamplate,
                // value: sampleValue,
                padding: { left: 2, top: 2, right: 2, bottom: 2 }
            });
            $("#el_elementForm4").jqxDropDownList({checkboxes:true}); 
            $("#el_elementForm5").jqxDropDownList({checkboxes:true}); 
            
            // var subFormTemplate = {GP:[ ],VIL:[ ],BHQ:[ ],OFC:[ ],BTS:[ ],OLT:[ ],SAS:[ ],SCH:[ ],PHC:[ ]};
            var subFormTemplate = {gpOptions :[ ],vilOptions:[ ],bhqOptions:[ ],ofcOptions:[ ],btsOptions:[ ],oltOptions:[ ],sasOptions:[ ],schOptions:[ ],phcOptions:[ ]};     
            let gpOptions= ['UP','DN','M90'];
            let vilOptions= ['COV','NCO'];
            let bhqOptions= ['PH1' ,'ABP'];
            let ofcOptions= ['BN','CIR','CNTX'];
            let btsOptions= ['2G','3G','4G'];
            let oltOptions= ['TIP','BNU','BAF'];
            let sasOptions= ['UP','DN','M90'];
            let schOptions= ['WK','NWK','FES'];
            let phcOptions= ['WK','NWK','FES'];
           
         //   [...gpOptions,...vilOptions,...bhqOptions,...ofcOptions,...btsOptions,...oltOptions,...sasOptions,...schOptions,...phcOptions].forEach(opt=>{   
            //   [gpOptions,vilOptions,bhqOptions,ofcOptions,btsOptions,oltOptions,sasOptions,schOptions,phcOptions].forEach(opt=>{   
         
            //     opt.forEach(val=>{
            //     subFormTemplate[opt].push({
            //         bind: `checkbox${opt}_${val}`,
            //         type: 'boolean',
            //         label: val,
            //         labelPosition: 'right',
            //         align: 'left',
            //         labelPadding: {left: 0, top: 5, right: 0, bottom: 5}
            //     })
            // })});

       [
        ['gpOptions', gpOptions],
        ['vilOptions', vilOptions],
        ['bhqOptions', bhqOptions],
        ['ofcOptions', ofcOptions],
        ['btsOptions', btsOptions],
        ['oltOptions', oltOptions],
        ['sasOptions', sasOptions],
        ['schOptions', schOptions],
        ['phcOptions', phcOptions]
        ].forEach(([key, opt]) => {

        subFormTemplate[key].push({
            columns: opt.map(val => ({
            bind: `checkbox_${key}_${val}`,
            type: 'boolean',
            label: val,
            labelPosition: 'right',
            align: 'left',
            labelPadding: { left: 0, top: 5, right: 0, bottom: 5 }
            }))
        });

        });
           
            $("#el_elementForm7_1").on("click", () => createSubForm("gpOptions"));
            $("#el_elementForm7_3").on("click", () => createSubForm("vilOptions"));
            $("#el_elementForm7_5").on("click", () => createSubForm("bhqOptions")); 
            $("#el_elementForm8_1").on("click", () => createSubForm("ofcOptions")); 
            $("#el_elementForm8_3").on("click", () => createSubForm("btsOptions"));
            $("#el_elementForm8_5").on("click", () => createSubForm("oltOptions"));
            $("#el_elementForm9_1").on("click", () => createSubForm("sasOptions"));
            $("#el_elementForm9_3").on("click", () => createSubForm("schOptions"));
            $("#el_elementForm9_5").on("click", () => createSubForm("phcOptions")); 

            function createSubForm(type){
                console.log(subFormTemplate[type]);
                let tmpl = [{
                    type: 'label',
                    bind: type,
                    label: type.replace("Options","").toUpperCase() + ' Options :',
                    rowHeight: '40px',
                },...subFormTemplate[type]];
                $('#elementSubForm').jqxForm({
                    template: tmpl,
                    padding: { left: 2, top: 2, right: 2, bottom: 2 }
                });
                
                $('#elementSubForm').jqxForm('refresh');
            }

            // $("#popover1").jqxPopover({offset: {left: -50, top:0}, arrowOffsetValue: 50, title: "Select Options", showCloseButton: true, selector: $("#el_sampleForm7_1") });
            // $("#popover2").jqxPopover({offset: {left: -50, top:0}, arrowOffsetValue: 50, title: "Select Options", showCloseButton: true, selector: $("#el_sampleForm7_3") });
            // $("#popover3").jqxPopover({offset: {left: -50, top:0}, arrowOffsetValue: 50, title: "Select Options", showCloseButton: true, selector: $("#el_sampleForm7_5") });
            // $("#popover4").jqxPopover({offset: {left: -50, top:0}, arrowOffsetValue: 50, title: "Select Options", showCloseButton: true, selector: $("#el_sampleForm8_1") });
            // $("#popover5").jqxPopover({offset: {left: -50, top:0}, arrowOffsetValue: 50, title: "Select Options", showCloseButton: true, selector: $("#el_sampleForm8_3") });
            // $("#popover6").jqxPopover({offset: {left: -50, top:0}, arrowOffsetValue: 50, title: "Select Options", showCloseButton: true, selector: $("#el_sampleForm8_5") });
            // $("#popover7").jqxPopover({offset: {left: -50, top:0}, arrowOffsetValue: 50, title: "Select Options", showCloseButton: true, selector: $("#el_sampleForm9_1") });
            // $("#popover8").jqxPopover({offset: {left: -50, top:0}, arrowOffsetValue: 50, title: "Select Options", showCloseButton: true, selector: $("#el_sampleForm9_3") });
            // $("#popover9").jqxPopover({offset: {left: -50, top:0}, arrowOffsetValue: 50, title: "Select Options", showCloseButton: true, selector: $("#el_sampleForm9_5") });



/////////////////////////////////////////////////////////////////////////////////

           








  statusEl = document.getElementById("status");
  



// initializeRibbon();
// initializeTabs();
//    let tabTree = `    
//         <button  id="btn-hide" title="Hide Boxs" style="float:right; background: none; border: none; color: #666; font-size: 20px; padding: 5; margin: 5; min-width: auto;">
       
//         </button>  
//         <div class="controls">
//           <button id="saveSelected" class="btn small">Save Selected</button>
//           <button id="saveAll" class="btn primary small">Save All</button>
//           <button id="clearTemp" class="btn small">Clear Temp</button>
//         </div>
//         <div id="sidepanel" class="card"><h2>Places</h2> 
//           <input id="kmlFile" type="file" accept=".kml" />
//           <div style="height:10px"></div>
//           <div id="jqxTree" class="card-body"></div>
//         </div>`;

// const tabs = [
//   { id: "jqxTree", title: "Load KML", content: tabTree },
//   { id: "EditMaps", title: "Users", url: "/users.html" },     // Ajax load
//   { id: "Settings", title: "Settings", content: "<p>Settings</p>" }
// ];

// const tabManager = $("#appTabs").advancedTabs({
//   data: tabs,
//   activeIndex: 0,
//   animation: true
// });


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
          // manager.disable();
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
      // polyManager.enableDraw()
      ultraPolyManager.enableDraw();  

      // manager.enable();
      // editPolyline.setRoute()
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
       if(oldMode=="Route")  ultraPolyManager.clearDrawing();

        
    },

    resize() {
      console.log("Resize tool activated");
    },

    delete() {
      console.log("Delete all");
        if(mode=="point") editMarker.remove();
        if(mode=="route") ultraPolyManager.delete(1);
    },

    undo() {
      console.log("Undo last action");
        if(mode=="route") ultraPolyManager.undo();
    },

    redo() {
      console.log("Redo last action");
       if(mode=="route") ultraPolyManager.redo();
    },

    export() {
      console.log("Export data");
    },
    save() {
      console.log("Save data");
     if(mode=="route")  ultraPolyManager.save("Route 1")
    },
    load() {
      console.log("Load data");
     if(mode=="route") ultraPolyManager.load(1)
    },
    upload() {
      console.log("Upload data");
     if(mode=="route")  ultraPolyManager.save("Route 1")
    },
    maps() {
      console.log("maps");
      Router.go("uktx/map/#/maps");
    },
    kml() {
      console.log("Upload data");
      Router.go("uktx/map/#/kml");
    },
   
   };
 
   document.getElementById("clearTemp").addEventListener("click",()=>{

    var items = $('#jqxTree').jqxTree('getItems');
    console.log(items)
   })

  
  ctxMenu = document.getElementById("contextMenu");
  

//   const viewer = new KMLViewer(map);

//   document.getElementById("kmlFile").addEventListener("change", e => {
//   viewer.loadFile(e.target.files[0]);
// });


document.addEventListener('keydown', e => {
    if (e.key === 'n') ultraPolyManager.startCreate();
    if (e.ctrlKey && e.key === 'z') ultraPolyManager.undo();
    if (e.ctrlKey && e.key === 'y') ultraPolyManager.redo();
    if (e.key === 'Delete' && ultraPolyManager.activePolyline)
        ultraPolyManager.delete(ultraPolyManager.activePolyline);
    if (e.key === 's' && ultraPolyManager.activePolyline)
        ultraPolyManager.save(ultraPolyManager.activePolyline, 'Polyline');
});

  
}

/// new function 
function setMode(newMode) {
$("#" + newMode).trigger("click");
}




export { initMap};