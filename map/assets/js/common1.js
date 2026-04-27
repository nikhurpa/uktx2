
//////////////////////////////////////////////////////////////////////////////////////////////
// get table properties
function getTableProp(upfile) {
  upfile = "/bnadminlte/pages/tables/" + "tablestructure/" + upfile + ".txt";
  const cArray = [];
  const dArray = []
  httpGet(upfile, function (fileContent) {
      const lines = fileContent.split(/\r?\n/);
      const keys = lines[0].split('\t');

      for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split('\t');
          const jsonObject1 = {};
          jsonObject1["name"] = values[0];
          if(keys.indexOf("type")!=-1){
            jsonObject1["type"] = values[keys.indexOf("type")];
          }
          dArray.push(jsonObject1);

          const jsonObject = {};

          for (let j = 0; j < keys.length; j++) {
              jsonObject[keys[j]] = values[j];
          }
          cArray.push(jsonObject);
      }
      //jsonResult = JSON.stringify(jsonArray, null, 2);

  });

  return [cArray, dArray];

}
//////////////////////////////////////////////////////////////////////////////////////////////
function convertTojson(fileContent) {

  const lines = fileContent.split(/\r?\n/);

  // Get the keys from the first row (assuming the first row contains keys)
  const keys = lines[0].split('\t');

  // Initialize an array to store the JSON objects
  const jsonArray = [];

  // Iterate through the remaining rows
  for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split('\t');
      const jsonObject = {};

      // Create an object with keys from the first row and values from the current row
      for (let j = 0; j < keys.length; j++) {
          jsonObject[keys[j]] = values[j];
      }

      // Add the object to the array
      jsonArray.push(jsonObject);
  }

  // Convert the array to JSON
  const jsonResult = JSON.stringify(jsonArray, null, 2);

  // Output the JSON result
  //console.log(jsonResult);
  return jsonResult;
}
//////////////////////////////////////////////////////////////////////////////////////////////
function httpGet(url, callback) {
  // this function gets the contents of the URL. Once the
  // content is present it runs the callback function.
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function () {
      if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
          callback(xmlhttp.responseText);
      }
  }
  xmlhttp.open("GET", url, false);
  xmlhttp.send();
}
//////////////////////////////////////////////////////////////////////////////////////////////
function fileExists(url) {
  if(url){
      var req = new XMLHttpRequest();



      req.open('GET', url, false);

      req.setRequestHeader("Cache-Control","no-cache, no-store, must-revalidate");
      req.setRequestHeader("Pragma","no-cache");
      req.setRequestHeader("Expires","0");
      req.send();
      return req.status==200;
  } else {
      return false;
  }
}



///////////////////////////////////////LOGIN CHECK ///////////////////////////////////////////////////////

var user_ssa,user_name,user_designation,user_role,user_blocks,user_stroes;
var attempt = 4; // Variable to count number of attempts.
var exdays = 90/(24*60);
// Below function Executes on click of login button.

