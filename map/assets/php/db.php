<?php
// db.php - update with your DB credentials
$DB_HOST = 'localhost';
$DB_NAME = 'TRANSMISSION1';
$DB_USER = 'uktx';
$DB_PASS = 'uktx123';
$DB_CHARSET = 'utf8mb4';

$host = 'localhost';
$dbname = 'TRANSMISSION1';
$username = 'uktx';
$password = 'uktx123';


$dsn = "mysql:host=$DB_HOST;dbname=$DB_NAME;charset=$DB_CHARSET";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
];

function getPDO() {
    global $dsn, $DB_USER, $DB_PASS, $options;
    static $pdo = null;
    if ($pdo === null) $pdo = new PDO($dsn, $DB_USER, $DB_PASS, $options);
    return $pdo;
}
