import  {getTableProp, convertTojson ,fileExists ,validate,verify1,setCookie,getCookie,checkCookie} from  "./common1.js";

function datatoolbar(options){
  var prbtnclick=''
  var curbtnclick=''

  var defaults=[
    // {id:"USERS" ,label:"Users" , class :'btn btn-default border border-1 active', herf:'',ikon:'fas  fa-user' , onclick: function(){ datagrid({ tablename:'gpon_report1',sql:'select * from gpon_report1'})}},
    // {id:"BLOCK" ,label:"Blocks" , class :'btn btn-default border border-1', herf:'',ikon:'fa fa-institution' ,onclick: function(){ datagrid({ tablename:'gpon_report2',sql:'select * from gpon_report2'})}},
    {id:"GP" ,label:"GP" , class :'btn btn-default border border-1', herf:'',ikon:'fa fa-home' , onclick:function(){ datagrid({ tablename:'gpon_master',sql:`select * from gpon_gp_master where GPON_TYPE='ONT'`})}},
    {id:"Village" ,label:"Villages" , class :'btn btn-default border border-1', herf:'',ikon:'fas fa-school' , onclick:function(){ datagrid({ tablename:'gpon_master',sql:`select * from gpon_gp_master where GPON_TYPE='CCU'`})}},
    {id:"School" ,label:"School" , class :'btn btn-default border border-1', herf:'',ikon:'glyphicon glyphicon-education', onclick:function(){ datagrid({ tablename:'gpon_master',sql:`select * from gpon_gp_master where GPON_TYPE='SOLAR'`})}},
    {id:"PHC" ,label:"PHC" , class :'btn btn-default border border-1', herf:'',ikon:'fas fa-briefcase-medical' , onclick:function(){ datagrid({ tablename:'gpon_master',sql:`select * from gpon_gp_master where GPON_TYPE='BTTY'`})}},
    {id:"SAS" ,label:"SAS" , class :'btn btn-default border border-1', herf:'',ikon:'fas  fa-truck' ,onclick: function(){ datagrid({ tablename:'gpon_transaction',sql:`select * from gpon_transaction where RECD_DATE is null`})}},
    // {id:"BTS" ,label:"BTS" , class :'btn btn-default border border-1', herf:'',ikon:'fas  fa-broadcast-tower' ,onclick: function(){ datagrid({ tablename:'gpon_transaction',sql:`select * from gpon_transaction where RECD_DATE is not null`})}},
    {id:"OLT" ,label:"OLT" , class :'btn btn-default border border-1', herf:'',ikon:'fas  fa-edit' ,onclick: function(){ editgpon()}},
    {id:"export" ,label:"Export" , class :'btn btn-default border border-1', herf:'',ikon:'fas  fa-file-excel' ,onclick: function(){ $("#jqxGrid").jqxGrid('exportview', 'xlsx', 'data');}},
  ];
var buttons = $.extend(defaults, options );
var  html='';
  for (let btnoptons of buttons) {
   // var btnoptons ={id:"user" ,label:" User Wise" , class :'btn btn-default border border-1', herf:'',ikon:'fas  fa-filter' }
    var btn=`
    <a id="${btnoptons.id}" class="${btnoptons.class}"  >
    <i class="${btnoptons.ikon}" aria-hidden="true"></i> ${btnoptons.label}
    </a>  `;

    html += btn + " ";

  }

  $(`#toolbar`).html(html );




  for (let btnoptons of buttons) {

      var btnelement=$(`#${btnoptons.id}`);

      btnelement.on('click',function(){
      btnoptons.onclick();
      toggle(btnoptons.id);

      })
  }
  buttons[0].onclick();

  function toggle(elid){
    prbtnclick=curbtnclick;
    curbtnclick=elid;
    console.log(prbtnclick + "/"+ curbtnclick)
    buttons.forEach((element, index) => {
      if ( !$(`#${element.id}`).hasClass('btn-default')){
        if ( $(`#${element.id}`).hasClass('btn-success')){
          $(`#${element.id}`).removeClass('btn-success')
          $(`#${element.id}`).addClass('btn-default')
        }

    }})

    if ( $(`#${elid}`).hasClass('btn-default')){
      $(`#${elid}`).removeClass('btn-default')
      $(`#${elid}`).addClass('btn-success')

    };


  }



  function editgpon(){

        if($('#jqxGrid').length){
            var selectedrowindex = $('#jqxGrid').jqxGrid('selectedrowindex');
            console.log(selectedrowindex);
            if (selectedrowindex == -1 ) {
              alert("please select a row");
              return;
            }

        }

        if(edit==false){
          alert("You cant edit");
          return;
        }


        var selectedrowdata = $('#jqxGrid').jqxGrid('getrowdata', selectedrowindex);
        if(selectedrowdata.hasOwnProperty("GPON_ASSET_ID")){
              var opt={
                      sql:`select * from gpon_master where GPON_ASSET_ID='${selectedrowdata.GPON_ASSET_ID}'`,
                      tablename:'gpon_master',
                      cancelButton: function () {buttons[2].onclick();},
                      submitButton: function () {
                      let formdata= $("#jqxForm").jqxForm('value');
                      console.log(formdata)
                        let sql=`UPDATE gpon_master SET SERIAL_NO='${$('#el_jqxForm2').val()}', MAKE='${$('#dropdownlistContentel_jqxForm3').html()}',
                              MODEL='${$('#el_jqxForm4').val()}', PO_NUM='${$('#el_jqxForm5').val()}', PO_DATE='${$('#el_jqxForm6').val()}',
                              PO_BY='${$('#dropdownlistContentel_jqxForm7').html()}', SUPPLIER='${$('#el_jqxForm8').val()}',INITIAL_LOCATION='${$('#el_jqxForm14').val()}',
                              PO_PHASE='${$('#el_jqxForm9').val()}', DATE_OF_AT='${$('#el_jqxForm10').val()}', PRESENT_STATUS='${$('#dropdownlistContentel_jqxForm12').html()}'
                              WHERE GPON_ASSET_ID ='${formdata.GPON_ASSET_ID}' ;`;
                        console.log(sql);
                        let url = "php/ajaxdata.php";
                        let key='1974'
                        $.ajax({url: url,data: {sql:sql,key:key},type:"GET", dataType: 'json',
                          success: function(data) {
                            console.log(data);
                            alert("Result:" + data.result);buttons[2].onclick();

                          }
                        });
                      },
                    uploadImage: function () { imageform({id:selectedrowdata.GPON_ASSET_ID,type:selectedrowdata.GPON_TYPE})},

                    };

                  dataform(opt,{});
                  scrollview({id:selectedrowdata.GPON_ASSET_ID,type:selectedrowdata.GPON_TYPE });
            }

    }




}

