<?php
/**
 * sync.php — Batch DB sync endpoint
 * Receives parsed Excel rows + config via POST, executes INSERT/UPDATE against MySQL.
 */

declare(strict_types=1);
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');

// ── Helpers ───────────────────────────────────────────────────────────────────

function json_out(array $data): void {
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function fatal(string $msg): void {
    json_out(['fatal' => $msg]);
}

// ── Input validation ──────────────────────────────────────────────────────────

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fatal('Only POST allowed');
}

$raw = $_POST['payload'] ?? '';
if (!$raw) {
    fatal('No payload received');
}

$payload = json_decode($raw, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    fatal('Invalid JSON payload: ' . json_last_error_msg());
}

$rows   = $payload['rows']   ?? [];
$conf   = $payload['conf']   ?? [];
$db     = $payload['db']     ?? [];

// Validate config
$required_conf = ['table_name', 'action', 'unique_id', 'unique_id_field', 'update_fields', 'values'];
foreach ($required_conf as $k) {
    if (!isset($conf[$k])) {
        fatal("Config missing key: {$k}");
    }
}

$action          = strtolower(trim($conf['action']));
$table_name      = trim($conf['table_name']);
$unique_id_col   = trim($conf['unique_id']);        // Excel column letter, e.g. "A"
$unique_id_field = trim($conf['unique_id_field']);  // DB column name, e.g. "BLOCK_ID"
$update_fields   = $conf['update_fields'];          // DB column names, e.g. ["PHASE","BACKHAUL"]
$value_cols      = $conf['values'];                 // Excel column letters, e.g. ["B","C","D"]

if (!in_array($action, ['insert', 'update'], true)) {
    fatal("action must be 'insert' or 'update'");
}

// Sanitise table name (allow only alphanumeric and underscore)
if (!preg_match('/^[A-Za-z_][A-Za-z0-9_]*$/', $table_name)) {
    fatal('Invalid table_name: only alphanumeric and underscore allowed');
}

// Sanitise unique_id_field DB column name
if (!preg_match('/^[A-Za-z_][A-Za-z0-9_]*$/', $unique_id_field)) {
    fatal('Invalid unique_id_field: only alphanumeric and underscore allowed');
}

// Sanitise update field names
foreach ($update_fields as $f) {
    if (!preg_match('/^[A-Za-z_][A-Za-z0-9_]*$/', $f)) {
        fatal("Invalid field name: {$f}");
    }
}

// Validate DB params
$db_host = trim($db['host'] ?? 'localhost');
$db_port = (int)($db['port'] ?? 3306);
$db_name = trim($db['name'] ?? '');
$db_user = trim($db['user'] ?? '');
$db_pass = $db['pass'] ?? '';

if (!$db_name || !$db_user) {
    fatal('Database name and user are required');
}

// ── Excel column letter → 0-based index ──────────────────────────────────────

function col_letter_to_index(string $col): int {
    $col = strtoupper(trim($col));
    $index = 0;
    for ($i = 0; $i < strlen($col); $i++) {
        $index = $index * 26 + (ord($col[$i]) - ord('A') + 1);
    }
    return $index - 1;
}

$uid_idx    = col_letter_to_index($unique_id_col);
$value_idxs = array_map('col_letter_to_index', $value_cols);

if (count($update_fields) !== count($value_idxs)) {
    fatal('update_fields and values arrays must have the same length');
}

// ── DB connection ─────────────────────────────────────────────────────────────

$dsn = "mysql:host={$db_host};port={$db_port};dbname={$db_name};charset=utf8mb4";

try {
    $pdo = new PDO($dsn, $db_user, $db_pass, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_TIMEOUT            => 15,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4",
    ]);
} catch (PDOException $e) {
    fatal('DB connection failed: ' . $e->getMessage());
}

// ── Process rows ──────────────────────────────────────────────────────────────

$processed    = 0;
$errors       = 0;
$error_details = [];

if (count($rows) === 0) {
    json_out(['processed' => 0, 'errors' => 0, 'message' => 'No rows in batch']);
}

// ── Bulk UPDATE via single INSERT … ON DUPLICATE KEY UPDATE ──────────────────
// ── Or plain INSERT / UPDATE per row with prepared statements ─────────────────

