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
    
    // Get user role and OA from session or request
    $user_role = isset($_POST['user_role']) ? trim($_POST['user_role']) : '';
    $user_oa = isset($_POST['user_oa']) ? trim($_POST['user_oa']) : '';

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
        $oa = isset($_POST['oa']) ? trim($_POST['oa']) : '';
        $fault_date = isset($_POST['fault_date']) ? trim($_POST['fault_date']) : '';
        $fault_time = isset($_POST['fault_time']) ? trim($_POST['fault_time']) : '';
        $route_brief = isset($_POST['route_brief']) ? trim($_POST['route_brief']) : '';
        $maintained_by = isset($_POST['maintained_by']) ? trim($_POST['maintained_by']) : '';
        $route_owner = isset($_POST['route_owner']) ? trim($_POST['route_owner']) : '';
        $location_brief = isset($_POST['location_brief']) ? trim($_POST['location_brief']) : '';
        $location_latlong = isset($_POST['location_latlong']) ? trim($_POST['location_latlong']) : '';
        $fault_description = isset($_POST['fault_description']) ? trim($_POST['fault_description']) : '';
        $route_ring_linear = isset($_POST['route_ring_linear']) ? trim($_POST['route_ring_linear']) : '';
        $frt_assigned = isset($_POST['frt_assigned']) ? trim($_POST['frt_assigned']) : '';
        $etr = isset($_POST['etr']) ? trim($_POST['etr']) : '';
        $element_affected = isset($_POST['element_affected']) ? $_POST['element_affected'] : '{}';
        $fault_type = isset($_POST['fault_type']) ? trim($_POST['fault_type']) : 'normal';
        $created_by = isset($_POST['created_by']) ? trim($_POST['created_by']) : 'user';
        
        // Handle fault images upload
        $fault_images = [];
        if (isset($_FILES['fault_images']) && is_array($_FILES['fault_images']['name'])) {
            $upload_dir = '../uploads/faults/' . date('Y/m/d/');
            $upload_path = 'uploads/faults/' . date('Y/m/d/');

            if (!is_dir($upload_dir)) {
                mkdir($upload_dir, 0755, true);
            }
            
            $file_count = count($_FILES['fault_images']['name']);
            // Cap at 10 images max
            $limit = min(10, $file_count);
            for ($i = 0; $i < $limit; $i++) {
                if ($_FILES['fault_images']['error'][$i] === UPLOAD_ERR_OK) {
                    $file_name = $_FILES['fault_images']['name'][$i];
                    $file_tmp = $_FILES['fault_images']['tmp_name'][$i];
                    $file_size = $_FILES['fault_images']['size'][$i];
                    $file_type = $_FILES['fault_images']['type'][$i];
                    
                    // Validate file type
                    if (!in_array($file_type, ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'])) {
                        continue; // Skip invalid file types
                    }
                    
                    // Validate file size (max 5MB)
                    if ($file_size > 5 * 1024 * 1024) {
                        continue; // Skip files larger than 5MB
                    }
                    
                    // Generate unique filename
                    $file_extension = pathinfo($file_name, PATHINFO_EXTENSION);
                    $unique_filename = $fault_id . '_' . time() . '_' . $i . '.' . $file_extension;
                    $file_upload_path = $upload_dir . $unique_filename;
                    $file_path = $upload_path . $unique_filename;
                    
                    // Move uploaded file
                    if (move_uploaded_file($file_tmp, $file_upload_path)) {
                        $fault_images[] = [
                            'addr' => $file_path,
                            'date_time' => date('Y-m-d H:i:s'),
                            'original_name' => $file_name
                        ];
                    }
                }
            }
        }
        
            // Validate required fields
    $required_fields = ['fault_id', 'oa', 'fault_date', 'fault_time', 'route_brief', 'maintained_by', 'route_owner', 'location_brief', 'fault_description', 'route_ring_linear'];
    $missing_fields = [];
    
    foreach ($required_fields as $field) {
        if (empty($$field)) {
            $missing_fields[] = $field;
        }
    }
    
    if (!empty($missing_fields)) {
        echo json_encode(['success' => false, 'message' => 'Missing required fields: ' . implode(', ', $missing_fields)]);
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
    
    // Check if user can book fault in this OA
    if ($user_role === 'user') {
        // User can only book faults in their own OA
        if ($oa !== $user_oa) {
            echo json_encode(['success' => false, 'message' => 'You can only book faults in your assigned OA: ' . $user_oa]);
            exit;
        }
    } elseif ($user_role === 'nodal') {
        // Nodal users can book faults in their assigned OA
        if ($oa !== $user_oa) {
            echo json_encode(['success' => false, 'message' => 'You can only book faults in your assigned OA: ' . $user_oa]);
            exit;
        }
    }
    // Suadmin can book faults in any OA
        
        // Check if fault ID already exists
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM FAULTS WHERE FAULT_ID = ?");
        $stmt->execute([$fault_id]);
        
        if ($stmt->fetchColumn() > 0) {
            echo json_encode(['success' => false, 'message' => 'Fault ID already exists. Please generate a new one.']);
            exit;
        }
        
        // Validate OA
        $valid_oa = ['ALM', 'DDN', 'HWR', 'NTL', 'NWT', 'SGR'];
        if (!in_array($oa, $valid_oa)) {
            echo json_encode(['success' => false, 'message' => 'Invalid OA value']);
            exit;
        }
        
        // Validate maintained_by
        $valid_maintained_by = ['BA', 'CNTX'];
        if (!in_array($maintained_by, $valid_maintained_by)) {
            echo json_encode(['success' => false, 'message' => 'Invalid maintained_by value']);
            exit;
        }
        
        // Validate route_owner
        $valid_route_owner = ['BA', 'CNTX', 'VTL', 'PGCIL', 'OTHER'];
        if (!in_array($route_owner, $valid_route_owner)) {
            echo json_encode(['success' => false, 'message' => 'Invalid route_owner value']);
            exit;
        }
        
        // Validate route_ring_linear
        $valid_route_types = ['RING', 'LINEAR'];
        if (!in_array($route_ring_linear, $valid_route_types)) {
            echo json_encode(['success' => false, 'message' => 'Invalid route type']);
            exit;
        }
        
        // Validate date format
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fault_date)) {
            echo json_encode(['success' => false, 'message' => 'Invalid date format']);
            exit;
        }
        
        // Validate time format
        if (!preg_match('/^\d{2}:\d{2}$/', $fault_time)) {
            echo json_encode(['success' => false, 'message' => 'Invalid time format']);
            exit;
        }
        
        // Insert fault record
        $sql = "INSERT INTO FAULTS (
            FAULT_ID, OA, FAULT_DATE, FAULT_TIME, ROUTE_BRIEF, MAINTAINED_BY, ROUTE_OWNER,
            LOCATION_BRIEF, LOCATION_LATLONG, FAULT_DESCRIPTION, ROUTE_RING_LINEAR, 
            FRT_ASSIGNED, ETR, ELEMENT_AFFECTED, FAULT_IMAGES, FAULT_TYPE
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $fault_id,
            $oa,
            $fault_date,
            $fault_time,
            $route_brief,
            $maintained_by,
            $route_owner,
            $location_brief,
            $location_latlong,
            $fault_description,
            $route_ring_linear,
            $frt_assigned,
            $etr,
            $element_affected, // Use the validated $element_affected
            json_encode($fault_images),  // Store fault images as JSON
            $fault_type
        ]);
        
        echo json_encode([
            'success' => true, 
            'message' => 'Fault saved successfully!',
            'fault_id' => $fault_id,
            'images_uploaded' => count($fault_images)
        ]);
        
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}
?> 