function datagrid(options,gridoptions){

  loadDiv('griddiv')
  var tableStyle = {
    headerBackgroundColor: '#4267B2',
    headerColor: '#fff',
    headerBackgroundHoveredColor: '#FE6602',
    headerHoveredColor: '#fff',
    headerBackgroundSelectedColor: '#FC3752',
    headerSelectedColor: '#fff',
    backgroundColor: '#fff',
    color: '#333',
    backgroundHoveredColor: '#FE6602',
    hoveredColor: '#fff',
    backgroundSelectedColor: '#FC3752',
    selectedColor: '#fff',

  };

  var defaults = {
    url:'php/ajaxdata.php',
    key:'1974',
    sql:'select * from gp_infra',
    tablename:'gp_infra',
    div:'jqxWindow',
    ele:'jqxGrid',

  }

  var settings = $.extend(defaults, options );

  // if( $(`#${settings.ele}`).length )         // use this if you are using id to check
  // {
  //   $(`#${settings.ele}`).jqxGrid('destroy');
  //   $(`#${settings.ele}div`).append('<div id="jqxGrid"></div>');

  // }
  var tableprop=   getTableProp(settings.tablename);
  console.log(tableprop)
  var datasource= {datatype: "json", datafields:tableprop[1] , url: settings.url, data: { sql: settings.sql, key: defaults.key },type: "GET"}
  var dataAdapter= new $.jqx.dataAdapter(datasource, {loadError: function (xhr, status, error) {alert(error); }})

  var columns = tableprop[0]
  columns = columns.map(v => ({...v, renderer: function(text, align, height) {
    return '<div style="font-weight: bold; font-size: 12px; text-align: center; width: auto; height: auto; text-wrap: balance; margin: 5px;">' + text + '</div>';
  }}))

  columns = columns.map(v => ({...v, style:tableStyle} ))
  columns.forEach((element, index) => {
  (element.aggregates=='sum')?columns[index].aggregates=['sum']:(element.aggregates=='count')?columns[index].aggregates=['count']:delete columns[index].aggregates;
   });

  var griddefaults = {
    width: '99%',
    theme: 'metro',
    height: Math.round(screen.height*.65),
    columnsheight: 50,
    rowsheight: 20,
    selectionmode: 'multiplerowsextended',
    altRows: true,
    showstatusbar: true,
    adaptive: true,
    enablehover: true,
    source:dataAdapter,
    columns:columns,
    showfilterrow: true,
    filterable: true,
    showstatusbar: true,
    showAggregates: true,

   }

   var gridsettings = $.extend(griddefaults, gridoptions );

   $(`#${settings.ele}` ).jqxGrid(gridsettings)
   console.log(dataAdapter)

}

