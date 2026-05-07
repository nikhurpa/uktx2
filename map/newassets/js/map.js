// map.js
// Initialize map and base layers

let map;
let featureGroup; // Layer group to hold all drawn and loaded features
let baseLayers = {};

function initMap() {
    // Initialize map
    map = L.map('map', {
        center: [20.5937, 78.9629], // Center of India, arbitrary default
        zoom: 5,
        zoomControl: false // We will move it
    });

    // Move zoom control
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Base Maps
    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    });

    const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    });

    osm.addTo(map); // Default

    baseLayers = {
        "OpenStreetMap": osm,
        "Satellite Imagery": satellite
    };

    L.control.layers(baseLayers, {}, { position: 'topright' }).addTo(map);

    // Initialize Feature Group
    featureGroup = L.featureGroup().addTo(map);

    // Context menu prevention (to allow custom right-click drawing)
    map.getContainer().addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
}


window.onload = function () {
 initMap()
};
