<?php
header('Content-Type: application/json');

// $conn = new mysqli("localhost", "uktx", "uktx123", "ukcfa"); 
$conn = new mysqli("srv1493.hstgr.io", "u642970219_uktx", "Gmcfa@01", "u642970219_TRANSMISSION1");

$input = json_decode(file_get_contents("php://input"), true);

$type = $input['type'] ?? '';
$block = strtoupper($input['block']) ?? '';
$oa = strtoupper($input['oa']) ?? '';
$addlqry = strtoupper($input['qry']) ?? '';

switch ($type) {
    case "GP":
        $qry= "SELECT * FROM gp where $block ";
        break;
    case "BHQ":
         $qry= "SELECT * FROM bhq where $block ";
        break;    
    case "OLT":
        $qry= "SELECT * FROM olt where $oa ";
        break;
    case "BTS":
        $qry= "SELECT * FROM bts where $oa ";
    break;
    case "OFC":
        $qry= "SELECT * FROM ofc where $oa ";
    break;
    case "VIL":
        $qry= "SELECT * FROM vil where $block ";
    break;       
    case "PHC":
        $qry= "SELECT * FROM phc where $block ";
    break;       
    case "SCH":
        $qry= "SELECT * FROM sch where $block ";
    break;       
    case "SAS":
        $qry= "SELECT * FROM sas where $block ";
    break;              
    default:
        $qry= "SELECT * FROM gp where $block ";
}

$qry= $qry . $addlqry ;
$stmt = $conn->prepare($qry);
$stmt->execute();
$result = $stmt->get_result();

$data = [];

while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode($data);
?>