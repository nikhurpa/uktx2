<?php
// api.php
header('Content-Type: application/json');

// --- DB config ---
$dbHost = '127.0.0.1';
$dbName = 'transmission';
$dbUser = 'uktx';
$dbPass = 'uktx123';
$dsn = "mysql:host=$dbHost;dbname=$dbName;charset=utf8mb4";

try {
  $pdo = new PDO($dsn, $dbUser, $dbPass, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
  ]);
} catch (Exception $e) {
  echo json_encode(['error' => 'DB connection failed: '.$e->getMessage()]); exit;
}

// --- helpers ---
function respond($data) { echo json_encode($data); exit; }
function requireParam($k) { if (!isset($_REQUEST[$k])) respond(['error'=>"Missing param $k"]); return $_REQUEST[$k]; }
function validateTableName($t) {
  if (!preg_match('/^[A-Za-z0-9_]+$/', $t)) respond(['error'=>'Invalid table name']);
  return $t;
}
function detectGeometryCols($cols) {
  $lc = array_map('strtolower', $cols);
  $res = ['type'=>null, 'cols'=>[]];
  // point detection
  $lat = null; $lng = null; $latlng = null;
  foreach ($cols as $c) {
    $lower = strtolower($c);
    if (in_array($lower, ['lat','latitude'])) $lat = $c;
    if (in_array($lower, ['lng','lon','long','longitude'])) $lng = $c;
    if (in_array($lower, ['latlng','lat_lon','coords','coord'])) $latlng = $c;
  }
  if (($lat && $lng) || $latlng) {
    $res['type']='point';
    $res['cols']=['lat'=>$lat,'lng'=>$lng,'latlng'=>$latlng];
    return $res;
  }
  // polyline/polygon detection
  foreach ($cols as $c) {
    $lower = strtolower($c);
    if (in_array($lower, ['polyline','path','encoded_path','route','encoded_polyline'])) {
      $res['type']='polyline';
      $res['cols']=['enc'=>$c];
      return $res;
    }
    if (in_array($lower, ['polygon','encoded_polygon','boundary','area'])) {
      $res['type']='polygon';
      $res['cols']=['enc'=>$c];
      return $res;
    }
  }
  return $res;
}

// --- routing based on 'action' ---
$action = isset($_REQUEST['action']) ? $_REQUEST['action'] : null;

// LIST TABLE COLUMNS
if ($action === 'inspect') {
  $table = validateTableName(requireParam('table'));
  try {
    $stmt = $pdo->query("DESCRIBE `$table`");
    $cols = [];
    while ($r = $stmt->fetch()) $cols[] = $r['Field'];
    $geom = detectGeometryCols($cols);
    respond(['table'=>$table,'columns'=>$cols,'geometry'=>$geom]);
  } catch (Exception $e) {
    respond(['error'=>$e->getMessage()]);
  }
}

// GET ALL FEATURES
if ($action === 'features') {
  $table = validateTableName(requireParam('table'));
  try {
    $stmt = $pdo->query("SELECT * FROM `$table`");
    $rows = $stmt->fetchAll();
    // detect cols
    $stmt2 = $pdo->query("DESCRIBE `$table`");
    $cols = []; while ($r=$stmt2->fetch()) $cols[] = $r['Field'];
    $geom = detectGeometryCols($cols);
    $features = [];
    foreach ($rows as $row) {
      $id = isset($row['id']) ? $row['id'] : null;
      $geometry = null;
      if ($geom['type']==='point') {
        if ($geom['cols']['latlng']) {
          $raw = $row[ $geom['cols']['latlng'] ] ?? '';
          $parts = array_map('trim', explode(',', $raw));
          if (count($parts)>=2) {
            $lat = floatval($parts[0]); $lng = floatval($parts[1]);
            $geometry = ['type'=>'Point','coordinates'=>[$lng,$lat]];
          }
        } else {
          $latc = $geom['cols']['lat']; $lngc = $geom['cols']['lng'];
          if (isset($row[$latc]) && isset($row[$lngc])) {
            $lat = floatval($row[$latc]); $lng = floatval($row[$lngc]);
            $geometry = ['type'=>'Point','coordinates'=>[$lng,$lat]];
          }
        }
      } elseif ($geom['type']==='polyline' || $geom['type']==='polygon') {
        $encCol = $geom['cols']['enc'] ?? null;
        $geometry = ['type'=> $geom['type']==='polyline' ? 'LineString' : 'Polygon', 'encoded'=> ($encCol ? ($row[$encCol] ?? '') : '')];
      }
      // properties: all non-geometry fields (including id)
      $props = $row;
      $features[] = ['id'=>$id, 'geometry'=>$geometry, 'properties'=>$props];
    }
    respond(['table'=>$table,'type'=>$geom['type'],'geomCols'=>$geom['cols'],'features'=>$features]);
  } catch (Exception $e) {
    respond(['error'=>$e->getMessage()]);
  }
}

