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
        // Debug logging
        error_log("Save user request - POST data: " . print_r($_POST, true));
        
        // Get form data
        $user_id = isset($_POST['user_id']) ? trim($_POST['user_id']) : '';
        $username = isset($_POST['username']) ? trim($_POST['username']) : '';
        $password = isset($_POST['password']) ? trim($_POST['password']) : '';
        $role = isset($_POST['role']) ? trim($_POST['role']) : '';
        $oa = isset($_POST['oa']) ? trim($_POST['oa']) : '';
        $name = isset($_POST['name']) ? trim($_POST['name']) : '';
        $email = isset($_POST['email']) ? trim($_POST['email']) : '';
        $mobile = isset($_POST['mobile']) ? trim($_POST['mobile']) : '';
        $designation = isset($_POST['designation']) ? trim($_POST['designation']) : '';
        
        // Validate required fields
        if (empty($username) || empty($role)) {
            echo json_encode(['success' => false, 'message' => 'Username and role are required']);
            exit;
        }
        
        // Validate email format if provided
        if (!empty($email) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            echo json_encode(['success' => false, 'message' => 'Invalid email format']);
            exit;
        }
        
        // Validate mobile format if provided (10 digits)
        if (!empty($mobile) && !preg_match('/^[0-9]{10}$/', $mobile)) {
            echo json_encode(['success' => false, 'message' => 'Mobile number must be 10 digits']);
            exit;
        }
        
        // Validate role
        $valid_roles = ['Suadmin', 'nodal', 'user'];
        if (!in_array($role, $valid_roles)) {
            echo json_encode(['success' => false, 'message' => 'Invalid role']);
            exit;
        }
        
        // Validate OA if provided
        if (!empty($oa)) {
            $valid_oa = ['ALMORA', 'DEHRADUN', 'HARIDWAR', 'NAINITAL', 'UTTARKASHI', 'KOTDWARA'];
            if (!in_array($oa, $valid_oa)) {
                echo json_encode(['success' => false, 'message' => 'Invalid OA value']);
                exit;
            }
        }
        
        if (empty($user_id)) {
            // Adding new user
            if (empty($password)) {
                echo json_encode(['success' => false, 'message' => 'Password is required for new users']);
                exit;
            }
            
            // Check if username already exists
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE username = ?");
            $stmt->execute([$username]);
            if ($stmt->fetchColumn() > 0) {
                echo json_encode(['success' => false, 'message' => 'Username already exists']);
                exit;
            }
            
            // Insert new user
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
            $sql = "INSERT INTO users (username, password, role, oa, name, email, mobile, designation) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$username, $hashedPassword, $role, $oa, $name, $email, $mobile, $designation]);
            
            $newUserId = $pdo->lastInsertId();
            
            echo json_encode([
                'success' => true,
                'message' => 'User added successfully!',
                'user_id' => $newUserId
            ]);
            
        } else {
            // Updating existing user
            $user_id = (int)$user_id;
            
            // Check if user exists
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE id = ?");
            $stmt->execute([$user_id]);
            if ($stmt->fetchColumn() == 0) {
                echo json_encode(['success' => false, 'message' => 'User not found']);
                exit;
            }
            
            // Check if username already exists for other users
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE username = ? AND id != ?");
            $stmt->execute([$username, $user_id]);
            if ($stmt->fetchColumn() > 0) {
                echo json_encode(['success' => false, 'message' => 'Username already exists']);
                exit;
            }
            
            if (!empty($password)) {
                // Update with new password
                $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
                $sql = "UPDATE users SET username = ?, password = ?, role = ?, oa = ?, name = ?, email = ?, mobile = ?, designation = ? WHERE id = ?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$username, $hashedPassword, $role, $oa, $name, $email, $mobile, $designation, $user_id]);
            } else {
                // Update without changing password
                $sql = "UPDATE users SET username = ?, role = ?, oa = ?, name = ?, email = ?, mobile = ?, designation = ? WHERE id = ?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$username, $role, $oa, $name, $email, $mobile, $designation, $user_id]);
            }
            
            echo json_encode([
                'success' => true,
                'message' => 'User updated successfully!'
            ]);
        }
        
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}
?> 