<?php
// load_myplace.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

define('DB_HOST', 'localhost');
define('DB_USER', 'uktx');
define('DB_PASS', 'uktx123');
define('DB_NAME', 'ukcfa');

$userId = $_GET['user_id'] ?? '';
if ($userId === '') {
    echo json_encode(['success' => false, 'message' => 'user_id required']);
    exit;
}

try {
    $pdo = new PDO(
        'mysql:host='.DB_HOST.';dbname='.DB_NAME.';charset=utf8mb4',
        DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Select all columns including popup.
    // Return parent_id as DB integer — JS now uses byDbId[n.parent_id] to wire hierarchy.
    // Order by sort_order so parents always come before their children.
    $stmt = $pdo->prepare("
        SELECT id, client_id, parent_id, label, geom_type,
               coordinates, style, popup, icon, checked, sort_order
        FROM   map_places
        WHERE  user_id = :uid
        ORDER  BY sort_order ASC
    ");
    $stmt->execute([':uid' => $userId]);
    $nodes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Cast id and parent_id to int so JS strict equality works
    foreach ($nodes as &$n) {
        $n['id']        = (int) $n['id'];
        $n['parent_id'] = $n['parent_id'] !== null ? (int) $n['parent_id'] : null;
        $n['checked']   = (int) $n['checked'];
        $n['sort_order']= (int) $n['sort_order'];
    }
    unset($n);

    echo json_encode(['success' => true, 'nodes' => $nodes]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
