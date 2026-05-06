function handleFile(input, zoneId, nameId) {
  const zone = document.getElementById(zoneId);
  const nameEl = document.getElementById(nameId);
  if (input.files[0]) {
    zone.classList.add('filled');
    nameEl.textContent = input.files[0].name;
  }
}

function loadConfFile(input) {
  if (!input.files[0]) return;
  const reader = new FileReader();
  reader.onload = e => { document.getElementById('configText').value = e.target.result; };
  reader.readAsText(input.files[0]);
}

// Drag-over style
['excelZone','confZone'].forEach(id => {
  const el = document.getElementById(id);
  el.addEventListener('dragover', e => { e.preventDefault(); el.classList.add('over'); });
  el.addEventListener('dragleave', () => el.classList.remove('over'));
  el.addEventListener('drop', () => el.classList.remove('over'));
});

// ─── Config parser ────────────────────────────────────────────────────────────
function parseConfig(src) {
  // Strip "const conf =" wrapper and evaluate safely
  let cleaned = src.replace(/\/\/[^\n]*/g, '').trim();
  cleaned = cleaned.replace(/^const\s+\w+\s*=\s*/, '').replace(/;$/, '');
  try {
    return Function('"use strict"; return (' + cleaned + ')')();
  } catch(e) {
    throw new Error('Config parse error: ' + e.message);
  }
}

// ─── Logging ──────────────────────────────────────────────────────────────────
function log(msg, type='') {
  const el = document.getElementById('log');
  const now = new Date().toLocaleTimeString('en-US', {hour12:false});
  const row = document.createElement('div');
  row.className = 'log-entry';
  row.innerHTML = `<span class="log-time">${now}</span><span class="log-msg ${type}">${msg}</span>`;
  el.appendChild(row);
  el.scrollTop = el.scrollHeight;
}

function clearLog() { document.getElementById('log').innerHTML = ''; }

// ─── Progress helpers ─────────────────────────────────────────────────────────
let startTime, timerInterval, totalRows = 0, processedRows = 0, errorRows = 0;

function setProgress(done, total) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('pctVal').textContent = pct + '%';
  document.getElementById('statDone').textContent = done;
  document.getElementById('statErr').textContent = errorRows;
}

function startTimer() {
  startTime = Date.now();
  timerInterval = setInterval(() => {
    const s = Math.floor((Date.now() - startTime) / 1000);
    document.getElementById('statTime').textContent = s + 's';
  }, 500);
}

function stopTimer() { clearInterval(timerInterval); }

// ─── Main sync ────────────────────────────────────────────────────────────────
async function startSync() {
  const excelInput = document.getElementById('excelFile');
  if (!excelInput.files[0]) { alert('Please select an Excel file.'); return; }

  // Parse config
  let conf;
  try {
    conf = parseConfig(document.getElementById('configText').value);
  } catch(e) { alert(e.message); return; }

  // Gather DB settings
  const db = {
    host: document.getElementById('dbHost').value.trim(),
    port: document.getElementById('dbPort').value.trim(),
    name: document.getElementById('dbName').value.trim(),
    user: document.getElementById('dbUser').value.trim(),
    pass: document.getElementById('dbPass').value,
  };
  if (!db.name || !db.user) { alert('Please fill in DB name and username.'); return; }

  const batchSize = parseInt(document.getElementById('batchSize').value) || 200;

  // Read Excel client-side
  log('Reading Excel file…', 'info');
  let rows;
  try {
    rows = await readExcel(excelInput.files[0], conf.sheet);
  } catch(e) { log('Excel read error: ' + e.message, 'error'); return; }

  if (!rows.length) { log('No data rows found in sheet.', 'warn'); return; }

  totalRows = rows.length;
  processedRows = 0;
  errorRows = 0;

  document.getElementById('statTotal').textContent = totalRows;
  document.getElementById('progressPanel').classList.add('active');
  document.getElementById('doneBanner').className = 'done-banner';
  document.getElementById('doneBanner').textContent = '';

  const btn = document.getElementById('runBtn');
  btn.disabled = true;
  btn.classList.add('running');
  document.getElementById('runLabel').textContent = 'Syncing…';

  startTimer();
  log(`Starting sync: ${totalRows} rows, batch=${batchSize}, action=${conf.action}, uid_col=${conf.unique_id}→${conf.unique_id_field}`, 'info');

  // Slice into batches
  const batches = [];
  for (let i = 0; i < rows.length; i += batchSize) {
    batches.push(rows.slice(i, i + batchSize));
  }

  // Process batches sequentially
  let batchNum = 0;
  for (const batch of batches) {
    batchNum++;
    try {
      const res = await sendBatch(batch, conf, db, batchNum, batches.length);
      processedRows += res.processed;
      errorRows += res.errors;
      setProgress(processedRows, totalRows);
      const errInfo = res.errors > 0 ? `, ${res.errors} errors` : '';
      log(`Batch ${batchNum}/${batches.length}: ${res.processed} processed${errInfo}`,
          res.errors > 0 ? 'warn' : 'success');
      if (res.error_details) {
        res.error_details.forEach(e => log('  ⚠ ' + e, 'error'));
      }
    } catch(e) {
      log(`Batch ${batchNum} failed: ${e.message}`, 'error');
      errorRows += batch.length;
      setProgress(processedRows, totalRows);
    }
  }

  stopTimer();
  btn.disabled = false;
  btn.classList.remove('running');
  document.getElementById('runLabel').textContent = 'Run Sync';

  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const banner = document.getElementById('doneBanner');

  if (errorRows === 0) {
    log(`✓ Complete — ${processedRows} rows synced in ${elapsed}s`, 'success');
    banner.textContent = `✓ Sync complete — ${processedRows} rows processed in ${elapsed}s`;
    banner.className = 'done-banner visible';
  } else {
    log(`⚠ Done with errors — ${processedRows} ok, ${errorRows} failed, ${elapsed}s`, 'warn');
    banner.textContent = `⚠ Done with errors — ${processedRows} ok, ${errorRows} errors`;
    banner.className = 'done-banner visible error-banner';
  }
}

