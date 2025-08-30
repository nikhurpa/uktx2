<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'db_connection.php';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Get fault coordinates from request
    $fault_lat = isset($_GET['lat']) ? floatval($_GET['lat']) : null;
    $fault_lng = isset($_GET['lng']) ? floatval($_GET['lng']) : null;
    $radius_km = isset($_GET['radius']) ? floatval($_GET['radius']) : 10; // Default 10km
    $kmz_filter = isset($_GET['kmz_file']) ? $_GET['kmz_file'] : null;

    if ($fault_lat === null || $fault_lng === null) {
        echo json_encode([
            'success' => false,
            'message' => 'Fault coordinates (lat, lng) are required'
        ]);
        exit;
    }
    
    // Convert km to degrees (approximate)
    // 1 degree latitude ≈ 111 km
    // 1 degree longitude ≈ 111 * cos(latitude) km
    $lat_degree_radius = $radius_km / 111.0;
    $lng_degree_radius = $radius_km / (111.0 * cos(deg2rad($fault_lat)));
    
    // Calculate bounding box
    $min_lat = $fault_lat - $lat_degree_radius;
    $max_lat = $fault_lat + $lat_degree_radius;
    $min_lng = $fault_lng - $lng_degree_radius;
    $max_lng = $fault_lng + $lng_degree_radius;
    
    $filequery ="";

    if ($kmz_filter) {
        $filequery = " AND ( kmz_filename IN ($kmz_filter) ) ";
        // $params[] = "( " .$kmz_filter . " )";
    }

    // Query polylines that intersect with the bounding box
    $sql = "
        SELECT 
            id,
            kmz_filename,
            polyline_name,
            polyline_description,
            google_encoded_polyline,
            coordinates_count,
            start_lat,
            start_lng,
            end_lat,
            end_lng,
            bounding_box,
            created_at
        FROM polylines 
        WHERE (
            -- Check if start point is within bounding box
            (start_lat BETWEEN ? AND ? AND start_lng BETWEEN ? AND ?)
            OR 
            -- Check if end point is within bounding box
            (end_lat BETWEEN ? AND ? AND end_lng BETWEEN ? AND ?)
            OR
            -- Check if polyline crosses the bounding box
            (
                (start_lat < ? AND end_lat > ?) OR (start_lat > ? AND end_lat < ?)
            ) AND (
                (start_lng < ? AND end_lng > ?) OR (start_lng > ? AND end_lng < ?)
            ) $filequery
        )
        ORDER BY 
            -- Prioritize polylines with start/end points closer to fault
            LEAST(
                SQRT(POW(start_lat - ?, 2) + POW(start_lng - ?, 2)),
                SQRT(POW(end_lat - ?, 2) + POW(end_lng - ?, 2))
            ) ASC
        LIMIT 900
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $min_lat, $max_lat, $min_lng, $max_lng,  // Start point bounds
        $min_lat, $max_lat, $min_lng, $max_lng,  // End point bounds
        $min_lat, $max_lat, $min_lat, $max_lat,  // Latitude crossing
        $min_lng, $max_lng, $min_lng, $max_lng,  // Longitude crossing
        $fault_lat, $fault_lng,  // Distance calculation for start point
        $fault_lat, $fault_lng   // Distance calculation for end point
    ]);
    
    $polylines = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Filter results to ensure they're actually within the specified radius
    $filtered_polylines = [];
    foreach ($polylines as $polyline) {
        $start_distance = calculateDistance(
            $fault_lat, $fault_lng, 
            $polyline['start_lat'], $polyline['start_lng']
        );
        $end_distance = calculateDistance(
            $fault_lat, $fault_lng, 
            $polyline['end_lat'], $polyline['end_lng']
        );
        
        // If either start or end point is within radius, include the polyline
        if ($start_distance <= $radius_km || $end_distance <= $radius_km) {
            $polyline['start_distance_km'] = round($start_distance, 2);
            $polyline['end_distance_km'] = round($end_distance, 2);
            $polyline['min_distance_km'] = min($start_distance, $end_distance);
            $filtered_polylines[] = $polyline;
        }
    }
    
    // Sort by minimum distance
    usort($filtered_polylines, function($a, $b) {
        return $a['min_distance_km'] <=> $b['min_distance_km'];
    });
    
    echo json_encode([
        'success' => true,
        'polylines' => $filtered_polylines,
        'count' => count($filtered_polylines),
        'search_center' => [
            'lat' => $fault_lat,
            'lng' => $fault_lng
        ],
        'search_radius_km' => $radius_km,
        'sql'=> $sql,
        'bounding_box' => [
            'min_lat' => $min_lat,
            'max_lat' => $max_lat,
            'min_lng' => $min_lng,
            'max_lng' => $max_lng
        ]
    ]);
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in kilometers
 */
function calculateDistance($lat1, $lng1, $lat2, $lng2) {
    $earth_radius = 6371; // Earth's radius in kilometers
    
    $lat_diff = deg2rad($lat2 - $lat1);
    $lng_diff = deg2rad($lng2 - $lng1);
    
    $a = sin($lat_diff / 2) * sin($lat_diff / 2) +
         cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
         sin($lng_diff / 2) * sin($lng_diff / 2);
    
    $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
    
    return $earth_radius * $c;
}
?>










