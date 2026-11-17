<?php
// ==========================================================
// Smart Insights & Analytics API (Slides 6, 14, 15, 17)
// Calculates:
// 1. Safe-to-Spend-Today / Daily Limit: (Budget Remaining / Remaining Days)
// 2. Budget Health Status & Balance
// 3. Needs vs Wants Split
// 4. Payment Method Distribution (UPI, Cash, Card)
// 5. Automatic Plain-Language Spending Insights
// ==========================================================

require_once __DIR__ . '/../config/db.php';

$userId = intval($_GET['user_id'] ?? 1);
$currentMonth = $_GET['month'] ?? date('Y-m'); // e.g. 2026-09

// 1. Get user profile
$uStmt = $pdo->prepare("SELECT * FROM users WHERE id = :id");
$uStmt->execute(['id' => $userId]);
$user = $uStmt->fetch();

if (!$user) {
    sendJsonResponse('error', 'User not found', null, 404);
}

$monthlyIncomeTarget = floatval($user['monthly_income']);
$overallBudgetLimit = floatval($user['overall_budget']);
$currency = $user['currency_symbol'];

// 2. Calculate Actual Incomes & Expenses for current month
$tStmt = $pdo->prepare("SELECT 
    COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income,
    COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense
    FROM transactions 
    WHERE user_id = :uid AND DATE_FORMAT(transaction_date, '%Y-%m') = :month");
$tStmt->execute(['uid' => $userId, 'month' => $currentMonth]);
$totals = $tStmt->fetch();

$actualIncome = floatval($totals['total_income']);
if ($actualIncome <= 0) $actualIncome = $monthlyIncomeTarget; // Fallback to profile target
$actualExpense = floatval($totals['total_expense']);
$totalBalance = $actualIncome - $actualExpense;

// 3. Budget Remaining
$effectiveBudget = $overallBudgetLimit > 0 ? $overallBudgetLimit : $actualIncome;
$budgetRemaining = max(0, $effectiveBudget - $actualExpense);

// 4. Safe-to-Spend-Today (Smart Daily Spending Limit)
$currentDate = new DateTime();
$daysInMonth = (int)date('t');
$currentDay = (int)date('j');
$daysRemaining = max(1, ($daysInMonth - $currentDay) + 1);

$dailyLimit = $budgetRemaining > 0 ? round($budgetRemaining / $daysRemaining, 0) : 0;
$averageDailySpend = $currentDay > 0 ? round($actualExpense / $currentDay, 0) : 0;

// 5. Need vs Want Breakdown
$nwStmt = $pdo->prepare("SELECT 
    COALESCE(SUM(CASE WHEN is_need = 1 THEN amount ELSE 0 END), 0) AS needs_total,
    COALESCE(SUM(CASE WHEN is_need = 0 THEN amount ELSE 0 END), 0) AS wants_total
    FROM transactions 
    WHERE user_id = :uid AND type = 'expense' AND DATE_FORMAT(transaction_date, '%Y-%m') = :month");
$nwStmt->execute(['uid' => $userId, 'month' => $currentMonth]);
$nw = $nwStmt->fetch();
$needsTotal = floatval($nw['needs_total']);
$wantsTotal = floatval($nw['wants_total']);
$needsPct = $actualExpense > 0 ? round(($needsTotal / $actualExpense) * 100, 1) : 0;
$wantsPct = $actualExpense > 0 ? round(($wantsTotal / $actualExpense) * 100, 1) : 0;

// 6. Category Breakdown & Top Category
$catStmt = $pdo->prepare("SELECT c.name, c.icon, c.color, COALESCE(SUM(t.amount), 0) AS total_amount
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = :uid AND t.type = 'expense' AND DATE_FORMAT(t.transaction_date, '%Y-%m') = :month
    GROUP BY c.id
    ORDER BY total_amount DESC");
$catStmt->execute(['uid' => $userId, 'month' => $currentMonth]);
$categoriesBreakdown = $catStmt->fetchAll();

$topCategory = !empty($categoriesBreakdown) ? $categoriesBreakdown[0] : ['name' => 'None', 'total_amount' => 0];

// 7. Payment Method Breakdown (UPI / Cash / Card / Net Banking)
$pmStmt = $pdo->prepare("SELECT payment_method, COALESCE(SUM(amount), 0) AS total_amount
    FROM transactions
    WHERE user_id = :uid AND type = 'expense' AND DATE_FORMAT(transaction_date, '%Y-%m') = :month
    GROUP BY payment_method
    ORDER BY total_amount DESC");
$pmStmt->execute(['uid' => $userId, 'month' => $currentMonth]);
$paymentMethods = $pmStmt->fetchAll();

// 8. Upcoming Subscriptions Count
$recStmt = $pdo->prepare("SELECT COUNT(*) FROM recurring_expenses WHERE user_id = :uid AND status = 'active' AND next_due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)");
$recStmt->execute(['uid' => $userId]);
$upcomingBillsDue = (int)$recStmt->fetchColumn();

// 9. Savings Goal Highlight
$sgStmt = $pdo->prepare("SELECT * FROM savings_goals WHERE user_id = :uid ORDER BY (current_amount / target_amount) DESC LIMIT 1");
$sgStmt->execute(['uid' => $userId]);
$featuredGoal = $sgStmt->fetch();

// 10. Generate Automatic Plain-Language Spending Insights (Slide 15)
$insights = [];

// Insight A: Daily Limit advice
if ($dailyLimit > 0) {
    $insights[] = [
        'type' => 'daily_limit',
        'icon' => 'zap',
        'title' => 'Safe-to-Spend-Today',
        'text' => "You have {$currency}{$dailyLimit}/day safe to spend for the remaining {$daysRemaining} days this month."
    ];
}

// Insight B: Top Expense Category
if (!empty($topCategory) && floatval($topCategory['total_amount']) > 0) {
    $topPct = round((floatval($topCategory['total_amount']) / $actualExpense) * 100);
    $insights[] = [
        'type' => 'top_category',
        'icon' => 'pie-chart',
        'title' => 'Highest Spending Area',
        'text' => "{$topCategory['name']} is your highest expense, taking {$topPct}% ({$currency}{$topCategory['total_amount']}) of your spending."
    ];
}

// Insight C: Needs vs Wants Split Evaluation
if ($actualExpense > 0) {
    if ($needsPct >= 65) {
        $insights[] = [
            'type' => 'discipline',
            'icon' => 'check-circle',
            'title' => 'Balanced Student Budget',
            'text' => "Great discipline! {$needsPct}% of your expenses are essential Needs (Mess, Books, Bus, Bills)."
        ];
    } else {
        $insights[] = [
            'type' => 'caution',
            'icon' => 'alert-triangle',
            'title' => 'Discretionary Spending Alert',
            'text' => "Discretionary Wants accounted for {$wantsPct}% of your spending. Try scaling down leisure outings this week."
        ];
    }
}

// Insight D: Upcoming Bill
if ($upcomingBillsDue > 0) {
    $insights[] = [
        'type' => 'reminder',
        'icon' => 'bell',
        'title' => 'Upcoming Student Due Date',
        'text' => "You have {$upcomingBillsDue} subscription/bill due in the next 7 days."
    ];
}

// Response payload
$data = [
    'currency' => $currency,
    'total_balance' => $totalBalance,
    'monthly_income' => $actualIncome,
    'monthly_expenses' => $actualExpense,
    'overall_budget' => $effectiveBudget,
    'budget_remaining' => $budgetRemaining,
    'daily_limit' => $dailyLimit,
    'average_daily_spend' => $averageDailySpend,
    'days_remaining' => $daysRemaining,
    'top_category' => $topCategory,
    'needs_vs_wants' => [
        'needs' => $needsTotal,
        'wants' => $wantsTotal,
        'needs_pct' => $needsPct,
        'wants_pct' => $wantsPct
    ],
    'categories_breakdown' => $categoriesBreakdown,
    'payment_methods' => $paymentMethods,
    'featured_goal' => $featuredGoal,
    'insights' => $insights
];

sendJsonResponse('success', 'Insights calculated successfully', $data);
?>
