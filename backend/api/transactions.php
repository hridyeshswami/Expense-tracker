<?php
// ==========================================================
// Transactions API (Income & Expense Management)
// ==========================================================

require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$userId = intval($_GET['user_id'] ?? 1);

switch ($method) {
    case 'GET':
        // Retrieve categories if requested
        if (isset($_GET['get_categories'])) {
            $stmt = $pdo->prepare("SELECT * FROM categories ORDER BY type ASC, name ASC");
            $stmt->execute();
            $cats = $stmt->fetchAll();
            sendJsonResponse('success', 'Categories retrieved', $cats);
        }

        // Filter parameters
        $type = $_GET['type'] ?? '';
        $categoryId = isset($_GET['category_id']) && $_GET['category_id'] !== '' ? intval($_GET['category_id']) : null;
        $isNeed = isset($_GET['is_need']) && $_GET['is_need'] !== '' ? intval($_GET['is_need']) : null;
        $paymentMethod = $_GET['payment_method'] ?? '';
        $search = trim($_GET['search'] ?? '');
        $month = $_GET['month'] ?? ''; // e.g. 2026-09

        $query = "SELECT t.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color
                  FROM transactions t
                  JOIN categories c ON t.category_id = c.id
                  WHERE t.user_id = :user_id";
        $params = ['user_id' => $userId];

        if (!empty($type)) {
            $query .= " AND t.type = :type";
            $params['type'] = $type;
        }
        if ($categoryId !== null) {
            $query .= " AND t.category_id = :category_id";
            $params['category_id'] = $categoryId;
        }
        if ($isNeed !== null) {
            $query .= " AND t.is_need = :is_need";
            $params['is_need'] = $isNeed;
        }
        if (!empty($paymentMethod)) {
            $query .= " AND t.payment_method = :payment_method";
            $params['payment_method'] = $paymentMethod;
        }
        if (!empty($month)) {
            $query .= " AND DATE_FORMAT(t.transaction_date, '%Y-%m') = :month";
            $params['month'] = $month;
        }
        if (!empty($search)) {
            $query .= " AND (t.note LIKE :search OR c.name LIKE :search2)";
            $params['search'] = "%{$search}%";
            $params['search2'] = "%{$search}%";
        }

        $query .= " ORDER BY t.transaction_date DESC, t.id DESC";

        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $transactions = $stmt->fetchAll();

        sendJsonResponse('success', 'Transactions retrieved', $transactions);
        break;

    case 'POST':
        $input = getJsonInput();

        $amount = floatval($input['amount'] ?? 0);
        $categoryId = intval($input['category_id'] ?? 0);
        $type = in_array($input['type'] ?? '', ['income', 'expense']) ? $input['type'] : 'expense';
        $isNeed = isset($input['is_need']) ? intval($input['is_need']) : 1;
        $paymentMethod = in_array($input['payment_method'] ?? '', ['UPI', 'Cash', 'Card', 'Net Banking']) ? $input['payment_method'] : 'UPI';
        $note = trim($input['note'] ?? '');
        $date = !empty($input['transaction_date']) ? $input['transaction_date'] : date('Y-m-d');

        if ($amount <= 0 || $categoryId <= 0) {
            sendJsonResponse('error', 'Valid amount and category are required', null, 400);
        }

        $stmt = $pdo->prepare("INSERT INTO transactions (user_id, category_id, type, amount, is_need, payment_method, note, transaction_date)
                               VALUES (:user_id, :category_id, :type, :amount, :is_need, :payment_method, :note, :date)");
        $stmt->execute([
            'user_id' => $userId,
            'category_id' => $categoryId,
            'type' => $type,
            'amount' => $amount,
            'is_need' => $isNeed,
            'payment_method' => $paymentMethod,
            'note' => $note,
            'date' => $date
        ]);

        $newId = $pdo->lastInsertId();
        sendJsonResponse('success', 'Transaction recorded successfully', ['id' => $newId], 201);
        break;

    case 'DELETE':
        $id = intval($_GET['id'] ?? 0);
        if ($id <= 0) {
            sendJsonResponse('error', 'Valid transaction ID is required', null, 400);
        }

        $stmt = $pdo->prepare("DELETE FROM transactions WHERE id = :id AND user_id = :user_id");
        $stmt->execute(['id' => $id, 'user_id' => $userId]);

        if ($stmt->rowCount() > 0) {
            sendJsonResponse('success', 'Transaction deleted successfully');
        } else {
            sendJsonResponse('error', 'Transaction not found or unauthorized', null, 404);
        }
        break;

    default:
        sendJsonResponse('error', 'Method not supported', null, 405);
}
?>
