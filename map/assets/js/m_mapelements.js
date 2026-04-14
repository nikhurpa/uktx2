function parseLatLng(str) {
  const [lat, lng] = str.split(',').map(Number);
  return { lat, lng };
}

async function loadMapData(type) {
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
   console.log(data)
   

  } catch (err) {
    console.error(err);
  }
}

let itemMarkers=[];


function createMarker(item,type) {
  const itemmarker = new AdvancedMarkerElement({
    position: parseLatLng(item.present_lat_long),
    map,
    title: item.GP_NAME,
    content: getSvgElement(type, getStatusColor(item.GP_STATUS))

  });
  itemMarkers.push(itemmarker);
  itemmarker.addListener("gmp-click", () => {
    infoWindow.setContent(`
      <div>
        <h4>${item.GP_NAME}</h4>
        <p>District: ${item.DISTRICT}</p>
        <p>Block: ${item.BLOCK}</p>
        <p>Status: ${item.GP_STATUS}</p>
      </div>
    `);

    infoWindow.open(map, itemmarker);
  });
}
/*
// BTS VSAT https://cdn-icons-png.flaticon.com/128/9747/9747108.png
// BTS VSAT B/W https://cdn-icons-png.flaticon.com/128/9747/9747064.png
//BTS OFC https://cdn-icons-png.flaticon.com/128/1011/1011360.png
OFC B/W	https://cdn-icons-png.flaticon.com/128/4300/4300517.png
//BTS ML https://cdn-icons-png.flaticon.com/128/3883/3883488.png
ML B/W https://cdn-icons-png.flaticon.com/128/3883/3883510.png

// Home B/W https://cdn-icons-png.flaticon.com/128/618/618911.png
//PHC   https://cdn-icons-png.flaticon.com/128/4006/4006511.png
// PHS B/W https://cdn-icons-png.flaticon.com/128/687/687529.png
/*
 home blue  https://cdn-icons-png.flaticon.com/128/9385/9385258.png
 home red 	https://cdn-icons-png.flaticon.com/128/10307/10307931.png
 jome yellow 	https://cdn-icons-png.flaticon.com/128/9713/9713317.png
 home B/W https://cdn-icons-png.flaticon.com/128/1659/1659112.png

 school B/W https://cdn-icons-png.flaticon.com/128/8074/8074798.png

*/

function getSvgElement(type, color) {
  const wrapper = document.createElement("div");
  wrapper.style.background = "white";
  wrapper.style.borderRadius = "50%";
  wrapper.style.padding = "3px";
  wrapper.style.boxShadow = "0 0 5px rgba(0,0,0,0.5)";
  wrapper.innerHTML = getSvgByType(type, color);

//   return wrapper.firstElementChild; // 🔥 important
    return wrapper; // 🔥 important
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

export { loadMapData, itemMarkers };