<?php
// Database configuration
$host = 'localhost';
$dbname = 'TRANSMISSION1';
$username = 'uktx';
$password = 'uktx123';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<h2>Adding ROUTE_OWNER Field to FAULTS Table</h2>";
    
    // Check if ROUTE_OWNER field already exists
    $stmt = $pdo->query("SHOW COLUMNS FROM FAULTS LIKE 'ROUTE_OWNER'");
    if ($stmt->rowCount() == 0) {
        // Add ROUTE_OWNER field
        $sql = "ALTER TABLE FAULTS ADD COLUMN ROUTE_OWNER VARCHAR(20) DEFAULT 'OTHER' AFTER MAINTAINED_BY";
        $pdo->exec($sql);
        echo "<p style='color: green;'>✓ ROUTE_OWNER field added successfully to FAULTS table</p>";
        
        // Add check constraint for valid values (MySQL 8.0+)
        try {
            $sql = "ALTER TABLE FAULTS ADD CONSTRAINT chk_route_owner CHECK (ROUTE_OWNER IN ('BA', 'CNTX', 'VTL', 'PGCIL', 'OTHER'))";
            $pdo->exec($sql);
            echo "<p style='color: green;'>✓ Check constraint added for ROUTE_OWNER field</p>";
        } catch(PDOException $e) {
            echo "<p style='color: orange;'>⚠ Check constraint not supported in this MySQL version, but field was added</p>";
        }
        
    } else {
        echo "<p style='color: blue;'>ℹ ROUTE_OWNER field already exists in FAULTS table</p>";
    }
    
    // Show current table structure
    echo "<h3>Current FAULTS Table Structure:</h3>";
    $stmt = $pdo->query("DESCRIBE FAULTS");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
    echo "<tr><th>Field</th><th>Type</th><th>Null</th><th>Key</th><th>Default</th><th>Extra</th></tr>";
    foreach ($columns as $column) {
        echo "<tr>";
        echo "<td>" . htmlspecialchars($column['Field']) . "</td>";
        echo "<td>" . htmlspecialchars($column['Type']) . "</td>";
        echo "<td>" . htmlspecialchars($column['Null']) . "</td>";
        echo "<td>" . htmlspecialchars($column['Key']) . "</td>";
        echo "<td>" . htmlspecialchars($column['Default']) . "</td>";
        echo "<td>" . htmlspecialchars($column['Extra']) . "</td>";
        echo "</tr>";
    }
    echo "</table>";
    
    echo "<hr>";
    echo "<p><a href='../dashboard.html'>Go to Dashboard</a></p>";
    
} catch(PDOException $e) {
    echo "<p style='color: red;'>✗ Database error: " . $e->getMessage() . "</p>";
}
?>
