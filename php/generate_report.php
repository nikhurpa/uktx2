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
        $reportType = $_POST['report_type'] ?? '';
        $dateFrom = $_POST['date_from'] ?? '';
        $dateTo = $_POST['date_to'] ?? '';
        
        if (empty($reportType) || empty($dateFrom) || empty($dateTo)) {
            echo json_encode(['success' => false, 'message' => 'Missing required parameters']);
            exit;
        }
        
        $response = [];
        
        switch ($reportType) {
            case 'pending_faults':
                $response = generatePendingFaultsReport($pdo, $_POST);
                break;
                
            case 'restored_faults':
                $response = generateRestoredFaultsReport($pdo, $_POST);
                break;
                
            case 'oa_wise':
                $response = generateOAWiseReport($pdo, $_POST);
                break;
                
            case 'user_wise':
                $response = generateUserWiseReport($pdo, $_POST);
                break;
                
            case 'duration_wise':
                $response = generateDurationWiseReport($pdo, $_POST);
                break;
                
            case 'route_wise':
                $response = generateRouteWiseReport($pdo, $_POST);
                break;
                
            case 'maintenance_wise':
                $response = generateMaintenanceWiseReport($pdo, $_POST);
                break;
                
            case 'summary':
                $response = generateSummaryReport($pdo, $_POST);
                break;
                
            default:
                echo json_encode(['success' => false, 'message' => 'Invalid report type']);
                exit;
        }
        
        echo json_encode($response);
        
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error generating report: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}

function generatePendingFaultsReport($pdo, $params) {
    // Get user role and OA from params
    $user_role = isset($params['user_role']) ? trim($params['user_role']) : '';
    $user_oa = isset($params['user_oa']) ? trim($params['user_oa']) : '';
    
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
    
    // Apply role-based filtering
    if ($user_role === 'user') {
        // Users can only see faults in their OA
        $sql .= " AND OA = ?";
        $queryParams[] = $user_oa;
    } elseif ($user_role === 'nodal') {
        // Nodal users can only see faults in their OA
        $sql .= " AND OA = ?";
        $queryParams[] = $user_oa;
    }
    // Suadmin can see all faults
    
    // Add additional filters
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
    
    // Calculate summary
    $totalFaults = count($data);
    $urgentFaults = 0;
    $criticalFaults = 0;
    
    foreach ($data as $fault) {
        if ($fault['HOURS_PENDING'] > 48) {
            $criticalFaults++;
        } elseif ($fault['HOURS_PENDING'] > 24) {
            $urgentFaults++;
        }
    }
    
    return [
        'success' => true,
        'report_title' => 'Pending Faults Report',
        'summary' => [
            'total_faults' => $totalFaults,
            'urgent_faults' => $urgentFaults,
            'critical_faults' => $criticalFaults,
            'avg_hours_pending' => $totalFaults > 0 ? round(array_sum(array_column($data, 'HOURS_PENDING')) / $totalFaults, 1) : 0
        ],
        'data' => $data
    ];
}

function generateRestoredFaultsReport($pdo, $params) {
    // Get user role and OA from params
    $user_role = isset($params['user_role']) ? trim($params['user_role']) : '';
    $user_oa = isset($params['user_oa']) ? trim($params['user_oa']) : '';
    
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
    
    // Apply role-based filtering
    if ($user_role === 'user') {
        // Users can only see faults in their OA
        $sql .= " AND OA = ?";
        $queryParams[] = $user_oa;
    } elseif ($user_role === 'nodal') {
        // Nodal users can only see faults in their OA
        $sql .= " AND OA = ?";
        $queryParams[] = $user_oa;
    }
    // Suadmin can see all faults
    
    // Add additional filters
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
    
    if (!empty($params['duration'])) {
        switch ($params['duration']) {
            case 'quick':
                $sql .= " AND TIMESTAMPDIFF(HOUR, CONCAT(FAULT_DATE, ' ', FAULT_TIME), CONCAT(RESTORATION_DATE, ' ', RESTORATION_TIME)) < 2";
                break;
            case 'normal':
                $sql .= " AND TIMESTAMPDIFF(HOUR, CONCAT(FAULT_DATE, ' ', FAULT_TIME), CONCAT(RESTORATION_DATE, ' ', RESTORATION_TIME)) BETWEEN 2 AND 8";
                break;
            case 'slow':
                $sql .= " AND TIMESTAMPDIFF(HOUR, CONCAT(FAULT_DATE, ' ', FAULT_TIME), CONCAT(RESTORATION_DATE, ' ', RESTORATION_TIME)) > 8";
                break;
        }
    }
    
    $sql .= " ORDER BY RESTORATION_DATE DESC, RESTORATION_TIME DESC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($queryParams);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Calculate summary
    $totalFaults = count($data);
    $avgResolutionTime = $totalFaults > 0 ? round(array_sum(array_column($data, 'RESOLUTION_HOURS')) / $totalFaults, 1) : 0;
    
    return [
        'success' => true,
        'report_title' => 'Restored Faults Report',
        'summary' => [
            'total_restored' => $totalFaults,
            'avg_resolution_hours' => $avgResolutionTime,
            'quick_resolutions' => count(array_filter($data, fn($f) => $f['RESOLUTION_HOURS'] < 2)),
            'slow_resolutions' => count(array_filter($data, fn($f) => $f['RESOLUTION_HOURS'] > 8))
        ],
        'data' => $data
    ];
}

