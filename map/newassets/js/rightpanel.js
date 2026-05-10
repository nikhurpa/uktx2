import { addDiv } from "./loader.js";
import { initGrid } from "./myjqxgrid.js";

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
                                    <div id='elementSubmitForm' style="width: 280px; height: auto;"></div>   
                                </div>
                                <div id="data" class="card">
                                    <div id='dataElementForm' style="width: 280px; height: auto;"></div>   
                                    <div id='dataElementSubForm' style="width: 280px; height: auto;"></div>  
                                    
                                </div>

                              </div>`, });    



addGeoDataMapperElements();
addBulkUploadElements()

  $("#right-panel").rightPullPanel({ width: 300, topOffset: 20 , contentSelector: "#main"});
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
      document.getElementById("map").style.display = 'block';
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

addDiv({ id: "right-panel1", parent: document.body,after: "#right-panel"});
$("#right-panel1").rightPullPanel({ width: 300, topOffset: 80 , contentSelector: "#main"});


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

function addBulkUploadElements(){

    // const mainDiv = document.getElementById("gridContainer");
    const mainDiv = document.getElementById("dataElementForm");
    mainDiv.innerHTML = ""; // Clear existing content

 addDiv({ id: "upload", parent: mainDiv, 
    innerHTML:  `
                <div class="app">

              <!--  <header>
                    <div class="logo-mark">
                    <div class="logo-icon"></div>
                    <span class="logo-label">DataSync</span>
                    </div>
                    <h1>Excel → <span>Database</span><br>Sync Engine</h1>
                    <p class="subtitle">Batch-process large Excel datasets with real-time feedback</p>
                </header>
                -->

                <!-- Step 1: Files -->
                <div class="panel" data-label="01 — Files">
                    <div class="panel-body">
                    <div class="upload-grid">
                        <div>
                        <div class="config-label">Excel File (.xlsx / .xls)</div>
                        <div class="drop-zone" id="excelZone">
                            <input type="file" id="excelFileBulk" accept=".xlsx,.xls" onchange="handleFile(this,'excelZone','excelName')">
                            <div class="drop-icon">📊</div>
                            <div class="drop-label">Drop Excel File</div>
                            <div class="drop-hint">or click to browse</div>
                            <div class="drop-filename" id="excelName"></div>
                        </div>
                        </div>
                        <div>
                        <div class="config-label">Config File (.txt / .js) — optional</div>
                        <div class="drop-zone" id="confZone">
                            <input type="file" id="confFile" accept=".txt,.js" onchange="handleFile(this,'confZone','confName');loadConfFile(this)">
                            <div class="drop-icon">⚙️</div>
                            <div class="drop-label">Drop Config File</div>
                            <div class="drop-hint">or click to browser</div>
                            <div class="drop-filename" id="confName"></div>
                        </div>
                        </div>
                    </div>
                    </div>
                </div>

                <!-- Step 2: Config -->
                <div class="panel  d-none" data-label="02 — Configuration">
                    <div class="panel-body">
                    <div class="config-label">Paste or edit your config object</div>
                    <textarea id="configText" spellcheck="false">const conf = {
                table_name: "BLOCK",
                action: "update",           // "insert" or "update"
                sheet: "Sheet1",
                unique_id: "A",             // Excel column letter whose value is used for matching
                unique_id_field: "BLOCK_ID", // DB column name to match against (WHERE unique_id_field = ?)
                update_fields: ["PHASE", "BACKHAUL", "MEDIA"],
                values: ["B", "C", "D"]    // Excel column letters that supply the update values
                };</textarea>
                    </div>
                </div>

                <!-- Step 3: Database -->
                <div class="panel" data-label="03 — Database Connection">
                    <div class="panel-body">
                    <div class="db-grid">
                    <!--
                        <div class="field-group">
                        
                        <label class="field-label">Host</label>
                        <input type="text" id="dbHost" value="localhost" placeholder="localhost">
                        </div>
                        <div class="field-group">
                        <label class="field-label">Port</label>
                        <input type="number" id="dbPort" value="3306" placeholder="3306">
                        </div>
                        <div class="field-group">
                        <label class="field-label">Database Name</label>
                        <input type="text" id="dbName" placeholder="my_database">
                        </div>
                        <div class="field-group">
                        <label class="field-label">Username</label>
                        <input type="text" id="dbUser" placeholder="root">
                        </div>
                        <div class="field-group" style="grid-column:1/-1">
                        <label class="field-label">Password</label>
                        <input type="password" id="dbPass" placeholder="••••••••">
                        </div>-->
                    </div>
                    <!-- <div class="batch-row"> -->
                        <div class="field-group">
                        <label class="field-label">Batch Size</label>
                        <input type="number" id="batchSize" value="200" min="10" max="1000">
                        <span class="batch-hint">Rows per AJAX request (100–500 recommended)</span>
                        </div>
                        
                    <!-- </div> -->
                    </div>
                </div>

                <!-- Run Button -->
                <button class="run-btn" id="runBtn" onclick="startSync()">
                    <span class="btn-icon">▶</span>
                    <span id="runLabel">Run Sync</span>
                </button>

                <!-- Progress -->
                <div class="panel progress-panel" id="progressPanel" data-label="04 — Live Progress" style="margin-top:16px">
                    <div class="panel-body">
                    <div class="pct-row">
                        <span class="pct-label">Progress</span>
                        <span class="pct-val" id="pctVal">0%</span>
                    </div>
                    <div class="progress-track">
                        <div class="progress-fill" id="progressFill"></div>
                    </div>

                    <div class="stats-row">
                        <div class="stat-box" data-tip="Total rows in Excel">
                        <div class="stat-val muted" id="statTotal">—</div>
                        <div class="stat-label">Total Rows</div>
                        </div>
                        <div class="stat-box" data-tip="Successfully processed">
                        <div class="stat-val" id="statDone">0</div>
                        <div class="stat-label">Processed</div>
                        </div>
                        <div class="stat-box" data-tip="Rows skipped or errored">
                        <div class="stat-val warn" id="statErr">0</div>
                        <div class="stat-label">Errors</div>
                        </div>
                        <div class="stat-box" data-tip="Elapsed time">
                        <div class="stat-val purple" id="statTime">0s</div>
                        <div class="stat-label">Elapsed</div>
                        </div>
                    </div>

                    <div class="log-header">
                        <span class="log-title">Activity Log</span>
                        <button class="log-clear" onclick="clearLog()">clear</button>
                    </div>
                    <div id="log"></div>

                    <div class="done-banner" id="doneBanner"></div>
                    </div>
                </div>

                </div
                `   });
}
export { initRightPanel };