<?php
// ─────────────────────────────────────────────────────────────────────────────
// save_myplace.php  —  receives JSON from saveNodeToMyPlace()
// POST body: { "nodes": [ {client_id, parent_id, label, geom_type,
//                           coordinates, style, icon, checked,
//                           sort_order, user_id}, … ] }
// ─────────────────────────────────────────────────────────────────────────────

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');

// ── DB config ────────────────────────────────────────────────────────────────
define('DB_HOST', 'localhost');
define('DB_USER', 'uktx');
define('DB_PASS', 'uktx123');
define('DB_NAME', 'ukcfa');

function getDb() {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    return $pdo;
}

// ── Handle preflight ─────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200); exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'POST required']);
    exit;
}

$body = json_decode(file_get_contents('php://input'), true);
if (!$body || empty($body['nodes'])) {
    echo json_encode(['success' => false, 'message' => 'No nodes received']);
    exit;
}

$nodes = $body['nodes'];

try {
    $pdo = getDb();
    $saved = 0;

    // Map client_id → auto-increment DB id (so parent_id FK is correct)
    $idMap = [];   // client_id => db_id

    $stmt = $pdo->prepare("
        INSERT INTO map_places
            (parent_id, client_id, label, geom_type, coordinates,
             style, icon, checked, sort_order, user_id,
             created_at, updated_at)
        VALUES
            (:parent_id, :client_id, :label, :geom_type, :coordinates,
             :style, :icon, :checked, :sort_order, :user_id,
             NOW(), NOW())
        ON DUPLICATE KEY UPDATE
            label       = VALUES(label),
            geom_type   = VALUES(geom_type),
            coordinates = VALUES(coordinates),
            style       = VALUES(style),
            icon        = VALUES(icon),
            checked     = VALUES(checked),
            sort_order  = VALUES(sort_order),
            updated_at  = NOW()
    ");

    foreach ($nodes as $node) {
        // Resolve parent_id from our id map
        $dbParentId = null;
        if (!empty($node['parent_id']) && isset($idMap[$node['parent_id']])) {
            $dbParentId = $idMap[$node['parent_id']];
        }

        $stmt->execute([
            ':parent_id'   => $dbParentId,
            ':client_id'   => $node['client_id']   ?? '',
            ':label'       => $node['label']        ?? '',
            ':geom_type'   => $node['geom_type']    ?? 'Folder',
            ':coordinates' => $node['coordinates']  ?? '',
            ':style'       => $node['style']        ?? '{}',
            ':icon'        => $node['icon']         ?? '',
            ':checked'     => $node['checked']      ?? 1,
            ':sort_order'  => $node['sort_order']   ?? 0,
            ':user_id'     => $node['user_id']      ?? 1,
        ]);

        $dbId = $pdo->lastInsertId();
        if (!$dbId) {
            // ON DUPLICATE UPDATE — fetch existing id
            $sel   = $pdo->prepare("SELECT id FROM map_places WHERE client_id = ? AND user_id = ?");
            $sel->execute([$node['client_id'], $node['user_id'] ?? 1]);
            $dbId  = $sel->fetchColumn();
        }

        $idMap[$node['client_id']] = $dbId;
        $saved++;
    }

    echo json_encode(['success' => true, 'saved' => $saved]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
