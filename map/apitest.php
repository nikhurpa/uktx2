<?php

// ── CONFIGURE HERE ──────────────────────────────────────────
// $api_url = "http://10.202.212.139/pls/apex/f";   // API endpoint
$api_url = "http://10.132.37.10:8081/api/glance-details";   // API endpoint

$method  = "POST";  

// ── Usage ──
// $queryString = "p=101:519:91807162505544:FLOW_PPR_OUTPUT_R162801326805495584_pg_R_162801326805495584:NO&pg_max_rows=3000&pg_min_row=1&pg_rows_fetched=3000";
//                101:519:91807162505544:FLOW_PPR_OUTPUT_R162801326805495584_pg_R_162801326805495584:NO
$queryString = "element=TIP-OLT&circle=UTTRANCHAL&ba=DEHRADUN&ssa=ALL";
$params = queryStringToParams($queryString) ;  // GET or POST

// echo json_encode($params);
// $params  = [                                                 // parameters
//     "p"              => "101:519:91807162505544:FLOW_PPR_OUTPUT_R162801326805495584_pg_R_162801326805495584:NO",
//                          101:519:91807162505544:FLOW_PPR_OUTPUT_R162801326805495584_pg_R_162801326805495584:NO
//     "pg_max_rows"    => "15",
//     "pg_min_row"     => "1",
//     "pg_rows_fetched"=> "15",
// ];

$cookie  = "teevra_session=eyJpdiI6IkhSVENuSU5qOG56ZW9UTVBhWVpReUE9PSIsInZhbHVlIjoiWkFFYnFpY3NlamRHZHl1MzJJeGJxMzRvM2pFWjRhQTRiMUdCclRTR3l0OWFFWXFwZkFCMkJ6RHZqUHNjcCtMRzhSRnVscTdFNUY3UElWR3lJVXlia2htWCtaTzNVUGRHY0pKZHRiWXQxZkI0ZytmUTM5cEZhUzY1cjRzeVR1SUMiLCJtYWMiOiJmZTY4MmMxMTgyYmQzMGM2NWMwMDA2NGQzNmI2ZGM5YzBkNGI5MzM1YjEzNGI4YmYwODJiMThhNjE1Y2NlOGRiIiwidGFnIjoiIn0%3D; expires=Wed, 27 May 2026 09:58:17 GMT; Max-Age=7200; path=/; httponly; samesite=lax";  // paste your cookie here
// ────────────────────────────────────────────────────────────


// Build URL for GET
$final_url = $api_url;
if (strtoupper($method) === "GET" && !empty($params)) {
    $final_url .= "?" . http_build_query($params);
}

// cURL request
$ch = curl_init($final_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, strtoupper($method));
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

// Parse origin from URL
$parsed = parse_url($api_url);
$origin = $parsed['scheme'] . '://' . $parsed['host'] . (isset($parsed['port']) ? ':' . $parsed['port'] : '');

curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept: application/json, text/html, */*",
    "X-Requested-With: XMLHttpRequest",
    "Origin: " . $origin,
    "Referer: " . $origin . "/",
    "Cookie: " . $cookie,
]);

// POST body
if (strtoupper($method) === "POST" && !empty($params)) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
}

$response  = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error     = curl_error($ch);
curl_close($ch);

// Output
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

if ($error) {
    echo json_encode(["error" => $error]);
} else {
    echo $response;
}


function queryStringToParams($queryString) {
    $params = [];
    parse_str($queryString, $params);
    return $params;
}


?>
