<?php
header('Content-Type: text/csv');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Database configuration
$host = 'localhost';
$dbname = 'TRANSMISSION1';
$username = 'uktx';
$password = 'uktx123';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die('Database connection failed');
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $reportType = $_POST['report_type'] ?? '';
        $dateFrom = $_POST['date_from'] ?? '';
        $dateTo = $_POST['date_to'] ?? '';
        
        if (empty($reportType) || empty($dateFrom) || empty($dateTo)) {
            die('Missing required parameters');
        }
        
        // Generate filename
        $filename = $reportType . '_' . $dateFrom . '_to_' . $dateTo . '.csv';
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        
        // Create output stream
        $output = fopen('php://output', 'w');
        
        // Generate report data based on type
        switch ($reportType) {
            case 'pending_faults':
                exportPendingFaultsReport($pdo, $_POST, $output);
                break;
                
            case 'restored_faults':
                exportRestoredFaultsReport($pdo, $_POST, $output);
                break;
                
            case 'oa_wise':
                exportOAWiseReport($pdo, $_POST, $output);
                break;
                
            case 'duration_wise':
                exportDurationWiseReport($pdo, $_POST, $output);
                break;
                
            case 'route_wise':
                exportRouteWiseReport($pdo, $_POST, $output);
                break;
                
            case 'maintenance_wise':
                exportMaintenanceWiseReport($pdo, $_POST, $output);
                break;
                
            case 'summary':
                exportSummaryReport($pdo, $_POST, $output);
                break;
                
            default:
                die('Invalid report type');
        }
        
        fclose($output);
        
    } catch(Exception $e) {
        die('Error exporting report: ' . $e->getMessage());
    }
} else {
    die('Invalid request method');
}

function exportPendingFaultsReport($pdo, $params, $output) {
    $sql = "SELECT 
                FAULT_ID,
                OA,
                ROUTE_BRIEF,
                LOCATION_BRIEF,
                FAULT_DATE,
                FAULT_TIME,
                MAINTAINED_BY,
                FRT_ASSIGNED,
                ETR,
                TIMESTAMPDIFF(HOUR, CONCAT(FAULT_DATE, ' ', FAULT_TIME), NOW()) as HOURS_PENDING
            FROM FAULTS 
            WHERE RESTORATION_DATE IS NULL 
            AND FAULT_DATE BETWEEN ? AND ?";
    
    $queryParams = [$params['date_from'], $params['date_to']];
    
    // Add filters
    if (!empty($params['oa'])) {
        $sql .= " AND OA = ?";
        $queryParams[] = $params['oa'];
    }
    
    if (!empty($params['maintained_by'])) {
        $sql .= " AND MAINTAINED_BY = ?";
        $queryParams[] = $params['maintained_by'];
    }
    
    if (!empty($params['route'])) {
        $sql .= " AND ROUTE_BRIEF LIKE ?";
        $queryParams[] = '%' . $params['route'] . '%';
    }
    
    $sql .= " ORDER BY FAULT_DATE DESC, FAULT_TIME DESC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($queryParams);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Write headers
    fputcsv($output, array_keys($data[0] ?? []));
    
    // Write data
    foreach ($data as $row) {
        fputcsv($output, $row);
    }
}

function exportRestoredFaultsReport($pdo, $params, $output) {
    $sql = "SELECT 
                FAULT_ID,
                OA,
                ROUTE_BRIEF,
                LOCATION_BRIEF,
                FAULT_DATE,
                FAULT_TIME,
                RESTORATION_DATE,
                RESTORATION_TIME,
                MAINTAINED_BY,
                RESTORATION_BRIEF,
                TIMESTAMPDIFF(HOUR, CONCAT(FAULT_DATE, ' ', FAULT_TIME), CONCAT(RESTORATION_DATE, ' ', RESTORATION_TIME)) as RESOLUTION_HOURS
            FROM FAULTS 
            WHERE RESTORATION_DATE IS NOT NULL 
            AND FAULT_DATE BETWEEN ? AND ?";
    
    $queryParams = [$params['date_from'], $params['date_to']];
    
    // Add filters
    if (!empty($params['oa'])) {
        $sql .= " AND OA = ?";
        $queryParams[] = $params['oa'];
    }
    
    if (!empty($params['maintained_by'])) {
        $sql .= " AND MAINTAINED_BY = ?";
        $queryParams[] = $params['maintained_by'];
    }
    
    if (!empty($params['route'])) {
        $sql .= " AND ROUTE_BRIEF LIKE ?";
        $queryParams[] = '%' . $params['route'] . '%';
    }
    
    $sql .= " ORDER BY RESTORATION_DATE DESC, RESTORATION_TIME DESC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($queryParams);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Write headers
    fputcsv($output, array_keys($data[0] ?? []));
    
    // Write data
    foreach ($data as $row) {
        fputcsv($output, $row);
    }
}

function exportOAWiseReport($pdo, $params, $output) {
    $sql = "SELECT 
                OA,
                COUNT(*) as total_faults,
                COUNT(CASE WHEN RESTORATION_DATE IS NULL THEN 1 END) as pending_faults,
                COUNT(CASE WHEN RESTORATION_DATE IS NOT NULL THEN 1 END) as restored_faults,
                AVG(CASE WHEN RESTORATION_DATE IS NOT NULL 
                    THEN TIMESTAMPDIFF(HOUR, CONCAT(FAULT_DATE, ' ', FAULT_TIME), CONCAT(RESTORATION_DATE, ' ', RESTORATION_TIME))
                    ELSE NULL END) as avg_resolution_hours
            FROM FAULTS 
            WHERE FAULT_DATE BETWEEN ? AND ?
            GROUP BY OA
            ORDER BY total_faults DESC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$params['date_from'], $params['date_to']]);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Write headers
    fputcsv($output, array_keys($data[0] ?? []));
    
    // Write data
    foreach ($data as $row) {
        fputcsv($output, $row);
    }
}

