<?php
header('Content-Type: application/json; charset=utf-8');

$host = '127.0.0.1';
$db   = 'u642970219_TRANSMISSION1';
$user = 'u642970219_uktx';
$pass = 'your_secure_password_here';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
} catch (\PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Link Error"]); exit;
}

$action = $_POST['action'] ?? null;
if (!$action) { echo json_encode(["status" => "error", "message" => "No action"]); exit; }

try {
    // Pipeline to map unique system options straight into frontend selectors
    if ($action === 'get_form_metadata') {
        $meta = ['ssa' => [], 'bbm' => [], 'franchisee' => []];
        
        // 1. Fetch unique SSA Zones
        $q = $pdo->query("SELECT DISTINCT OA_NAME FROM oa WHERE OA_NAME IS NOT NULL AND OA_NAME <> '' ORDER BY OA_NAME ASC");
        $meta['ssa'] = $q->fetchAll(PDO::FETCH_COLUMN);
        
        // 2. Fetch unique BBM Managers
        $q = $pdo->query("SELECT DISTINCT BBM_NAME FROM bbm WHERE ACTIVE='Y' AND BBM_NAME IS NOT NULL ORDER BY BBM_NAME ASC");
        $meta['bbm'] = $q->fetchAll(PDO::FETCH_COLUMN);
        
        // 3. Fetch unique Franchisee configurations
        $q = $pdo->query("SELECT DISTINCT FRANCHISEE_ID, FRANCHISEE FROM olt WHERE FRANCHISEE_ID IS NOT NULL AND FRANCHISEE_ID <> '' ORDER BY FRANCHISEE ASC");
        foreach($q->fetchAll() as $r) {
            $meta['franchisee'][] = ['id' => $r['FRANCHISEE_ID'], 'name' => $r['FRANCHISEE']];
        }
        
        echo json_encode(["status" => "success", "data" => $meta]);
        exit;
    }

    // Process reporting procedure requests
    $input_date = $_POST['input_date'] ?? 'ALL';
    $dataOut = [];

    switch ($action) {
        case "getSsaProvisioning":
        case "getBbmProvisioning":
        case "getFranchiseeProvisioning":
            $stmt = $pdo->prepare("CALL {$action}(?)");
            $stmt->execute([$input_date]);
            $dataOut = $stmt->fetchAll();
            break;

        case "getSsaDisconnection":
        case "getBbmDisconnection":
        case "getFranchiseeDisconnection":
            $sub_type = $_POST['input_sub_type'] ?? 'ALL';
            $stmt = $pdo->prepare("CALL {$action}(?, ?)");
            $stmt->execute([$input_date, $sub_type]);
            $dataOut = $stmt->fetchAll();
            break;

        case "getSsaProvisioningList":
        case "getBbmProvisioningList":
        case "getFranchiseeProvisioningList":
            $entity = $_POST['input_entity'] ?? '';
            $stmt = $pdo->prepare("CALL {$action}(?, ?)");
            $stmt->execute([$input_date, $entity]);
            $dataOut = $stmt->fetchAll();
            break;

        case "getSsaDisconnectionList":
        case "getBbmDisconnectionList":
        case "getFranchiseeDisconnectionList":
            $entity = $_POST['input_entity'] ?? '';
            $sub_type = $_POST['input_sub_type'] ?? 'ALL';
            $stmt = $pdo->prepare("CALL {$action}(?, ?, ?)");
            $stmt->execute([$input_date, $entity, $sub_type]);
            $dataOut = $stmt->fetchAll();
            break;
    }

    echo json_encode(["status" => "success", "data" => $dataOut]);

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}