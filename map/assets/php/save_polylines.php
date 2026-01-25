<?php
$data = json_decode(file_get_contents("php://input"), true);
$dbHost = '127.0.0.1';
$dbName = 'transmission';
$dbUser = 'uktx';
$dbPass = 'uktx123';

$conn = new mysqli($dbHost, $dbUser, $dbPass, $dbName);
$json = json_encode($data['path']);

if ($data['id']) {
    $stmt = $conn->prepare(
        "UPDATE polylines SET name=?, path=? WHERE id=?"
    );
    $stmt->bind_param("ssi", $data['name'], $json, $data['id']);
    $stmt->execute();
    echo json_encode(["id" => $data['id']]);
} else {
    $stmt = $conn->prepare(
        "INSERT INTO polylines (name, path) VALUES (?, ?)"
    );
    $stmt->bind_param("ss", $data['name'], $json);
    $stmt->execute();
    echo json_encode(["id" => $stmt->insert_id]);
}
$stmt->close();
$conn->close();