function validate(){

var username = document.getElementById("username").value;
var password = document.getElementById("password").value;

//var sql="select A.*,B.first_name,b.last_name,b.phone,b.email,b.image,b.status from user A left join contact B on A.username=B.username where A.username='" + username + "' ;" ;
var sql="SELECT A.*,B.FIRST_NAME,B.LAST_NAME,B.PHONE,B.EMAIL,B.IMAGE,B.STATUS,IFNULL(CONCAT(" + "'[\"'" + ",GROUP_CONCAT(store_id SEPARATOR '\",\"'"  +   "),'\"]') ,'[]')  as STORES from user A " +
"left join contact B on A.USERNAME=B.USERNAME left join store C on A.USERNAME=C.USERNAME " +
" where A.USERNAME='" + username + "' ;" ;


var key="1974";
console.log(sql)
		$.ajax({
				url: 'pages/tables/php/table.php',
				data: {
					sql: sql,
					key:key
				},
				dataType: 'json',
				type: 'GET',
				success: function(data) {
				if(data.length==0) {
				alert("username incorrect");
				return false;
				} else {
					if (data[0].PASSWORD != password ) {
							attempt --;// Decrementing by one.
							alert("Password Incorrect , You have left "+attempt+" attempt;");
							// Disabling fields after 3 attempts.
							if( attempt == 0){
							document.getElementById("username").disabled = true;
							document.getElementById("password").disabled = true;
							document.getElementById("submit").disabled = true;
							return false;
							}

					} else {
							alert ("Login successfully");
							var curpage  = getCookie("curpage");

							//alert(curpage);
							if(curpage==null){
							window.location = "index.php?page=gpreport"; // Redirecting to other page.
							} else if (curpage.includes("table.php") ) {
                window.location = "index.php?page=gpreport"; // Redirecting to other page.
							} else if (curpage.includes("gpon_report.php") ) {
                window.location = "index.php?page=gpon_main"; // Redirecting to other page.
              } else if (curpage.includes("map") ) {
                window.location = "index.php?page=gmap"; // Redirecting to other page.
							} else {
                window.location = "index.php?page=gpreport"; // Redirecting to other page.

              }


							var ssa=data[0].SSA;
							var role=data[0].ROLE;
							var name =data[0].FIRST_NAME + " " + data[0].LAST_NAME;
							var blocks = data[0].BLOCKS;
						  var stores = data[0].STORES;

              //alert(data[0].first_name)

							setCookie("username",username,exdays);
							setCookie("ssa",ssa,exdays);
							setCookie("blocks",blocks,exdays);
							setCookie("stores",stores,exdays);
							setCookie("role",role,exdays);
							setCookie("name",name,exdays);
							setCookie("designation",designation,exdays);


							return false;

					}


				}


				}
		});

}
////////////////////////////////////////////////////////////////////////////////////

function verify1(){


var getusername = getCookie("username");
setCookie("curpage",document.documentURI,exdays);

if(getusername == null) {

alert("you are not logged in, Pl login");

window.location = "login.php";

} else {

//alert("already logged in" );
//var getpage = getCookie("currentpage");
//window.location = "getpage"; // Redirecting to other page.
user_ssa = getCookie("ssa");
user_role = getCookie("role");
user_name = getCookie("username");
user_designation = getCookie("designation");


// document.getElementById("user_name").innerHTML = "<p class='fw-light'> SSA :" + user_ssa + ",  Name :" + user_name + "</p>" +
// 											 "<p class='fw-light'> Designation :" + user_designation + "</p>" +
// 											 " <b class='fw-bold' herf='' onClick=logout()>Logout</b>  ";

document.getElementById("user_name").innerHTML = "<p class='fw-light'> " + titleCase(user_name) + "</p>" ;
											//  " <p class='fw-light'>  Developed by M S Nikhurpa,ITS, GM Bharatnet <p>" ;



}

/////////////////////////////////////////////////////
function verify2(){


var getusername = getCookie("ID_my_site");
setCookie("curpage",document.documentURI,exdays);

if(getusername == null) {

alert("you are not logged in, Pl login");

window.location = "login.php";

} else {

//alert("already logged in" );
//var getpage = getCookie("currentpage");
//window.location = "getpage"; // Redirecting to other page.
userssa = getCookie("SSA_my_site");



}

}
/////////////////////////////////////////////////////

}

function logout() {

username=null;
setCookie("username",username,exdays);
window.location = "login.php";
}

/////////////////////////////////
function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return null;
}

function checkCookie() {
    var username = getCookie("username");
    if (username != "") {
        alert("Welcome again " + username);
    } else {
        username = prompt("Please enter your name:", "");
        if (username != "" && username != null) {
            setCookie("username", username, 365);
        }
    }
}

function titleCase(str) {
  return str.toLowerCase().replace(/(?:^|\s)\w/g, function(match) {
      return match.toUpperCase();
  });
}
/////////////////////////////////////////////////////////////////////////////


export {getTableProp, convertTojson ,fileExists ,validate,verify1,setCookie,getCookie, checkCookie};
