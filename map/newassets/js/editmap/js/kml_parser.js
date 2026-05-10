// kml_parser.js
// Parses KML data and generates the layer tree in the sidebar

let layerIdCounter = 0;

window.parseKML = function(kmlText, sourceName) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(kmlText, "text/xml");
    
    // Find Document or Root Folder
    const documents = xmlDoc.getElementsByTagName("Document");
    const rootNode = documents.length > 0 ? documents[0] : xmlDoc;

    const rootUl = document.getElementById('tree-root');
    
    // Create Root Node for this file
    const fileNodeId = `node-${layerIdCounter++}`;
    const fileLi = createTreeNode(sourceName, fileNodeId, true);
    rootUl.appendChild(fileLi);
    
    const childrenUl = document.createElement('ul');
    childrenUl.className = 'tree-children';
    fileLi.appendChild(childrenUl);

    parseFolder(rootNode, childrenUl);
};

window.loadGeoJSONFeatures = function(features, sourceName) {
    const rootUl = document.getElementById('tree-root');
    const folderId = `node-${layerIdCounter++}`;
    const folderLi = createTreeNode(sourceName, folderId, true);
    rootUl.appendChild(folderLi);

    const childrenUl = document.createElement('ul');
    childrenUl.className = 'tree-children';
    folderLi.appendChild(childrenUl);

    features.forEach(f => {
        let layer;
        if(f.geometry.type === 'Point') {
            layer = L.marker([f.geometry.coordinates[1], f.geometry.coordinates[0]]);
        } else if (f.geometry.type === 'LineString') {
            const latlngs = f.geometry.coordinates.map(c => [c[1], c[0]]);
            layer = L.polyline(latlngs, {color: 'blue'});
        }
        
        if(layer) {
            layer.addTo(featureGroup);
            const name = f.properties.name || 'Unnamed Feature';
            layer.bindPopup(`<b>${name}</b><br>${f.properties.description || ''}`);
            
            const nodeId = `node-${layerIdCounter++}`;
            const li = createTreeNode(name, nodeId, false, layer);
            childrenUl.appendChild(li);
        }
    });
};

function parseFolder(xmlNode, parentUl) {
    // Process Placemarks
    const placemarks = getDirectChildren(xmlNode, "Placemark");
    placemarks.forEach(pm => {
        const nameNode = pm.getElementsByTagName("name")[0];
        const name = nameNode ? nameNode.textContent : "Unnamed Placemark";
        
        let layer = createLayerFromPlacemark(pm);
        if(layer) {
            layer.addTo(featureGroup);
            layer.bindPopup(name);
            
            const nodeId = `node-${layerIdCounter++}`;
            const li = createTreeNode(name, nodeId, false, layer);
            parentUl.appendChild(li);
        }
    });

    // Process Subfolders
    const folders = getDirectChildren(xmlNode, "Folder");
    folders.forEach(f => {
        const nameNode = f.getElementsByTagName("name")[0];
        const name = nameNode ? nameNode.textContent : "Unnamed Folder";
        
        const nodeId = `node-${layerIdCounter++}`;
        const li = createTreeNode(name, nodeId, true);
        parentUl.appendChild(li);
        
        const childrenUl = document.createElement('ul');
        childrenUl.className = 'tree-children';
        li.appendChild(childrenUl);
        
        parseFolder(f, childrenUl);
    });
}

function getDirectChildren(parentNode, tagName) {
    const children = [];
    for(let i=0; i<parentNode.childNodes.length; i++) {
        if(parentNode.childNodes[i].nodeName === tagName) {
            children.push(parentNode.childNodes[i]);
        }
    }
    return children;
}

function createLayerFromPlacemark(pm) {
    const point = pm.getElementsByTagName("Point")[0];
    const lineString = pm.getElementsByTagName("LineString")[0];

    if(point) {
        const coords = point.getElementsByTagName("coordinates")[0].textContent.trim().split(',');
        return L.marker([parseFloat(coords[1]), parseFloat(coords[0])]);
    } else if(lineString) {
        const coordsText = lineString.getElementsByTagName("coordinates")[0].textContent.trim().split(/\s+/);
        const latlngs = coordsText.map(c => {
            const parts = c.split(',');
            return [parseFloat(parts[1]), parseFloat(parts[0])];
        });
        return L.polyline(latlngs, {color: 'blue'});
    }
    return null;
}

function createTreeNode(name, id, isFolder, layer = null) {
    const li = document.createElement('li');
    li.className = 'tree-node';
    
    const itemDiv = document.createElement('div');
    itemDiv.className = 'tree-item';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = id;
    checkbox.checked = true;
    
    const icon = document.createElement('i');
    icon.className = isFolder ? 'fa-solid fa-folder' : (layer instanceof L.Marker ? 'fa-solid fa-location-dot' : 'fa-solid fa-route');
    
    const label = document.createElement('label');
    label.htmlFor = id;
    label.innerText = name;
    
    itemDiv.appendChild(checkbox);
    itemDiv.appendChild(icon);
    itemDiv.appendChild(label);
    li.appendChild(itemDiv);
    
    // Visibility toggle logic
    checkbox.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        if(!isFolder && layer) {
            if(isChecked) {
                featureGroup.addLayer(layer);
            } else {
                featureGroup.removeLayer(layer);
            }
        } else if (isFolder) {
            // Toggle all children
            const childrenChecks = li.querySelectorAll('ul input[type="checkbox"]');
            childrenChecks.forEach(cb => {
                cb.checked = isChecked;
                // trigger change manually
                cb.dispatchEvent(new Event('change'));
            });
        }
    });

    return li;
}

window.addNodeToTree = function(folderName, itemName, layer) {
    // Find or create folder
    const rootUl = document.getElementById('tree-root');
    let folderLi = null;
    
    // Simple lookup (could be improved)
    const labels = rootUl.getElementsByTagName('label');
    for(let i=0; i<labels.length; i++) {
        if(labels[i].innerText === folderName) {
            folderLi = labels[i].closest('li');
            break;
        }
    }
    
    if(!folderLi) {
        const folderId = `node-${layerIdCounter++}`;
        folderLi = createTreeNode(folderName, folderId, true);
        rootUl.appendChild(folderLi);
        
        const childrenUl = document.createElement('ul');
        childrenUl.className = 'tree-children';
        folderLi.appendChild(childrenUl);
    }
    
    const targetUl = folderLi.querySelector('ul');
    const nodeId = `node-${layerIdCounter++}`;
    const li = createTreeNode(itemName, nodeId, false, layer);
    targetUl.appendChild(li);
};
