<?php
// db.php
$host = 'localhost';
$user = 'root';
$pass = ''; // Default WAMP password
$dbname = 'gis_map';

try {
    // First connect without dbname to ensure it exists
    $pdo = new PDO("mysql:host=$host", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Create DB if not exists
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbname`");
    $pdo->exec("USE `$dbname`");
    
    // Create Table if not exists
    $sql = "CREATE TABLE IF NOT EXISTS features (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        type ENUM('Point', 'LineString') NOT NULL,
        coordinates JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )";
    $pdo->exec($sql);

} catch(PDOException $e) {
    die(json_encode(['success' => false, 'message' => "DB Connection failed: " . $e->getMessage()]));
}
?>
