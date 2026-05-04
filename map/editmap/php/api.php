<?php
// api.php
header('Content-Type: application/json');
require_once 'db.php';

$action = $_GET['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
}

switch ($action) {
    case 'load_db_features':
        try {
            $stmt = $pdo->query("SELECT * FROM features");
            $features = [];
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $features[] = [
                    'type' => 'Feature',
                    'geometry' => [
                        'type' => $row['type'],
                        'coordinates' => json_decode($row['coordinates'], true)
                    ],
                    'properties' => [
                        'id' => $row['id'],
                        'name' => $row['name'],
                        'description' => $row['description']
                    ]
                ];
            }
            echo json_encode(['success' => true, 'features' => $features]);
        } catch(PDOException $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;

    case 'save_feature':
        $dest = $input['destination'] ?? 'db';
        $feature = $input['feature'] ?? null;
        
        if (!$feature) {
            echo json_encode(['success' => false, 'message' => 'No feature data']);
            exit;
        }

        $name = $feature['properties']['name'] ?? 'Unnamed';
        $desc = $feature['properties']['description'] ?? '';
        $type = $feature['geometry']['type'];
        $coords = json_encode($feature['geometry']['coordinates']);

        if ($dest === 'db') {
            try {
                $stmt = $pdo->prepare("INSERT INTO features (name, description, type, coordinates) VALUES (?, ?, ?, ?)");
                $stmt->execute([$name, $desc, $type, $coords]);
                echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
            } catch(PDOException $e) {
                echo json_encode(['success' => false, 'message' => $e->getMessage()]);
            }
        } else if ($dest === 'kml') {
            // Save to a new KML file on server
            $kmlContent = generateKmlFromGeoJson([$feature]);
            $filename = '../uploads/' . time() . '_' . preg_replace('/[^A-Za-z0-9\-]/', '', $name) . '.kml';
            if (!is_dir('../uploads')) mkdir('../uploads');
            file_put_contents($filename, $kmlContent);
            echo json_encode(['success' => true, 'message' => 'Saved to KML file on server', 'file' => $filename]);
        }
        break;

    case 'export_kml':
        // Expects GeoJSON FeatureCollection in POST
        $geojson = $input['geojson'] ?? null;
        if($geojson && isset($geojson['features'])) {
            $kml = generateKmlFromGeoJson($geojson['features']);
            header('Content-Type: application/vnd.google-earth.kml+xml');
            header('Content-Disposition: attachment; filename="export.kml"');
            echo $kml;
        } else {
            echo "Invalid GeoJSON";
        }
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
}

function generateKmlFromGeoJson($features) {
    $kml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    $kml .= '<kml xmlns="http://www.opengis.net/kml/2.2">' . "\n";
    $kml .= '  <Document>' . "\n";
    
    foreach ($features as $f) {
        $name = htmlspecialchars($f['properties']['name'] ?? 'Feature');
        $desc = htmlspecialchars($f['properties']['description'] ?? '');
        $type = $f['geometry']['type'];
        $coords = $f['geometry']['coordinates'];

        $kml .= "    <Placemark>\n";
        $kml .= "      <name>$name</name>\n";
        $kml .= "      <description>$desc</description>\n";
        
        if ($type === 'Point') {
            $kml .= "      <Point>\n";
            $kml .= "        <coordinates>{$coords[0]},{$coords[1]},0</coordinates>\n";
            $kml .= "      </Point>\n";
        } else if ($type === 'LineString') {
            $kml .= "      <LineString>\n";
            $kml .= "        <coordinates>\n";
            $coordStrings = [];
            foreach ($coords as $c) {
                $coordStrings[] = "          {$c[0]},{$c[1]},0";
            }
            $kml .= implode("\n", $coordStrings) . "\n";
            $kml .= "        </coordinates>\n";
            $kml .= "      </LineString>\n";
        }
        $kml .= "    </Placemark>\n";
    }
    
    $kml .= "  </Document>\n</kml>";
    return $kml;
}
?>
