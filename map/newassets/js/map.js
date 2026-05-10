// map.js
// Initialize map and base layers

var map;
var featureGroup; // Layer group to hold all drawn and loaded features
var baseLayers = {};
var bounds;

window.initMap = function() {
    // Initialize map
    map = L.map('map', {
        center: [20.5937, 78.9629], // Center of India, arbitrary default
        zoom: 5,
        zoomControl: false // We will move it
    });

    // Move zoom control
    L.control.zoom({ position: 'bottomright' }).addTo(map);



    // New Base Maps

    const osm = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors'
        }
    );

    const hot = L.tileLayer(
        'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
        {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap HOT'
        }
    );

    const topo = L.tileLayer(
        'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        {
            maxZoom: 17,
            attribution: '&copy; OpenTopoMap'
        }
    );

    const positron = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        {
            maxZoom: 20,
            attribution: '&copy; CartoDB'
        }
    );

    const darkMatter = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
            maxZoom: 20,
            attribution: '&copy; CartoDB'
        }
    );

    const satellite = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
            maxZoom: 19,
            attribution: 'Tiles &copy; Esri'
        }
    );

    const esriStreet = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
        {
            maxZoom: 19,
            attribution: 'Tiles &copy; Esri'
        }
    );

    const cyclosm = L.tileLayer(
        'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
        {
            maxZoom: 20,
            attribution: '&copy; CyclOSM'
        }
    );

    const googleStreet = L.tileLayer(
        'http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
        {
            maxZoom: 20,
            subdomains:['mt0','mt1','mt2','mt3']
        }
        );

        const googleSat = L.tileLayer(
            'http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
            {
                maxZoom: 20,
                subdomains:['mt0','mt1','mt2','mt3']
            }
            );

            const googleHybrid = L.tileLayer(
            'http://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
            {
                maxZoom: 20,
                subdomains:['mt0','mt1','mt2','mt3']
            }
            );

            const googleTerrain = L.tileLayer(
                'http://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
                {
                    maxZoom: 20,
                    subdomains:['mt0','mt1','mt2','mt3']
                }
                );
                // Default Layer
    googleStreet.addTo(map);

    // Layer Control
    baseLayers = {
        "OpenStreetMap": osm,
        "Google Street": googleStreet,
        "Google Satellite": googleSat,
        "Google Hybrid": googleHybrid,
        "Google Terrain": googleTerrain,
        "HOT Humanitarian": hot,
        "OpenTopoMap": topo,
        "Carto Light": positron,
        "Carto Dark": darkMatter,
        "Esri Satellite": satellite,
        "Esri Street": esriStreet,
        "CyclOSM": cyclosm
    };

    L.control.layers(baseLayers, {}, {
        position: 'topleft',
        collapsed: true
    }).addTo(map);



    // // Base Maps
    // const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    //     maxZoom: 19,
    //     attribution: '© OpenStreetMap contributors'
    // });

    // const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    //     maxZoom: 19,
    //     attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    // });

    // osm.addTo(map); // Default

    // baseLayers = {
    //     "OpenStreetMap": osm,
    //     "Satellite Imagery": satellite
    // };

    // L.control.layers(baseLayers, {}, { position: 'topright' }).addTo(map);

    // Initialize Feature Group
    featureGroup = L.featureGroup().addTo(map);

    // Context menu prevention (to allow custom right-click drawing)
    map.getContainer().addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
    bounds = L.latLngBounds([]);


    map.on("click", () => {

    if (selectedLine) {

        selectedLine.setStyle({
            color: selectedLine.originalColor,
            weight: 3,
            opacity: 0.7
        });

        selectedLine.closePopup();

        selectedLine = null;
    }

});
}


// window.addEventListener("load", function () {
//  initMap()
// });

