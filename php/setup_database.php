<?php
// Database configuration
    // $host = 'localhost';
    // $dbname = 'TRANSMISSION1';
    // $username = 'uktx';
    // $password = 'uktx123';
    
    require_once 'db_connection.php';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Create FAULTS table
    $sql = "CREATE TABLE IF NOT EXISTS FAULTS (
        FAULT_ID VARCHAR(20) PRIMARY KEY,
        OA VARCHAR(20) NOT NULL,
        FAULT_DATE DATE NOT NULL,
        FAULT_TIME TIME NOT NULL,
        ROUTE_BRIEF VARCHAR(200) NOT NULL,
        MAINTAINED_BY VARCHAR(20) NOT NULL,
        ROUTE_OWNER VARCHAR(20) NOT NULL DEFAULT 'OTHER',
        LOCATION_BRIEF VARCHAR(100) NOT NULL,
        LOCATION_LATLONG VARCHAR(20),
        FAULT_DESCRIPTION VARCHAR(100) NOT NULL,
        ROUTE_RING_LINEAR VARCHAR(10) NOT NULL,
        ELEMENT_AFFECTED TEXT,
        FRT_ASSIGNED VARCHAR(20),
        ETR VARCHAR(20),
        FAULT_IMAGES TEXT,
        RESTORATION_DATE DATE,
        RESTORATION_TIME TIME,
        RESTORATION_BRIEF TEXT,
        RESTORATION_IMAGES TEXT,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )";
    
    $pdo->exec($sql);
    
    // Create users table if not exists
    $sql = "CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        oa VARCHAR(20) DEFAULT NULL,
        name VARCHAR(100) DEFAULT NULL,
        email VARCHAR(100) DEFAULT NULL,
        mobile VARCHAR(15) DEFAULT NULL,
        designation VARCHAR(100) DEFAULT NULL,
        photo_path VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )";
    
    $pdo->exec($sql);
    
    // Insert default Suadmin user if not exists
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE username = 'admin'");
    $stmt->execute();
    
    if ($stmt->fetchColumn() == 0) {
        $defaultPassword = password_hash('admin123', PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO users (username, password, role, oa) VALUES (?, ?, ?, ?)");
        $stmt->execute(['admin', $defaultPassword, 'Suadmin', 'ALM']);
    }
    
    // Create OA table
    $sql = "CREATE TABLE IF NOT EXISTS OA_TABLE (
        id INT AUTO_INCREMENT PRIMARY KEY,
        OA VARCHAR(20) UNIQUE NOT NULL,
        BA VARCHAR(20) NOT NULL,
        LAT_LONGS VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )";
    
    $pdo->exec($sql);
    
    // Insert default admin user if not exists
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE username = 'admin'");
    $stmt->execute();
    
    if ($stmt->fetchColumn() == 0) {
        $defaultPassword = password_hash('admin123', PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO users (username, password, role, oa, name, email, designation) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute(['admin', $defaultPassword, 'admin', 'ALM', 'System Administrator', 'admin@uktx.com', 'System Administrator']);
    }
    
    // Insert OA data for Uttarakhand districts
    $oaData = [
        ['OA' => 'ALM', 'BA' => 'ALMORA', 'LAT_LONGS' => '29.5973,79.6506'],
        ['OA' => 'DDN', 'BA' => 'DEHRADUN', 'LAT_LONGS' => '30.3165,78.0322'],
        ['OA' => 'HWR', 'BA' => 'HARIDWAR', 'LAT_LONGS' => '29.9457,78.1642'],
        ['OA' => 'NTL', 'BA' => 'NAINITAL', 'LAT_LONGS' => '29.3919,79.4542'],
        ['OA' => 'NWT', 'BA' => 'NEW TEHRI', 'LAT_LONGS' => '30.3753,78.4447'],
        ['OA' => 'SGR', 'BA' => 'SRINAGAR', 'LAT_LONGS' => '30.2224,78.7834']
    ];
    
    foreach ($oaData as $oa) {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM OA_TABLE WHERE OA = ?");
        $stmt->execute([$oa['OA']]);
        
        if ($stmt->fetchColumn() == 0) {
            $stmt = $pdo->prepare("INSERT INTO OA_TABLE (OA, BA, LAT_LONGS) VALUES (?, ?, ?)");
            $stmt->execute([$oa['OA'], $oa['BA'], $oa['LAT_LONGS']]);
        }
    }
    
    echo "Database setup completed successfully!\n";
    echo "Default admin credentials: admin / admin123\n";
    echo "OA data for Uttarakhand districts added successfully!\n";
    
} catch(PDOException $e) {
    echo "Database setup failed: " . $e->getMessage() . "\n";
}
?> 