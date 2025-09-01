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
        $user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;
        
        if ($user_id <= 0) {
            echo json_encode(['success' => false, 'message' => 'Invalid user ID']);
            exit;
        }
        
        // Get user by ID
        $stmt = $pdo->prepare("SELECT id, username, role, oa, name, email, mobile, designation, photo_path, created_at FROM users WHERE id = ?");
        $stmt->execute([$user_id]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            echo json_encode(['success' => false, 'message' => 'User not found']);
            exit;
        }
        
        echo json_encode([
            'success' => true,
            'user' => $user
        ]);
        
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}
?> 