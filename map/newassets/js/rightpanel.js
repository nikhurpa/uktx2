import { addDiv } from "./loader.js";
import { initGrid } from "../../grid/myjqxgrid.js";

function initRightPanel() {

 addDiv({ id: "right-panel", parent: document.body,after: "#main",
                  innerHTML: ` <div id='jqxtabs'>
                              <ul style='margin-left: 20px;'>
                                <li>Edit Map</li>
                                <li>kml</li>
                                <li>Map</li>
                                <li>Data</li>
                              </ul>
                              <div id="sidepanel" class="card">
                                        <h2>Places</h2>
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
                                <div id="kml" class="card"></div>
                                <div id="infoPanel">
                                    <div id='elementForm' style="width: 280px; height: auto;"></div>   
                                    <div id='elementSubForm' style="width: 280px; height: auto;"></div>   
                                </div>
                                <div id="data" class="card">
                                    <div id='dataElementForm' style="width: 280px; height: auto;"></div>   
                                    <div id='dataElementSubForm' style="width: 280px; height: auto;"></div>   
                                </div>

                              </div>`, });    

addGeoDataMapperElements();

  $("#right-panel").rightPullPanel({ width: 300, topOffset: 60 });
  $('#jqxtabs').jqxTabs({ width: 295, height: '100%' });
  $('#jqxtabs').on('tabclick', function (event) {
    var clickedItem = event.args.item;
    if (clickedItem === 0) {
      // initMap();
    //   map.getDiv().style.display = 'block';
      // document.getElementById("main").style.display = 'flex';
      // document.getElementById("main").style.display = 'flex';
      document.getElementById("main").style.display = 'none';
    //   document.getElementById("status").style.display = 'block';
    //   document.getElementById("dataTable").style.display = 'none';
    } else if (clickedItem === 1) {
        
    //   map.getDiv().style.display = 'block';
      document.getElementById("map").style.display = 'block';
      document.getElementById("main").style.display = 'none';
      // initMap();
    //   document.getElementById("status").style.display = 'none';
    //   document.getElementById("dataTable").style.display = 'none';
    } else if (clickedItem === 2) {
        // initGrid();
    //   map.getDiv().style.display = 'none';
      document.getElementById("map").style.display = 'none';
        document.getElementById("main").style.display = 'none';
    //   document.getElementById("dataTable").style.display = 'block';
    } else if (clickedItem === 3) {
        initGrid();
    //   map.getDiv().style.display = 'none';
      document.getElementById("map").style.display = 'none';
      document.getElementById("main").style.display = 'block';
    }
  });   
  console.log("Right panel initialized");
}

function addGeoDataMapperElements(){

  
let geoKmlhtml=`
<div class="control-panel">
        <div class="panel-header">
            <h1>GeoData Mapper</h1>
            <p>Upload Excel data and a JSON config to visualize.</p>
        </div>


        <div class="form-group">
            <label for="excelFile">Data File (Excel)</label>
            <div class="file-input-wrapper">
                <input type="file" id="excelFile" accept=".xlsx, .xls, .csv">
                <div class="file-dummy">
                    <span class="file-text">Choose Excel File...</span>
                </div>
            </div>
        </div>

        <div class="form-group">
            <label for="configFile">Configuration (JSON)</label>
            <div class="file-input-wrapper">
                <input type="file" id="configFile" accept=".json">
                <div class="file-dummy">
                    <span class="file-text">Choose Config JSON...</span>
                </div>
            </div>
        </div>

        <div class="action-buttons">
            <button id="processDataBtn" class="btn btn-primary" disabled>Process & Map Data</button>
            <button id="downloadKmlBtn" class="btn btn-success" disabled>Download KML</button>
            <button id="clearMapBtn" class="btn btn-danger">Clear Map</button>
        </div>
        
        <div id="statusMessage" class="status-message"></div>
    </div>

`
const kmlDiv= document.getElementById("kml");
kmlDiv.innerHTML = ""; // Clear existing content

addDiv({ id: "kmlmain", parent: kmlDiv,  innerHTML:  geoKmlhtml });


}

export { initRightPanel };