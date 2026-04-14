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
         createMarker(item);
   });
   console.log(data)
   

  } catch (err) {
    console.error(err);
  }
}

let itemMarkers=[];


function createMarker(item) {
  const itemmarker = new AdvancedMarkerElement({
    position: parseLatLng(item.present_lat_long),
    map,
    title: item.GP_NAME
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

export { loadMapData, itemMarkers };