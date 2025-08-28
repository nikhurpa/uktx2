<?php
header("Content-Type: application/json");

// Database connection settings
require_once 'db_connection.php';

try {
    $dsn = "mysql:host=$host;dbname=$dbname;charset=utf8mb4";
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (PDOException $e) {
    echo json_encode(["error" => "Connection failed: " . $e->getMessage()]);
    exit;
}

// Get SQL query from POST
if (!isset($_POST['query'])) {
    echo json_encode(["error" => "No SQL query provided"]);
    exit;
}

$sql = $_POST['query'];

try {
    $stmt = $pdo->query($sql);

    // If result is SELECT (or similar)
    if ($stmt->columnCount() > 0) {
        $output = $stmt->fetchAll();
    } else {
        // For INSERT, UPDATE, DELETE
        $output = ["affected_rows" => $stmt->rowCount()];
    }

    echo json_encode($output, JSON_PRETTY_PRINT);
} catch (PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}