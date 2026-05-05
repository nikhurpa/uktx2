<?php
// process.php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database configuration
$host = 'localhost';
$dbname = 'ukcfa';
$username = 'uktx';
$password = 'uktx123';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit();
}

// Check if POST data exists
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['error' => 'Invalid request method']);
    exit();
}

// Get POST data
$batch = $_POST['batch'] ?? null;
$config = $_POST['config'] ?? null;

if (!$batch || !$config) {
    echo json_encode(['error' => 'Missing required data']);
    exit();
}

try {
    // Parse JSON data
    $batchData = json_decode($batch, true);
    $configData = json_decode($config, true);
    
    if (!$batchData || !$configData) {
        throw new Exception('Invalid JSON data');
    }
    
    // Validate configuration
    $requiredFields = ['table_name', 'action', 'sheet', 'unique_id', 'unique_id_field', 'update_fields', 'values'];
    foreach ($requiredFields as $field) {
        if (!isset($configData[$field])) {
            throw new Exception("Missing required configuration field: $field");
        }
    }
    
    // Process batch
    $result = processBatch($pdo, $batchData, $configData);
    
    echo json_encode($result);
    
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}

function processBatch($pdo, $batchData, $config) {
    $processed = 0;
    $errors = [];
    $inserted = 0;
    $updated = 0;
    
    try {
        foreach ($batchData as $row) {
            try {
                $uniqueId = $row[$config['unique_id']] ?? null;
                
                if (!$uniqueId) {
                    $errors[] = "Row skipped: Missing unique ID";
                    continue;
                }
                
                // Check if record exists
                $exists = checkRecordExists($pdo, $config['table_name'], $config['unique_id_field'], $uniqueId);
                
                if ($config['action'] === 'insert' || !$exists) {
                    // Insert new record
                    insertRecord($pdo, $config['table_name'], $row, $config);
                    $inserted++;
                } else {
                    // Update existing record
                    updateRecord($pdo, $config['table_name'], $row, $config, $uniqueId);
                    $updated++;
                }
                
                $processed++;
                
            } catch (Exception $e) {
                $errors[] = "Row processing error: " . $e->getMessage();
            }
        }
        
        return [
            'processed' => $processed,
            'inserted' => $inserted,
            'updated' => $updated,
            'errors' => $errors,
            'success' => true
        ];
        
    } catch (Exception $e) {
        return [
            'error' => $e->getMessage(),
            'success' => false
        ];
    }
}

function checkRecordExists($pdo, $tableName, $uniqueField, $uniqueValue) {
    $sql = "SELECT COUNT(*) FROM `$tableName` WHERE `$uniqueField` = :value";
    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':value', $uniqueValue);
    $stmt->execute();
    
    return $stmt->fetchColumn() > 0;
}

function insertRecord($pdo, $tableName, $row, $config) {
    // Get all columns to insert
    $columns = array_keys($row);
    $columns = array_filter($columns, function($col) {
        return !empty($col); // Filter out empty column names
    });
    
    // Remove unique_id from columns for insertion (it's already in WHERE clause)
    $columns = array_filter($columns, function($col) use ($config) {
        return $col !== $config['unique_id'];
    });
    
    if (empty($columns)) {
        return;
    }
    
    // Build SQL
    $placeholders = [];
    foreach ($columns as $col) {
        $placeholders[] = "`$col` = :$col";
    }
    
    $sql = "INSERT INTO `$tableName` (`" . implode('`, `', $columns) . "`) VALUES (:" . implode(', :', $columns) . ")";
    
    $stmt = $pdo->prepare($sql);
    
    foreach ($columns as $col) {
        $stmt->bindValue(":$col", $row[$col] ?? null);
    }
    
    $stmt->execute();
}

function updateRecord($pdo, $tableName, $row, $config, $uniqueId) {
    // Get fields to update
    $updateFields = array_merge($config['update_fields'], $config['values']);
    
    // Remove unique_id from update fields
    $updateFields = array_filter($updateFields, function($field) use ($config) {
        return $field !== $config['unique_id'];
    });
    
    if (empty($updateFields)) {
        return;
    }
    
    // Build SQL
    $placeholders = [];
    foreach ($updateFields as $field) {
        $placeholders[] = "`$field` = :$field";
    }
    
    $sql = "UPDATE `$tableName` SET " . implode(', ', $placeholders) . " WHERE `" . $config['unique_id_field'] . "` = :unique_id";
    
    $stmt = $pdo->prepare($sql);
    
    foreach ($updateFields as $field) {
        $stmt->bindValue(":$field", $row[$field] ?? null);
    }
    
    $stmt->bindValue(':unique_id', $uniqueId);
    
    $stmt->execute();
}
?>
