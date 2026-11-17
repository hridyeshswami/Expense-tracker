<?php
// ==========================================================
// Budgets API with Budget Health Indicator (Slide 6, 14, 15)
// Under Control (< 70%), Getting Close (70-95%), Exceeded (> 95%)
// ==========================================================

require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$userId = intval($_GET['user_id'] ?? 1);
$currentMonth = $_GET['month'] ?? date('Y-m');

switch ($method) {
    case 'GET':
        // Fetch user's category budgets for the specified month
        $stmt = $pdo->prepare("SELECT b.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color
                               FROM budgets b
                               JOIN categories c ON b.category_id = c.id
                               WHERE b.user_id = :user_id AND b.month_year = :month
                               ORDER BY b.allocated_amount DESC");
        $stmt->execute(['user_id' => $userId, 'month' => $currentMonth]);
        $budgets = $stmt->fetchAll();

        // Calculate actual spending for each budgeted category in this month
        foreach ($budgets as &$b) {
            $catId = $b['category_id'];
            $spendStmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) AS total_spent 
                                       FROM transactions 
                                       WHERE user_id = :user_id 
                                         AND category_id = :cat_id 
                                         AND type = 'expense' 
                                         AND DATE_FORMAT(transaction_date, '%Y-%m') = :month");
            $spendStmt->execute(['user_id' => $userId, 'cat_id' => $catId, 'month' => $currentMonth]);
            $spent = floatval($spendStmt->fetchColumn());

            $allocated = floatval($b['allocated_amount']);
            $remaining = max(0, $allocated - $spent);
            $percentage = $allocated > 0 ? round(($spent / $allocated) * 100, 1) : 0;

            // Budget Health Indicator status (from Research PPTX)
            if ($percentage > 95) {
                $status = 'Exceeded';
                $statusClass = 'danger';
            } elseif ($percentage >= 70) {
                $status = 'Getting Close';
                $statusClass = 'warning';
            } else {
                $status = 'Under Control';
                $statusClass = 'success';
            }

            $b['spent_amount'] = $spent;
            $b['remaining_amount'] = $remaining;
            $b['percentage'] = $percentage;
            $b['health_status'] = $status;
            $b['health_class'] = $statusClass;
        }

        sendJsonResponse('success', 'Budgets retrieved', $budgets);
        break;

    case 'POST':
        $input = getJsonInput();
        $categoryId = intval($input['category_id'] ?? 0);
        $allocatedAmount = floatval($input['allocated_amount'] ?? 0);
        $month = !empty($input['month_year']) ? $input['month_year'] : date('Y-m');

        if ($categoryId <= 0 || $allocatedAmount <= 0) {
            sendJsonResponse('error', 'Valid category and allocated amount are required', null, 400);
        }

        // Upsert budget (Insert or update on duplicate key)
        $stmt = $pdo->prepare("INSERT INTO budgets (user_id, category_id, month_year, allocated_amount)
                               VALUES (:user_id, :cat_id, :month, :allocated)
                               ON DUPLICATE KEY UPDATE allocated_amount = VALUES(allocated_amount)");
        $stmt->execute([
            'user_id' => $userId,
            'cat_id' => $categoryId,
            'month' => $month,
            'allocated' => $allocatedAmount
        ]);

        sendJsonResponse('success', 'Budget allocated successfully');
        break;

    case 'DELETE':
        $id = intval($_GET['id'] ?? 0);
        $stmt = $pdo->prepare("DELETE FROM budgets WHERE id = :id AND user_id = :user_id");
        $stmt->execute(['id' => $id, 'user_id' => $userId]);

        sendJsonResponse('success', 'Budget removed');
        break;

    default:
        sendJsonResponse('error', 'Method not supported', null, 405);
}
?>
