<?php
// ==========================================================
// Database Configuration & Helper Methods (PDO)
// ==========================================================

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Handle CORS preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$db_host = "localhost";
$db_name = "student_expense_tracker";
$db_user = "root";
$db_pass = "";

try {
    $pdo = new PDO("mysql:host={$db_host};dbname={$db_name};charset=utf8mb4", $db_user, $db_pass, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Database connection failed. Please ensure MySQL is running in XAMPP: " . $e->getMessage()
    ]);
    exit();
}

/**
 * Standard JSON response helper
 */
function sendJsonResponse($status, $message, $data = null, $httpCode = 200) {
    http_response_code($httpCode);
    echo json_encode([
        "status" => $status,
        "message" => $message,
        "data" => $data,
        "timestamp" => date('Y-m-d H:i:s')
    ]);
    exit();
}

/**
 * Get JSON body data from request
 */
function getJsonInput() {
    $rawInput = file_get_contents('php://input');
    return json_decode($rawInput, true) ?? [];
}
?>
