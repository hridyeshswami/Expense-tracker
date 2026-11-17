<?php
// ==========================================================
// Authentication & User Profile API Endpoint
// ==========================================================

require_once __DIR__ . '/../config/db.php';

$action = $_GET['action'] ?? 'profile';
$input = getJsonInput();

switch ($action) {
    case 'login':
        $email = trim($input['email'] ?? '');
        $password = trim($input['password'] ?? '');

        if (empty($email) || empty($password)) {
            sendJsonResponse('error', 'Email and password are required', null, 400);
        }

        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = :email LIMIT 1");
        $stmt->execute(['email' => $email]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password_hash'])) {
            unset($user['password_hash']);
            sendJsonResponse('success', 'Login successful', $user);
        } else {
            sendJsonResponse('error', 'Invalid email or password credentials', null, 401);
        }
        break;

    case 'register':
        $name = trim($input['name'] ?? '');
        $email = trim($input['email'] ?? '');
        $password = trim($input['password'] ?? '');

        if (empty($name) || empty($email) || empty($password)) {
            sendJsonResponse('error', 'All fields (Name, Email, Password) are required', null, 400);
        }

        // Check if email already registered
        $checkStmt = $pdo->prepare("SELECT id FROM users WHERE email = :email");
        $checkStmt->execute(['email' => $email]);
        if ($checkStmt->fetch()) {
            sendJsonResponse('error', 'Email is already registered. Please log in.', null, 409);
        }

        $passwordHash = password_hash($password, PASSWORD_BCRYPT);
        $insertStmt = $pdo->prepare("INSERT INTO users (name, email, password_hash, monthly_income, overall_budget, currency_symbol, student_mode) VALUES (:name, :email, :password_hash, 0.00, 0.00, '₹', 1)");
        $insertStmt->execute([
            'name' => $name,
            'email' => $email,
            'password_hash' => $passwordHash
        ]);

        $newUserId = $pdo->lastInsertId();
        $userStmt = $pdo->prepare("SELECT id, name, email, monthly_income, overall_budget, currency_symbol, student_mode FROM users WHERE id = :id");
        $userStmt->execute(['id' => $newUserId]);
        $newUser = $userStmt->fetch();

        sendJsonResponse('success', 'Student account registered successfully', $newUser, 201);
        break;

    case 'profile':
        $userId = intval($_GET['user_id'] ?? 1);
        $stmt = $pdo->prepare("SELECT id, name, email, monthly_income, overall_budget, currency_symbol, student_mode, created_at FROM users WHERE id = :id");
        $stmt->execute(['id' => $userId]);
        $user = $stmt->fetch();

        if (!$user) {
            sendJsonResponse('error', 'User not found', null, 404);
        }
        sendJsonResponse('success', 'Profile retrieved', $user);
        break;

    case 'update_profile':
        $userId = intval($input['user_id'] ?? 1);
        $monthlyIncome = floatval($input['monthly_income'] ?? 15000);
        $overallBudget = floatval($input['overall_budget'] ?? 12000);
        $studentMode = isset($input['student_mode']) ? intval($input['student_mode']) : 1;
        $currencySymbol = trim($input['currency_symbol'] ?? '₹');

        $stmt = $pdo->prepare("UPDATE users SET monthly_income = :income, overall_budget = :budget, student_mode = :smode, currency_symbol = :curr WHERE id = :id");
        $stmt->execute([
            'income' => $monthlyIncome,
            'budget' => $overallBudget,
            'smode' => $studentMode,
            'curr' => $currencySymbol,
            'id' => $userId
        ]);

        sendJsonResponse('success', 'Profile updated successfully', [
            'monthly_income' => $monthlyIncome,
            'overall_budget' => $overallBudget,
            'student_mode' => $studentMode,
            'currency_symbol' => $currencySymbol
        ]);
        break;

    default:
        sendJsonResponse('error', 'Invalid action specified', null, 400);
}
?>