// ─── Read Excel via SheetJS ───────────────────────────────────────────────────
function readExcel(file, sheetName) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const wb = XLSX.read(new Uint8Array(e.target.result), {type:'array'});
        const sheet = wb.Sheets[sheetName] || wb.Sheets[wb.SheetNames[0]];
        if (!sheet) throw new Error('Sheet not found: ' + sheetName);
        // Get raw rows as arrays (header = false for column-letter access)
        const data = XLSX.utils.sheet_to_json(sheet, {header:1, defval:''});
        // Remove header row (row 0 is headers)
        const headers = data[0] || [];
        const rows = data.slice(1).filter(r => r.some(c => c !== ''));
        resolve({headers, rows});
      } catch(e) { reject(e); }
    };
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsArrayBuffer(file);
  });
}

// ─── Send batch to PHP ────────────────────────────────────────────────────────
async function sendBatch(batch, conf, db, batchNum, totalBatches) {
  const payload = {
    rows: batch.rows !== undefined ? batch : batch, // rows are arrays
    conf,
    db,
    batch_num: batchNum,
    total_batches: totalBatches
  };

  // batch here is {headers, rows} object merged from readExcel
  // Actually batch is just a slice of rows array - we pass headers via conf reference
  const fd = new FormData();
  fd.append('payload', JSON.stringify({
    headers: batch.headers || [],
    rows: batch.rows || batch,
    conf,
    db,
    batch_num: batchNum
  }));

  const resp = await fetch('./grid/files/sync.php', { method: 'POST', body: fd });
  if (!resp.ok) throw new Error('HTTP ' + resp.status);
  const json = await resp.json();
  if (json.fatal) throw new Error(json.fatal);
  return json;
}
// </script>

// <!-- Fix batch call to carry headers properly -->
// <script>
// Patch: override startSync batch dispatch to carry headers
const _origSendBatch = sendBatch;
window.sendBatch = async function(batchRows, conf, db, batchNum, totalBatches) {
  const fd = new FormData();
  fd.append('payload', JSON.stringify({
    rows: batchRows,
    conf,
    db,
    batch_num: batchNum,
    total_batches: totalBatches
  }));
  const resp = await fetch('./grid/files/sync.php', { method: 'POST', body: fd });
  if (!resp.ok) throw new Error('HTTP ' + resp.status);
  const json = await resp.json();
  if (json.fatal) throw new Error(json.fatal);
  return json;
};

// Also patch readExcel to return flat rows (arrays), not object
window.readExcel = function(file, sheetName) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const wb = XLSX.read(new Uint8Array(e.target.result), {type:'array'});
        const wsName = Object.keys(wb.Sheets).find(n => n === sheetName) || wb.SheetNames[0];
        const sheet = wb.Sheets[wsName];
        if (!sheet) throw new Error('Sheet not found');
        const data = XLSX.utils.sheet_to_json(sheet, {header:1, defval:''});
        const rows = data.slice(1).filter(r => r.some(c => c !== '' && c !== null && c !== undefined));
        resolve(rows);
      } catch(err) { reject(err); }
    };
    reader.onerror = () => reject(new Error('File read error'));
    reader.readAsArrayBuffer(file);
  });
};