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
        $updated_by = isset($_POST['updated_by']) ? trim($_POST['updated_by']) : 'user';
        $keep_fault_images = isset($_POST['keep_fault_images']) ? json_decode($_POST['keep_fault_images'], true) : [];
        $updated_by = isset($_POST['updated_by']) ? trim($_POST['updated_by']) : 'user';
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
    
    // Check if user can edit this fault
    if ($user_role === 'user') {
        // User can only edit faults they created in their own OA
        $stmt = $pdo->prepare("SELECT CREATED_BY, OA FROM FAULTS WHERE FAULT_ID = ?");
        $stmt->execute([$fault_id]);
        $fault = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$fault) {
            echo json_encode(['success' => false, 'message' => 'Fault not found']);
            exit;
        }
        
        if ($fault['CREATED_BY'] !== $created_by || $fault['OA'] !== $user_oa) {
            echo json_encode(['success' => false, 'message' => 'You can only edit faults you created in your assigned OA']);
            exit;
        }
    } elseif ($user_role === 'nodal') {
        // Nodal users can edit faults in their assigned OA
        $stmt = $pdo->prepare("SELECT OA FROM FAULTS WHERE FAULT_ID = ?");
        $stmt->execute([$fault_id]);
        $fault = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$fault) {
            echo json_encode(['success' => false, 'message' => 'Fault not found']);
            exit;
        }
        
        if ($fault['OA'] !== $user_oa) {
            echo json_encode(['success' => false, 'message' => 'You can only edit faults in your assigned OA']);
            exit;
        }
    }
    // Suadmin can edit any fault
        
        // Check if fault exists
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM FAULTS WHERE FAULT_ID = ?");
        $stmt->execute([$fault_id]);
        
        if ($stmt->fetchColumn() == 0) {
            echo json_encode(['success' => false, 'message' => 'Fault not found']);
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
        
        // Validate fault_type
        $valid_fault_types = ['critical', 'urgent', 'normal'];
        if (!in_array($fault_type, $valid_fault_types)) {
            echo json_encode(['success' => false, 'message' => 'Invalid fault type']);
            exit;
        }
        
        // Validate date format
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fault_date)) {
            echo json_encode(['success' => false, 'message' => 'Invalid date format']);
            exit;
        }
        
        // Validate time format
        if (!preg_match('/^\d{2}:\d{2}:\d{2}$/', $fault_time)) {
            echo json_encode(['success' => false, 'message' => 'Invalid time format']);
            exit;
        }
        
        // Handle images merging (keep + new uploads), capped to 10 total
        // Read existing images
        $stmt = $pdo->prepare("SELECT FAULT_IMAGES FROM FAULTS WHERE FAULT_ID = ?");
        $stmt->execute([$fault_id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $existing_images = [];
        if ($row && !empty($row['FAULT_IMAGES'])) {
            $decoded = json_decode($row['FAULT_IMAGES'], true);
            if (is_array($decoded)) {
                $existing_images = $decoded;
            }
        }
        // Filter kept images
        $kept_images = [];
        $kept_paths = is_array($keep_fault_images) ? $keep_fault_images : [];
        foreach ($existing_images as $img) {
            $addr = isset($img['addr']) ? $img['addr'] : (isset($img['file_path']) ? $img['file_path'] : '');
            if ($addr && in_array($addr, $kept_paths, true)) {
                // Normalize to { addr, date_time, original_name }
                $kept_images[] = [
                    'addr' => $addr,
                    'date_time' => isset($img['date_time']) ? $img['date_time'] : (isset($img['upload_date']) ? $img['upload_date'] : date('Y-m-d H:i:s')),
                    'original_name' => isset($img['original_name']) ? $img['original_name'] : ''
                ];
            } else {
                // Optionally delete removed files from disk
                $path = $addr ? realpath(__DIR__ . '/../' . $addr) : null;
                if ($path && file_exists($path)) {
                    @unlink($path); // best-effort delete
                }
            }
        }
        
        // Process new uploaded images
        $new_images = [];
        if (isset($_FILES['fault_images']) && is_array($_FILES['fault_images']['name'])) {
            $upload_dir_rel = 'uploads/faults/' . date('Y/m/d/') ;
            $upload_dir_abs = realpath(__DIR__ . '/..') . DIRECTORY_SEPARATOR . $upload_dir_rel;
            if (!is_dir($upload_dir_abs)) {
                mkdir($upload_dir_abs, 0755, true);
            }
            $file_count = count($_FILES['fault_images']['name']);
            $slots_left = max(0, 10 - count($kept_images));
            $limit = min($slots_left, $file_count);
            for ($i = 0; $i < $limit; $i++) {
                if ($_FILES['fault_images']['error'][$i] === UPLOAD_ERR_OK) {
                    $file_name = $_FILES['fault_images']['name'][$i];
                    $file_tmp = $_FILES['fault_images']['tmp_name'][$i];
                    $file_size = $_FILES['fault_images']['size'][$i];
                    $file_type = $_FILES['fault_images']['type'][$i];
                    // Validate
                    $allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
                    if (!in_array($file_type, $allowed_types)) continue;
                    if ($file_size > 5 * 1024 * 1024) continue;
                    // Unique filename
                    $ext = pathinfo($file_name, PATHINFO_EXTENSION);
                    $unique = $fault_id . '_' . time() . '_' . $i . '.' . $ext;
                    $abs_path = $upload_dir_abs . $unique;
                    $rel_path = $upload_dir_rel . $unique;
                    if (move_uploaded_file($file_tmp, $abs_path)) {
                        $new_images[] = [
                            'addr' => $rel_path,
                            'date_time' => date('Y-m-d H:i:s'),
                            'original_name' => $file_name
                        ];
                    }
                }
            }
        }
        // Merge
        $final_images = array_slice(array_merge($kept_images, $new_images), 0, 10);

        // Update fault record including FAULT_IMAGES
        $sql = "UPDATE FAULTS SET 
            OA = ?, FAULT_DATE = ?, FAULT_TIME = ?, ROUTE_BRIEF = ?, MAINTAINED_BY = ?, ROUTE_OWNER = ?,
            LOCATION_BRIEF = ?, LOCATION_LATLONG = ?, FAULT_DESCRIPTION = ?, ROUTE_RING_LINEAR = ?, 
            FRT_ASSIGNED = ?, ETR = ?, ELEMENT_AFFECTED = ?, FAULT_TYPE = ?, FAULT_IMAGES = ?
            WHERE FAULT_ID = ?";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
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
            $element_affected,
            $fault_type,
            json_encode($final_images),
            $fault_id
        ]);
        
        echo json_encode([
            'success' => true, 
            'message' => 'Fault updated successfully!',
            'fault_id' => $fault_id,
            'images_total' => count($final_images)
        ]);
        
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}
?> 