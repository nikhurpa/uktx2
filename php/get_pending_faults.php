<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Database configuration
$host = 'localhost';
$dbname = 'TRANSMISSION1';
$username = 'uktx';
$password = 'uktx123';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Get user role and OA from request
    $user_role = isset($_GET['user_role']) ? trim($_GET['user_role']) : '';
    $user_oa = isset($_GET['user_oa']) ? trim($_GET['user_oa']) : '';
    
    // Build the query with filters
    $sql = "SELECT *,
            TIMESTAMPDIFF(HOUR, CONCAT(FAULT_DATE, ' ', FAULT_TIME), NOW()) as HOURS_PENDING
            FROM FAULTS WHERE RESTORATION_DATE IS NULL";
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
    
    // Apply additional filters
    if (isset($_GET['oa']) && !empty($_GET['oa'])) {
        $sql .= " AND OA = ?";
        $params[] = $_GET['oa'];
    }
    
    if (isset($_GET['maintained_by']) && !empty($_GET['maintained_by'])) {
        $sql .= " AND MAINTAINED_BY = ?";
        $params[] = $_GET['maintained_by'];
    }
    
    if (isset($_GET['route_owner']) && !empty($_GET['route_owner'])) {
        $sql .= " AND ROUTE_OWNER = ?";
        $params[] = $_GET['route_owner'];
    }
    
    if (isset($_GET['route']) && !empty($_GET['route'])) {
        $sql .= " AND ROUTE_BRIEF LIKE ?";
        $params[] = '%' . $_GET['route'] . '%';
    }

    if (isset($_GET['type']) && !empty($_GET['type'])) {
        if ($_GET['type'] == 'recent') {
            $sql .= " AND FAULT_DATE >= CURDATE() - INTERVAL 2 DAY";
        } else if ($_GET['type'] == 'week') {
            $sql .= " AND FAULT_DATE < CURDATE() - INTERVAL 1 WEEK";
        }
       
    }
    
    
    // Order by creation date (newest first)
   // $sql .= " ORDER BY CREATED_AT DESC";
    //$sql .= " ORDER BY FAULT_DATE DESC, FAULT_TIME DESC";
    $sql .= " ORDER BY HOURS_PENDING DESC";
    
    // Add limit for pagination
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
    $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
    $sql .= " LIMIT ? OFFSET ?";
    
    $stmt = $pdo->prepare($sql);
    
    // Bind all parameters except LIMIT and OFFSET
    $paramIndex = 1;
    foreach ($params as $param) {
        $stmt->bindValue($paramIndex, $param);
        $paramIndex++;
    }
    
    // Bind LIMIT and OFFSET as integers
    $stmt->bindValue($paramIndex, $limit, PDO::PARAM_INT);
    $paramIndex++;
    $stmt->bindValue($paramIndex, $offset, PDO::PARAM_INT);
    
    $stmt->execute();
    $faults = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'faults' => $faults,
        'total' => count($faults)
    ]);
    
} catch(PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?> 