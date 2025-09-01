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
        $user_id = isset($_POST['user_id']) ? trim($_POST['user_id']) : '';
        
        // Debug logging
        error_log("Photo upload request - User ID: " . $user_id);
        error_log("POST data: " . print_r($_POST, true));
        error_log("FILES data: " . print_r($_FILES, true));
        
        if (empty($user_id)) {
            echo json_encode(['success' => false, 'message' => 'User ID is required']);
            exit;
        }
        
        // Check if user exists
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE id = ?");
        $stmt->execute([$user_id]);
        if ($stmt->fetchColumn() == 0) {
            echo json_encode(['success' => false, 'message' => 'User not found']);
            exit;
        }
        
        // Handle file upload
        if (isset($_FILES['photo'])) {
            $file = $_FILES['photo'];
            error_log("File upload details: " . print_r($file, true));
            
            if ($file['error'] !== UPLOAD_ERR_OK) {
                $errorMessages = [
                    UPLOAD_ERR_INI_SIZE => 'File exceeds upload_max_filesize',
                    UPLOAD_ERR_FORM_SIZE => 'File exceeds MAX_FILE_SIZE',
                    UPLOAD_ERR_PARTIAL => 'File was only partially uploaded',
                    UPLOAD_ERR_NO_FILE => 'No file was uploaded',
                    UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder',
                    UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
                    UPLOAD_ERR_EXTENSION => 'A PHP extension stopped the file upload'
                ];
                $errorMsg = isset($errorMessages[$file['error']]) ? $errorMessages[$file['error']] : 'Unknown upload error';
                echo json_encode(['success' => false, 'message' => 'Upload error: ' . $errorMsg]);
                exit;
            }
            
            $fileName = $file['name'];
            $fileTmpName = $file['tmp_name'];
            $fileSize = $file['size'];
            $fileError = $file['error'];
            $fileType = $file['type'];
            
            // Get file extension
            $fileExt = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
            
            // Allowed file types
            $allowed = array('jpg', 'jpeg', 'png', 'gif');
            
            if (!in_array($fileExt, $allowed)) {
                echo json_encode(['success' => false, 'message' => 'Only JPG, JPEG, PNG & GIF files are allowed']);
                exit;
            }
            
            if ($fileError !== 0) {
                echo json_encode(['success' => false, 'message' => 'There was an error uploading the file']);
                exit;
            }
            
            if ($fileSize > 10000000) { // 10MB limit
                echo json_encode(['success' => false, 'message' => 'File size must be less than 10MB']);
                exit;
            }
            
            // Create uploads directory if it doesn't exist
            $uploadDir = '../uploads/user_photos/';
            $uploadPath = 'uploads/user_photos/';
            error_log("Upload directory path: " . realpath($uploadDir));
            
            if (!file_exists($uploadDir)) {
                error_log("Creating upload directory: " . $uploadDir);
                if (mkdir($uploadDir, 0777, true)) {
                    error_log("Directory created successfully");
                } else {
                    error_log("Failed to create directory");
                }
            } else {
                error_log("Directory already exists");
            }
            
            if (!is_writable($uploadDir)) {
                error_log("Directory is not writable: " . $uploadDir);
                echo json_encode(['success' => false, 'message' => 'Upload directory is not writable']);
                exit;
            }
            
            // Generate unique filename
            $fileNameNew = 'user_' . $user_id . '_' . uniqid() . '.' . $fileExt;
            $fileDestination = $uploadDir . $fileNameNew;
            $filePath = $uploadPath . $fileNameNew; 
            // Move uploaded file
            error_log("Attempting to move file from $fileTmpName to $fileDestination");
            if (move_uploaded_file($fileTmpName, $fileDestination)) {
                error_log("File moved successfully");
                // Resize image to 160x160
                $resizedImage = resizeImage($fileDestination, 160, 160);
                
                if ($resizedImage) {
                    // Save resized image
                    imagejpeg($resizedImage, $fileDestination, 90);
                    imagedestroy($resizedImage);
                    
                    // Update database with photo path
                    $stmt = $pdo->prepare("UPDATE users SET photo_path = ? WHERE id = ?");
                    $stmt->execute([  $filePath, $user_id]);
                    
                    echo json_encode([
                        'success' => true,
                        'message' => 'Photo uploaded successfully!',
                        'photo_path' => $filePath
                    ]);
                } else {
                    // If resize fails, still save the original
                    $stmt = $pdo->prepare("UPDATE users SET photo_path = ? WHERE id = ?");
                    $stmt->execute([$filePath, $user_id]);
                    
                    echo json_encode([
                        'success' => true,
                        'message' => 'Photo uploaded successfully! (Original size)',
                        'photo_path' => $filePath
                    ]);
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to move uploaded file']);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'No photo file received']);
        }
        
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}

function resizeImage($sourcePath, $targetWidth, $targetHeight) {
    // Get image info
    $imageInfo = getimagesize($sourcePath);
    if (!$imageInfo) {
        return false;
    }
    
    $sourceWidth = $imageInfo[0];
    $sourceHeight = $imageInfo[1];
    $sourceType = $imageInfo[2];
    
    // Create image resource based on type
    switch ($sourceType) {
        case IMAGETYPE_JPEG:
            $sourceImage = imagecreatefromjpeg($sourcePath);
            break;
        case IMAGETYPE_PNG:
            $sourceImage = imagecreatefrompng($sourcePath);
            break;
        case IMAGETYPE_GIF:
            $sourceImage = imagecreatefromgif($sourcePath);
            break;
        default:
            return false;
    }
    
    if (!$sourceImage) {
        return false;
    }
    
    // Create target image
    $targetImage = imagecreatetruecolor($targetWidth, $targetHeight);
    
    // Preserve transparency for PNG and GIF
    if ($sourceType == IMAGETYPE_PNG || $sourceType == IMAGETYPE_GIF) {
        imagealphablending($targetImage, false);
        imagesavealpha($targetImage, true);
        $transparent = imagecolorallocatealpha($targetImage, 255, 255, 255, 127);
        imagefilledrectangle($targetImage, 0, 0, $targetWidth, $targetHeight, $transparent);
    }
    
    // Resize image
    imagecopyresampled($targetImage, $sourceImage, 0, 0, 0, 0, $targetWidth, $targetHeight, $sourceWidth, $sourceHeight);
    
    // Clean up source image
    imagedestroy($sourceImage);
    
    return $targetImage;
}
?>
