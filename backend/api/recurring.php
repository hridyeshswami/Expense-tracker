<?php
// ==========================================================
// Recurring Expenses API (Slide 15: Subscriptions & Due Dates)
// ==========================================================

require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$userId = intval($_GET['user_id'] ?? 1);

switch ($method) {
    case 'GET':
        $stmt = $pdo->prepare("SELECT r.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color
                               FROM recurring_expenses r
                               JOIN categories c ON r.category_id = c.id
                               WHERE r.user_id = :user_id
                               ORDER BY r.next_due_date ASC");
        $stmt->execute(['user_id' => $userId]);
        $recurring = $stmt->fetchAll();

        $today = new DateTime(date('Y-m-d'));

        foreach ($recurring as &$item) {
            $dueDate = new DateTime($item['next_due_date']);
            $diff = $today->diff($dueDate);
            $daysLeft = (int)$diff->format("%r%a");

            $item['days_remaining'] = $daysLeft;
            if ($daysLeft < 0) {
                $item['due_status'] = 'Overdue';
                $item['status_badge'] = 'danger';
            } elseif ($daysLeft <= 3) {
                $item['due_status'] = 'Due Soon';
                $item['status_badge'] = 'warning';
            } else {
                $item['due_status'] = 'Upcoming';
                $item['status_badge'] = 'info';
            }
        }

        sendJsonResponse('success', 'Recurring expenses retrieved', $recurring);
        break;

    case 'POST':
        $input = getJsonInput();
        $title = trim($input['title'] ?? '');
        $categoryId = intval($input['category_id'] ?? 1);
        $amount = floatval($input['amount'] ?? 0);
        $billingCycle = in_array($input['billing_cycle'] ?? '', ['monthly', 'quarterly', 'yearly']) ? $input['billing_cycle'] : 'monthly';
        $nextDueDate = !empty($input['next_due_date']) ? $input['next_due_date'] : date('Y-m-d', strtotime('+30 days'));
        $paymentMethod = in_array($input['payment_method'] ?? '', ['UPI', 'Cash', 'Card', 'Net Banking']) ? $input['payment_method'] : 'UPI';

        if (empty($title) || $amount <= 0) {
            sendJsonResponse('error', 'Title and valid amount are required', null, 400);
        }

        $stmt = $pdo->prepare("INSERT INTO recurring_expenses (user_id, title, category_id, amount, billing_cycle, next_due_date, payment_method, status)
                               VALUES (:user_id, :title, :category_id, :amount, :billing_cycle, :due_date, :payment_method, 'active')");
        $stmt->execute([
            'user_id' => $userId,
            'title' => $title,
            'category_id' => $categoryId,
            'amount' => $amount,
            'billing_cycle' => $billingCycle,
            'due_date' => $nextDueDate,
            'payment_method' => $paymentMethod
        ]);

        sendJsonResponse('success', 'Recurring subscription added', ['id' => $pdo->lastInsertId()], 201);
        break;

    case 'DELETE':
        $id = intval($_GET['id'] ?? 0);
        $stmt = $pdo->prepare("DELETE FROM recurring_expenses WHERE id = :id AND user_id = :user_id");
        $stmt->execute(['id' => $id, 'user_id' => $userId]);

        sendJsonResponse('success', 'Recurring expense removed');
        break;

    default:
        sendJsonResponse('error', 'Method not supported', null, 405);
}
?>
