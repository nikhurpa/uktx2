// app.js
// General UI interactions, toolbars, modals, and AJAX calls

let currentTool = 'pan';

document.addEventListener('DOMContentLoaded', () => {
    setupToolbar();
    setupModals();
    setupUpload();
});

function setupToolbar() {
    const tools = ['pan', 'add-point', 'add-polyline', 'edit'];
    const infoText = document.getElementById('toolbar-info');

    tools.forEach(tool => {
        document.getElementById(`tool-${tool}`).addEventListener('click', (e) => {
            // Update UI
            document.querySelectorAll('.tool-btn:not(.action)').forEach(btn => btn.classList.remove('active'));
            e.currentTarget.classList.add('active');
            
            // Set state
            currentTool = tool;
            
            // Notify editor script
            if(window.editorToolChanged) {
                window.editorToolChanged(tool);
            }

            // Update info
            if(tool === 'pan') infoText.innerText = "Drag map to pan.";
            if(tool === 'add-point') infoText.innerText = "Click on map to add a point.";
            if(tool === 'add-polyline') infoText.innerText = "Left-click to add, drag to free-draw. Right-click to undo. Click existing line to extend.";
            if(tool === 'edit') infoText.innerText = "Click features to edit.";
        });
    });

    // Save and Export
    document.getElementById('tool-save').addEventListener('click', () => {
        if(window.editorGetCurrentFeature) {
            const feature = window.editorGetCurrentFeature();
            if(!feature) {
                alert("No active feature to save. Draw or select a feature first.");
                return;
            }
            openSaveModal();
        }
    });

    document.getElementById('tool-export').addEventListener('click', () => {
        exportMapToKml();
    });
}

function setupModals() {
    const modal = document.getElementById('save-modal');
    const closeBtn = document.querySelector('.close-modal');

    closeBtn.onclick = function() {
        modal.style.display = "none";
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    document.getElementById('save-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveFeature();
    });
}

function openSaveModal() {
    document.getElementById('save-modal').style.display = 'block';
    // Clear previous
    document.getElementById('feature-name').value = '';
    document.getElementById('feature-desc').value = '';
}

function saveFeature() {
    const name = document.getElementById('feature-name').value;
    const desc = document.getElementById('feature-desc').value;
    const dest = document.getElementById('save-destination').value;
    
    const feature = window.editorGetCurrentFeature();
    let geojson = null;
    if(feature) {
        geojson = feature.toGeoJSON();
        geojson.properties.name = name;
        geojson.properties.description = desc;
    }

    if(!geojson) return;

    fetch('php/api.php?action=save_feature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            destination: dest,
            feature: geojson
        })
    })
    .then(res => res.json())
    .then(data => {
        if(data.success) {
            alert('Saved successfully!');
            document.getElementById('save-modal').style.display = 'none';
            // Finalize feature in editor
            if(window.editorFinalizeFeature) window.editorFinalizeFeature(name);
        } else {
            alert('Error saving: ' + data.message);
        }
    })
    .catch(err => {
        console.error(err);
        alert('Server error while saving.');
    });
}

function setupUpload() {
    const uploadInput = document.getElementById('kml-upload');
    uploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if(!file) return;

        const formData = new FormData();
        formData.append('kml_file', file);

        fetch('php/upload_kml.php', {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            if(data.success) {
                // Pass KML text to parser
                if(window.parseKML) {
                    window.parseKML(data.kmlContent, file.name);
                }
            } else {
                alert('Upload failed: ' + data.message);
            }
        })
        .catch(err => console.error(err));
    });

    document.getElementById('btn-load-db').addEventListener('click', () => {
        loadFromDB();
    });
}

function loadFromDB() {
    fetch('php/api.php?action=load_db_features')
    .then(res => res.json())
    .then(data => {
        if(data.success) {
            if(window.loadGeoJSONFeatures) {
                window.loadGeoJSONFeatures(data.features, 'Database Features');
            }
        } else {
            alert('Error loading DB: ' + data.message);
        }
    });
}

function exportMapToKml() {
    if(!featureGroup || Object.keys(featureGroup._layers).length === 0) {
        alert("No features to export.");
        return;
    }
    
    const geojson = featureGroup.toGeoJSON();
    
    fetch('php/api.php?action=export_kml', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geojson: geojson })
    })
    .then(res => res.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "export.kml";
        document.body.appendChild(a);
        a.click();
        a.remove();
    });
}
