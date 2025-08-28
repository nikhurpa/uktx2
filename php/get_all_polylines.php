<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'db_connection.php';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Get optional filters
    $kmz_filter = isset($_GET['kmz_file']) ? $_GET['kmz_file'] : null;
    $name_filter = isset($_GET['name']) ? $_GET['name'] : null;
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 100;
    
    // Build query
    $sql = "
        SELECT 
            id,
            kmz_filename,
            polyline_name,
            polyline_description,
            google_encoded_polyline,
            coordinates_count,
            start_lat,
            start_lng,
            end_lat,
            end_lng,
            bounding_box,
            created_at
        FROM polylines 
        WHERE 1=1
    ";
    
    $params = [];
    
    if ($kmz_filter) {
        $sql .= " AND kmz_filename LIKE ?";
        $params[] = "%$kmz_filter%";
    }
    
    if ($name_filter) {
        $sql .= " AND (polyline_name LIKE ? OR polyline_description LIKE ?)";
        $params[] = "%$name_filter%";
        $params[] = "%$name_filter%";
    }
    
    // $sql .= " ORDER BY created_at DESC LIMIT ?";
    // $params[] = $limit;
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    $polylines = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get unique KMZ files for filtering
    $kmz_files_sql = "SELECT DISTINCT kmz_filename FROM polylines ORDER BY kmz_filename";
    $kmz_stmt = $pdo->query($kmz_files_sql);
    $kmz_files = $kmz_stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo json_encode([
        'success' => true,
        'polylines' => $polylines,
        'count' => count($polylines),
        'kmz_files' => $kmz_files,
        'total_available' => $pdo->query("SELECT COUNT(*) FROM polylines")->fetchColumn()
    ]);
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage() . $sql
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?>

