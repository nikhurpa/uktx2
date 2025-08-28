<?php
header('Content-Type: text/html; charset=utf-8');

require_once 'db_connection.php';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$database;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<h2>Polylines Table Test</h2>";
    
    // Check if table exists
    $tableExists = $pdo->query("SHOW TABLES LIKE 'polylines'")->rowCount() > 0;
    
    if ($tableExists) {
        echo "<p style='color: green;'>✓ Polylines table exists</p>";
        
        // Get table structure
        echo "<h3>Table Structure:</h3>";
        $stmt = $pdo->query("DESCRIBE polylines");
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo "<table border='1' style='border-collapse: collapse; margin: 10px 0;'>";
        echo "<tr><th>Field</th><th>Type</th><th>Null</th><th>Key</th><th>Default</th><th>Extra</th></tr>";
        foreach ($columns as $column) {
            echo "<tr>";
            echo "<td>{$column['Field']}</td>";
            echo "<td>{$column['Type']}</td>";
            echo "<td>{$column['Null']}</td>";
            echo "<td>{$column['Key']}</td>";
            echo "<td>{$column['Default']}</td>";
            echo "<td>{$column['Extra']}</td>";
            echo "</tr>";
        }
        echo "</table>";
        
        // Get record count
        $count = $pdo->query("SELECT COUNT(*) FROM polylines")->fetchColumn();
        echo "<p><strong>Total records:</strong> {$count}</p>";
        
        if ($count > 0) {
            // Get sample data
            echo "<h3>Sample Data (First 5 records):</h3>";
            $stmt = $pdo->query("SELECT * FROM polylines ORDER BY id LIMIT 5");
            $sampleData = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo "<table border='1' style='border-collapse: collapse; margin: 10px 0; font-size: 12px;'>";
            if (!empty($sampleData)) {
                // Header
                echo "<tr>";
                foreach (array_keys($sampleData[0]) as $header) {
                    echo "<th style='padding: 5px;'>{$header}</th>";
                }
                echo "</tr>";
                
                // Data
                foreach ($sampleData as $row) {
                    echo "<tr>";
                    foreach ($row as $value) {
                        if ($value === null) {
                            echo "<td style='padding: 5px; color: #999;'>NULL</td>";
                        } else {
                            $displayValue = strlen($value) > 50 ? substr($value, 0, 50) . '...' : $value;
                            echo "<td style='padding: 5px;'>{$displayValue}</td>";
                        }
                    }
                    echo "</tr>";
                }
            }
            echo "</table>";
            
            // Get KMZ files summary
            echo "<h3>KMZ Files Summary:</h3>";
            $stmt = $pdo->query("SELECT kmz_filename, COUNT(*) as count FROM polylines GROUP BY kmz_filename ORDER BY count DESC");
            $kmzSummary = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo "<table border='1' style='border-collapse: collapse; margin: 10px 0;'>";
            echo "<tr><th>KMZ File</th><th>Route Count</th></tr>";
            foreach ($kmzSummary as $summary) {
                echo "<tr>";
                echo "<td style='padding: 5px;'>{$summary['kmz_filename']}</td>";
                echo "<td style='padding: 5px; text-align: center;'>{$summary['count']}</td>";
                echo "</tr>";
            }
            echo "</table>";
        } else {
            echo "<p style='color: orange;'>⚠ Table exists but has no data</p>";
            echo "<p>You can run the Python KMZ processor to populate this table.</p>";
        }
        
    } else {
        echo "<p style='color: red;'>✗ Polylines table does not exist</p>";
        echo "<p>You need to run the Python KMZ processor first to create the table.</p>";
    }
    
} catch (PDOException $e) {
    echo "<p style='color: red;'>Database Error: " . $e->getMessage() . "</p>";
} catch (Exception $e) {
    echo "<p style='color: red;'>Error: " . $e->getMessage() . "</p>";
}

echo "<hr>";
echo "<h3>Next Steps:</h3>";
echo "<ol>";
echo "<li>If the table doesn't exist or has no data, run the Python KMZ processor</li>";
echo "<li>Navigate to the Fault Map page in your dashboard</li>";
echo "<li>Use the route controls to display polylines near fault points</li>";
echo "</ol>";

echo "<p><a href='dashboard.html'>← Back to Dashboard</a></p>";
?>



