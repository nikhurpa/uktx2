<?php
// api/stop.php — forwards stop request to Python agent

define('AGENT_URL', 'http://YOUR_PC_IP:8765');
define('SECRET_KEY', 'change_this_secret_key_123');

header('Content-Type: application/json');

if (($_GET['key'] ?? '') !== SECRET_KEY) {
    http_response_code(403);
    exit('{"error":"Forbidden"}');
}

$ch = curl_init(AGENT_URL . '/stop?key=' . SECRET_KEY);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 5);
$response = curl_exec($ch);
curl_close($ch);

echo $response ?: '{"status":"ok"}';
