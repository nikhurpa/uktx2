// DOM Elements
const excelFileInput = document.getElementById('excelFile');
const configFileInput = document.getElementById('configFile');
const processDataBtn = document.getElementById('processDataBtn');
const downloadKmlBtn = document.getElementById('downloadKmlBtn');
const clearMapBtn = document.getElementById('clearMapBtn');
const statusMessage = document.getElementById('statusMessage');

// App State
let map = null;
let markers = [];
let polylines = [];
let rawExcelData = null; // array of objects
let configData = null; // json object
let kmlData = ''; // generated KML string

// Update UI Text for File Inputs
excelFileInput.addEventListener('change', (e) => {
    const fileName = e.target.files[0] ? e.target.files[0].name : 'Choose Excel File...';
    e.target.nextElementSibling.querySelector('.file-text').textContent = fileName;
    checkReadyState();
});

configFileInput.addEventListener('change', (e) => {
    const fileName = e.target.files[0] ? e.target.files[0].name : 'Choose Config JSON...';
    e.target.nextElementSibling.querySelector('.file-text').textContent = fileName;
    checkReadyState();
});

function checkReadyState() {
    if (excelFileInput.files.length > 0 && configFileInput.files.length > 0) {
        processDataBtn.disabled = false;
    } else {
        processDataBtn.disabled = true;
    }
}

function showStatus(msg, type) {
    statusMessage.textContent = msg;
    statusMessage.className = `status-message ${type}`;
}

// Initialize Leaflet Map
window.initMap = function () {
    map = L.map('map').setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    showStatus('Map loaded successfully.', 'success');
};

// Call it right away
initMap();

// Process Data Files
processDataBtn.addEventListener('click', async () => {
    if (!map) {
        showStatus('Please load the map first using an API key.', 'error');
        return;
    }

    const excelFile = excelFileInput.files[0];
    const configFile = configFileInput.files[0];

    try {
        showStatus('Processing files...', 'info');

        // 1. Read Config
        configData = await readJsonFile(configFile);

        // 2. Read Excel
        const excelArrayBuffer = await readExcelFile(excelFile);
        const workbook = XLSX.read(excelArrayBuffer, { type: 'array' });

        // Determine sheet
        const sheetName = configData.sheet || workbook.SheetNames[0];
        if (!workbook.Sheets[sheetName]) {
            throw new Error(`Sheet "${sheetName}" not found in Excel file.`);
        }

        rawExcelData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        // 3. Map Data
        clearMapData();
        mapDataToLeaflet();

        // Enable KML Download
        if (markers.length > 0 || polylines.length > 0) {
            downloadKmlBtn.disabled = false;
        }

    } catch (error) {
        console.error(error);
        showStatus(`Error: ${error.message}`, 'error');
    }
});

// File Readers
function readJsonFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                resolve(JSON.parse(e.target.result));
            } catch (err) {
                reject(new Error("Invalid JSON configuration format."));
            }
        };
        reader.onerror = () => reject(new Error("Failed to read Config file."));
        reader.readAsText(file);
    });
}

function readExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(new Error("Failed to read Excel file."));
        reader.readAsArrayBuffer(file);
    });
}

function clearMapData() {
    markers.forEach(m => map.removeLayer(m));
    polylines.forEach(p => map.removeLayer(p));
    markers = [];
    polylines = [];
    downloadKmlBtn.disabled = true;
}

clearMapBtn.addEventListener('click', () => {
    clearMapData();
    excelFileInput.value = '';
    configFileInput.value = '';
    excelFileInput.nextElementSibling.querySelector('.file-text').textContent = 'Choose Excel File...';
    configFileInput.nextElementSibling.querySelector('.file-text').textContent = 'Choose Config JSON...';
    processDataBtn.disabled = true;
    showStatus('Map cleared.', 'success');
});

