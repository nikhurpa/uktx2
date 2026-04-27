<?php
header("Content-Type: application/json");

// 🔥 DB CONNECTION
$conn = new mysqli("localhost", "root", "", "your_db");

if ($conn->connect_error) {
    die(json_encode(["error" => $conn->connect_error]));
}

// 🔥 INPUTS
$action = $_GET['action'] ?? '';
$table  = $_GET['table'] ?? '';
$id     = $_GET['id'] ?? null;

// 🔥 PRIMARY KEY MAP
$pkMap = [
    "block" => "ID",
    "fth"   => "NUMBER"
];

$pk = isset($pkMap[$table]) ? $pkMap[$table] : "id";

// 🔥 READ JSON BODY
$data = json_decode(file_get_contents("php://input"), true);

// =====================
// 📥 GET DATA
// =====================
if ($action === "get") {

    $result = $conn->query("SELECT * FROM $table");

    $rows = [];

    while ($row = $result->fetch_assoc()) {
        $rows[] = $row;
    }

    echo json_encode($rows);
}

// =====================
// ➕ INSERT
// =====================
elseif ($action === "insert") {

    $columns = implode(",", array_keys($data));
    $values  = implode("','", array_values($data));

    $sql = "INSERT INTO $table ($columns) VALUES ('$values')";

    if ($conn->query($sql)) {
        echo json_encode(["status" => "success"]);
    } else {
        echo json_encode(["error" => $conn->error]);
    }
}

// =====================
// ✏️ UPDATE
// =====================
elseif ($action === "update") {

    $updates = [];

    foreach ($data as $key => $value) {
        $updates[] = "$key='$value'";
    }

    $updateStr = implode(",", $updates);

    $sql = "UPDATE $table SET $updateStr WHERE $pk='$id'";

    if ($conn->query($sql)) {
        echo json_encode(["status" => "updated"]);
    } else {
        echo json_encode(["error" => $conn->error]);
    }
}

// =====================
// ❌ DELETE
// =====================
elseif ($action === "delete") {

    $sql = "DELETE FROM $table WHERE $pk='$id'";

    if ($conn->query($sql)) {
        echo json_encode(["status" => "deleted"]);
    } else {
        echo json_encode(["error" => $conn->error]);
    }
}

// =====================
// ❌ INVALID
// =====================
else {
    echo json_encode(["error" => "Invalid action"]);
}

$conn->close();
?>