<?php
$DB_HOST='xxx';
$DB_NAME='xxxx';
$DB_USER='xxxx';
$DB_PASS='xxxx'; // Default WAMP password



$pdo=new PDO(
'mysql:host='.$DB_HOST.';dbname='.$DB_NAME.';charset=utf8mb4',
$DB_USER,
$DB_PASS,
[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]
);
