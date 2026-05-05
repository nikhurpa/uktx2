<?php
// upload_kml.php
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['kml_file'])) {
    $file = $_FILES['kml_file'];
    
    // Basic validation
    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    if (strtolower($ext) !== 'kml') {
        echo json_encode(['success' => false, 'message' => 'Invalid file type. Only KML allowed.']);
        exit;
    }

    $uploadDir = '../uploads/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    $filename = time() . '_' . basename($file['name']);
    $targetPath = $uploadDir . $filename;

    if (move_uploaded_file($file['tmp_name'], $targetPath)) {
        // Read file contents to send back to frontend
        $kmlContent = file_get_contents($targetPath);
        echo json_encode([
            'success' => true, 
            'message' => 'File uploaded successfully',
            'kmlContent' => $kmlContent,
            'fileName' => $file['name']
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to move uploaded file.']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'No file uploaded.']);
}
?>
