<?php
header('Content-Type: application/json');

$conn = new mysqli("localhost", "uktx", "uktx123", "bnuknd");

$input = json_decode(file_get_contents("php://input"), true);

$type = $input['type'] ?? '';


// $stmt = $conn->prepare("SELECT * FROM element WHERE district=? AND type=?");
// $stmt->bind_param("ss", $district, $type);
$stmt = $conn->prepare("SELECT * FROM $type");
$stmt->execute();
$result = $stmt->get_result();

$data = [];

while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode($data);
?>