function loadDiv(divname){

  var divid=new Map();
  divid.set('griddiv',` <div  id="jqxGriddiv"><div  id="jqxGrid"></div></div> `);
  divid.set('formdiv',`
              <div id="FormDiv" class="row mx-auto">  <!-- Form Div -->
              <div class="col col-12 col-lg-6 card p-1 m-1"><div class="card-header p-1 m-1 bg-secondary border-1 rounded-top" id="formhead"><span class="p-1 text-white font-weight-bold" id="formtop">GPON</span></div>
                  <div class="card-body p-1" id="jqxFormdiv"><div  id="jqxForm"></div></div></div>
              <div class="col col-12 col-lg-5 card p-1 m-1"> <div class="card-header p-1 m-1 bg-secondary border-1 rounded-top" id="scrollhead"><span class="p-1 text-white font-weight-bold" id="formtop">Images</span></div>
                <div  class ="d-flex justify-content-center mx-auto p-2" id="jqxScrollview1div"><div  id="jqxScrollview1"></div></div></div>
              </div>

              <div id="CameraDivMain" class="row mx-auto">  <!-- Camera Div -->
                  <div class="col col-12 col-sm-12 col-md-12 col-lg-3 card p-1 m-1"><div class="card-header p-1 m-1 bg-secondary border-1 rounded-top" id="formhead"><span class="p-1 text-white font-weight-bold" id="formtop">Saved Images</span></div>
                        <div class="card-body d-flex align-items-center flex-column">
                        <div class="  p-1" id="jqxScrollviewdiv"><div  id="jqxScrollview" ></div></div>
                        <div class="p-1" id="DeleteBtndiv" ><input  type="button" value="Delete Photo" id="DeleteBtn" /></div>
                        <div class="  p-1" id="jqxFileUploaddiv"><div  id="jqxFileUpload" ></div></div>
                        </div>
                  </div>
                  <div class="col col-12 col-sm-12  col-md-12 col-lg-3 card p-1 m-1"> <div class="card-header p-1 m-1 bg-secondary border-1 rounded-top" id="scrollhead"><span class="p-1 text-white font-weight-bold" id="formtop">Camera</span></div>
                        <div class="card-body d-flex align-items-center flex-column">
                        <div class=" p-1 " id="Cameradiv"><div id="Camera"  class="mx-auto pre_capture_frame border border-dark rounded"></div></div>
                        <input type="hidden" name="captured_image_data" id="captured_image_data"/>
                        <div class=" p-1 " id="PhotoBtndiv"><input type="button" value="Take Photo" id="PhotoBtn" "/></div>
                        </div>
                 </div>
                 <div class="col col-12 col-sm-12  col-md-12 col-lg-3 card p-1 m-1"> <div class="card-header p-1 m-1 bg-secondary border-1 rounded-top" id="scrollhead"><span class="p-1 text-white font-weight-bold" id="formtop">Captured Images</span></div>
                        <div  class ="card-body d-flex align-items-center flex-column">
                            <div class=" mx-auto p-1 border border-dark rounded" id="results"  style="width: 300px; height:250px;" ><img id="result1" style="width: 290px; height:240px" class="border border-dark rounded after_capture_frame" /></div>
                            <div class= mx-auto p-1" id="buttonsdiv" style="width: 300px; height:30px;" >
                                  <div class="d-flex justify-content-center mx-auto p-2">
                                  <div class="p-1" ><input  type="button" value="Save Photo" id="SaveBtn" /></div>
                                  <div class="p-1" ><input  type="button" value="    Back    " id="BackBtn" /></div>
                                  </div>
                            </div>
                       </div>
                  </div>

              </div>
              `);


    if( $(`#cardbody`).html.length ){         // use this if you are using id to check
          $(`#cardbody`).html(divid.get(divname));
    }



}
export { datatoolbar, datagrid };




