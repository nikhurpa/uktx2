<?php
// ─────────────────────────────────────────────────────────────────────────────
// load_myplace.php  —  returns saved nodes for loadMyPlaces()
// GET ?user_id=1
// Returns: { success: true, nodes: [ {id, client_id, parent_id, label,
//             geom_type, coordinates, style, icon, checked, sort_order}, … ] }
// Nodes are ordered by sort_order so parent always comes before child.
// ─────────────────────────────────────────────────────────────────────────────

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

define('DB_HOST', 'localhost');
define('DB_USER', 'uktx');
define('DB_PASS', 'uktx123');
define('DB_NAME', 'ukcfa');

$userId = intval($_GET['USER_ID'] ?? 1);

try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $stmt = $pdo->prepare("
        SELECT ID, CLIENT_ID, parent_id, label, geom_type,
               coordinates, style, icon, checked, sort_order
        FROM   map_places
        WHERE  user_id = :uid
        ORDER  BY sort_order ASC
    ");
    $stmt->execute([':uid' => $userId]);
    $nodes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Convert parent_id (DB integer) back to client_id string
    // so the JS idMap can reconstruct the tree hierarchy
    $idToClientId = [];
    foreach ($nodes as $n) {
        $idToClientId[$n['id']] = $n['client_id'];
    }
    foreach ($nodes as &$n) {
        $n['parent_client_id'] = $n['parent_id']
            ? ($idToClientId[$n['parent_id']] ?? null)
            : null;
    }
    unset($n);

    echo json_encode(['success' => true, 'nodes' => $nodes]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