function exportDurationWiseReport($pdo, $params, $output) {
    $sql = "SELECT 
                CASE 
                    WHEN TIMESTAMPDIFF(HOUR, CONCAT(FAULT_DATE, ' ', FAULT_TIME), CONCAT(RESTORATION_DATE, ' ', RESTORATION_TIME)) < 2 THEN '0-2 hours'
                    WHEN TIMESTAMPDIFF(HOUR, CONCAT(FAULT_DATE, ' ', FAULT_TIME), CONCAT(RESTORATION_DATE, ' ', RESTORATION_TIME)) < 8 THEN '2-8 hours'
                    WHEN TIMESTAMPDIFF(HOUR, CONCAT(FAULT_DATE, ' ', FAULT_TIME), CONCAT(RESTORATION_DATE, ' ', RESTORATION_TIME)) < 24 THEN '8-24 hours'
                    ELSE '24+ hours'
                END as duration_range,
                COUNT(*) as fault_count,
                AVG(TIMESTAMPDIFF(HOUR, CONCAT(FAULT_DATE, ' ', FAULT_TIME), CONCAT(RESTORATION_DATE, ' ', RESTORATION_TIME))) as avg_duration
            FROM FAULTS 
            WHERE RESTORATION_DATE IS NOT NULL 
            AND FAULT_DATE BETWEEN ? AND ?
            GROUP BY duration_range
            ORDER BY avg_duration";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$params['date_from'], $params['date_to']]);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Write headers
    fputcsv($output, array_keys($data[0] ?? []));
    
    // Write data
    foreach ($data as $row) {
        fputcsv($output, $row);
    }
}

function exportRouteWiseReport($pdo, $params, $output) {
    $sql = "SELECT 
                ROUTE_BRIEF,
                COUNT(*) as fault_count,
                COUNT(CASE WHEN RESTORATION_DATE IS NULL THEN 1 END) as pending_count,
                COUNT(CASE WHEN RESTORATION_DATE IS NOT NULL THEN 1 END) as restored_count,
                MAX(FAULT_DATE) as last_fault_date
            FROM FAULTS 
            WHERE FAULT_DATE BETWEEN ? AND ?
            GROUP BY ROUTE_BRIEF
            ORDER BY fault_count DESC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$params['date_from'], $params['date_to']]);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Write headers
    fputcsv($output, array_keys($data[0] ?? []));
    
    // Write data
    foreach ($data as $row) {
        fputcsv($output, $row);
    }
}

function exportMaintenanceWiseReport($pdo, $params, $output) {
    $sql = "SELECT 
                MAINTAINED_BY,
                COUNT(*) as total_faults,
                COUNT(CASE WHEN RESTORATION_DATE IS NULL THEN 1 END) as pending_faults,
                COUNT(CASE WHEN RESTORATION_DATE IS NOT NULL THEN 1 END) as resolved_faults,
                AVG(CASE WHEN RESTORATION_DATE IS NOT NULL 
                    THEN TIMESTAMPDIFF(HOUR, CONCAT(FAULT_DATE, ' ', FAULT_TIME), CONCAT(RESTORATION_DATE, ' ', RESTORATION_TIME))
                    ELSE NULL END) as avg_resolution_hours
            FROM FAULTS 
            WHERE FAULT_DATE BETWEEN ? AND ?
            GROUP BY MAINTAINED_BY
            ORDER BY total_faults DESC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$params['date_from'], $params['date_to']]);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Write headers
    fputcsv($output, array_keys($data[0] ?? []));
    
    // Write data
    foreach ($data as $row) {
        fputcsv($output, $row);
    }
}

function exportSummaryReport($pdo, $params, $output) {
    // Get overall statistics
    $sql = "SELECT 
                COUNT(*) as total_faults,
                COUNT(CASE WHEN RESTORATION_DATE IS NULL THEN 1 END) as pending_faults,
                COUNT(CASE WHEN RESTORATION_DATE IS NOT NULL THEN 1 END) as resolved_faults,
                AVG(CASE WHEN RESTORATION_DATE IS NOT NULL 
                    THEN TIMESTAMPDIFF(HOUR, CONCAT(FAULT_DATE, ' ', FAULT_TIME), CONCAT(RESTORATION_DATE, ' ', RESTORATION_TIME))
                    ELSE NULL END) as avg_resolution_hours
            FROM FAULTS 
            WHERE FAULT_DATE BETWEEN ? AND ?";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$params['date_from'], $params['date_to']]);
    $summary = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Get OA-wise summary
    $oaSql = "SELECT OA, COUNT(*) as fault_count FROM FAULTS 
               WHERE FAULT_DATE BETWEEN ? AND ? 
               GROUP BY OA ORDER BY fault_count DESC";
    
    $stmt = $pdo->prepare($oaSql);
    $stmt->execute([$params['date_from'], $params['date_to']]);
    $oaData = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Write summary
    fputcsv($output, ['Summary Statistics']);
    fputcsv($output, array_keys($summary));
    fputcsv($output, array_values($summary));
    fputcsv($output, []); // Empty row
    
    // Write OA data
    fputcsv($output, ['OA-wise Breakdown']);
    fputcsv($output, array_keys($oaData[0] ?? []));
    foreach ($oaData as $row) {
        fputcsv($output, $row);
    }
}
?> 