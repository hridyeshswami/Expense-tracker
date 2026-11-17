<?php
// ==========================================================
// Savings Goals API (Slide 15, 17)
// Tracks target amount, current savings, progress, required daily/monthly rate
// ==========================================================

require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$userId = intval($_GET['user_id'] ?? 1);

switch ($method) {
    case 'GET':
        $stmt = $pdo->prepare("SELECT * FROM savings_goals WHERE user_id = :user_id ORDER BY target_date ASC");
        $stmt->execute(['user_id' => $userId]);
        $goals = $stmt->fetchAll();

        $today = new DateTime();

        foreach ($goals as &$g) {
            $target = floatval($g['target_amount']);
            $current = floatval($g['current_amount']);
            $remaining = max(0, $target - $current);
            $percentage = $target > 0 ? min(100, round(($current / $target) * 100, 1)) : 0;

            $targetDate = new DateTime($g['target_date']);
            $daysLeft = $today < $targetDate ? $today->diff($targetDate)->days : 0;

            // Calculate required daily saving to achieve goal on time
            $dailyRequired = $daysLeft > 0 ? round($remaining / $daysLeft, 2) : 0;
            $monthlyRequired = round($dailyRequired * 30, 2);

            $g['remaining_amount'] = $remaining;
            $g['percentage'] = $percentage;
            $g['days_left'] = $daysLeft;
            $g['daily_required'] = $dailyRequired;
            $g['monthly_required'] = $monthlyRequired;
        }

        sendJsonResponse('success', 'Goals retrieved', $goals);
        break;

    case 'POST':
        $input = getJsonInput();
        $title = trim($input['title'] ?? '');
        $targetAmount = floatval($input['target_amount'] ?? 0);
        $currentAmount = floatval($input['current_amount'] ?? 0);
        $targetDate = !empty($input['target_date']) ? $input['target_date'] : date('Y-12-31');
        $icon = trim($input['icon'] ?? 'piggy-bank');

        if (empty($title) || $targetAmount <= 0) {
            sendJsonResponse('error', 'Goal title and positive target amount are required', null, 400);
        }

        $stmt = $pdo->prepare("INSERT INTO savings_goals (user_id, title, target_amount, current_amount, target_date, icon)
                               VALUES (:user_id, :title, :target, :current, :date, :icon)");
        $stmt->execute([
            'user_id' => $userId,
            'title' => $title,
            'target' => $targetAmount,
            'current' => $currentAmount,
            'date' => $targetDate,
            'icon' => $icon
        ]);

        sendJsonResponse('success', 'Savings goal created', ['id' => $pdo->lastInsertId()], 201);
        break;

    case 'PUT':
        // Deposit or withdraw from goal
        $input = getJsonInput();
        $id = intval($_GET['id'] ?? $input['id'] ?? 0);
        $addAmount = floatval($input['add_amount'] ?? 0);

        if ($id <= 0 || $addAmount == 0) {
            sendJsonResponse('error', 'Valid goal ID and amount to deposit/withdraw are required', null, 400);
        }

        $stmt = $pdo->prepare("UPDATE savings_goals 
                               SET current_amount = GREATEST(0, current_amount + :amount) 
                               WHERE id = :id AND user_id = :user_id");
        $stmt->execute(['amount' => $addAmount, 'id' => $id, 'user_id' => $userId]);

        sendJsonResponse('success', 'Goal progress updated successfully');
        break;

    case 'DELETE':
        $id = intval($_GET['id'] ?? 0);
        $stmt = $pdo->prepare("DELETE FROM savings_goals WHERE id = :id AND user_id = :user_id");
        $stmt->execute(['id' => $id, 'user_id' => $userId]);

        sendJsonResponse('success', 'Savings goal deleted');
        break;

    default:
        sendJsonResponse('error', 'Method not supported', null, 405);
}
?>
