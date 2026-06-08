<?php

require 'config.php';

error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');

try {

    $data = json_decode(
        file_get_contents("php://input"),
        true
    );

    if (!$data) {
        throw new Exception("Invalid JSON");
    }

    $rows = $data['rows'] ?? [];
    $report = trim($data['report_type'] ?? '');

    if (count($rows) === 0) {
        throw new Exception("No rows received");
    }

    $table = $report ?: 'uploaded_report';

    // Uncomment if you want auto-create table
    /*
    $template = 'working_ftth';

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `$table`
        LIKE `$template`
    ");
    */

    $headers = array_keys($rows[0]);

    $columns = [];

    foreach ($headers as $col) {

        $columns[] =
            "`" .
            str_replace("`", "", $col) .
            "`";
    }

    $columnList =
        implode(",", $columns);

    /*
     * Exclude PK columns from update
     * Modify according to your table
     */
    $primaryKeys = [
        'CRM_ORDER_ID'
    ];

    $updateParts = [];

    foreach ($headers as $col) {

        if (
            in_array(
                strtoupper($col),
                array_map('strtoupper', $primaryKeys)
            )
        ) {
            continue;
        }

        $updateParts[] =
            "`$col`=VALUES(`$col`)";
    }

    $updateSQL =
        implode(",", $updateParts);

    $rowsFound = count($rows);

    $batchSize = 200;

    $chunks =
        array_chunk(
            $rows,
            $batchSize
        );

    $pdo->beginTransaction();

    foreach ($chunks as $chunk) {

        $placeholders = [];
        $values = [];

        foreach ($chunk as $row) {

            $placeholders[] =
                "(" .
                implode(
                    ",",
                    array_fill(
                        0,
                        count($headers),
                        "?"
                    )
                )
                . ")";

            foreach ($headers as $h) {

                $v = $row[$h] ?? null;

                if ($v === '') {
                    $v = null;
                }

                $values[] = $v;
            }
        }

        $sql = "
        INSERT INTO `$table`
        (
            $columnList
        )
        VALUES
        " .
        implode(",", $placeholders) .
        "
        ON DUPLICATE KEY UPDATE
        $updateSQL
        ";

        $stmt =
            $pdo->prepare($sql);

        $stmt->execute($values);
    }

    $pdo->commit();

    echo json_encode([

        "success" => true,

        "report_type" => $report,

        "table" => $table,

        "rows_found" => $rowsFound,

        "rows_processed" => $rowsFound

    ]);

} catch (Exception $e) {

    if (
        isset($pdo) &&
        $pdo->inTransaction()
    ) {
        $pdo->rollBack();
    }

    echo json_encode([

        "success" => false,

        "message" => $e->getMessage()

    ]);
}