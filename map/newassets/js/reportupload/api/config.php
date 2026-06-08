<?php
$DB_HOST='srv1493.hstgr.io';
$DB_NAME='u642970219_TRANSMISSION1';
$DB_USER='u642970219_uktx';
$DB_PASS='Gmcfa@01'; // Default WAMP password

// $host = 'srv1493.hstgr.io';
// $user = 'u642970219_uktx';
// $pass = 'Gmcfa@01'; // Default WAMP password
// $dbname = 'u642970219_TRANSMISSION1';

$pdo=new PDO(
'mysql:host='.$DB_HOST.';dbname='.$DB_NAME.';charset=utf8mb4',
$DB_USER,
$DB_PASS,
[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]
);
