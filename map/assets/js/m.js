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
const { Map } = await google.maps.importLibrary("maps");
const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
const { Marker } = await google.maps.importLibrary("marker");

//load block json file
let hierarchy = {};

async function loadHierarchy() {
  try {
    const res = await fetch('hierarchy.json'); // path to your file
    hierarchy = await res.json();

    console.log("Hierarchy loaded:", hierarchy);

  } catch (err) {
    console.error("Error loading hierarchy:", err);
  }
}


async function initMap() {

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

    $("#right-panel").rightPullPanel({ width: 300,topOffset: 60 });
    $('#jqxtabs').jqxTabs({ width:  295, height: '100%'});

   ///////////////////////////////////////////////////////////////////////////////////////////////
   // FORM CREATION 
        var template = [ {
        type: 'label',
        bind: 'radiobuttonValue_out',
        label: 'Select OA :',
        rowHeight: '40px',
         }];     
   
          var OA = ["DDN", "HWR", "NTL", "NWT", "SGR", "ALM"];
          var OAValues= {DDN:false, HWR:false, NTL:false, NWT:false, SGR:false, ALM:true};
          var OANames= {DDN:'Dehradun',HWR:'Haridwar',NTL:'Nainital',NWT:'New Tehri',SGR:'Srinagar',ALM:'Almora'};
          var OAvalues1= [false, false, false, true, false, true];
          var OAelementId= {DDN:'el_elementForm1_0',HWR:'el_elementForm1_1',NTL:'el_elementForm1_2',NWT:'el_elementForm2_0',SGR:'el_elementForm2_1',ALM:'el_elementForm2_2'};
          var districtValues= {Almora:true, Dehradun:false, Haridwar:false, Nainital:false, "U S Nagar":false, Srinagar:false,Pauri:false, Pithoragarh:false, Champawat:false, Rudraprayag:false, "New Tehri":false, Uttarkashi:false};

        let oaValueObj = OA.reduce((acc, key, index) => {
            acc["chk" + key] = OAValues[key];
            return acc;
        }, {});


            for (let i = 0; i < OA.length; i += 3) {
                let row = { columns: [] };

                for (let j = i; j < i + 3 && j < OA.length; j++) {
                    row.columns.push({
                        bind: "chk"+ OA[j],
                        type: 'boolean',
                        label: OA[j]
                    });
                }

                template.push(row);
            }  

               template= template.concat([
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
                        // checkboxes: true,
                        labelWidth: '30%',
                        align: 'left',
                        width: '150px',
                        // required: true,
                        component: 'jqxDropDownList',
                        options: [
                            { label: 'Dehradun', value: 'Dehradun' },
                            { label: 'Almora', value: 'Almora' },
                            { label: 'Nainital', value: 'Nainital' },
                            { label: 'Haridwar', value: 'Haridwar' }
                        ],
                        // init: function (component) {
                        // component.jqxDropDownList({
                        //     checkboxes: true,
                        //     displayMember: 'label',
                        //     valueMember: 'value'
                        // }); }   
                },

                {
                        bind: 'dropdownBlock',
                        type: 'option',
                        label: 'Block',
                        // checkboxes: true,
                        labelPosition: 'left',
                        labelWidth: '30%',
                        align: 'left',
                        width: '150px',
                        // required: true,
                        component: 'jqxDropDownList',
                         options: [
                            { label: 'Raipur', value: 'Raipur' },
                            { label: 'Haldwani', value: 'Haldwani' },
                            { label: 'Hawalbag', value: 'Hawalbag' },
                            { label: 'Laksar', value: 'Laksar' }
                        ],
 
                        // init: function (component) {
                        // component.jqxDropDownList({
                        //     checkboxes: true,
                        //     displayMember: 'label',
                        //     valueMember: 'value'
                        // });} 
                },
                {
                        type: 'label',
                        bind: 'select_options',
                        label: 'Select Elements :',
                        rowHeight: '40px',
                }]


               );
            
            

            var btnElements = ["GP", "VIL", "BHQ", "OFC", "BTS", "OLT", "SAS", "SCH", "PHC"  ];
            var btnElementId= {GP:'el_elementForm7_1',VIL:'el_elementForm7_3',BHQ:'el_elementForm7_5',OFC:'el_elementForm8_1',BTS:'el_elementForm8_3',OLT:'el_elementForm8_5',SAS:'el_elementForm9_1',SCH:'el_elementForm9_3',PHC:'el_elementForm9_5'}; 
            var btnValues = [false, false, true, false, true, false, true, false, true];
            var btnValueObj ={GP:false, VIL:false, BHQ:true, OFC:false, BTS:true, OLT:false, SAS:true, SCH:false, PHC:true};



            let btnInitialValue = btnElements.reduce((acc, key, index) => {
                acc["chk"+ key] = btnValueObj[key];
                return acc;
            }, {});

            var btns=[]   

            for (let i = 0; i < btnElements.length; i += 3) {
                let row = { columns: [] };

                for (let j = i; j < i + 3 && j < btnElements.length; j++) {
                    row.columns.push({
                        bind: "chk"+ btnElements[j],
                        type: 'boolean',
                        
                    });
                    row.columns.push({  

                            type: 'button',
                            bind: 'btn' + btnElements[j],
                            text: btnElements[j],
                            width: '40px',
                            height: '30px',
                            rowHeight: '30px',
                            align: 'left',
                        });



                }

                btns.push(row);
            }      
                
           template= template.concat(btns);
  
            $('#elementForm').jqxForm({
                template: template,
                value: {...oaValueObj,...btnInitialValue      },
                padding: { left: 2, top: 2, right: 2, bottom: 2 }
            });
          

          
            btnElements.forEach(item => {$("#" + btnElementId[item]).jqxButton({ disabled: !btnValueObj[item] })});
       

            const selectedOAs= ["Almora"]; // Example: Getting districts for a specific OA
            //et district and block from hierarchy
            const districts = [...new Set(selectedOAs.flatMap(oa => Object.keys(hierarchy[oa] || {})))];
            let selectedDistricts = Object.keys(districtValues).filter(key => districtValues[key] === true);

            const blocks = [...new Set(selectedDistricts.flatMap(dist => Object.values(hierarchy).map(oa => oa[dist] || []).flat()  ))];

            $("#el_elementForm4").jqxDropDownList("clear");
            $("#el_elementForm4").jqxDropDownList({checkboxes:true,source: districts  }); 
           //check selected districts
           
            selectedDistricts.forEach(item => { $("#el_elementForm4").jqxDropDownList('checkItem', item );}); 

            // District Dropdown change event
            $("#el_elementForm4").on('checkChange', function (event)
                {
                    if (event.args) {
                    var item = event.args.item;
                    var value = item.value;
                    var label = item.label;
                    var checked = item.checked;
                    var checkedItems = $("#el_elementForm4").jqxDropDownList('getCheckedItems');
                    // Addig removing blocks based on district selection
                    const blocks = Object.values(hierarchy).flatMap(oa => oa[label] || []);
                    checked ? blocks.forEach(block=> $("#el_elementForm5").jqxDropDownList('addItem',block )) : blocks.forEach(block=> $("#el_elementForm5").jqxDropDownList('removeItem',block)); 
                        
                }

                // Disabling other districts if 2 are already selected
                if (!event.args) return;

                var dropdown = $("#el_elementForm4");

                var checkedItems = dropdown.jqxDropDownList('getCheckedItems');

                // 🔥 Step 1: count checked
                if (checkedItems.length >= 2) {

                    // disable all unchecked items
                    var allItems = dropdown.jqxDropDownList('getItems');

                    allItems.forEach(item => {
                        if (!item.checked) {
                            dropdown.jqxDropDownList('disableItem', item);
                        }
                    });

                } else {
                    // 🔥 enable all again
                    var allItems = dropdown.jqxDropDownList('getItems');

                    allItems.forEach(item => {
                        dropdown.jqxDropDownList('enableItem', item);
                    });
                }



                });



            // districtValues.forEach(val => {
            //     $("#el_elementForm4").jqxDropDownList('checkItem', val);
            // });

            $("#el_elementForm5").jqxDropDownList({checkboxes:true}); 
            $("#el_elementForm5").jqxDropDownList("clear");
            $("#el_elementForm5").jqxDropDownList({checkboxes:true,source: blocks  }); 
            
            // blockValues.forEach(val => {
            //     $("#el_elementForm5").jqxDropDownList('checkItem', val);
            // });

            $("#el_elementForm5").on('checkChange', function (event)
                {
                    if (event.args) {
                    var item = event.args.item;
                    var value = item.value;
                    var label = item.label;
                    var checked = item.checked;
                    var checkedItems = $("#el_elementForm4").jqxDropDownList('getCheckedItems');
                       
                }

                // Disabling other blocks if 2 are already selected
                if (!event.args) return;

                var dropdown = $("#el_elementForm5");

                var checkedItems = dropdown.jqxDropDownList('getCheckedItems');

                // 🔥 Step 1: count checked
                if (checkedItems.length >= 2) {

                    // disable all unchecked items
                    var allItems = dropdown.jqxDropDownList('getItems');

                    allItems.forEach(item => {
                        if (!item.checked) {
                            dropdown.jqxDropDownList('disableItem', item);
                        }
                    });

                } else {
                    // 🔥 enable all again
                    var allItems = dropdown.jqxDropDownList('getItems');

                    allItems.forEach(item => {
                        dropdown.jqxDropDownList('enableItem', item);
                    });
                }



                });

         
            
            $("#elementForm").on('formDataChange', function (event) {

                let prev = event.args.previousValue;
                let curr = event.args.value;
                let changedField = Object.keys(curr).find(k => prev[k] !== curr[k]);
               
                let chel = changedField?.replace('chk', '');
                // Check if Checkbox field is changed and belongs to OA or Element
                if (OA.includes(chel)) {
                        
                        let isChecked = curr[changedField];
                        console.log("✅ OA checkbox changed:", chel , ",Checked:", isChecked);
                         // 🔥 Step 2: count checked OA checkboxes
                        let checkedOAs = OA.filter(chel => curr["chk" + chel] === true);
                        console.log("Checked OAs:", checkedOAs);
                        // 🔥 Step 3: apply rule that if >2 OA is selected then disable others
                        if (checkedOAs.length >= 2) {

                            OA.forEach(item => {
                                if (!checkedOAs.includes(item)) {
                                  // var chk =  $("#elementForm").jqxForm('getComponentByName', "chk" + item);
                                  $("#" + OAelementId[item]).jqxCheckBox({ disabled: true });
                                   $("#label_" + OAelementId[item]).css("pointer-events", "none");  // Disable click on label
                                }
                            });

                        } else {
                            // enable all
                            OA.forEach(item => {
                                // var chk =  $("#elementForm").jqxForm('getComponentByName', "chk" + item);
                                $("#" + OAelementId[item]).jqxCheckBox({ disabled: false }); // Enable Checkbokes
                                 $("#label_" + OAelementId[item]).css("pointer-events", "auto"); // Enablee click on label
                            });
                        }

                        // load distrct based on OA selection
                        const districts = Object.keys(hierarchy[OANames[chel]] || {}).sort();
                        //console.log("Districts for selected OAs:", districts);
                        isChecked ? districts.forEach(district=> $("#el_elementForm4").jqxDropDownList('addItem',district )) : districts.forEach(district=> $("#el_elementForm4").jqxDropDownList('removeItem',district)); 
                        

                }

                // Check if changed field is element button
                if (btnElements.includes(chel)) {
                        
                        let isChecked = curr[changedField];
                        console.log("✅ Element checkbox changed:", chel , ",Checked:", isChecked);
                     
                        isChecked ? $('#' + btnElementId[chel] ).jqxButton({ disabled: false }) : $('#' + btnElementId[chel] ).jqxButton({ disabled: true });
                }

              
    
            });

           // SUB FORM CREATION for every element button                     
            var subFormTemplate = {GP :[ ],VIL :[ ],BHQ :[ ],OFC :[ ],BTS :[ ],OLT :[ ],SAS :[ ],SCH :[ ],PHC :[ ]};
 
            var subFormElements = {
                GP :['UP','DN','M90','L90'],
                VIL :['COV','NCO'],
                BHQ :['PH1','ABP'],
                OFC :['BN','CIR','CNTX'],
                BTS :['2G','3G','4G','UP','DN','ML','OFC',"SAT"],
                OLT :['TIP','BNU','BAF'],
                SAS :['UP','DN','M90'],
                SCH:['WK','NWK','FES'],
                PHC:['WK','NWK','FES']
            };     
            


            var subFormElementsValue = {
                GP :[true, false, true, false],
                VIL :[true, false],
                BHQ :[true, false],
                OFC :[true, false, false],
                BTS :[true, false, false, true, false, false, false, true],
                OLT :[true, false, false],
                SAS :[true,false, false],
                SCH :[true,false, false],
                PHC :[true,false, false]
            };   

            let initialElementValue = {};

            Object.keys(subFormElementsValue).forEach(group => {
                let values = subFormElementsValue[group];
                let keys = subFormElements[group];

                let groupName = group.replace("Options", "").toUpperCase();

                initialElementValue[groupName] = {};

                values.forEach((val, index) => {
                    initialElementValue[groupName]['chk'+ groupName+ keys[index]] = val;
                });
            });



            Object.entries(subFormElements).forEach(([key, value]) => {
                for (let i = 0; i < value.length; i += 3) {
                let row = { columns: [] };

                for (let j = i; j < i + 3 && j < value.length; j++) {
                    row.columns.push({
                        bind: 'chk' + key+ value[j],
                        type: 'boolean',
                        label: value[j]
                    });
                }

                subFormTemplate[key].push(row);
            } 
               
            });




            $('#elementForm').on('buttonClick', function (event) {
            var args = event.args;
            var text = args.text // clicked button's text.;
            var name = args.name // clicked button's name.;
            createSubForm(text);

             });
                
    

            function createSubForm(type){
                // console.log(subFormTemplate[type]);
                // console.log(initialElementValue[type]);
                let tmpl = [{
                    type: 'label',
                    bind: type,
                    label: type.replace("Options","").toUpperCase() + ' Options :',
                    rowHeight: '40px',
                },...subFormTemplate[type]];
              
                if ($("#elementSubForm").data('jqxForm')) {
                    $("#elementSubForm").jqxForm('destroy');
                    $("#elementSubForm").remove();
                    $("#infoPanel").append('<div id="elementSubForm" style="width: 280px; height: auto;"></div>   ');
                }
                $('#elementSubForm').jqxForm({
                    template: tmpl,
                    padding: { left: 2, top: 2, right: 2, bottom: 2 },
                    value: initialElementValue[type] || {}
                });
                
             
                $('#elementSubForm').on('formDataChange', function (event) {
                  var args = event.args;
                  console.log(args)
                  var newValue = args.value;
                  var previousValue = args.previousValue;

                  var formattedChanges = getFormattedChanges(args);
                  applyFilters(formattedChanges);

                  // for (var i in newValue) {
                  //   // var newInputValue = newValue[i]; // current input's value.
                  //   // var previousInputValue = previousValue[i]; // previous input's value.
                  // }
                });
                $('#elementSubForm').jqxForm('refresh');


            }

          function getFormattedChanges(obj) {
              let { value, previousValue } = obj;

              // ✅ Get type (key without 'chk')
              let typeKey = Object.keys(value).find(k => !k.startsWith('chk'));
              let type = typeKey;

              let changes = [];

              Object.keys(value).forEach(key => {
                  if (key.startsWith('chk')) {
                      let oldVal = previousValue[key];
                      let newVal = value[key];

                      if (oldVal !== newVal) {
                          // Extract suffix (remove 'chk' + type)
                          let suffix = key.replace('chk' + type, '');

                          changes.push(`${suffix}=${newVal.toString().toUpperCase()}`);
                      }
                  }
              });

              return {
                  type: type,
                  changes: `(${changes.join(', ')})`
              };
          }

          function applyFilters(formattedChanges) {

            



            switch (value) {
              case 'A':
                // code
                break;

              case 'B':
                // code
                break;

              default:
                // fallback
            }


          }            