// Mapping Logic
function mapDataToLeaflet() {
    const latCol = configData.latitude_column || 'LAT';
    const lonCol = configData.longitude_column || 'LON';
    const nameCol = configData.name_column || 'NAME';

    // Bounds to fit all markers/lines
    const bounds = L.latLngBounds();
    let hasPoints = false;

    // Track path groups if polyline is configured
    const pathGroups = {};

    rawExcelData.forEach((row, index) => {
        // 1. Process Polylines (grouping by path_columns)
        if (configData.polyline && configData.polyline.path_columns) {
            const pathId = row[configData.polyline.path_columns];
            if (pathId !== undefined && pathId !== null && pathId !== '') {
                if (!pathGroups[pathId]) pathGroups[pathId] = [];
                const lat = parseFloat(row[latCol]);
                const lon = parseFloat(row[lonCol]);
                if (!isNaN(lat) && !isNaN(lon)) {
                    pathGroups[pathId].push({ lat, lng: lon, rowData: row });
                }
            }
        }

        // 2. Process Markers
        const lat = parseFloat(row[latCol]);
        const lon = parseFloat(row[lonCol]);

        if (!isNaN(lat) && !isNaN(lon)) {
            hasPoints = true;
            const position = { lat, lng: lon };
            bounds.extend([lat, lon]);

            const title = row[nameCol] ? String(row[nameCol]) : `Point ${index + 1}`;

            // Build InfoWindow Content
            const infoContent = buildInfoWindowContent(row, title);

            const marker = L.marker([lat, lon], { title: title }).addTo(map);
            marker.bindPopup(infoContent);

            // Store marker info for KML
            marker.kmlData = {
                title: title,
                description: buildKmlDescription(row),
                position: position // {lat, lng} structure kept for KML logic
            };

            markers.push(marker);
        }
    });

    // Draw Polylines
    if (configData.polyline && Object.keys(pathGroups).length > 0) {
        const color = configData.polyline.color || '#FF0000';
        const width = configData.polyline.width || 3;

        Object.keys(pathGroups).forEach(pathId => {
            const points = pathGroups[pathId];
            if (points.length > 1) { // Need at least 2 points for a line
                const pathCoordinates = points.map(p => ({ lat: p.lat, lng: p.lng }));

                const polyline = L.polyline(pathCoordinates, {
                    color: color,
                    weight: width,
                    opacity: 1.0
                }).addTo(map);

                // Store polyline info for KML
                polyline.kmlData = {
                    title: `Path ${pathId}`,
                    coordinates: pathCoordinates,
                    color: color,
                    width: width
                };

                polylines.push(polyline);

                // extend bounds for paths that might not be in points logic
                pathCoordinates.forEach(coord => bounds.extend([coord.lat, coord.lng]));
                hasPoints = true;
            }
        });
    }

    if (hasPoints) {
        map.fitBounds(bounds);
        showStatus(`Mapped ${markers.length} markers and ${polylines.length} polylines.`, 'success');
    } else {
        showStatus('No valid coordinates found based on configuration.', 'error');
    }
}

function buildInfoWindowContent(row, title) {
    let html = `<div class="custom-infowindow"><h3>${title}</h3>`;

    // Determine which columns to show
    let colsToShow = [];
    if (configData.info_columns) {
        // Handle "A1:G1" style by just taking all keys if string, or map array
        if (Array.isArray(configData.info_columns)) {
            colsToShow = configData.info_columns;
        } else if (typeof configData.info_columns === 'string') {
            // Very basic range fallback - just show all properties
            colsToShow = Object.keys(row);
        }
    } else {
        colsToShow = Object.keys(row);
    }

    colsToShow.forEach(col => {
        if (row[col] !== undefined && col !== '__rowNum__') {
            html += `<div class="info-row"><span class="info-label">${col}:</span><span class="info-value">${row[col]}</span></div>`;
        }
    });

    html += `</div>`;
    return html;
}

function buildKmlDescription(row) {
    let desc = '';
    const colsToShow = Object.keys(row).filter(k => k !== '__rowNum__');
    colsToShow.forEach(col => {
        if (row[col] !== undefined) {
            desc += `${col}: ${row[col]}\n`;
        }
    });
    return desc;
}

// Generate and Download KML
downloadKmlBtn.addEventListener('click', () => {
    generateKML();
    if (kmlData) {
        const blob = new Blob([kmlData], { type: 'application/vnd.google-earth.kml+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'map_data.kml';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showStatus('KML Downloaded successfully.', 'success');
    }
});

function generateKML() {
    let kml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    kml += `<kml xmlns="http://www.opengis.net/kml/2.2">\n`;
    kml += `  <Document>\n`;
    kml += `    <name>GeoData Export</name>\n`;
    kml += `    <description>Exported from GeoData Mapper</description>\n`;

    // Add Styles for Polylines (Simple mapping)
    if (polylines.length > 0) {
        kml += `    <Style id="lineStyle">\n`;
        kml += `      <LineStyle>\n`;
        // KML colors are aabbggrr, so we do a simple fallback or just red
        kml += `        <color>ff0000ff</color>\n`;
        kml += `        <width>3</width>\n`;
        kml += `      </LineStyle>\n`;
        kml += `    </Style>\n`;
    }

    // Add Markers
    markers.forEach(m => {
        if (m.kmlData) {
            kml += `    <Placemark>\n`;
            kml += `      <name><![CDATA[${m.kmlData.title}]]></name>\n`;
            kml += `      <description><![CDATA[${m.kmlData.description}]]></description>\n`;
            kml += `      <Point>\n`;
            kml += `        <coordinates>${m.kmlData.position.lng},${m.kmlData.position.lat},0</coordinates>\n`;
            kml += `      </Point>\n`;
            kml += `    </Placemark>\n`;
        }
    });

    // Add Polylines
    polylines.forEach(p => {
        if (p.kmlData) {
            kml += `    <Placemark>\n`;
            kml += `      <name><![CDATA[${p.kmlData.title}]]></name>\n`;
            kml += `      <styleUrl>#lineStyle</styleUrl>\n`;
            kml += `      <LineString>\n`;
            kml += `        <tessellate>1</tessellate>\n`;

            let coordsStr = p.kmlData.coordinates.map(c => `${c.lng},${c.lat},0`).join(' ');

            kml += `        <coordinates>${coordsStr}</coordinates>\n`;
            kml += `      </LineString>\n`;
            kml += `    </Placemark>\n`;
        }
    });

    kml += `  </Document>\n`;
    kml += `</kml>`;

    kmlData = kml;
}
