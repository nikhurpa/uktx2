<?php
error_reporting(0);
ini_set('display_errors', 0);
header("Content-Type: application/json");

// 🔥 DB CONNECTION
$conn = new mysqli("localhost", "uktx", "uktx123", "ukcfa");

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

    $ignoreFields = ['uid', 'boundindex', 'uniqueid', 'visibleindex'];

    $filteredData = [];

    foreach ($data as $key => $value) {
        if (!in_array($key, $ignoreFields)) {
            $filteredData[$key] = $value;
        }
    }

    $columns = implode(",", array_keys($filteredData));
    $values  = implode("','", array_values($filteredData));

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

    $ignoreFields = ['uid', 'boundindex', 'uniqueid', 'visibleindex'];

    $updates = [];

    foreach ($data as $key => $value) {

        if (in_array($key, $ignoreFields)) {
            continue; // ❌ skip jqxGrid internal fields
        }

        $updates[] = "$key='$value'";
    }

    $updateStr = implode(",", $updates);

    $sql = "UPDATE $table SET $updateStr WHERE $pk='$id'";

    if ($conn->query($sql)) {
        echo json_encode(["status" => "updated"]);
    } else {
        echo $sql;
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