////////////////////////////////////////////////////////////////////////////////










         
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

/////////////////////////////////////////////////////////////////////////////////////////////

function parseLatLng(str) {
  const [lat, lng] = str.split(',').map(Number);
  return { lat, lng };
}

function getDistricts(oa) {
  return Object.keys(hierarchy[oa] || {});
}

async function loadMapData(type) {

  // const blocks = hierarchy["Almora"]["Pithoragarh"]; // Example: Accessing blocks under a specific district and block
  // const selectedOAs= ["Almora","New Tehri"]; // Example: Getting districts for a specific OA
  // const districts = [...new Set(selectedOAs.flatMap(oa => Object.keys(hierarchy[oa] || {})))];
  // console.log(districts);
  // const blocks = [...new Set(districts.flatMap(dist => Object.values(hierarchy).map(oa => oa[dist] || []).flat()  ))];
  // console.log(blocks);
 
  try {
    const res = await fetch('assets/php/data.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({type:type})
    });

    const data = await res.json();
    data.forEach(item => {
         createMarker(item,type);
   });
  
   map.fitBounds(bounds);

  } catch (err) {
    console.error(err);
  }
}

let itemMarkers=[];
let labeledMarkers = []; 

function createMarker(item,type) {
    const pos = parseLatLng(item.present_lat_long);
    const color = getStatusColor(item.GP_STATUS);

    const { wrapper, text } = getSvgElement(
    type,
    color,
    item.GP_NAME
  );

    const itemmarker = new AdvancedMarkerElement({
    position: pos,
    map,
    title: item.GP_NAME,
    content: wrapper
  });

  itemMarkers.meta = {
    type: type,                 // GP, BTS, etc
    oa: item.OA,
    district: item.DISTRICT,
    block: item.BLOCK,
    status: item.GP_STATUS,     // UP / DN / M90
    options: item.OPTIONS || [] // ['UP','DN'] etc if multiple
  };

  itemMarkers.push(itemmarker);

 // store for zoom control
  labeledMarkers.push({ marker, text });

  itemMarkers.push(marker);

    map.addListener("zoom_changed", () => {
    const zoom = map.getZoom();

    labeledMarkers.forEach(obj => {
        if (zoom >= 13) {
        obj.text.style.display = "block"; // show name
        } else {
        obj.text.style.display = "none";  // hide name
        }
    });
    });

  bounds.extend(pos);
  itemmarker.addListener("gmp-click", () => {
    infoWindow.setContent(createInfoTable(item));
    infoWindow.open(map, itemmarker);
  });
}


