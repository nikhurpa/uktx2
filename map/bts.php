<?php
$api_url = "http://210.212.83.249/node-map/get_nodes.php"; // change this to actual API URL

$response = file_get_contents($api_url);

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

echo $response;