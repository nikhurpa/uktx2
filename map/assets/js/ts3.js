let map;
let marker;
let pathCoords = [];
let polyline;
// List of map events to log
const mapEvents = [
"click",
"dblclick",
"rightclick",
"mousemove",
"mousedown",
"mouseup",
"mouseover",
"mouseout",
"bounds_changed",
"center_changed",
"zoom_changed",
"dragstart",
"drag",
"dragend",
"idle",
"tilesloaded",
"projection_changed",
"maptypeid_changed",
];

// List of marker events to log
const markerEvents = [
"click",
"dblclick",
"rightclick",
"dragstart",
"drag",
"dragend",
"mousedown",
"mouseup",
"mouseover",
"mouseout",
"position_changed",
"visible_changed",
];
// Custom arrow icon
const arrowIcon1 = {
    path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
    scale: 5,
    strokeColor: "blue",
    rotation: -90, // pointing up
};

// Custom vertical arrow icon (SVG path)
const arrowIcon2 = {
    path: "M 0 -30 L -10 0 L -4 0 L -4 20 L 4 20 L 4 0 L 10 0 Z",
    fillColor: "red",
    fillOpacity: 1,
    strokeColor: "black",
    strokeWeight: 1,
    scale: 1,
    anchor: new google.maps.Point(0, 0), // tip of arrow is draggable point
};

// Smaller vertical arrow icon
const arrowIcon = {
    path: "M 0 -15 L -5 0 L -2 0 L -2 10 L 2 10 L 2 0 L 5 0 Z",
    fillColor: "red",
    fillOpacity: 1,
    strokeColor: "black",
    strokeWeight: 1,
    scale: 1, // keep natural size
    anchor: new google.maps.Point(0, 0), // tip of arrow = crosshair point
};

function initMap() {
// Initialize map
map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 28.6139, lng: 77.2090 }, // Delhi
    zoom: 15,
    draggableCursor: "crosshair",   // normal state
    draggingCursor: "grabbing",     // while dragging
});



// Place draggable marker
marker = new google.maps.Marker({
    position: { lat: 28.6139, lng: 77.2090 },
    map: map,
    draggable: true,
    icon: arrowIcon,
});

// Initialize polyline to show dragged path
polyline = new google.maps.Polyline({
    map: map,
    path: pathCoords,
    strokeColor: "red",
    strokeWeight: 3,
});

// Listen while dragging
// google.maps.event.addListener(marker, "drag", (e) => {
//     const latlng = e.latLng.toJSON(); // {lat: ..., lng: ...}
//     pathCoords.push(latlng);
//     polyline.setPath(pathCoords); // update line
// });



// Distance based sampling
// google.maps.event.addListener(marker, "drag", (e) => {
//   const latlng = e.latLng.toJSON();
//   if (pathCoords.length === 0) {
//     pathCoords.push(latlng);
//     polyline.setPath(pathCoords);
//   } else {
//     const last = pathCoords[pathCoords.length - 1];
//     if (haversine(last.lat, last.lng, latlng.lat, latlng.lng) > 1) {
//       // capture only if >5 meters apart
//       pathCoords.push(latlng);
//       polyline.setPath(pathCoords);
//     }
//   }
// });


// time based sampling
let lastTime = 0;
google.maps.event.addListener(marker, "drag", (e) => {
  const now = Date.now();
  if (now - lastTime > 200) { // every 200ms
    pathCoords.push(e.latLng.toJSON());
    polyline.setPath(pathCoords);
    lastTime = now;
  }
});


// Optional: log when drag ends
google.maps.event.addListener(marker, "dragend", () => {
    console.log("Final Path:", pathCoords);
});

}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000; // meters
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function setupModeButtons() {
    const modeUI = document.getElementById('mode-ui');
    if (!modeUI) {
        return;
    }
    const modeButtons = {
        'select-mode': 'select',
        'point-mode': 'point',
        'linestring-mode': 'linestring',
        'polygon-mode': 'polygon',
        'route-mode': 'polygon',
        'clear-mode': 'static'
    };
    for (const buttonId in modeButtons) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.onclick = () => {
                setActiveButton(buttonId);
                const modeName = modeButtons[buttonId];
                // if (!draw) {
                //     return;
                // }
                // if (modeName === 'static') {
                //     draw.clear();
                //     draw.setMode('static');
                // }
                // else if (modeName) {
                //     draw.setMode(modeName);
                // }

            };
        }
    }
}
function setActiveButton(buttonId) {
    const buttons = document.querySelectorAll('.mode-button');
    const resizeButton = document.getElementById('resize-button');
    const isResizeActive = resizeButton?.classList.contains('active');
    buttons.forEach(button => {
        if (button.id !== 'resize-button') {
            button.classList.remove('active');
        }
    });
    const activeButton = document.getElementById(buttonId);
    if (activeButton) {
        activeButton.classList.add('active');
    }
    if (isResizeActive) {
        resizeButton?.classList.add('active');
    }
}     

window.onload = initMap;