function createInfoTable(item) {
  return `
    <div style="
      font-family: Arial;
      width: 260px;
    ">

      <!-- HEADER -->
      <div style="
        background: #007bff;
        color: white;
        padding: 8px;
        font-size: 15px;
        font-weight: bold;
        border-radius: 6px 6px 0 0;
      ">
        ${item.GP_NAME || 'Details'}
      </div>

      <!-- TABLE -->
      <table border="1" style="
        border-collapse: collapse;
        width: 100%;
        font-size: 13px;
        border-top: none;
      ">
        <tr style="background-color: #f2f2f2;">
          <th style="padding: 5px;">Field</th>
          <th style="padding: 5px;">Value</th>
        </tr>

        <tr>
          <td style="padding: 5px;"><b>DISTRICT</b></td>
          <td style="padding: 5px;">${item.DISTRICT || '-'}</td>
        </tr>

        <tr>
          <td style="padding: 5px;"><b>BLOCK</b></td>
          <td style="padding: 5px;">${item.BLOCK || '-'}</td>
        </tr>

        <tr>
          <td style="padding: 5px;"><b>STATUS</b></td>
          <td style="padding: 5px;">
            <span style="
              color:${item.GP_STATUS === 'UP' ? 'green' : 'red'};
              font-weight:bold;
            ">
              ${item.GP_STATUS || '-'}
            </span>
          </td>
        </tr>

        <tr>
          <td style="padding: 5px;"><b>LAT-LONG</b></td>
          <td style="padding: 5px;">${item.present_lat_long || '-'}</td>
        </tr>
      </table>

    </div>
  `;
}

