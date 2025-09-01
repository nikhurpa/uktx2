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
        $oa = isset($_GET['oa']) ? trim($_GET['oa']) : '';
        
        if (empty($oa)) {
            echo json_encode(['success' => false, 'message' => 'OA parameter is required']);
            exit;
        }
        
        // Validate OA
        $valid_oa = ['ALM', 'DDN', 'HWR', 'NTL', 'NWT', 'SGR'];
        if (!in_array($oa, $valid_oa)) {
            echo json_encode(['success' => false, 'message' => 'Invalid OA value']);
            exit;
        }
        
        // Generate fault ID
        $fault_id = generateUniqueFaultId($pdo, $oa);
        
        echo json_encode([
            'success' => true,
            'fault_id' => $fault_id
        ]);
        
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error generating fault ID: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}

function generateUniqueFaultId($pdo, $oa) {
    $maxAttempts = 10;
    $attempt = 0;
    
    do {
        $attempt++;
        
        // Generate fault ID components
        $now = new DateTime();
        $dateStr = $now->format('ymd'); // YYMMDD
        $timeStr = $now->format('His'); // HHMMSS
        $randomNum = str_pad(mt_rand(0, 999), 3, '0', STR_PAD_LEFT);
        
        $fault_id = $oa . $dateStr . $timeStr . $randomNum;
        
        // Check if this ID already exists
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM FAULTS WHERE FAULT_ID = ?");
        $stmt->execute([$fault_id]);
        
        if ($stmt->fetchColumn() == 0) {
            return $fault_id;
        }
        
        // If ID exists, wait a bit and try again
        usleep(100000); // 0.1 second
        
    } while ($attempt < $maxAttempts);
    
    // If we still have conflicts after max attempts, add more randomness
    $extraRandom = str_pad(mt_rand(0, 999), 3, '0', STR_PAD_LEFT);
    return $oa . $dateStr . $timeStr . $randomNum . $extraRandom;
}
?> 