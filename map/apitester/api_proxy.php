<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

$input   = json_decode(file_get_contents('php://input'), true);
$api_url = $input['url']     ?? '';
$method  = strtoupper($input['method'] ?? 'GET');
$headers = $input['headers'] ?? [];
$body    = $input['body']    ?? null;
$cookie  = $input['cookie']  ?? '';

if (!$api_url) { echo json_encode(['error' => 'No URL provided']); exit(); }

$ch = curl_init($api_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_HEADER, false);

// Build headers
$fwd = [
    'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept: application/json, text/html, */*',
    'Accept-Language: en-US,en;q=0.9',
    'X-Requested-With: XMLHttpRequest',
    'Connection: keep-alive',
];

// Referer / Origin from the API host
$parsed = parse_url($api_url);
$origin = $parsed['scheme'] . '://' . $parsed['host'] . (isset($parsed['port']) ? ':' . $parsed['port'] : '');
$fwd[] = 'Origin: ' . $origin;
$fwd[] = 'Referer: ' . $origin . '/';

// Cookies
if (!empty($cookie)) {
    $fwd[] = 'Cookie: ' . $cookie;
    curl_setopt($ch, CURLOPT_COOKIE, $cookie);
}

// Content-Type for body
if ($body && !in_array($method, ['GET', 'DELETE'])) {
    $decoded = json_decode($body, true);
    if (json_last_error() === JSON_ERROR_NONE) {
        $fwd[] = 'Content-Type: application/json';
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    } else {
        $fwd[] = 'Content-Type: application/x-www-form-urlencoded';
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }
}

// Custom headers from UI (override defaults)
foreach ($headers as $k => $v) {
    if (!empty($k)) $fwd[] = "$k: $v";
}

curl_setopt($ch, CURLOPT_HTTPHEADER, $fwd);

$response  = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error     = curl_error($ch);
curl_close($ch);

if ($error) {
    http_response_code(500);
    echo json_encode(['error' => $error]);
    exit();
}

http_response_code($http_code);
echo $response;
?>
