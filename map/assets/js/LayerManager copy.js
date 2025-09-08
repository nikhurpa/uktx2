/**
 * layer-manager.js
 * Requires google.maps and api.php endpoints as written above.
 */
class LayerManager {
  constructor(map, apiBase = './api.php') {
    this.map = map;
    this.apiBase = apiBase;
    this.layers = {}; // table -> layer object
  }

  // --------- Server wrappers ----------
  async _call(action, params = {}, method = 'POST') {
    params.action = action;
    const opts = { method, headers: {} };
    if (method === 'GET') {
      const url = this.apiBase + '?' + new URLSearchParams(params);
      const res = await fetch(url);
      return res.json();
    } else {
      opts.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      opts.body = new URLSearchParams(params);
      const res = await fetch(this.apiBase, opts);
      return res.json();
    }
  }

  // ---------- Layer lifecycle ----------
  async createLayer(table, type, extraColumns = {}) {
    // creates a new table on the server
    const res = await this._call('create_table', { table, type, columns: JSON.stringify(extraColumns) });
    if (res.error) throw new Error(res.error);
    return this.addLayer(table); // load it after creation
  }

  async deleteLayer(table) {
    if (!confirm(`Delete layer table "${table}" from database? This will drop the table.`)) return;
    const res = await this._call('delete_table', { table });
    if (res.error) throw new Error(res.error);
    // remove from map
    if (this.layers[table]) {
      this._clearLayerGraphics(this.layers[table]);
      delete this.layers[table];
    }
    return res;
  }

  async addLayer(table) {
    const inspect = await this._call('inspect', { table }, 'GET');
    if (inspect.error) throw new Error(inspect.error);
    if (!inspect.geometry || !inspect.geometry.type) throw new Error('No geometry detected in table');
    const featuresRes = await this._call('features', { table }, 'GET');
    if (featuresRes.error) throw new Error(featuresRes.error);

    const layer = {
      table,
      type: featuresRes.type,
      geomCols: featuresRes.geomCols,
      visible: true,
      g: { markers: [], polylines: [], polygons: [] }
    };
    this._renderLayer(layer, featuresRes.features);
    this.layers[table] = layer;
    return layer;
  }

  toggleLayer(table, visible) {
    const layer = this.layers[table];
    if (!layer) return;
    layer.visible = visible;
    this._setLayerVisibility(layer, visible);
  }

  removeLayer(table) {
    const layer = this.layers[table];
    if (!layer) return;
    this._clearLayerGraphics(layer);
    delete this.layers[table];
  }

  // ---------- Add / Edit / Delete elements ----------
  // Add marker and save to DB
  async addMarkerToTable(table, latLng, attributes = {}) {
    const res = await this._call('point_create', {
      table, lat: latLng.lat(), lng: latLng.lng(), attributes: JSON.stringify(attributes)
    });
    if (res.error) throw new Error(res.error);
    // refresh layer view
    await this.addLayer(table);
    return res;
  }

  // Update marker position (call when dragend)
  async updateMarkerPosition(table, id, lat, lng) {
    const res = await this._call('point_update', { table, id, lat, lng });
    if (res.error) throw new Error(res.error);
    return res;
  }

  // Update row attributes
  async updateRow(table, id, updates) {
    const res = await this._call('row_update', { table, id, updates: JSON.stringify(updates) });
    if (res.error) throw new Error(res.error);
    return res;
  }

  // Delete a row/element
  async deleteRow(table, id) {
    const res = await this._call('row_delete', { table, id });
    if (res.error) throw new Error(res.error);
    // remove from map if present
    const layer = this.layers[table];
    if (layer) {
      ['markers','polylines','polygons'].forEach(kind => {
        (layer.g[kind] || []).forEach((g, i) => {
          if (g.__id == id) {
            g.setMap(null);
            layer.g[kind].splice(i,1);
          }
        });
      });
    }
    return res;
  }

  // Add path to table (polyline/polygon)
  async addPathToTable(table, pathLatLngArray, attributes = {}) {
    const encoded = google.maps.geometry.encoding.encodePath(pathLatLngArray);
    const res = await this._call('path_create', { table, encoded, attributes: JSON.stringify(attributes) });
    if (res.error) throw new Error(res.error);
    await this.addLayer(table);
    return res;
  }

  // Update encoded path for path objects (called internally)
  async _savePath(table, id, encoded) {
    const res = await this._call('path_update', { table, id, encoded });
    if (res.error) throw new Error(res.error);
    return res;
  }

