<?php
// Add this temporarily to debug
// echo json_encode([
//     'curl_enabled'     => function_exists('curl_init'),
//     'allow_url_fopen'  => ini_get('allow_url_fopen'),
//     'php_version'      => PHP_VERSION,
//     'server_ip'        => $_SERVER['SERVER_ADDR'] ?? 'unknown'
// ]);
// exit();



header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

$input   = json_decode(file_get_contents('php://input'), true);
$api_url = $input['url'] ?? '';
$method  = strtoupper($input['method'] ?? 'GET');
$headers = $input['headers'] ?? [];
$body    = $input['body'] ?? null;

if (!$api_url) { echo json_encode(['error' => 'No URL provided']); exit(); }

// ── Try direct file include first (same server = fastest, no HTTP overhead)
// If bts.php is on same server, you can also do:
// $result = file_get_contents('/var/www/html/node-map/bts.php');

$ch = curl_init($api_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 15);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

// ── KEY FIX: spoof headers to look like a real browser on same server ──
$forward_headers = [
    'Content-Type: application/json',
    'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept: application/json, text/plain, */*',
    'Accept-Language: en-US,en;q=0.9',
    'Connection: keep-alive',
    // Make it look like request came from same server
    'Host: localhost',
    'Referer: http://localhost/',
    'X-Requested-With: XMLHttpRequest',
];

// Forward any cookies (session auth)
if (!empty($_SERVER['HTTP_COOKIE'])) {
    curl_setopt($ch, CURLOPT_COOKIE, $_SERVER['HTTP_COOKIE']);
    $forward_headers[] = 'Cookie: ' . $_SERVER['HTTP_COOKIE'];
}

// Merge any custom headers from request
foreach ($headers as $k => $v) {
    $forward_headers[] = "$k: $v";
}

curl_setopt($ch, CURLOPT_HTTPHEADER, $forward_headers);

if ($body && !in_array($method, ['GET', 'DELETE'])) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
}

$response  = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error     = curl_error($ch);
$info      = curl_getinfo($ch);
curl_close($ch);

if ($error) {
    http_response_code(500);
    echo json_encode(['error' => $error, 'debug' => $info]);
    exit();
}

// ── If still 403, return debug info ──
if ($http_code == 403 || $http_code == 401) {
    echo json_encode([
        'error'          => 'Permission denied by API server',
        'http_code'      => $http_code,
        'url_called'     => $api_url,
        'tip'            => 'Try using the internal path like http://127.0.0.1/node-map/bts.php instead of hostname'
    ]);
    exit();
}

http_response_code($http_code);
echo $response;


// // <?php
// header("Content-Type: application/json");
// header("Access-Control-Allow-Origin: *");
// header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
// header("Access-Control-Allow-Headers: Content-Type");

// if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

// $input   = json_decode(file_get_contents('php://input'), true);
// $api_url = $input['url']     ?? '';
// $method  = strtoupper($input['method']  ?? 'GET');
// $headers = $input['headers'] ?? [];
// $body    = $input['body']    ?? null;

// if (!$api_url) { echo json_encode(['error' => 'No URL provided']); exit(); }

// $ch = curl_init($api_url);
// curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
// curl_setopt($ch, CURLOPT_TIMEOUT, 15);
// curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
// curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
// curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);   // ← follow redirects

// // Forward cookies from browser to API
// if (!empty($_SERVER['HTTP_COOKIE'])) {
//     curl_setopt($ch, CURLOPT_COOKIE, $_SERVER['HTTP_COOKIE']);
// }

// // Forward real browser headers so API thinks it's a browser request
// curl_setopt($ch, CURLOPT_HTTPHEADER, array_merge([
//     'Content-Type: application/json',
//     'User-Agent: ' . ($_SERVER['HTTP_USER_AGENT'] ?? 'Mozilla/5.0'),
//     'Referer: ' . ($_SERVER['HTTP_REFERER'] ?? $api_url),
//     'X-Forwarded-For: ' . ($_SERVER['REMOTE_ADDR'] ?? ''),
// ], array_map(fn($k,$v) => "$k: $v", array_keys($headers), array_values($headers))));

// if ($body && !in_array($method, ['GET', 'DELETE'])) {
//     curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
// }

// $response  = curl_exec($ch);
// $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
// $error     = curl_error($ch);
// curl_close($ch);

// if ($error) { http_response_code(500); echo json_encode(['error' => $error]); exit(); }

// http_response_code($http_code);
// echo $response;





// header("Content-Type: application/json");
// header("Access-Control-Allow-Origin: *");
// header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
// header("Access-Control-Allow-Headers: Content-Type");

// if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
//     http_response_code(200);
//     exit();
// }

// $input   = json_decode(file_get_contents('php://input'), true);
// $api_url = $input['url']     ?? '';
// $method  = strtoupper($input['method']  ?? 'GET');
// $headers = $input['headers'] ?? [];
// $body    = $input['body']    ?? null;

// if (!$api_url) {
//     echo json_encode(['error' => 'No URL provided']);
//     exit();
// }

// $ch = curl_init($api_url);
// curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
// curl_setopt($ch, CURLOPT_TIMEOUT, 15);
// curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
// curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

// $hdrs = ['Content-Type: application/json'];
// foreach ($headers as $k => $v) {
//     $hdrs[] = "$k: $v";
// }
// curl_setopt($ch, CURLOPT_HTTPHEADER, $hdrs);

// if ($body && !in_array($method, ['GET', 'DELETE'])) {
//     curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
// }

// $response  = curl_exec($ch);
// $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
// $curl_error = curl_error($ch);
// curl_close($ch);

// if ($curl_error) {
//     http_response_code(500);
//     echo json_encode(['error' => $curl_error]);
//     exit();
// }

// http_response_code($http_code);
// echo $response;
?>
