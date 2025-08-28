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
    
    // Get recent faults (last 10, ordered by creation date)
    $stmt = $pdo->query("
        SELECT 
            FAULT_ID,
            OA,
            FAULT_TYPE,
            FAULT_DATE,
            FAULT_TIME,
            ROUTE_BRIEF,
            LOCATION_BRIEF,
            FAULT_DESCRIPTION,
            ROUTE_OWNER,
            RESTORATION_DATE,
            CREATED_AT
        FROM FAULTS 
        ORDER BY CREATED_AT DESC 
        LIMIT 10
    ");
    
    $faults = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'faults' => $faults
    ]);
    
} catch(PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?> 