// CREATE POINT (insert)
if ($action === 'point_create') {
  $table = validateTableName(requireParam('table'));
  $lat = isset($_REQUEST['lat']) ? $_REQUEST['lat'] : null;
  $lng = isset($_REQUEST['lng']) ? $_REQUEST['lng'] : null;
  $attributes = isset($_REQUEST['attributes']) ? json_decode($_REQUEST['attributes'], true) : [];
  if ($lat === null || $lng === null) respond(['error'=>'Missing lat/lng']);
  try {
    $stmt = $pdo->query("DESCRIBE `$table`");
    $cols = []; while ($r=$stmt->fetch()) $cols[] = $r['Field'];
    $geom = detectGeometryCols($cols);
    if ($geom['type'] !== 'point') respond(['error'=>'Table is not a point layer']);
    $toInsert = $attributes ?: [];
    if ($geom['cols']['latlng']) {
      $toInsert[$geom['cols']['latlng']] = "$lat,$lng";
    } else {
      $toInsert[$geom['cols']['lat']] = $lat;
      $toInsert[$geom['cols']['lng']] = $lng;
    }
    $validKeys = array_values(array_intersect($cols, array_keys($toInsert)));
    if (count($validKeys) === 0) respond(['error'=>'No valid columns to insert']);
    $placeholders = implode(',', array_fill(0,count($validKeys),'?'));
    $sql = "INSERT INTO `$table` (`".implode('`,`',$validKeys)."`) VALUES ($placeholders)";
    $stmt2 = $pdo->prepare($sql);
    $params = array_map(function($k) use ($toInsert){ return $toInsert[$k]; }, $validKeys);
    $stmt2->execute($params);
    respond(['ok'=>true,'id'=>$pdo->lastInsertId()]);
  } catch (Exception $e) { respond(['error'=>$e->getMessage()]); }
}

// UPDATE POINT (move)
if ($action === 'point_update') {
  $table = validateTableName(requireParam('table'));
  $id = requireParam('id');
  $lat = requireParam('lat');
  $lng = requireParam('lng');
  try {
    $stmt = $pdo->query("DESCRIBE `$table`");
    $cols = []; while ($r=$stmt->fetch()) $cols[] = $r['Field'];
    $geom = detectGeometryCols($cols);
    if ($geom['type'] !== 'point') respond(['error'=>'Table is not a point layer']);
    if ($geom['cols']['latlng']) {
      $sql="UPDATE `$table` SET `{$geom['cols']['latlng']}`=? WHERE id=?";
      $pdo->prepare($sql)->execute(["$lat,$lng",$id]);
    } else {
      $sql="UPDATE `$table` SET `{$geom['cols']['lat']}`=?, `{$geom['cols']['lng']}`=? WHERE id=?";
      $pdo->prepare($sql)->execute([$lat,$lng,$id]);
    }
    respond(['ok'=>true]);
  } catch (Exception $e) { respond(['error'=>$e->getMessage()]); }
}

// CREATE PATH (polyline/polygon)
if ($action === 'path_create') {
  $table = validateTableName(requireParam('table'));
  $encoded = requireParam('encoded');
  $attributes = isset($_REQUEST['attributes']) ? json_decode($_REQUEST['attributes'], true) : [];
  try {
    $stmt = $pdo->query("DESCRIBE `$table`");
    $cols = []; while ($r=$stmt->fetch()) $cols[] = $r['Field'];
    $geom = detectGeometryCols($cols);
    if (!in_array($geom['type'], ['polyline','polygon'])) respond(['error'=>'Table not a path layer']);
    $encCol = $geom['cols']['enc'];
    $toInsert = $attributes ?: [];
    $toInsert[$encCol] = $encoded;
    $validKeys = array_values(array_intersect($cols, array_keys($toInsert)));
    if (!in_array($encCol, $validKeys)) respond(['error'=>"Missing geometry column $encCol"]);
    $placeholders = implode(',', array_fill(0,count($validKeys),'?'));
    $sql = "INSERT INTO `$table` (`".implode('`,`',$validKeys)."`) VALUES ($placeholders)";
    $stmt2 = $pdo->prepare($sql);
    $params = array_map(function($k) use ($toInsert){ return $toInsert[$k]; }, $validKeys);
    $stmt2->execute($params);
    respond(['ok'=>true,'id'=>$pdo->lastInsertId()]);
  } catch (Exception $e) { respond(['error'=>$e->getMessage()]); }
}

// UPDATE PATH (save encoded)
if ($action === 'path_update') {
  $table = validateTableName(requireParam('table'));
  $id = requireParam('id');
  $encoded = requireParam('encoded');
  try {
    $stmt = $pdo->query("DESCRIBE `$table`");
    $cols = []; while ($r=$stmt->fetch()) $cols[] = $r['Field'];
    $geom = detectGeometryCols($cols);
    if (!in_array($geom['type'], ['polyline','polygon'])) respond(['error'=>'Table not a path layer']);
    $encCol = $geom['cols']['enc'];
    $sql = "UPDATE `$table` SET `$encCol`=? WHERE id=?";
    $pdo->prepare($sql)->execute([$encoded,$id]);
    respond(['ok'=>true]);
  } catch (Exception $e) { respond(['error'=>$e->getMessage()]); }
}

