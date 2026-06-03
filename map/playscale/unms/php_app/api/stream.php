<?php
// api/stream.php — proxies SSE stream from the Python agent on your PC

define('AGENT_URL', 'http://YOUR_PC_IP:8765');
define('SECRET_KEY', 'change_this_secret_key_123');

// Validate secret key
if (($_GET['key'] ?? '') !== SECRET_KEY) {
    http_response_code(403);
    exit('Forbidden');
}

// SSE headers
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('X-Accel-Buffering: no');
header('Connection: keep-alive');

// Disable output buffering completely
if (ob_get_level()) ob_end_clean();
ini_set('output_buffering', 'off');
ini_set('zlib.output_compression', false);

function send_event($data) {
    echo "data: {$data}\n\n";
    flush();
}

// Call the Python agent /run endpoint and stream its response line by line
$url = AGENT_URL . '/run?key=' . SECRET_KEY;

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, false);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 300);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);

$buffer = '';

curl_setopt($ch, CURLOPT_WRITEFUNCTION, function($ch, $chunk) use (&$buffer) {
    $buffer .= $chunk;

    // Process complete lines from buffer
    while (($pos = strpos($buffer, "\n")) !== false) {
        $line = substr($buffer, 0, $pos);
        $buffer = substr($buffer, $pos + 1);

        $line = trim($line);

        // SSE lines from Python agent look like: "data: some text"
        if (strpos($line, 'data: ') === 0) {
            $text = substr($line, 6); // strip "data: " prefix
            echo "data: {$text}\n\n";
            flush();
        }
    }
    return strlen($chunk);
});

$result = curl_exec($ch);

if (curl_errno($ch)) {
    send_event('[ERROR] Could not connect to agent: ' . curl_error($ch));
}

curl_close($ch);

// Flush any remaining buffer
if (!empty(trim($buffer))) {
    send_event(trim($buffer));
}

send_event('__END__');
