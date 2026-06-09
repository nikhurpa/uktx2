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
        throw new Exception("Invalid JSON input");
    }

    $rows        = $data['rows']         ?? [];
    $report      = trim($data['report_type']  ?? '');
    $table       = trim($data['table']        ?? '');
    $primaryKeys = $data['primary_keys']  ?? ['CRM_ORDER_ID'];
    $uploadMode  = trim($data['upload_mode']  ?? 'upsert');

    // Validate
    if (count($rows) === 0) {
        throw new Exception("No rows received");
    }

    // Sanitise table name — allow only word chars and underscores
    if ($table === '') {
        $table = $report ?: 'uploaded_report';
    }

    $table = preg_replace('/[^\w]/', '', $table);

    if ($table === '') {
        throw new Exception("Invalid table name");
    }

    // ── Column list from first row ────────────────────────────────────────────
    $headers = array_keys($rows[0]);

    $columns = array_map(
        fn($col) => "`" . str_replace("`", "", $col) . "`",
        $headers
    );

    $columnList = implode(",", $columns);

    // ── Mode: create_insert — auto-create table from headers ─────────────────
    if ($uploadMode === 'create_insert') {

        $colDefs = [];

        foreach ($headers as $col) {
            $safecol  = str_replace("`", "", $col);
            $colDefs[] = "`$safecol` VARCHAR(500) NULL";
        }

        $colDefSQL = implode(",\n", $colDefs);

        // Try to pick the first primary key header as AUTO primary
        $pkCol = null;
        foreach ($primaryKeys as $pk) {
            foreach ($headers as $h) {
                if (strtoupper($h) === strtoupper($pk)) {
                    $pkCol = str_replace("`", "", $h);
                    break 2;
                }
            }
        }

        $pkSQL = $pkCol
            ? ",\nPRIMARY KEY (`$pkCol`)"
            : '';

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS `$table` (
                $colDefSQL
                $pkSQL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");
    }

    // ── Build UPDATE clause (for upsert mode) ─────────────────────────────────
    $primaryKeysUpper = array_map('strtoupper', $primaryKeys);

    $updateParts = [];

    foreach ($headers as $col) {
        if (in_array(strtoupper($col), $primaryKeysUpper)) {
            continue;
        }
        $updateParts[] = "`$col`=VALUES(`$col`)";
    }

    $updateSQL = implode(",", $updateParts);

    // ── Execute in batches ────────────────────────────────────────────────────
    $batchSize    = 200;
    $chunks       = array_chunk($rows, $batchSize);
    $rowsInserted = 0;
    $rowsUpdated  = 0;
    $rowsFound    = count($rows);

    $pdo->beginTransaction();

    foreach ($chunks as $chunk) {

        $placeholders = [];
        $values       = [];

        foreach ($chunk as $row) {
            $placeholders[] =
                "(" .
                implode(",", array_fill(0, count($headers), "?")) .
                ")";

            foreach ($headers as $h) {
                $v = $row[$h] ?? null;
                if ($v === '') $v = null;
                $values[] = $v;
            }
        }

        $valuePlaceholders = implode(",", $placeholders);

        // ── Choose SQL strategy by mode ───────────────────────────────────────
        if ($uploadMode === 'insert_only') {

            // Silently skip duplicates
            $sql = "
                INSERT IGNORE INTO `$table`
                ($columnList)
                VALUES $valuePlaceholders
            ";

            $stmt = $pdo->prepare($sql);
            $stmt->execute($values);

            $rowsInserted += $stmt->rowCount();

        } elseif ($uploadMode === 'upsert' || $uploadMode === 'create_insert') {

            if (empty($updateParts)) {
                // No non-PK columns — just insert ignore
                $sql = "
                    INSERT IGNORE INTO `$table`
                    ($columnList)
                    VALUES $valuePlaceholders
                ";
                $stmt = $pdo->prepare($sql);
                $stmt->execute($values);
                $rowsInserted += $stmt->rowCount();

            } else {

                /*
                 * MySQL ON DUPLICATE KEY UPDATE returns:
                 *   1 for each inserted row
                 *   2 for each updated row (value actually changed)
                 *   0 for each duplicate row with identical values
                 */
                $sql = "
                    INSERT INTO `$table`
                    ($columnList)
                    VALUES $valuePlaceholders
                    ON DUPLICATE KEY UPDATE
                    $updateSQL
                ";

                $stmt = $pdo->prepare($sql);
                $stmt->execute($values);

                $affected = $stmt->rowCount();
                // affected = inserted*1 + updated*2
                // So: updated = affected - count(chunk)  [approx when no 0-delta rows]
                // More precisely using the formula:
                $chunkCount     = count($chunk);
                $updInChunk     = (int)(($affected - $chunkCount + $chunkCount) / 2);
                $insInChunk     = $chunkCount - $updInChunk;

                // Simpler accurate split: use affected row count directly
                // inserted = rows where affected==1, updated = rows where affected==2
                // Since PDO gives aggregate count, we use:
                //   inserted = chunkCount - (affected - chunkCount) when affected > chunkCount
                //   all inserts when affected <= chunkCount
                if ($affected <= $chunkCount) {
                    $rowsInserted += $affected;
                } else {
                    $upd           = $affected - $chunkCount;
                    $rowsUpdated  += $upd;
                    $rowsInserted += $chunkCount - $upd;
                }
            }
        }
    }

    $pdo->commit();

    echo json_encode([
        "success"       => true,
        "report_type"   => $report,
        "table"         => $table,
        "upload_mode"   => $uploadMode,
        "rows_found"    => $rowsFound,
        "rows_inserted" => $rowsInserted,
        "rows_updated"  => $rowsUpdated,
        "rows_processed"=> $rowsFound
    ]);

} catch (Exception $e) {

    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
