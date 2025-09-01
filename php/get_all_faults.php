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
        // Get all faults with coordinates
        $sql = "SELECT 
                    FAULT_ID,
                    OA,
                    ROUTE_BRIEF,
                    LOCATION_BRIEF,
                    LOCATION_LATLONG,
                    FAULT_DATE,
                    FAULT_TIME,
                    MAINTAINED_BY,
                    ROUTE_OWNER,
                    FRT_ASSIGNED,
                    ETR,
                    FAULT_DESCRIPTION,
                    ROUTE_RING_LINEAR,
                    RESTORATION_DATE,
                    RESTORATION_TIME,
                    RESTORATION_BRIEF
                FROM FAULTS 
                WHERE LOCATION_LATLONG IS NOT NULL 
                AND LOCATION_LATLONG != ''
                ORDER BY FAULT_DATE DESC, FAULT_TIME DESC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $faults = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'faults' => $faults,
            'total_count' => count($faults)
        ]);
        
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error fetching faults: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}
?> 