function getSvgElement(type, color, label = "") {
        const wrapper = document.createElement("div");
        // wrapper.style.display = "flex";
        // wrapper.style.alignItems = "center";
        // wrapper.style.justifyContent = "center";
        wrapper.style.display = "flex";
        wrapper.style.alignItems = "center";
        wrapper.style.gap = "4px";

        // ICON CONTAINER (🔥 border applied here)
        const iconDiv = document.createElement("div");

        iconDiv.style.display = "flex";
        iconDiv.style.alignItems = "center";
        iconDiv.style.justifyContent = "center";

        // 🔥 VERY LIGHT BORDER EFFECT
        iconDiv.style.background = "rgba(255,255,255,0.5)"; // ✅ 50% transparent
        iconDiv.style.borderRadius = "50%";
        iconDiv.style.padding = "1px";

        // subtle shadow (like Google Maps)
        iconDiv.style.boxShadow = "0 0 2px rgba(0,0,0,0.2)";

    
        iconDiv.innerHTML = getSvgByType(type, color);

  // TEXT (right side)
    const text = document.createElement("div");
    text.innerText = label;

    text.style.fontSize = "11px";
    text.style.fontWeight = "bold";
    text.style.color = "black";

    // 🔥 WHITE BORDER (HALO EFFECT like Google Maps)
    text.style.textShadow = `
        -1px -1px 0 #fff,
        1px -1px 0 #fff,
        -1px  1px 0 #fff,
        1px  1px 0 #fff
    `;

    text.style.whiteSpace = "nowrap";
    text.style.display = "none"; // hidden initially

  wrapper.appendChild(iconDiv);
  wrapper.appendChild(text);

  return { wrapper, text }; // 🔥 return both
}


