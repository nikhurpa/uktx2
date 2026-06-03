<?php
// config — change this to your PC's IP where Python runs
define('AGENT_URL', 'http://YOUR_PC_IP:8765');
define('SECRET_KEY', 'change_this_secret_key_123');
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>BharatNet FTTH Report Downloader</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #0f1117;
    color: #e2e8f0;
    font-family: 'Segoe UI', system-ui, sans-serif;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem 1rem;
  }

  h1 {
    font-size: 18px;
    font-weight: 600;
    color: #f1f5f9;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  h1 span {
    background: #2563eb22;
    border: 1px solid #2563eb44;
    border-radius: 8px;
    padding: 6px 10px;
    font-size: 20px;
  }

  .card {
    background: #1a1d27;
    border: 1px solid #2d3148;
    border-radius: 12px;
    width: 100%;
    max-width: 900px;
    overflow: hidden;
  }

  .card-header {
    padding: 1.1rem 1.5rem;
    border-bottom: 1px solid #2d3148;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .card-title { font-size: 14px; font-weight: 600; color: #94a3b8; }

  .status-pill {
    font-size: 12px; padding: 3px 12px;
    border-radius: 20px; font-weight: 500;
    background: #1e293b; color: #64748b;
    border: 1px solid #334155; transition: all 0.3s;
  }
  .status-pill.running { background: #052e16; color: #4ade80; border-color: #166534; }
  .status-pill.success { background: #052e16; color: #4ade80; border-color: #166534; }
  .status-pill.error   { background: #2d0a0a; color: #f87171; border-color: #7f1d1d; }

  .controls {
    padding: 1rem 1.5rem;
    display: flex; gap: 10px;
    border-bottom: 1px solid #2d3148;
    align-items: center;
  }

  button {
    display: flex; align-items: center; gap: 7px;
    padding: 8px 18px; border-radius: 8px;
    font-size: 13px; font-weight: 500;
    cursor: pointer; border: none;
    transition: opacity 0.2s, transform 0.1s;
  }
  button:active { transform: scale(0.97); }
  button:disabled { opacity: 0.4; cursor: not-allowed; }

  #btn-run   { background: #2563eb; color: #fff; }
  #btn-run:hover:not(:disabled) { background: #1d4ed8; }
  #btn-stop  { background: #dc2626; color: #fff; }
  #btn-stop:hover:not(:disabled) { background: #b91c1c; }
  #btn-clear { background: #1e293b; color: #94a3b8; border: 1px solid #334155; }
  #btn-clear:hover { background: #273344; }

  .agent-status {
    margin-left: auto; font-size: 12px; color: #475569;
    display: flex; align-items: center; gap: 6px;
  }
  .dot-indicator {
    width: 8px; height: 8px; border-radius: 50%;
    background: #374151; transition: background 0.3s;
  }
  .dot-indicator.online  { background: #4ade80; box-shadow: 0 0 6px #4ade8088; }
  .dot-indicator.offline { background: #f87171; }

  .terminal-bar {
    padding: 7px 14px; background: #13151f;
    display: flex; align-items: center; gap: 6px;
    border-bottom: 1px solid #1e2235;
  }
  .dot { width: 10px; height: 10px; border-radius: 50%; }
  .dot-r { background: #ff5f57; }
  .dot-y { background: #febc2e; }
  .dot-g { background: #28c840; }
  .terminal-label { margin-left: 6px; font-size: 11px; color: #4b5563; font-family: monospace; }

  #terminal {
    background: #0d0f18; color: #d4d4d8;
    font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
    font-size: 13px; line-height: 1.7;
    padding: 1rem 1.25rem;
    height: 460px; overflow-y: auto;
    white-space: pre-wrap; word-break: break-all;
  }

  .line         { display: block; }
  .line-divider { color: #4b5563; }
  .line-success { color: #4ade80; }
  .line-error   { color: #f87171; }
  .line-warn    { color: #fbbf24; }
  .line-info    { color: #60a5fa; }
  .line-dim     { color: #6b7280; }

  .cursor {
    display: inline-block; width: 8px; height: 14px;
    background: #4ade80; vertical-align: middle;
    animation: blink 1s step-end infinite;
  }
  @keyframes blink { 50% { opacity: 0; } }

  .stats-bar {
    padding: 0.7rem 1.5rem; border-top: 1px solid #2d3148;
    display: flex; gap: 1.5rem; font-size: 12px; color: #475569;
  }
  .stat span { color: #94a3b8; font-weight: 500; }
</style>
</head>
<body>

<h1><span>📡</span> BharatNet FTTH Report Downloader</h1>

<div class="card">
  <div class="card-header">
    <div class="card-title">python main1.py — Live Output</div>
    <div class="status-pill" id="status-pill">Idle</div>
  </div>

  <div class="controls">
    <button id="btn-run">▶ Run Script</button>
    <button id="btn-stop" disabled>■ Stop</button>
    <button id="btn-clear">🗑 Clear</button>
    <div class="agent-status">
      <div class="dot-indicator" id="agent-dot"></div>
      <span id="agent-label">Checking agent...</span>
    </div>
  </div>

  <div class="terminal-bar">
    <div class="dot dot-r"></div>
    <div class="dot dot-y"></div>
    <div class="dot dot-g"></div>
    <span class="terminal-label">output — python main1.py</span>
  </div>
  <div id="terminal"><span class="line line-dim">Ready. Press Run Script to start.</span>
</div>

  <div class="stats-bar">
    <div class="stat">Lines: <span id="stat-lines">0</span></div>
    <div class="stat">Started: <span id="stat-time">-</span></div>
    <div class="stat">Elapsed: <span id="stat-elapsed">-</span></div>
  </div>
</div>

<script>
const AGENT = '<?= AGENT_URL ?>';
const KEY   = '<?= SECRET_KEY ?>';

const terminal    = document.getElementById("terminal");
const btnRun      = document.getElementById("btn-run");
const btnStop     = document.getElementById("btn-stop");
const btnClear    = document.getElementById("btn-clear");
const pill        = document.getElementById("status-pill");
const agentDot    = document.getElementById("agent-dot");
const agentLabel  = document.getElementById("agent-label");
const statLines   = document.getElementById("stat-lines");
const statTime    = document.getElementById("stat-time");
const statElapsed = document.getElementById("stat-elapsed");

let evtSource = null, lineCount = 0, startTime = null, elapsedTimer = null, cursorEl = null;

// Check agent connectivity on load
async function checkAgent() {
  try {
    const r = await fetch(AGENT + '/ping?key=' + KEY, { signal: AbortSignal.timeout(3000) });
    const j = await r.json();
    if (j.status === 'ok') {
      agentDot.className = 'dot-indicator online';
      agentLabel.textContent = 'Agent online';
    } else { throw new Error(); }
  } catch {
    agentDot.className = 'dot-indicator offline';
    agentLabel.textContent = 'Agent offline';
  }
}
checkAgent();
setInterval(checkAgent, 15000);

function classify(t) {
  const u = t.toUpperCase();
  if (u.includes("ERROR")) return "line-error";
  if (u.includes("[WARN]")) return "line-warn";
  if (u.includes("[DONE]") || u.includes("COMPLETED") || u.includes("SUCCESSFUL")) return "line-success";
  if (u.startsWith("==") || u.endsWith("==")) return "line-divider";
  if (u.includes("DOWNLOAD") || u.includes("UPLOADING") || u.includes("CONNECTING") || u.includes("READING") || u.includes("CONVERTING")) return "line-info";
  return "line";
}

function appendLine(text) {
  if (cursorEl) { cursorEl.remove(); cursorEl = null; }
  const span = document.createElement("span");
  span.className = `line ${classify(text)}`;
  span.textContent = text;
  terminal.appendChild(span);
  terminal.appendChild(document.createTextNode("\n"));
  lineCount++;
  statLines.textContent = lineCount;
  terminal.scrollTop = terminal.scrollHeight;
}

function addCursor() {
  if (cursorEl) return;
  cursorEl = document.createElement("span");
  cursorEl.className = "cursor";
  terminal.appendChild(cursorEl);
  terminal.scrollTop = terminal.scrollHeight;
}

function setStatus(s) {
  pill.className = "status-pill " + s;
  pill.textContent = s === "running" ? "Running..." : s === "success" ? "Done" : s === "error" ? "Error" : "Idle";
}

function startElapsed() {
  startTime = Date.now();
  statTime.textContent = new Date().toLocaleTimeString();
  elapsedTimer = setInterval(() => {
    const s = Math.floor((Date.now() - startTime) / 1000);
    statElapsed.textContent = `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  }, 1000);
}

btnRun.addEventListener("click", () => {
  if (evtSource) { evtSource.close(); }
  terminal.innerHTML = "";
  lineCount = 0; statLines.textContent = 0; statElapsed.textContent = "00:00";
  btnRun.disabled = true; btnStop.disabled = false;
  setStatus("running"); startElapsed(); addCursor();

  // Stream from agent via PHP proxy
  evtSource = new EventSource(`api/stream.php?key=${KEY}`);

  evtSource.onmessage = e => {
    if (e.data === "__END__") {
      evtSource.close(); evtSource = null;
      btnRun.disabled = false; btnStop.disabled = true;
      clearInterval(elapsedTimer);
      if (cursorEl) { cursorEl.remove(); cursorEl = null; }
      return;
    }
    appendLine(e.data);
    if (e.data.includes("[DONE]") || e.data.includes("PROCESS COMPLETED")) setStatus("success");
    if (e.data.includes("[ERROR]") || e.data.includes("ERROR")) setStatus("error");
  };

  evtSource.onerror = () => {
    evtSource.close(); evtSource = null;
    appendLine("[ERROR] Lost connection to agent.");
    setStatus("error");
    btnRun.disabled = false; btnStop.disabled = true;
    clearInterval(elapsedTimer);
    if (cursorEl) { cursorEl.remove(); cursorEl = null; }
  };
});

btnStop.addEventListener("click", async () => {
  await fetch(`api/stop.php?key=${KEY}`);
  if (evtSource) { evtSource.close(); evtSource = null; }
  appendLine("[STOPPED] Script was manually stopped.");
  setStatus("idle");
  btnRun.disabled = false; btnStop.disabled = true;
  clearInterval(elapsedTimer);
  if (cursorEl) { cursorEl.remove(); cursorEl = null; }
});

btnClear.addEventListener("click", () => {
  terminal.innerHTML = '<span class="line line-dim">Ready. Press Run Script to start.</span>\n';
  lineCount = 0; statLines.textContent = 0;
  statTime.textContent = "-"; statElapsed.textContent = "-";
  setStatus("idle");
});
</script>
</body>
</html>