// UPDATE ROW (attributes)
if ($action === 'row_update') {
  $table = validateTableName(requireParam('table'));
  $id = requireParam('id');
  $updates = isset($_REQUEST['updates']) ? json_decode($_REQUEST['updates'], true) : null;
  if (!is_array($updates)) respond(['error'=>'Missing updates']);
  try {
    $stmt = $pdo->query("DESCRIBE `$table`");
    $cols = []; while ($r=$stmt->fetch()) $cols[] = $r['Field'];
    // filter out id and geometry columns
    $geom = detectGeometryCols($cols);
    $allowed = array_filter($cols, function($c) use ($geom){
      $lc = strtolower($c);
      if ($lc === 'id') return false;
      if ($geom['type']==='point') {
        if ($geom['cols']['lat'] && strtolower($geom['cols']['lat'])=== $lc) return false;
        if ($geom['cols']['lng'] && strtolower($geom['cols']['lng'])=== $lc) return false;
        if ($geom['cols']['latlng'] && strtolower($geom['cols']['latlng'])=== $lc) return false;
      }
      if (($geom['type']==='polyline' || $geom['type']==='polygon') && $geom['cols']['enc'] && strtolower($geom['cols']['enc'])=== $lc) return false;
      return true;
    });
    $updatesKeys = array_intersect($allowed, array_keys($updates));
    if (count($updatesKeys)===0) respond(['ok'=>true,'changed'=>0]);
    $sets = implode(',', array_map(function($k){ return "`$k`=?"; }, $updatesKeys));
    $sql = "UPDATE `$table` SET $sets WHERE id=?";
    $params = array_map(function($k) use ($updates){ return $updates[$k]; }, $updatesKeys);
    $params[] = $id;
    $pdo->prepare($sql)->execute($params);
    respond(['ok'=>true,'changed'=>count($updatesKeys)]);
  } catch (Exception $e) { respond(['error'=>$e->getMessage()]); }
}

// DELETE ROW
if ($action === 'row_delete') {
  $table = validateTableName(requireParam('table'));
  $id = requireParam('id');
  try {
    $pdo->prepare("DELETE FROM `$table` WHERE id=?")->execute([$id]);
    respond(['ok'=>true]);
  } catch (Exception $e) { respond(['error'=>$e->getMessage()]); }
}

// CREATE TABLE (layer)
// params: table, type in {point, polyline, polygon}, optional columns JSON
if ($action === 'create_table') {
  $table = validateTableName(requireParam('table'));
  $type = requireParam('type'); // point | polyline | polygon
  $extraCols = isset($_REQUEST['columns']) ? json_decode($_REQUEST['columns'], true) : [];
  try {
    if (!in_array($type, ['point','polyline','polygon'])) respond(['error'=>'Invalid type']);
    // Basic template
    if ($type === 'point') {
      // default: id, name, lat, lng, notes
      $sql = "CREATE TABLE IF NOT EXISTS `$table` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) DEFAULT NULL,
        lat DOUBLE DEFAULT NULL,
        lng DOUBLE DEFAULT NULL,
        notes TEXT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
    } elseif ($type === 'polyline') {
      $sql = "CREATE TABLE IF NOT EXISTS `$table` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) DEFAULT NULL,
        polyline TEXT,
        notes TEXT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
    } else { // polygon
      $sql = "CREATE TABLE IF NOT EXISTS `$table` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) DEFAULT NULL,
        encoded_polygon TEXT,
        notes TEXT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
    }
    $pdo->exec($sql);
    // Add any extra columns (safe names)
    if (is_array($extraCols)) {
      foreach ($extraCols as $colName => $colDef) {
        if (!preg_match('/^[A-Za-z0-9_]+$/',$colName)) continue;
        // minimal protection: allow only basic types if provided (VARCHAR(...), INT, TEXT, DOUBLE)
        $colDefSan = strtoupper(trim($colDef));
        if (!preg_match('/^(VARCHAR\(\d+\)|INT|DOUBLE|TEXT)$/',$colDefSan)) $colDefSan = 'VARCHAR(255)';
        $pdo->exec("ALTER TABLE `$table` ADD COLUMN IF NOT EXISTS `$colName` $colDefSan");
      }
    }
    respond(['ok'=>true,'created'=>true]);
  } catch (Exception $e) { respond(['error'=>$e->getMessage()]); }
}

// DELETE TABLE
if ($action === 'delete_table') {
  $table = validateTableName(requireParam('table'));
  try {
    $pdo->exec("DROP TABLE IF EXISTS `$table`");
    respond(['ok'=>true]);
  } catch (Exception $e) { respond(['error'=>$e->getMessage()]); }
}

respond(['error'=>'Unknown action']);
