  const tempNodes = [];
  const myNodes = [];

  // context menu state
  let ctxNode = null;
  let ctxNodeArray = null; // which array (tempNodes or myNodes)
  const ctxMenu1 = document.getElementById('contextMenu1');

  // helpers
  const uid = (()=>{let c=1; return ()=>'n'+(c++);})();

  // -------------------------
  // init
  // -------------------------
  (async function init(){
    // import the libs we need
    // const { Map } = await google.maps.importLibrary("maps"); // returns Map class
    const markerModule = await google.maps.importLibrary("marker"); // AdvancedMarkerElement in marker module
    AdvancedMarkerElementClass = markerModule.AdvancedMarkerElement;

    // map = new Map(document.getElementById('map'), {
    //   center: { lat: 20, lng: 78 },
    //   zoom: 5,
    //   gestureHandling: 'greedy',
    //   mapId: "YOUR_MAP_ID"   // 👈 required now
    // });

    // wire file input
    document.getElementById('kmlFile').addEventListener('change', onKmlFile);
    // context menu actions
    document.getElementById('ctxEdit').addEventListener('click', onCtxEdit);
    document.getElementById('ctxDelete').addEventListener('click', onCtxDelete);
    document.getElementById('ctxSave').addEventListener('click', onCtxSave);

    document.addEventListener('click', ()=> ctxMenu1.style.display='none');

    // control buttons
    document.getElementById('saveAll').addEventListener('click', ()=>saveNodes(tempNodes.slice()));
    document.getElementById('saveSelected').addEventListener('click', ()=> {
      const sel = findSelectedNode(tempNodes);
      if(!sel) return alert('Select a temp node in tree first (click its label).');
      saveNodes([sel]);
    });
    document.getElementById('clearTemp').addEventListener('click', ()=> { clearTemp(); renderTrees(); });

    renderTrees();
  })();

  // -------------------------
  // KML parsing and overlay creation
  // -------------------------
  async function onKmlFile(ev){
    const file = ev.target.files && ev.target.files[0];
    if(!file) return;
    try {
      const txt = await file.text();
      const parsedRoots = parseKMLText(txt);
      // For each parsed root create overlays and push into tempNodes
      parsedRoots.forEach(r => {
        createOverlaysForNodeRecursively(r);
        tempNodes.push(r);
      });
      renderTrees();
    } catch(err) {
      console.error('KML load error', err);
      alert('Failed to parse KML: see console');
    }
  }

  // Parse KML string -> array of root nodes
  function parseKMLText(kmlText){
    const parser = new DOMParser();
    const xml = parser.parseFromString(kmlText, "application/xml");

    // node walker helper by localName
    function getElementsByLocalName(root, localName){
      const arr=[];
      const it = document.createNodeIterator(root, NodeFilter.SHOW_ELEMENT, null);
      let n; while(n=it.nextNode()){
        if(n.localName === localName) arr.push(n);
      }
      return arr;
    }

    // parse a Placemark element
    function parsePlacemark(pm){
      const name = (pm.querySelector && (pm.querySelector('name')?.textContent)) || pm.getElementsByTagName('name')[0]?.textContent || 'Placemark';
      // find geometry by localName
      let geomNode = null;
      const locals = ['Point','LineString','Polygon'];
      const it = document.createNodeIterator(pm, NodeFilter.SHOW_ELEMENT, null);
      let n; while(n = it.nextNode()){
        if(locals.includes(n.localName)){ geomNode = n; break; }
      }
      let node = { id: uid(), name, geomType:null, geomData:null, overlay:null, children:[], temp:true, visible:false };
      if(geomNode){
        node.geomType = geomNode.localName;
        // coordinates element inside
        const coordsNode = (() => {
          let nn = geomNode.querySelector ? geomNode.querySelector('coordinates') : null;
          if(!nn){ // fallback walk
            const it2 = document.createNodeIterator(geomNode, NodeFilter.SHOW_ELEMENT, null);
            let m; while(m=it2.nextNode()){ if(m.localName==='coordinates'){ nn=m; break; } }
          }
          return nn;
        })();
        if(coordsNode){
          const raw = coordsNode.textContent.trim();
          if(node.geomType === 'Point'){
            const [lon,lat] = raw.split(',').map(Number);
            node.geomData = { lat, lng: lon };
          } else if(node.geomType === 'LineString'){
            const coords = raw.split(/\s+/).map(s=>{
              const [lon,lat] = s.split(',').map(Number); return { lat, lng: lon };
            });
            node.geomData = coords;
          } else if(node.geomType === 'Polygon'){
            // take first LinearRing (outer)
            const lr = geomNode.getElementsByTagName('LinearRing')[0];
            const coordsText = lr ? (lr.querySelector ? lr.querySelector('coordinates')?.textContent : null) : null;
            const rawCoords = (coordsText || raw).trim();
            const coords = rawCoords.split(/\s+/).map(s => { const [lon,lat] = s.split(',').map(Number); return { lat, lng: lon }; });
            node.geomData = [coords]; // array of rings
          }
          node.visible = true;
        } else {
          node.visible = false;
        }
      }
      return node;
    }

    // parse Folder/Document recursively
    
    function parseContainer(el){
      const nameEl = el.querySelector ? el.querySelector('name') : null;
      const name = (nameEl && nameEl.textContent.trim()) || el.localName;
      const node = { id: uid(), name, geomType: null, geomData: null, overlay:null, children:[], temp:true, visible:false };
      // iter children Placemark and Folder
      const childIt = document.createNodeIterator(el, NodeFilter.SHOW_ELEMENT, null);
      let x; while (x = childIt.nextNode()){
        // only direct-level children: skip nested descendants by checking parent chain?
        // Simpler: collect only Placemark/Folders whose parentNode is this element or are direct descendants with their own structure.
      }
      // Simpler: use XPath-like: find immediate Placemark descendants that are direct children by checking parent chain
      for(const tag of ['Placemark','Folder','Document']){
        const list = getElementsByLocalName(el, tag);
        for(const item of list){
          // push only if parent (or nearest element parent) is current el to mimic hierarchy
          // We'll accept slight flattening: KML structures vary.
          if(item === el) continue;
          // If item is nested deeper we still include (acceptable)
          if(tag === 'Placemark') node.children.push(parsePlacemark(item));
          else node.children.push(parseContainer(item));
        }
      }
      // set visible if any child visible
      node.visible = node.children.some(c=>c.visible) || !!node.geomData;
      return node;
    }

    // If Document or Folder at root, parse them; else parse placemarks
    const docs = getElementsByLocalName(xml, 'Document');
    const folders = getElementsByLocalName(xml, 'Folder');
    const roots = [];
    if(docs.length){
      docs.forEach(d => roots.push(parseContainer(d)));
    } else if(folders.length){
      folders.forEach(f => roots.push(parseContainer(f)));
    } else {
      // fallback: parse top-level Placemarks
      const placemarks = getElementsByLocalName(xml, 'Placemark');
      for(const p of placemarks) roots.push(parsePlacemark(p));
    }
    return roots;
  }

  // -------------------------
  // overlay creation
  // -------------------------
  function createOverlaysForNodeRecursively(node){
    // create for this node if it has geomData
    if(node.geomType && node.geomData){
      if(node.geomType === 'Point'){
     

        // const container = document.createElement('div');
        // // small vertical arrow svg
        // container.innerHTML = `<svg width="18" height="26" viewBox="0 0 20 30" xmlns="http://www.w3.org/2000/svg" style="transform:translate(-9px,-26px);">
        //   <polygon points="10,0 15,10 12,10 12,24 8,24 8,10 5,10" fill="#ef4444" stroke="#000" stroke-width="0.5"/>
        // </svg>`;
        // container.style.pointerEvents = 'auto'; // allow DOM events

       // create AdvancedMarkerElement with small arrow or dot
        const container = document.createElement("div");
        container.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="18" viewBox="0 0 14 18">
            <polygon points="10,0 13.5,6 11,6 11,18 9,18 9,6 6.5,6" 
                    fill="#83F52C" stroke="black" stroke-width=".4"/>
        </svg>
        `;
        //  <polygon points="10,0 15,10 12,10 12,25 8,25 8,10 5,10" 
        container.style.transform = "translate(-2px, 18px)"; // align tip to latLng
        container.style.pointerEvents = 'auto'; // allow DOM events

        const marker = new AdvancedMarkerElementClass({
          position: node.geomData,
          content: container,
          map: map
        });

        // right-click on content -> context menu
        container.addEventListener('contextmenu1', (ev) => {
          ev.preventDefault();
          ctxNode = node; ctxNodeArray = tempNodes;
          showContextMenu(ev.pageX, ev.pageY);
        });

        node.overlay = marker;
      }

      if(node.geomType === 'LineString'){
        const poly = new google.maps.Polyline({
          path: node.geomData,
          map: map,
          strokeColor: '#ef4444', strokeWeight: 3, geodesic: true
        });
        // rightclick event on polyline -> context
        poly.addListener('rightclick', (ev) => {
          ctxNode = node; ctxNodeArray = tempNodes;
          showContextMenu(ev.domEvent.pageX, ev.domEvent.pageY);
        });
        node.overlay = poly;
      }

      if(node.geomType === 'Polygon'){
        const poly = new google.maps.Polygon({
          paths: node.geomData[0],
          map: map,
          strokeColor: '#ef4444', fillColor:'#ef444430', strokeWeight: 2
        });
        poly.addListener('rightclick', (ev) => {
          ctxNode = node; ctxNodeArray = tempNodes;
          showContextMenu(ev.domEvent.pageX, ev.domEvent.pageY);
        });
        node.overlay = poly;
      }
    }

    // recurse children
    if(node.children && node.children.length){
      node.children.forEach(ch => createOverlaysForNodeRecursively(ch));
    }
  }

  // -------------------------
  // Rendering the tree UI
  // -------------------------
  function renderTrees(){
    renderTreeInto(tempNodes, document.getElementById('tempTree'), true);
    renderTreeInto(myNodes, document.getElementById('myTree'), false);
  }

  function renderTreeInto(nodesArray, containerEl, isTemp){
    containerEl.innerHTML = '';
    nodesArray.forEach(node => containerEl.appendChild(renderNode(node, isTemp)));
  }

  function renderNode(node, isTemp){
    // li wrapper
    const li = document.createElement('div');
    li.className = 'node';
    // title row
    const title = document.createElement('div');
    title.className = 'node-title';

    // caret if children
    if(node.children && node.children.length){
      const caret = document.createElement('span');
      caret.className = 'caret';
      caret.textContent = node.name;
      title.appendChild(caret);
      const checkbox = document.createElement('input'); checkbox.type='checkbox'; checkbox.style.marginRight='6px';
      title.insertBefore(checkbox, caret);

      const childContainer = document.createElement('div');
      childContainer.className = 'nested';
      node.children.forEach(ch => childContainer.appendChild(renderNode(ch, isTemp)));

      caret.addEventListener('click', ()=>{ caret.classList.toggle('caret-down'); childContainer.classList.toggle('active'); });
      checkbox.addEventListener('change', (e)=>{
        const val = e.target.checked;
        // cascade
        childContainer.querySelectorAll('input[type=checkbox]').forEach(c=>c.checked = val);
        toggleOverlayRec(node, val);
      });

      li.appendChild(title);
      li.appendChild(childContainer);
    } else {
      // leaf
      const checkbox = document.createElement('input'); checkbox.type='checkbox'; checkbox.style.marginRight='6px';
      title.appendChild(checkbox);
      const label = document.createElement('span');
      label.textContent = node.name;
      title.appendChild(label);

      checkbox.addEventListener('change', (e)=> toggleOverlay(node, e.target.checked) );

      // select on label click
      label.addEventListener('click', (ev) => {
        ev.stopPropagation();
        document.querySelectorAll('.node .node-title').forEach(n=>n.classList.remove('selected'));
        title.classList.add('selected');
        // center/flash overlay
        if(node.overlay){
          if(node.geomType==='Point') map.panTo(node.geomData);
          else {
            // fit bounds
            const b = new google.maps.LatLngBounds();
            if(node.geomType==='LineString') node.geomData.forEach(p=>b.extend(p));
            if(node.geomType==='Polygon') node.geomData[0].forEach(p=>b.extend(p));
            map.fitBounds(b);
          }
        }
      });

      // right-click on label -> context
      title.addEventListener('contextmenu1', (ev) => {
        ev.preventDefault();
        ctxNode = node; ctxNodeArray = isTemp ? tempNodes : myNodes;
        showContextMenu(ev.pageX, ev.pageY);
      });

      li.appendChild(title);
    }

    return li;
  }

  // toggle overlay for node + children
  function toggleOverlayRec(node, visible){
    if(node.overlay){
      if(visible) {
        if(node.overlay instanceof google.maps.Polyline || node.overlay instanceof google.maps.Polygon) node.overlay.setMap(map);
        else node.overlay.map = map;
      } else {
        if(node.overlay instanceof google.maps.Polyline || node.overlay instanceof google.maps.Polygon) node.overlay.setMap(null);
        else node.overlay.map = null;
      }
    }
    if(node.children) node.children.forEach(ch => toggleOverlayRec(ch, visible));
  }
  function toggleOverlay(node, visible){
    toggleOverlayRec(node, visible);
  }

  // -------------------------
  // Context menu actions
  // -------------------------
  function showContextMenu(x,y){
    ctxMenu1.style.left = x + 'px';
    ctxMenu1.style.top = y + 'px';
    // show Save only for temp nodes
    document.getElementById('ctxSave').style.display = ctxNode ? (ctxNode.temp ? 'block' : 'none') : 'none';
    ctxMenu1.style.display = 'block';
  }

  function onCtxEdit(){
    ctxMenu1.style.display='none';
    if(!ctxNode) return;
    const newName = prompt('Rename item', ctxNode.name);
    if(newName) { ctxNode.name = newName; renderTrees(); }
  }
  function onCtxDelete(){
    ctxMenu1.style.display='none';
    if(!ctxNode) return;
    if(!confirm('Delete "'+ctxNode.name+'"?')) return;
    // remove overlay and remove from array (recursive search)
    function removeFromArray(arr,target){
      const idx = arr.indexOf(target);
      if(idx>=0){ // cleanup overlay
        cleanupOverlay(target);
        arr.splice(idx,1); return true;
      }
      for(const it of arr){
        if(it.children && removeFromArray(it.children,target)) return true;
      }
      return false;
    }
    removeFromArray(tempNodes, ctxNode);
    removeFromArray(myNodes, ctxNode);
    renderTrees();
  }
  function onCtxSave(){
    ctxMenu1.style.display='none';
    if(!ctxNode || !ctxNode.temp) return;
    // move to myNodes (simple push)
    ctxNode.temp = false;
    myNodes.push(ctxNode);
    // also remove from tempNodes
    function removeFrom(arr,target){
      const idx = arr.indexOf(target);
      if(idx>=0){ arr.splice(idx,1); return true; }
      for(const a of arr) if(a.children && removeFrom(a.children,target)) return true;
      return false;
    }
    removeFrom(tempNodes, ctxNode);
    // TODO: do AJAX POST to persist to DB
    renderTrees();
    alert('Saved to My Places (demo). Implement server call to persist.');
  }

  function cleanupOverlay(node){
    if(node.overlay){
      try{
        if(node.overlay instanceof google.maps.Polyline || node.overlay instanceof google.maps.Polygon) node.overlay.setMap(null);
        else node.overlay.map = null;
      }catch(e){}
      node.overlay = null;
    }
    if(node.children) node.children.forEach(ch => cleanupOverlay(ch));
  }

  // find selected top-level node in an array by checking .selected class on DOM titles (simple helper)
  function findSelectedNode(arr){
    // we walk the DOM selected class and map back by name (simple approach for demo)
    const sel = document.querySelector('.node .node-title.selected');
    if(!sel) return null;
    const name = sel.querySelector('span:not(.caret)')?.textContent || sel.querySelector('.caret')?.textContent;
    function walk(a){
      for(const n of a){
        if(n.name === name) return n;
        if(n.children){
          const r = walk(n.children);
          if(r) return r;
        }
      }
      return null;
    }
    return walk(arr);
  }

  // save nodes (stub)
  function saveNodes(nodes){
    if(!nodes || !nodes.length) return alert('No nodes to save');
    // in production you would POST nodes -> server; here we simulate
    nodes.forEach(n => { n.temp = false; myNodes.push(n); removeNodeFromTemp(n); });
    renderTrees();
    alert('Saved (demo). Implement your server API to persist.');
  }
  function removeNodeFromTemp(node){
    function rec(arr){
      const i = arr.indexOf(node);
      if(i>=0){ arr.splice(i,1); return true; }
      for(const it of arr) if(it.children && rec(it.children)) return true;
      return false;
    }
    rec(tempNodes);
  }

  function clearTemp(){
    // remove overlays
    tempNodes.forEach(n => cleanupOverlay(n));
    tempNodes.length = 0;
  }

  // -------------------------
  let pathCounter = 1;

function addDrawnPath(latlngs) {
  const node = {
    id: uid(),
    name: "Path " + pathCounter++,
    geomType: "LineString",
    geomData: latlngs,
    overlay: null,
    children: [],
    temp: true,
    visible: true
  };

  // Create overlay for the path
  const poly = new google.maps.Polyline({
    path: node.geomData,
    map: map,
    strokeColor: "#1d4ed8",
    strokeWeight: 3,
    geodesic: true
  });

  // Right-click context menu
  poly.addListener("rightclick", (ev) => {
    ctxNode = node;
    ctxNodeArray = tempNodes;
    showContextMenu(ev.domEvent.pageX, ev.domEvent.pageY);
  });

  node.overlay = poly;

  // Add to temporary places
  tempNodes.push(node);
  renderTrees();
}
  // Fin
  // -------------------------