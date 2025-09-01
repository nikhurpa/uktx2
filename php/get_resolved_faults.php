<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

// Database configuration
    // $host = 'localhost';
    // $dbname = 'TRANSMISSION1';
    // $username = 'uktx';
    // $password = 'uktx123';
    
    require_once 'db_connection.php';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // Get filter parameters
        $oa = isset($_GET['oa']) ? trim($_GET['oa']) : '';
        $maintained_by = isset($_GET['maintained_by']) ? trim($_GET['maintained_by']) : '';
        $route_owner = isset($_GET['route_owner']) ? trim($_GET['route_owner']) : '';
        $route = isset($_GET['route']) ? trim($_GET['route']) : '';
        $date_from = isset($_GET['date_from']) ? trim($_GET['date_from']) : '';
        $date_to = isset($_GET['date_to']) ? trim($_GET['date_to']) : '';
        
        // Get user role and OA from request
        $user_role = isset($_GET['user_role']) ? trim($_GET['user_role']) : '';
        $user_oa = isset($_GET['user_oa']) ? trim($_GET['user_oa']) : '';
        
        // Build query
        $sql = "SELECT * FROM FAULTS WHERE RESTORATION_DATE IS NOT NULL";
        $params = [];
        
        // Apply role-based filtering
        if ($user_role === 'user') {
            // Users can only see faults in their OA
            $sql .= " AND OA = ?";
            $params[] = $user_oa;
        } elseif ($user_role === 'nodal') {
            // Nodal users can only see faults in their OA
            $sql .= " AND OA = ?";
            $params[] = $user_oa;
        }
        // Suadmin can see all faults
        
        // Add additional filters
        if (!empty($oa)) {
            $sql .= " AND OA = ?";
            $params[] = $oa;
        }
        
        if (!empty($maintained_by)) {
            $sql .= " AND MAINTAINED_BY = ?";
            $params[] = $maintained_by;
        }
        
        if (!empty($route_owner)) {
            $sql .= " AND ROUTE_OWNER = ?";
            $params[] = $route_owner;
        }
        
        if (!empty($route)) {
            $sql .= " AND ROUTE_BRIEF LIKE ?";
            $params[] = "%$route%";
        }
        
        if (!empty($date_from)) {
            $sql .= " AND RESTORATION_DATE >= ?";
            $params[] = $date_from;
        }
        
        if (!empty($date_to)) {
            $sql .= " AND RESTORATION_DATE <= ?";
            $params[] = $date_to;
        }
        
        // Order by restoration date (newest first)
        $sql .= " ORDER BY RESTORATION_DATE DESC, RESTORATION_TIME DESC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $faults = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'faults' => $faults
        ]);
        
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}
?> 