if ($action === 'update') {
    /**
     * Strategy: build a bulk UPDATE using a temporary values list:
     *   UPDATE table SET field1 = CASE unique_id WHEN v THEN x … END, …
     *   WHERE unique_id IN (…)
     * This is efficient for large batches.
     */

    // Gather non-empty rows
    $valid_rows = [];
    foreach ($rows as $row) {
        $uid = isset($row[$uid_idx]) ? trim((string)$row[$uid_idx]) : '';
        if ($uid === '') continue;
        $vals = [];
        foreach ($value_idxs as $vi) {
            $vals[] = isset($row[$vi]) ? $row[$vi] : null;
        }
        $valid_rows[] = ['uid' => $uid, 'vals' => $vals];
    }

    if (empty($valid_rows)) {
        json_out(['processed' => 0, 'errors' => 0, 'message' => 'All rows empty']);
    }

    try {
        $pdo->beginTransaction();

        // Build CASE … END for each field
        $case_sql   = [];
        $bind_vals  = [];
        $uid_list   = [];

        foreach ($update_fields as $fi => $field) {
            $case_parts = [];
            foreach ($valid_rows as $r) {
                $case_parts[] = "WHEN ? THEN ?";
                $bind_vals[] = $r['uid'];
                $bind_vals[] = $r['vals'][$fi];
            }
            $case_sql[] = "`{$field}` = CASE `{$unique_id_field}` " . implode(' ', $case_parts) . " ELSE `{$field}` END";
        }

        foreach ($valid_rows as $r) {
            $uid_list[] = $r['uid'];
        }

        $placeholders = implode(',', array_fill(0, count($uid_list), '?'));
        $sql = "UPDATE `{$table_name}` SET " . implode(', ', $case_sql)
             . " WHERE `{$unique_id_field}` IN ({$placeholders})";

        $stmt = $pdo->prepare($sql);
        $all_params = array_merge($bind_vals, $uid_list);
        $stmt->execute($all_params);

        $affected = $stmt->rowCount();
        $pdo->commit();

        // Rows not updated (not found in DB) are not errors — just log
        $not_found = count($valid_rows) - $affected;
        $processed = $affected;
        $errors    = 0; // DB errors, not "not found"

        $msg = "Updated {$affected} rows.";
        if ($not_found > 0) {
            $msg .= " {$not_found} row(s) not found in table (skipped).";
            $error_details[] = "{$not_found} row(s) had no matching `{$unique_id_field}` in table.";
        }

    } catch (PDOException $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        // Fall back to row-by-row
        $result = update_row_by_row($pdo, $table_name, $unique_id_field, $update_fields, $valid_rows);
        $processed    = $result['processed'];
        $errors       = $result['errors'];
        $error_details = $result['error_details'];
        $msg = "Row-by-row fallback: {$processed} updated, {$errors} errors.";
    }

} else {
    // ── INSERT ────────────────────────────────────────────────────────────────
    // Build bulk INSERT … ON DUPLICATE KEY UPDATE (upsert) or plain INSERT IGNORE

    $all_fields   = array_merge([$unique_id_field], $update_fields);
    $col_list     = '`' . implode('`, `', $all_fields) . '`';
    $row_ph       = '(' . implode(', ', array_fill(0, count($all_fields), '?')) . ')';

    $valid_rows = [];
    foreach ($rows as $row) {
        $uid = isset($row[$uid_idx]) ? trim((string)$row[$uid_idx]) : '';
        if ($uid === '') continue;
        $entry = [$uid];
        foreach ($value_idxs as $vi) {
            $entry[] = isset($row[$vi]) ? $row[$vi] : null;
        }
        $valid_rows[] = $entry;
    }

    if (empty($valid_rows)) {
        json_out(['processed' => 0, 'errors' => 0, 'message' => 'All rows empty']);
    }

    // Chunk inserts to avoid too-large queries
    $chunk_size = 100;
    $chunks     = array_chunk($valid_rows, $chunk_size);

    try {
        $pdo->beginTransaction();

        foreach ($chunks as $chunk) {
            $row_placeholders = implode(', ', array_fill(0, count($chunk), $row_ph));
            $sql = "INSERT INTO `{$table_name}` ({$col_list}) VALUES {$row_placeholders}";

            // ON DUPLICATE KEY UPDATE each field
            $dup_parts = [];
            foreach ($update_fields as $f) {
                $dup_parts[] = "`{$f}` = VALUES(`{$f}`)";
            }
            $sql .= " ON DUPLICATE KEY UPDATE " . implode(', ', $dup_parts);

            $params = array_merge(...$chunk);
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $processed += count($chunk);
        }

        $pdo->commit();
        $msg = "Inserted/upserted {$processed} rows.";

    } catch (PDOException $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        $result = insert_row_by_row($pdo, $table_name, $unique_id_field, $update_fields, $value_idxs, $valid_rows);
        $processed    = $result['processed'];
        $errors       = $result['errors'];
        $error_details = $result['error_details'];
        $msg = "Row-by-row fallback: {$processed} inserted, {$errors} errors.";
    }
}

json_out([
    'processed'     => $processed,
    'errors'        => $errors,
    'error_details' => array_slice($error_details, 0, 10), // cap at 10 msgs
    'message'       => $msg ?? '',
]);

// ── Fallback helpers ──────────────────────────────────────────────────────────

function update_row_by_row(PDO $pdo, string $table, string $uid_col, array $fields, array $valid_rows): array {
    $set_parts = implode(', ', array_map(fn($f) => "`{$f}` = ?", $fields));
    $sql       = "UPDATE `{$table}` SET {$set_parts} WHERE `{$uid_col}` = ?";
    $stmt      = $pdo->prepare($sql);

    $processed = 0; $errors = 0; $error_details = [];
    foreach ($valid_rows as $r) {
        try {
            $params = array_merge($r['vals'], [$r['uid']]);
            $stmt->execute($params);
            $processed++;
        } catch (PDOException $e) {
            $errors++;
            $error_details[] = "UID {$r['uid']}: " . $e->getMessage();
        }
    }
    return compact('processed', 'errors', 'error_details');
}

function insert_row_by_row(PDO $pdo, string $table, string $uid_col, array $fields, array $val_idxs, array $valid_rows): array {
    $all_fields = array_merge([$uid_col], $fields);
    $col_list   = '`' . implode('`, `', $all_fields) . '`';
    $ph         = implode(', ', array_fill(0, count($all_fields), '?'));
    $dup        = implode(', ', array_map(fn($f) => "`{$f}` = VALUES(`{$f}`)", $fields));
    $sql        = "INSERT INTO `{$table}` ({$col_list}) VALUES ({$ph}) ON DUPLICATE KEY UPDATE {$dup}";
    $stmt       = $pdo->prepare($sql);

    $processed = 0; $errors = 0; $error_details = [];
    foreach ($valid_rows as $row) {
        try {
            $stmt->execute($row);
            $processed++;
        } catch (PDOException $e) {
            $errors++;
            $error_details[] = "Row: " . $e->getMessage();
        }
    }
    return compact('processed', 'errors', 'error_details');
}
