<?php
// save_kml_elements.php
header('Content-Type: application/json');

try {
    require_once 'db.php';
    $pdo = getPDO();

    // read JSON body
    $raw = file_get_contents('php://input');
    if (!$raw) throw new Exception('No input received');
    $rows = json_decode($raw, true);
    if (!is_array($rows)) throw new Exception('Invalid JSON');

    // prepare insert statement with ON DUPLICATE KEY UPDATE
    $sql = "INSERT INTO kml_elements
      (id, temp, file, fileid, parentfolder, element_type, element_name, description,
       ikon, style, coordinates, open, user_created, user_updated,
       creation_date_time, updation_date_time, element_sl)
      VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        temp = VALUES(temp),
        file = VALUES(file),
        parentfolder = VALUES(parentfolder),
        element_type = VALUES(element_type),
        element_name = VALUES(element_name),
        description = VALUES(description),
        ikon = VALUES(ikon),
        style = VALUES(style),
        coordinates = VALUES(coordinates),
        open = VALUES(open),
        user_updated = VALUES(user_updated),
        updation_date_time = VALUES(updation_date_time),
        element_sl = VALUES(element_sl)";

    $stmt = $pdo->prepare($sql);
    $count = 0;
    $pdo->beginTransaction();
    foreach ($rows as $r) {
        // basic sanitization & defaults
        $params = [
            $r['id'] ?? uniqid('id_'),
            $r['temp'] ?? null,
            $r['file'] ?? null,
            $r['fileid'] ?? null,
            $r['parentfolder'] ?? null,
            $r['element_type'] ?? null,
            $r['element_name'] ?? null,
            $r['description'] ?? null,
            $r['ikon'] ?? null,
            $r['style'] ?? null,
            $r['coordinates'] ?? null,
            $r['open'] ?? null,
            $r['user_created'] ?? null,
            $r['user_updated'] ?? null,
            $r['creation_date_time'] ?? null,
            $r['updation_date_time'] ?? null,
            isset($r['element_sl']) ? intval($r['element_sl']) : null
        ];
        $stmt->execute($params);
        $count += $stmt->rowCount();
    }
    $pdo->commit();

    echo json_encode(['success' => true, 'inserted' => count($rows), 'affected_rows' => $count]);
} catch (Exception $ex) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $ex->getMessage()]);
}