function generateOAWiseReport($pdo, $params) {
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
    
    // Generate chart data
    $chartData = [
        'labels' => array_column($data, 'OA'),
        'datasets' => [
            [
                'label' => 'Total Faults',
                'data' => array_column($data, 'total_faults'),
                'backgroundColor' => 'rgba(54, 162, 235, 0.2)',
                'borderColor' => 'rgba(54, 162, 235, 1)',
                'borderWidth' => 1
            ],
            [
                'label' => 'Pending Faults',
                'data' => array_column($data, 'pending_faults'),
                'backgroundColor' => 'rgba(255, 99, 132, 0.2)',
                'borderColor' => 'rgba(255, 99, 132, 1)',
                'borderWidth' => 1
            ]
        ]
    ];
    
    return [
        'success' => true,
        'report_title' => 'OA-wise Faults Report',
        'summary' => [
            'total_oa' => count($data),
            'total_faults' => array_sum(array_column($data, 'total_faults')),
            'total_pending' => array_sum(array_column($data, 'pending_faults')),
            'total_restored' => array_sum(array_column($data, 'restored_faults'))
        ],
        'data' => $data,
        'charts' => [
            [
                'title' => 'Faults by OA',
                'type' => 'bar',
                'data' => $chartData,
                'options' => [
                    'responsive' => true,
                    'scales' => [
                        'y' => ['beginAtZero' => true]
                    ]
                ]
            ]
        ]
    ];
}

function generateUserWiseReport($pdo, $params) {
    // This would require a user activity log table
    // For now, we'll create a basic report based on fault creation
    $sql = "SELECT 
                'Admin' as user_type,
                COUNT(*) as total_activities,
                COUNT(CASE WHEN RESTORATION_DATE IS NULL THEN 1 END) as faults_created,
                COUNT(CASE WHEN RESTORATION_DATE IS NOT NULL THEN 1 END) as faults_resolved
            FROM FAULTS 
            WHERE FAULT_DATE BETWEEN ? AND ?";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$params['date_from'], $params['date_to']]);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    return [
        'success' => true,
        'report_title' => 'User Activity Report',
        'summary' => [
            'total_activities' => $data[0]['total_activities'] ?? 0,
            'faults_created' => $data[0]['faults_created'] ?? 0,
            'faults_resolved' => $data[0]['faults_resolved'] ?? 0
        ],
        'data' => $data
    ];
}

function generateDurationWiseReport($pdo, $params) {
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
    
    return [
        'success' => true,
        'report_title' => 'Duration-wise Analysis Report',
        'summary' => [
            'total_resolved' => array_sum(array_column($data, 'fault_count')),
            'avg_resolution_time' => round(array_sum(array_column($data, 'avg_duration')) / count($data), 1),
            'quickest_resolution' => min(array_column($data, 'avg_duration')),
            'slowest_resolution' => max(array_column($data, 'avg_duration'))
        ],
        'data' => $data
    ];
}

function generateRouteWiseReport($pdo, $params) {
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
    
    return [
        'success' => true,
        'report_title' => 'Route-wise Faults Report',
        'summary' => [
            'total_routes' => count($data),
            'total_faults' => array_sum(array_column($data, 'fault_count')),
            'most_faulty_route' => $data[0]['ROUTE_BRIEF'] ?? 'N/A',
            'avg_faults_per_route' => count($data) > 0 ? round(array_sum(array_column($data, 'fault_count')) / count($data), 1) : 0
        ],
        'data' => $data
    ];
}

function generateMaintenanceWiseReport($pdo, $params) {
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
    
    return [
        'success' => true,
        'report_title' => 'Maintenance-wise Report',
        'summary' => [
            'total_maintenance_types' => count($data),
            'total_faults' => array_sum(array_column($data, 'total_faults')),
            'total_resolved' => array_sum(array_column($data, 'resolved_faults')),
            'avg_resolution_time' => round(array_sum(array_column($data, 'avg_resolution_hours')) / count($data), 1)
        ],
        'data' => $data
    ];
}

function generateSummaryReport($pdo, $params) {
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
               GROUP BY OA ORDER BY fault_count DESC LIMIT 5";
    
    $stmt = $pdo->prepare($oaSql);
    $stmt->execute([$params['date_from'], $params['date_to']]);
    $oaData = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    return [
        'success' => true,
        'report_title' => 'Summary Dashboard Report',
        'summary' => [
            'total_faults' => $summary['total_faults'],
            'pending_faults' => $summary['pending_faults'],
            'resolved_faults' => $summary['resolved_faults'],
            'avg_resolution_hours' => round($summary['avg_resolution_hours'], 1)
        ],
        'data' => $oaData
    ];
}
?> 