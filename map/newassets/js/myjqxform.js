//load block json file


let hierarchy = {};

async function loadHierarchy() {
  try {
    const res = await fetch('hierarchy_updated.json?v=' + Date.now()); // path to your file
    hierarchy = await res.json();


    console.log("Hierarchy loaded:", hierarchy);

  } catch (err) {
    console.error("Error loading hierarchy:", err);
  }
}

let typeMap = {};

async function loadTypeMap() {
  try {
    const res = await fetch('type.json?v=' + Date.now()); // path to your file
    typeMap = await res.json();

    console.log("Type map loaded:", typeMap);

  } catch (err) {
    console.error("Error loading type map:", err);
  }
}

window.onload = function () {

 loadHierarchy();
 loadTypeMap();

};


////////////////////////   FORM PART ////////////////////////////////////////////////////

document.addEventListener('DOMContentLoaded', () => {

var template = [{
    type: 'label',
    bind: 'radiobuttonValue_out',
    label: 'Select OA :',
    rowHeight: '40px',
  }];

  var OA = ["DDN", "HWR", "NTL", "NWT", "SGR", "ALM"];
  var OAValues = { DDN: false, HWR: false, NTL: false, NWT: false, SGR: false, ALM: true };
  var OANames = { DDN: 'DEHRADUN', HWR: 'HARIDWAR', NTL: 'NAINITAL', NWT: 'NEW TEHRI', SGR: 'SRINAGAR', ALM: 'ALMORA' };
  var OAvalues1 = [false, false, false, true, false, true];
  var OAelementId = { DDN: 'el_elementForm1_0', HWR: 'el_elementForm1_1', NTL: 'el_elementForm1_2', NWT: 'el_elementForm2_0', SGR: 'el_elementForm2_1', ALM: 'el_elementForm2_2' };
  var districtValues = { ALMORA: true, DEHRADUN: false, HARIDWAR: false, NAINITAL: false, "U S NAGAR": false, SRINAGAR: false, "PAURI GARHWAL": false, PITHORAGARH: false, CHAMPAWAT: false, RUDRAPRAYAG: false, "NEW TEHRI": false, UTTARKASHI: false };

  let oaValueObj = OA.reduce((acc, key, index) => {
    acc["chk" + key] = OAValues[key];
    return acc;
  }, {});


  for (let i = 0; i < OA.length; i += 3) {
    let row = { columns: [] };

    for (let j = i; j < i + 3 && j < OA.length; j++) {
      row.columns.push({
        bind: "chk" + OA[j],
        type: 'boolean',
        label: OA[j]
      });
    }

    template.push(row);
  }

  template = template.concat([
    {
      type: 'label',
      bind: 'Select_District_Block',
      label: 'Select District and Block :',
      rowHeight: '40px',
    },
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



  var btnElements = ["GP", "VIL", "BHQ", "OFC", "BTS", "OLT", "SAS", "SCH", "PHC"];
  var btnElementId = { GP: 'el_elementForm7_1', VIL: 'el_elementForm7_3', BHQ: 'el_elementForm7_5', OFC: 'el_elementForm8_1', BTS: 'el_elementForm8_3', OLT: 'el_elementForm8_5', SAS: 'el_elementForm9_1', SCH: 'el_elementForm9_3', PHC: 'el_elementForm9_5' };
  var btnValues = [false, false, true, false, true, false, true, false, true];
  var btnValueObj = { GP: false, VIL: false, BHQ: true, OFC: false, BTS: true, OLT: false, SAS: true, SCH: false, PHC: true };



  let btnInitialValue = btnElements.reduce((acc, key, index) => {
    acc["chk" + key] = btnValueObj[key];
    return acc;
  }, {});

  var btns = []

  for (let i = 0; i < btnElements.length; i += 3) {
    let row = { columns: [] };

    for (let j = i; j < i + 3 && j < btnElements.length; j++) {
      row.columns.push({
        bind: "chk" + btnElements[j],
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

  template = template.concat(btns);

  $('#elementForm').jqxForm({
    template: template,
    value: { ...oaValueObj, ...btnInitialValue },
    padding: { left: 2, top: 2, right: 2, bottom: 2 }
  });



  btnElements.forEach(item => { $("#" + btnElementId[item]).jqxButton({ disabled: !btnValueObj[item] }) });


  const selectedOAs = ["ALMORA"]; // Example: Getting districts for a specific OA
  //et district and block from hierarchy
  const districts = [...new Set(selectedOAs.flatMap(oa => Object.keys(hierarchy[oa] || {})))];
  let selectedDistricts = Object.keys(districtValues).filter(key => districtValues[key] === true);

  const blocks = [...new Set(selectedDistricts.flatMap(dist => Object.values(hierarchy).map(oa => oa[dist] || []).flat()))];

  $("#el_elementForm4").jqxDropDownList("clear");
  $("#el_elementForm4").jqxDropDownList({ checkboxes: true, source: districts });
  //check selected districts

  selectedDistricts.forEach(item => { $("#el_elementForm4").jqxDropDownList('checkItem', item); });

  // District Dropdown change event
  $("#el_elementForm4").on('checkChange', function (event) {
    if (event.args) {
      var item = event.args.item;
      var value = item.value;
      var label = item.label;
      var checked = item.checked;
      var checkedItems = $("#el_elementForm4").jqxDropDownList('getCheckedItems');
      // Addig removing blocks based on district selection
      const blocks = Object.values(hierarchy).flatMap(oa => oa[label] || []);
      checked ? blocks.forEach(block => $("#el_elementForm5").jqxDropDownList('addItem', block)) : blocks.forEach(block => $("#el_elementForm5").jqxDropDownList('removeItem', block));

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

  $("#el_elementForm5").jqxDropDownList({ checkboxes: true });
  $("#el_elementForm5").jqxDropDownList("clear");
  $("#el_elementForm5").jqxDropDownList({ checkboxes: true, source: blocks });

  // blockValues.forEach(val => {
  //     $("#el_elementForm5").jqxDropDownList('checkItem', val);
  // });

  $("#el_elementForm5").on('checkChange', function (event) {
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


  /// main form rendered
  $("#elementForm").on('formDataChange', function (event) {

    let prev = event.args.previousValue;
    let curr = event.args.value;
    let changedField = Object.keys(curr).find(k => prev[k] !== curr[k]);

    let chel = changedField?.replace('chk', '');
    // Check if Checkbox field is changed and belongs to OA or Element
    if (OA.includes(chel)) {

      let isChecked = curr[changedField];
      console.log("✅ OA checkbox changed:", chel, ",Checked:", isChecked);
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

      // load or unload distrct based on OA selection
      const districts = Object.keys(hierarchy[OANames[chel]] || {}).sort();
      console.log("Districts for selected OAs:", districts);
      isChecked ? districts.forEach(district => $("#el_elementForm4").jqxDropDownList('addItem', district)) : districts.forEach(district => $("#el_elementForm4").jqxDropDownList('removeItem', district));
      if (isChecked) {
        districts.forEach(district => $("#el_elementForm4").jqxDropDownList('addItem', district))
        oaTypeList.forEach(type => { loadMapData({ type: type, block: null, oa: OANames[chel] }) });
      }
      else {


        oaTypeList.forEach(type => { removeMapData({ type: type, block: null, oa: OANames[chel] }) });


        districts.forEach(district => {
          $("#el_elementForm4").jqxDropDownList('removeItem', district);
          const blocks = Object.values(hierarchy).flatMap(oa => oa[district] || []);
          console.log("Blocks for selected Districts:", blocks);
          blocks.forEach(block => {
            $("#el_elementForm5").jqxDropDownList('removeItem', block);
          });

          blocks.forEach(block => {

            blockTypeList.forEach(type => { removeMapData({ type, block }) });
          });

        });
      }

    }

    // Check if changed field is element button
    if (btnElements.includes(chel)) {

      let isChecked = curr[changedField];
      console.log("✅ Element checkbox changed:", chel, ",Checked:", isChecked);

      isChecked ? $('#' + btnElementId[chel]).jqxButton({ disabled: false }) : $('#' + btnElementId[chel]).jqxButton({ disabled: true });
    }



  });


  // let blockValue= {Raipur:{District:"Dehradun",OA:"DN",GP:{UP:true,DN:false,M90:true,L90:false },VIL:{COV:true,NCO:false},
  // BHQ:{PH1:true,ABP:false},OFC:{BN:true,CIR:false,CNTX:false},BTS:{"2G":true,"3G":false,"4G":false,UP:true,DN:},OLT:{},SAS:{},SCH:{},PHC:{}}};
  // SUB FORM CREATION for every element button                     
  var subFormTemplate = { GP: [], VIL: [], BHQ: [], OFC: [], BTS: [], OLT: [], SAS: [], SCH: [], PHC: [] };

  var subFormElements = {
    GP: ['UP', 'DN', 'M90', 'L90', 'COV', 'NCO'],
    VIL: ['COV', 'NCO'],
    BHQ: ['PH1', 'ABP'],
    OFC: ['BN', 'CIR', 'CNTX', 'VTL'],
    BTS: ['2G', '3G', '4G', 'UP', 'DN', 'ML', 'OFC', "SAT"],
    OLT: ['TIP', 'BNU', 'BAF'],
    SAS: ['UP', 'DN', 'M90'],
    SCH: ['WK', 'NWK', 'FES', 'UP', 'DN'],
    PHC: ['WK', 'NWK', 'FES', 'UP', 'DN ']
  };

  // make object for storing subform values for each block
  let blockElementsValue = createBlockValueData()
  console.log(blockElementsValue);

  function createBlockValueData() {

    // list all blocks from hierarchy
    let allBlocks = [...new Set(
      Object.values(hierarchy)
        .flatMap(d => Object.values(d))
        .flat()
    )];

    // get district and block from hierarchy
    let elements = {}
    let districtOa = {};
    let results = {};

    allBlocks.forEach(blockName => {

      results[blockName] = {};

      let districtOa = Object.entries(hierarchy).flatMap(([oa, districts]) =>
        Object.entries(districts).flatMap(([district, blocks]) =>
          blocks.includes(blockName) ? [{ oa, district }] : []
        )
      )[0];



      Object.entries(subFormElements).forEach(([key, values]) => {
        elements[key] = {};

        values.forEach(v => {
          elements[key][v] = false;
        });
      });


      results[blockName] = { ...districtOa, ...elements };

    });


    return results;
  }


  var subFormElementsValue = {
    GP: [true, false, true, false],
    VIL: [true, false],
    BHQ: [true, false],
    OFC: [true, false, false, false],
    BTS: [true, false, false, true, false, false, false, true],
    OLT: [true, false, false],
    SAS: [true, false, false],
    SCH: [true, false, false],
    PHC: [true, false, false]
  };

  let initialElementValue = {};

  Object.keys(subFormElementsValue).forEach(group => {
    let values = subFormElementsValue[group];
    let keys = subFormElements[group];

    let groupName = group.replace("Options", "").toUpperCase();

    initialElementValue[groupName] = {};

    values.forEach((val, index) => {
      initialElementValue[groupName]['chk' + groupName + keys[index]] = val;
    });
  });



  Object.entries(subFormElements).forEach(([key, value]) => {
    for (let i = 0; i < value.length; i += 3) {
      let row = { columns: [] };

      for (let j = i; j < i + 3 && j < value.length; j++) {
        row.columns.push({
          bind: 'chk' + key + value[j],
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



  function createSubForm(type) {
    // console.log(subFormTemplate[type]);
    // console.log(initialElementValue[type]);
    let tmpl = [{
      type: 'label',
      bind: type,
      label: type.replace("Options", "").toUpperCase() + ' Options :',
      rowHeight: '40px',
    }, ...subFormTemplate[type]];

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

});
  ////////////////////////// MAP PART //////////////////////////////////////////

  
  /////////////////////////////////////////////////////////////////////////////////////////////
  let itemMarkers = [];
  let labeledMarkers = [];
  let allPaths = [];
  
  function parseLatLng(str) {
    if (!str) return null;
  
    const parts = str.split(',');
  
    if (parts.length !== 2) return null;
  
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
  
    return { lat, lng };
  }
  
  function isValidLatLng(pos) {
    if (!pos) return false;
  
    const { lat, lng } = pos;
  
    return (
      typeof lat === "number" &&
      typeof lng === "number" &&
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 && lat <= 90 &&
      lng >= -180 && lng <= 180
    );
  }
  
  function getDistricts(oa) {
    return Object.keys(hierarchy[oa] || {});
  }
  
  async function loadMapData({ type = null, block = null, oa = null } = {}) {
  
    // const blocks = hierarchy["Almora"]["Pithoragarh"]; // Example: Accessing blocks under a specific district and block
    // const selectedOAs= ["Almora","New Tehri"]; // Example: Getting districts for a specific OA
    // const districts = [...new Set(selectedOAs.flatMap(oa => Object.keys(hierarchy[oa] || {})))];
    // console.log(districts);
    // const blocks = [...new Set(districts.flatMap(dist => Object.values(hierarchy).map(oa => oa[dist] || []).flat()  ))];
    // console.log(blocks);
    //  console.log(typeMap);
  
    try {
      const res = await fetch('assets/php/data.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: type, block: block ?? "", oa: oa ?? "" })
      });
      console.log(typeMap[type].latLongField);
      const data = await res.json();
      data.forEach(item => {
  
        typeMap[type].latLongField != "" ? createMarker(item, type) : null;
        typeMap[type].encodedPathField != "" ? createPath(item, type) : null;
  
      });
  
      map.fitBounds(bounds);
  
    } catch (err) {
      console.error(err);
    }
  }
  
  
  function createMarker(item, type) {
    const pos = parseLatLng(item[typeMap[type].latLongField]);
    // 🔥 VALIDATION CHECK
    if (!isValidLatLng(pos)) {
      console.log("❌ Invalid LatLng:", item.present_lat_long, item);
      return; // ⛔ skip marker
    }
  
  
    const color = getStatusColor(item[typeMap[type].statusField]);
  
    const { wrapper, text } = getSvgElement(
      type,
      color,
      item[typeMap[type].nameField]
    );
  
    const itemmarker = new AdvancedMarkerElement({
      position: pos,
      map,
      title: item[typeMap[type].nameField],
      content: wrapper,
  
    });
  
    itemmarker.meta = buildMetadata(item, type);
  
    itemMarkers.push(itemmarker);
  
    // store for zoom control
    labeledMarkers.push({ itemmarker, text });
  
    itemMarkers.push(itemmarker);
  
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
      infoWindow.setContent(buildInfoWindow(item, type));
      infoWindow.open(map, itemmarker);
    });
  }
  
  function buildMetadata(item, type) {
    const fields = typeMap[type]?.metadataFields || [];
  
    let fieldsData = fields.reduce((meta, key) => {
      meta[key] = item[key] ?? null;
      return meta;
    }, {});
    let meta = { TYPE: type };
    return { ...meta, ...fieldsData };
  
  
  }
  
  function buildInfoWindow(item, type) {
    const fields = typeMap[type]?.metadataFields || [];
  
  
    let head = `
      <div style="min-width:250px; font-family:Arial;">
  
        <!-- Header -->
        <div style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          background:#f2f2f2;
          padding:6px 8px;
          border-bottom:1px solid #ddd;
        ">
          <span style="font-size:16px;">${getSvgByType(type, getStatusColor(item[typeMap[type].statusField]))} </span>
          <span  style="font-weight:bold;">
            ${item[typeMap[type].nameField] + ", TYPE:" + type || type}
          </span>
  
          <span id="iw-close-btn" 
             style="
            cursor:pointer;
            color:#888;
             padding:2px 6px;
            font-weight:bold;
            font-size:16px;
            border-radius:50%;
            background:#eee;
            transition:0.2s;
  "
            onmouseover="this.style.background='#ddd'"
            onmouseout="this.style.background='#eee'"
           onclick="closeInfoWindow()">✖</span>
        </div>`
  
    let html = head + `
  
    
      <table style="border-collapse: collapse; width: 100%;">
        <tr style="background:#007bff;">
          <th style="padding:5px;">Field</th>
          <th style="padding:5px;">Value</th>
        </tr>
    `;
  
    fields.forEach((f, i) => {
      html += `
        <tr style="background:${i % 2 === 0 ? '#ffffff' : '#fafafa'};">
          <td style="
            padding:5px;
            border:1px solid #ddd;
            font-weight:bold;
            color:#444;
          ">
            ${f.replace(/_/g, ' ')}
          </td>
          <td style="
            padding:5px;
            border:1px solid #ddd;
            color:#333;
          ">
            ${item[f] ?? ''}
          </td>
        </tr>
      `;
    });
  
    html += `</table>`;
  
    return html;
  }
  
  function createInfoTable(item, type) {
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
          ${item[typeMap[type].nameField] || 'Details'}
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
            <td style="padding: 5px;">${item[typeMap[type].districtField] || '-'}</td>
          </tr>
  
          <tr>
            <td style="padding: 5px;"><b>BLOCK</b></td>
            <td style="padding: 5px;">${item[typeMap[type].blockField] || '-'}</td>
          </tr>
  
          <tr>
            <td style="padding: 5px;"><b>STATUS</b></td>
            <td style="padding: 5px;">
              <span style="
                color:${item[typeMap[type].statusField] === 'UP' ? 'green' : 'red'};
                font-weight:bold;
              ">
                ${item[typeMap[type].statusField] || '-'}
              </span>
            </td>
          </tr>
  
          <tr>
            <td style="padding: 5px;"><b>LAT-LONG</b></td>
            <td style="padding: 5px;">${item[typeMap[type].latLongField] || '-'}</td>
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
    switch (status) {
      case 'UP': return '#28a745';   // green
      case 'OK': return '#28a745';   // green
      case 'DN': return '#dc3545';   // red
      case 'M90': return '#ffc107';  // yellow
      case null: return '#6c757d';    // gray
      default: return '#6c757d';     // gray
    }
  }
  
  function getSvgByType(type, color) {
    switch (type) {
  
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
  
  function decodePath(encoded) {
  
    try {
      // console.log("Decoding path:", encoded);
      return encoding.decodePath(encoded);
    } catch (e) {
      console.log("❌ Invalid encoded polyline:", encoded);
      return [];
    }
  }
  
  
  function createPath(item, type) {
  
    const path = decodePath(item[typeMap[type].encodedPathField]);
  
    // 🔥 VALIDATION
    if (!path || path.length < 2) {
      console.log("❌ Invalid Path:", item[typeMap[type].encodedPathField], item);
      return;
    }
    const plusSymbol = {
      // SVG path for a '+' sign
      path: "M 0,-1 L 0,1 M -1,0 L 1,0",
      strokeOpacity: 1,
      scale: 3,           // Adjust this to make the '+' larger or smaller
      strokeWeight: 2,
      strokeColor: "#000802"
    };
    const polyline = new google.maps.Polyline({
      path: path,
      map: map,
      strokeColor: getPathColor(item[typeMap[type].ownerField]),
      // strokeColor: "#555", // Base track bed color
      strokeOpacity: 0.7,
      strokeWeight: 3,
      // icons: [
      //   {
      //     icon: plusSymbol,
      //     offset: "0",
      //     repeat: "15px",  // Adjust distance between sleepers
      //   },
      // ],
    });
  
    if (item[typeMap[type].statusField] != "UP") {
      polyline.setOptions({
        icons: [
          {
            icon: plusSymbol,
            offset: "0",
            repeat: "15px",  // Adjust distance between sleepers
          },
        ],
      });
    } // 🔥 visually differentiate non-UP paths
  
    // 🔥 metadata
    polyline.meta = buildMetadata(item, type);
    path.forEach(p => bounds.extend(p));
    allPaths.push(polyline);
  
    // click event
    polyline.addListener("click", (e) => {
      infoWindow.setContent(buildInfoWindow(item, type));
      infoWindow.setPosition(e.latLng);
      infoWindow.open(map);
    });
  }
  
  function getPathColor(owner) {
    switch (owner) {
      case 'CIRCLE': return '#ebe014';   // green
      case 'CNTX': return '#fc0808';   // green
      case 'VTL': return '#3564dc';   // red
      case 'BN': return '#ff07c1';  // yellow
      case null: return '#6c757d';    // gray
      default: return '#6c757d';     // gray
    }
  }
  
  
  function removeMapData({ type = null, block = null, oa = null } = {}) {
  
    console.log("Before:", itemMarkers.length, "Type:", type, "Block:", block, "OA:", oa);
    //  console.log("Before:", itemMarkers.length, "Type:", type, "Block:", block, "OA:", oa);
  
    // 🔴 Markers
    try {
      itemMarkers = itemMarkers.filter(marker => {
  
        if (!marker || !marker.meta) {
          console.warn("⚠️ Skipping invalid marker:", marker);
          return false; // remove bad entries
        }
        const meta = marker.meta || {};
  
        const matchType = !type || meta.TYPE === type;
  
        const matchBlock = !block || (meta.hasOwnProperty('BLOCK') && meta.BLOCK === block);
  
        const matchOa = !oa || (meta.hasOwnProperty('OA') && meta.OA === oa);
  
        if (matchType && (matchBlock || matchOa)) {
          marker.map = null;
          console.log("removing marker:", marker.meta);
          return false; // remove from array
        }
  
        return true;
      });
    } catch (e) {
      console.error("Error in filter:", e);
      return true;
    }
  
    console.log("After:", itemMarkers.length);
  
    // 🔵 Paths
    try {
      allPaths = allPaths.filter(path => {
  
        const meta = path.meta || {};
  
        const matchType = !type || meta.TYPE === type;
  
        const matchBlock = !block || (meta.hasOwnProperty('BLOCK') && meta.BLOCK === block);
        const matchOa = !oa || (meta.hasOwnProperty('OA') && meta.OA === oa);
  
        if (matchType && (matchBlock || matchOa)) {
          path.setMap(null);
          console.log("removing path:", path.meta);
          return false;
  
        }
  
        return true;
      });
    } catch (e) {
      console.error("Error in filter:", e);
      return true;
    }
  }
  
