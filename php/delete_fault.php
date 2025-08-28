<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Database configuration
$host = 'localhost';
$dbname = 'TRANSMISSION1';
$username = 'uktx';
$password = 'uktx123';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Get form data
        $fault_id = isset($_POST['fault_id']) ? trim($_POST['fault_id']) : '';
        $role = isset($_POST['role']) ? trim($_POST['role']) : 'user';
        
        
        
        // Validate required fields
        $required_fields = ['fault_id', 'role'];
        $missing_fields = [];
        
        foreach ($required_fields as $field) {
            if (empty($field)) {
                $missing_fields[] = $field;
            }
        }
        
        if (!empty($missing_fields)) {
            echo json_encode(['success' => false, 'message' => 'Missing required fields: ' . implode(', ', $missing_fields)]);
            exit;
        }
        
        // Check if fault ID already exists
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM FAULTS WHERE FAULT_ID = ?");
        $stmt->execute([$fault_id]);
        
        if ($stmt->fetchColumn() < 0) {
            echo json_encode(['success' => false, 'message' => 'Fault ID not exists.']);
            exit;
        }
        
        // Validate role - Only Suadmin can delete faults
        
        if ($role !== 'Suadmin'){
            echo json_encode(['success' => false, 'message' => 'Only Suadmin users can delete faults']);
            exit;
        }
        
           // Delete user
        $stmt = $pdo->prepare("DELETE FROM faults WHERE FAULT_ID = ?");
        $stmt->execute([$fault_id]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Fault deleted successfully!'
        ]);     
       
        
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}
?> 