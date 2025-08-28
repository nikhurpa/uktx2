-- Example SQL queries for the polylines table with start/end coordinates

-- 1. Find all polylines that start near a specific location (within 0.01 degrees)
SELECT * FROM polylines 
WHERE ABS(start_lat - 40.7128) < 0.01 
  AND ABS(start_lng - (-74.0060)) < 0.01;

-- 2. Find all polylines that end near a specific location
SELECT * FROM polylines 
WHERE ABS(end_lat - 34.0522) < 0.01 
  AND ABS(end_lng - (-118.2437)) < 0.01;

-- 3. Find polylines that start in one area and end in another
SELECT * FROM polylines 
WHERE start_lat BETWEEN 40.0 AND 41.0 
  AND start_lng BETWEEN -75.0 AND -74.0
  AND end_lat BETWEEN 34.0 AND 35.0 
  AND end_lng BETWEEN -119.0 AND -118.0;

-- 4. Calculate the straight-line distance between start and end points (in degrees)
SELECT 
    polyline_name,
    coordinates_count,
    SQRT(POW(end_lat - start_lat, 2) + POW(end_lng - start_lng, 2)) as straight_line_distance_degrees
FROM polylines 
ORDER BY straight_line_distance_degrees DESC;

-- 5. Find polylines with the most coordinates (longest routes)
SELECT 
    polyline_name,
    kmz_filename,
    coordinates_count,
    start_lat, start_lng,
    end_lat, end_lng
FROM polylines 
ORDER BY coordinates_count DESC 
LIMIT 10;

-- 6. Find polylines from a specific KMZ file with their endpoints
SELECT 
    polyline_name,
    polyline_description,
    start_lat, start_lng,
    end_lat, end_lng,
    coordinates_count
FROM polylines 
WHERE kmz_filename = 'your_file.kmz'
ORDER BY polyline_name;

-- 7. Find polylines created within a date range with start/end info
SELECT 
    polyline_name,
    kmz_filename,
    start_lat, start_lng,
    end_lat, end_lng,
    created_at
FROM polylines 
WHERE created_at BETWEEN '2024-01-01' AND '2024-12-31'
ORDER BY created_at DESC;

-- 8. Count polylines by coordinate count ranges
SELECT 
    CASE 
        WHEN coordinates_count < 100 THEN 'Short (< 100 points)'
        WHEN coordinates_count < 1000 THEN 'Medium (100-999 points)'
        WHEN coordinates_count < 10000 THEN 'Long (1000-9999 points)'
        ELSE 'Very Long (10000+ points)'
    END as polyline_length,
    COUNT(*) as count
FROM polylines 
GROUP BY 
    CASE 
        WHEN coordinates_count < 100 THEN 'Short (< 100 points)'
        WHEN coordinates_count < 1000 THEN 'Medium (100-999 points)'
        WHEN coordinates_count < 10000 THEN 'Long (1000-9999 points)'
        ELSE 'Very Long (10000+ points)'
    END
ORDER BY count DESC;

-- 9. Find polylines that cross a specific longitude line
SELECT * FROM polylines 
WHERE (start_lng < -74.0 AND end_lng > -74.0)
   OR (start_lng > -74.0 AND end_lng < -74.0);

-- 10. Find polylines that cross a specific latitude line
SELECT * FROM polylines 
WHERE (start_lat < 40.0 AND end_lat > 40.0)
   OR (start_lat > 40.0 AND end_lat < 40.0);

-- 11. Get bounding box information for all polylines
SELECT 
    polyline_name,
    kmz_filename,
    start_lat, start_lng,
    end_lat, end_lng,
    bounding_box,
    coordinates_count
FROM polylines 
ORDER BY coordinates_count DESC;

-- 12. Find polylines with similar start points (clustering)
SELECT 
    p1.polyline_name as polyline1,
    p2.polyline_name as polyline2,
    p1.kmz_filename as file1,
    p2.kmz_filename as file2,
    SQRT(POW(p1.start_lat - p2.start_lat, 2) + POW(p1.start_lng - p2.start_lng, 2)) as start_distance
FROM polylines p1
JOIN polylines p2 ON p1.id < p2.id
WHERE SQRT(POW(p1.start_lat - p2.start_lat, 2) + POW(p1.start_lng - p2.start_lng, 2)) < 0.01
ORDER BY start_distance;



