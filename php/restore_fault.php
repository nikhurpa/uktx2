<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
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

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Get form data
        $fault_id = isset($_POST['fault_id']) ? trim($_POST['fault_id']) : '';
        $restoration_date = isset($_POST['restoration_date']) ? trim($_POST['restoration_date']) : '';
        $restoration_time = isset($_POST['restoration_time']) ? trim($_POST['restoration_time']) : '';
        $restoration_brief = isset($_POST['restoration_brief']) ? trim($_POST['restoration_brief']) : '';
        
        // Get user role and OA from session or request
        $user_role = isset($_POST['user_role']) ? trim($_POST['user_role']) : '';
        $user_oa = isset($_POST['user_oa']) ? trim($_POST['user_oa']) : '';
        
        // Validate required fields
        if (empty($fault_id) || empty($restoration_date) || empty($restoration_time) || empty($restoration_brief)) {
            echo json_encode(['success' => false, 'message' => 'All fields are required']);
            exit;
        }
        
        // Check if fault exists and get fault details
        $stmt = $pdo->prepare("SELECT OA, CREATED_BY FROM FAULTS WHERE FAULT_ID = ?");
        $stmt->execute([$fault_id]);
        $fault = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$fault) {
            echo json_encode(['success' => false, 'message' => 'Fault not found']);
            exit;
        }
        
         // Role-based access control validation
    if (empty($user_role) ) {
        echo json_encode(['success' => false, 'message' => 'User role information required']);
        exit;
    }

     // Role-based access control validation
     if (empty($user_oa) && $user_role != "Suadmin") {
        echo json_encode(['success' => false, 'message' => 'User OA information required']);
        exit;
    }
        
        // Check if user can restore this fault
        if ($user_role === 'user') {
            // User can only restore faults they created in their own OA
            if ($fault['OA'] !== $user_oa) {
                echo json_encode(['success' => false, 'message' => 'You can only restore faults in your assigned OA']);
                exit;
            }
            // Additional check: user should only restore faults they created
            // This would require passing the current username as well
        } elseif ($user_role === 'nodal') {
            // Nodal users can restore faults in their assigned OA
            if ($fault['OA'] !== $user_oa) {
                echo json_encode(['success' => false, 'message' => 'You can only restore faults in your assigned OA']);
                exit;
            }
        }
        // Suadmin can restore any fault
        
        // Validate date format
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $restoration_date)) {
            echo json_encode(['success' => false, 'message' => 'Invalid restoration date format']);
            exit;
        }
        
        // Validate time format
        if (!preg_match('/^\d{2}:\d{2}$/', $restoration_time)) {
            echo json_encode(['success' => false, 'message' => 'Invalid restoration time format']);
            exit;
        }
        
        // Handle image uploads
        $restoration_images = [];
        
        if (isset($_FILES['restoration_images']) && is_array($_FILES['restoration_images']['name'])) {
            $upload_dir = '/../uploads/restoration/' . date('Y/m/d/');
            
            // Create directory if it doesn't exist
            if (!file_exists($upload_dir)) {
                mkdir($upload_dir, 0777, true);
            }
            
            $file_count = count($_FILES['restoration_images']['name']);
            
            for ($i = 0; $i < $file_count; $i++) {
                if ($_FILES['restoration_images']['error'][$i] === UPLOAD_ERR_OK) {
                    $file_name = $_FILES['restoration_images']['name'][$i];
                    $file_tmp = $_FILES['restoration_images']['tmp_name'][$i];
                    $file_size = $_FILES['restoration_images']['size'][$i];
                    $file_type = $_FILES['restoration_images']['type'][$i];
                    
                    // Validate file type
                    $allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
                    if (!in_array($file_type, $allowed_types)) {
                        continue; // Skip invalid file types
                    }
                    
                    // Validate file size (max 5MB)
                    if ($file_size > 5 * 1024 * 1024) {
                        continue; // Skip files larger than 5MB
                    }
                    
                    // Generate unique filename
                    $file_extension = pathinfo($file_name, PATHINFO_EXTENSION);
                    $unique_filename = $fault_id . '_' . time() . '_' . $i . '.' . $file_extension;
                    $file_path = $upload_dir . $unique_filename;
                    
                    // Move uploaded file
                    if (move_uploaded_file($file_tmp, $file_path)) {
                        $restoration_images[] = [
                            'addr' => $file_path,
                            'date_time' => date('Y-m-d H:i:s'),
                            'original_name' => $file_name
                        ];
                    }
                }
            }
        }
        
        // Update fault record
        $sql = "UPDATE FAULTS SET 
                RESTORATION_DATE = ?, 
                RESTORATION_TIME = ?, 
                RESTORATION_BRIEF = ?, 
                RESTORATION_IMAGES = ?
                WHERE FAULT_ID = ?";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $restoration_date,
            $restoration_time,
            $restoration_brief,
            json_encode($restoration_images),
            $fault_id
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Fault restored successfully!',
            'fault_id' => $fault_id,
            'images_uploaded' => count($restoration_images)
        ]);
        
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}
?> 