function getStatusColor(status) {
  switch(status) {
    case 'UP': return '#28a745';   // green
    case 'OK': return '#28a745';   // green
    case 'DN': return '#dc3545';   // red
    case 'M90': return '#ffc107';  // yellow
    case null: return '#6c757d';    // gray
    default: return '#6c757d';     // gray
  }
}

function getSvgByType(type, color) {
  switch(type) {

    // 🏠 Gram Panchayat
    case 'GP':
      return `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="${color}">
        <path d="M12 3l9 8h-3v9h-4v-6H10v6H6v-9H3z"/>
      </svg>`;

    // 🏡 Village
    case 'VIL':
      return `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="${color}">
        <path d="M4 10l8-6 8 6v10H4z"/>
      </svg>`;

    // 📡 Mobile BTS (tower)
    case 'BTS':
      return `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="${color}">
        <path d="M12 2l4 20h-2l-1-5h-2l-1 5H8l4-20z"/>
      </svg>`;

    // 🔌 OLT / OFC (network)
    case 'OLT':
      return `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="${color}">
        <path d="M3 6h18v4H3zM3 14h18v4H3z"/>
      </svg>`;

    // 🏫 School
    case 'SCH':
      return `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="${color}">
        <path d="M12 3l10 6-10 6L2 9l10-6zm0 13l6-3v5H6v-5l6 3z"/>
      </svg>`;

    // 🏥 PHC (health center)
    case 'PHC':
      return `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="${color}">
        <path d="M10 2h4v6h6v4h-6v6h-4v-6H4V8h6z"/>
      </svg>`;

    // 🏢 Government Office
    case 'GOV':
      return `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="${color}">
        <path d="M3 21h18V3H3v18zm4-14h2v2H7V7zm0 4h2v2H7v-2zm0 4h2v2H7v-2zm4-8h2v2h-2V7zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2zm4-8h2v10h-2V7z"/>
      </svg>`;

    // 🏢 Block HQ (bigger admin building)
    case 'BHQ':
      return `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="${color}">
        <path d="M12 2l9 4v14H3V6l9-4zm-3 6h2v2H9V8zm0 4h2v2H9v-2zm4-4h2v2h-2V8zm0 4h2v2h-2v-2z"/>
      </svg>`;

    default:
      return `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="${color}">
        <circle cx="12" cy="12" r="8"/>
      </svg>`;
  }
}
export { initMap, loadMapData, itemMarkers,loadHierarchy};