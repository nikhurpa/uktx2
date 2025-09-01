<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Database configuration
    // $host = 'localhost';
    // $dbname = 'TRANSMISSION1';
    // $username = 'uktx';
    // $password = 'uktx123';
    
    require_once 'db_connection.php';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    if (!isset($_GET['fault_id']) || empty($_GET['fault_id'])) {
        echo json_encode(['success' => false, 'message' => 'Fault ID is required']);
        exit;
    }
    
    $faultId = $_GET['fault_id'];
    
    $stmt = $pdo->prepare("SELECT * FROM FAULTS WHERE FAULT_ID = ?");
    $stmt->execute([$faultId]);
    $fault = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($fault) {
        echo json_encode([
            'success' => true,
            'fault' => $fault
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Fault not found'
        ]);
    }
    
} catch(PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?> 