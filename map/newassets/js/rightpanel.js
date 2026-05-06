import { addDiv } from "./loader.js";
import { initGrid } from "../../grid/myjqxgrid.js";

function initRightPanel() {

 addDiv({ id: "right-panel", parent: document.body,after: "#main",
                  innerHTML: ` <div id='jqxtabs'>
                              <ul style='margin-left: 20px;'>
                                <li>Map</li>
                                <li>Information</li>
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
                                <div id="infoPanel">
                                    <div id='elementForm' style="width: 280px; height: auto;"></div>   
                                    <div id='elementSubForm' style="width: 280px; height: auto;"></div>   
                                </div>
                                <div id="data" class="card">
                                    <div id='dataElementForm' style="width: 280px; height: auto;"></div>   
                                    <div id='dataElementSubForm' style="width: 280px; height: auto;"></div>   
                                </div>

                              </div>`, });    


  $("#right-panel").rightPullPanel({ width: 300, topOffset: 60 });
  $('#jqxtabs').jqxTabs({ width: 295, height: '100%' });
  $('#jqxtabs').on('tabclick', function (event) {
    var clickedItem = event.args.item;
    if (clickedItem === 0) {
    //   map.getDiv().style.display = 'block';
    //   document.getElementById("mode-ui").style.display = 'flex';
    //   document.getElementById("status").style.display = 'block';
    //   document.getElementById("dataTable").style.display = 'none';
    } else if (clickedItem === 1) {
    //   map.getDiv().style.display = 'block';
    //   document.getElementById("mode-ui").style.display = 'none';
    //   document.getElementById("status").style.display = 'none';
    //   document.getElementById("dataTable").style.display = 'none';
    } else if (clickedItem === 2) {
        initGrid();
    //   map.getDiv().style.display = 'none';
    //   document.getElementById("mode-ui").style.display = 'none';
    //   document.getElementById("dataTable").style.display = 'block';
    }
  });   
  console.log("Right panel initialized");
}

export { initRightPanel };