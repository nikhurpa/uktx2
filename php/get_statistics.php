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


$today = date('Y-m-d');
try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

try {
    // Get total count
    $stmt = $pdo->query("SELECT COUNT(*) FROM FAULTS");
    $total_count = $stmt->fetchColumn();
    
    // Get pending count (faults without restoration date)
    $stmt = $pdo->query("SELECT COUNT(*) FROM FAULTS WHERE RESTORATION_DATE IS NULL");
    $pending_count = $stmt->fetchColumn();
    
    // Get resolved count (faults with restoration date)
    // $stmt = $pdo->query("SELECT COUNT(*) FROM FAULTS WHERE RESTORATION_DATE IS NOT NULL");
    $stmt = $pdo->query("SELECT COUNT(*) FROM FAULTS WHERE RESTORATION_DATE ='$today'");
    $resolved_count = $stmt->fetchColumn();
    
    // Get faults older than a week (7 days)
    $stmt = $pdo->query("SELECT COUNT(*) FROM FAULTS WHERE RESTORATION_DATE IS NULL AND DATEDIFF(CURDATE(), FAULT_DATE) > 7");
    $old_faults_count = $stmt->fetchColumn();
    // Get recent faults booked in 24 hr
    $stmt = $pdo->query("SELECT COUNT(*) FROM FAULTS WHERE RESTORATION_DATE IS NULL AND DATEDIFF(CURDATE(), FAULT_DATE) <= 1");
    $recent_count = $stmt->fetchColumn();
    
    echo json_encode([
        'success' => true,
        'total_count' => $total_count,
        'pending_count' => $pending_count,
        'resolved_count' => $resolved_count,
        'old_faults_count' => $old_faults_count,
        'recent_count ' => $recent_count ,
        'current_date' => date('Y-m-d'),
        'debug_info' => [
            'total_query' => "SELECT COUNT(*) FROM FAULTS",
            'pending_query' => "SELECT COUNT(*) FROM FAULTS WHERE RESTORATION_DATE IS NULL",
            'resolved_query' => "SELECT COUNT(*) FROM FAULTS WHERE RESTORATION_DATE ='$today'",
            'old_query' => "SELECT COUNT(*) FROM FAULTS WHERE RESTORATION_DATE IS NULL AND DATEDIFF(CURDATE(), FAULT_DATE) > 7",
            'recent_query' => "SELECT COUNT(*) FROM FAULTS WHERE RESTORATION_DATE IS NULL AND DATEDIFF(CURDATE(), FAULT_DATE) <= 1"
        ]
    ]);
    
} catch(PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?> 