  // ---------- internal rendering helpers ----------
  _renderLayer(layer, features) {
    this._clearLayerGraphics(layer);
    if (layer.type === 'point') {
      layer.g.markers = features.map(f => {
        if (!f.geometry) return null;
        const [lng, lat] = f.geometry.coordinates;
        const m = new google.maps.Marker({ position: {lat, lng}, map: this.map, draggable: true });
        m.__id = f.id; m.__table = layer.table; m.__props = f.properties; m.__geomType = 'point';
        m.addListener('dragend', (ev) => {
          this.updateMarkerPosition(layer.table, f.id, ev.latLng.lat(), ev.latLng.lng())
            .catch(err => console.error('updateMarkerPosition', err));
        });
        m.addListener('click', () => this._openInfoWindowForFeature(m, layer));
        return m;
      }).filter(Boolean);
    }
    if (layer.type === 'polyline') {
      layer.g.polylines = features.map(f => {
        const path = google.maps.geometry.encoding.decodePath(f.geometry.encoded || '');
        const pl = new google.maps.Polyline({ path, map: this.map, strokeColor:'#1565c0', strokeWeight:3, editable:true });
        pl.__id = f.id; pl.__table = layer.table; pl.__props = f.properties; pl.__geomType = 'polyline';
        const saver = () => this._debounceSavePath(pl);
        pl.getPath().addListener('insert_at', saver);
        pl.getPath().addListener('remove_at', saver);
        pl.getPath().addListener('set_at', saver);
        pl.addListener('click', (e) => this._openInfoWindowForFeature(pl, layer, e && e.latLng));
        return pl;
      });
    }
    if (layer.type === 'polygon') {
      layer.g.polygons = features.map(f => {
        const path = google.maps.geometry.encoding.decodePath(f.geometry.encoded || '');
        const pg = new google.maps.Polygon({ paths: path, map: this.map, strokeColor:'#2e7d32', fillColor:'#a5d6a7', editable:true });
        pg.__id = f.id; pg.__table = layer.table; pg.__props = f.properties; pg.__geomType = 'polygon';
        const saver = () => this._debounceSavePath(pg);
        pg.getPath().addListener('insert_at', saver);
        pg.getPath().addListener('remove_at', saver);
        pg.getPath().addListener('set_at', saver);
        pg.addListener('click', (e) => this._openInfoWindowForFeature(pg, layer, e && e.latLng));
        return pg;
      });
    }
    this._setLayerVisibility(layer, layer.visible);
  }

  _setLayerVisibility(layer, visible) {
    const setMap = (arr) => arr && arr.forEach(o => o.setMap(visible ? this.map : null));
    setMap(layer.g.markers); setMap(layer.g.polylines); setMap(layer.g.polygons);
  }

  _clearLayerGraphics(layer) {
    const clear = (arr) => arr && arr.forEach(o => o.setMap(null));
    clear(layer.g.markers); clear(layer.g.polylines); clear(layer.g.polygons);
    layer.g = { markers: [], polylines: [], polygons: [] };
  }

  // InfoWindow editor for properties + delete
  _openInfoWindowForFeature(gfx, layer, atLatLng) {
    if (!this._infow) this._infow = new google.maps.InfoWindow();
    const props = gfx.__props || {};
    let html = `<div style="min-width:220px"><h3 style="margin:0">${layer.table} <small style="color:#666">${gfx.__geomType}</small></h3><form id="lmf_${Math.random().toString(36).slice(2)}">`;
    Object.keys(props).forEach(k => {
      const v = props[k] == null ? '' : props[k];
      html += `<div style="display:flex;margin:6px 0;align-items:center"><label style="min-width:90px">${k}</label><input name="${k}" value="${this._escapeHtml(v)}" style="flex:1;padding:4px"/></div>`;
    });
    html += `</form><div style="display:flex;gap:6px"><button id="lm_save">Save</button><button id="lm_del" style="margin-left:auto;color:#b00020">Delete</button></div></div>`;
    this._infow.setContent(html);
    if (gfx instanceof google.maps.Marker) {
      this._infow.open(this.map, gfx);
    } else {
      this._infow.setPosition(atLatLng || this.map.getCenter());
      this._infow.open(this.map);
    }
    google.maps.event.addListenerOnce(this._infow, 'domready', () => {
      document.getElementById('lm_save').onclick = async () => {
        const form = this._infow.getContent().querySelector('form');
        const fd = new FormData(document.querySelector('form[id^="lmf_"]'));
        const updates = {};
        for (const [k,v] of fd.entries()) updates[k]=v;
        try {
          await this.updateRow(layer.table, gfx.__id, updates);
          alert('Saved');
          // refresh layer to get persisted props
          await this.addLayer(layer.table);
          this._infow.close();
        } catch (e) { alert('Error: '+e.message); }
      };
      document.getElementById('lm_del').onclick = async () => {
        if (!confirm('Delete this row?')) return;
        try {
          await this.deleteRow(layer.table, gfx.__id);
          this._infow.close();
        } catch (e) { alert('Error: '+e.message); }
      };
    });
  }

  _escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

  // debounce save path edits
  _debounceSavePath(gfx) {
    if (gfx.__saveTimeout) clearTimeout(gfx.__saveTimeout);
    gfx.__saveTimeout = setTimeout(async () => {
      const arr = [];
      const p = gfx.getPath();
      for (let i=0;i<p.getLength();i++) arr.push(p.getAt(i));
      const enc = google.maps.geometry.encoding.encodePath(arr);
      try {
        await this._savePath(gfx.__table, gfx.__id, enc);
      } catch (e) { console.error('savePath failed', e); }
    }, 600);
  }

  // helper to find features in memory
  findGraphic(table, id) {
    const layer = this.layers[table];
    if (!layer) return null;
    for (const kind of ['markers','polylines','polygons']) {
      for (const g of (layer.g[kind]||[])) if (g.__id == id) return g;
    }
    return null;
  }
}

export { LayerManager };  