<?php
// Database configuration
$host = 'localhost';
$dbname = 'TRANSMISSION1';
$username = 'uktx';
$password = 'uktx123';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Add new columns to users table if they don't exist
    $columns = [
        'name' => 'VARCHAR(100) DEFAULT NULL',
        'email' => 'VARCHAR(100) DEFAULT NULL',
        'mobile' => 'VARCHAR(15) DEFAULT NULL',
        'designation' => 'VARCHAR(100) DEFAULT NULL',
        'photo_path' => 'VARCHAR(255) DEFAULT NULL'
    ];
    
    foreach ($columns as $column => $definition) {
        try {
            $sql = "ALTER TABLE users ADD COLUMN $column $definition";
            $pdo->exec($sql);
            echo "Added column: $column\n";
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
                echo "Column $column already exists\n";
            } else {
                echo "Error adding column $column: " . $e->getMessage() . "\n";
            }
        }
    }
    
    echo "Users table update completed successfully!\n";
    
} catch(PDOException $e) {
    echo "Database update failed: " . $e->getMessage() . "\n";
}
?>


