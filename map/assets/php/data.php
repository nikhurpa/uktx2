<?php
header('Content-Type: application/json');

$conn = new mysqli("localhost", "uktx", "uktx123", "bnuknd");

$input = json_decode(file_get_contents("php://input"), true);

$type = $input['type'] ?? '';
$block = strtoupper($input['block']) ?? '';
$oa = strtoupper($input['oa']) ?? '';

switch ($type) {
    case "GP":
        $qry= "SELECT * FROM gp where BLOCK='$block' ";
        break;
    case "OLT":
        $qry= "SELECT * FROM olt where OA='$oa' ";
        break;
    case "BTS":
        $qry= "SELECT * FROM bts where OA='$oa' ";
    break;
    case "OFC":
        $qry= "SELECT * FROM ofc where OA='$oa' ";
    break;       
    default:
        $qry= "SELECT * FROM gp where BLOCK='$block' ";
}


$stmt = $conn->prepare($qry);
$stmt->execute();
$result = $stmt->get_result();

$data = [];

while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode($data);
?>