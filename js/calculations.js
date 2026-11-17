/**
 * Financial Calculation & Plain-Language Insights Engine
 * Implements real-time student calculations and handles empty/clean state gracefully.
 */

const calculations = {
    /**
     * Compute full financial metrics for a specific month
     */
    calculateFinancials(month) {
        if (!month) {
            const now = new Date();
            month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        }

        const profile = state.getProfile();
        const allTransactions = state.getTransactions();
        const currency = profile.currency_symbol || '₹';

        // Filter transactions for this month
        const monthlyTransactions = allTransactions.filter(t => t.date && t.date.startsWith(month));

        // Income vs Expense
        let totalIncome = 0;
        let totalExpense = 0;
        let needsTotal = 0;
        let wantsTotal = 0;

        const categorySpending = {};
        const paymentMethodSpending = {
            'UPI': 0,
            'Cash': 0,
            'Card': 0,
            'Net Banking': 0
        };

        monthlyTransactions.forEach(t => {
            const amount = parseFloat(t.amount) || 0;
            if (t.type === 'income') {
                totalIncome += amount;
            } else {
                totalExpense += amount;

                // Need vs Want
                if (parseInt(t.is_need) === 1) {
                    needsTotal += amount;
                } else {
                    wantsTotal += amount;
                }

                // Category map
                categorySpending[t.category_id] = (categorySpending[t.category_id] || 0) + amount;

                // Payment method map
                const pm = t.payment_method || 'UPI';
                paymentMethodSpending[pm] = (paymentMethodSpending[pm] || 0) + amount;
            }
        });

        // If no income transactions recorded, fallback to user's set monthly income
        const profileIncome = parseFloat(profile.monthly_income) || 0;
        if (totalIncome === 0 && profileIncome > 0) {
            totalIncome = profileIncome;
        }

        const totalBalance = totalIncome - totalExpense;

        // Budget remaining
        const profileBudget = parseFloat(profile.overall_budget) || 0;
        const effectiveBudget = profileBudget > 0 ? profileBudget : totalIncome;
        const budgetRemaining = Math.max(0, effectiveBudget - totalExpense);

        // Days remaining in current month
        const parts = month.split('-');
        const year = parseInt(parts[0]);
        const monthNum = parseInt(parts[1]);
        const totalDaysInMonth = new Date(year, monthNum, 0).getDate();
        
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        const currentDay = now.getDate();

        let daysRemaining = 20;
        if (year === currentYear && monthNum === currentMonth) {
            daysRemaining = Math.max(1, (totalDaysInMonth - currentDay) + 1);
        } else {
            daysRemaining = totalDaysInMonth;
        }

        // Smart Daily Spending Limit (Safe-to-Spend-Today)
        const dailyLimit = budgetRemaining > 0 ? Math.round(budgetRemaining / daysRemaining) : 0;
        const daysElapsed = Math.max(1, (totalDaysInMonth - daysRemaining) + 1);
        const avgDailySpend = totalExpense > 0 ? Math.round(totalExpense / daysElapsed) : 0;

        // Needs vs Wants percentages
        const needsPct = totalExpense > 0 ? Math.round((needsTotal / totalExpense) * 100) : 0;
        const wantsPct = totalExpense > 0 ? Math.round((wantsTotal / totalExpense) * 100) : 0;

        // Top category determination
        let topCatId = null;
        let topCatAmount = 0;
        Object.entries(categorySpending).forEach(([catId, spent]) => {
            if (spent > topCatAmount) {
                topCatAmount = spent;
                topCatId = parseInt(catId);
            }
        });

        const topCategory = topCatId ? state.getCategoryById(topCatId) : { name: 'None yet', icon: '✨' };
        topCategory.spent = topCatAmount;
        topCategory.percentage = totalExpense > 0 ? Math.round((topCatAmount / totalExpense) * 100) : 0;

        return {
            currency,
            totalIncome,
            totalExpense,
            totalBalance,
            effectiveBudget,
            budgetRemaining,
            dailyLimit,
            avgDailySpend,
            daysRemaining,
            totalDaysInMonth,
            needsTotal,
            wantsTotal,
            needsPct,
            wantsPct,
            categorySpending,
            paymentMethodSpending,
            topCategory,
            monthlyTransactions
        };
    },

    /**
     * Budget Health Indicator (Slide 6, 14, 15)
     */
    getBudgetHealth(allocated, spent) {
        if (!allocated || allocated <= 0) return { status: 'Under Control', class: 'success', percentage: 0 };
        const percentage = Math.round((spent / allocated) * 100);

        if (percentage > 95) {
            return { status: 'Exceeded', class: 'danger', percentage };
        } else if (percentage >= 70) {
            return { status: 'Getting Close', class: 'warning', percentage };
        } else {
            return { status: 'Under Control', class: 'success', percentage };
        }
    },

    /**
     * Automatic Plain-Language Spending Insights Generator (Slide 15)
     */
    generateInsights(financials) {
        const insights = [];
        const { currency, dailyLimit, daysRemaining, topCategory, needsPct, wantsPct, totalExpense, totalIncome, budgetRemaining, effectiveBudget } = financials;

        // When fresh / zero data recorded yet
        if (totalExpense === 0 && totalIncome === 0) {
            insights.push({
                icon: '👋',
                title: 'Clean Slate Ready',
                text: 'Your tracker is ready with zero dummy data. Click "+ Quick Add" to record your monthly allowance or first student purchase.'
            });
            insights.push({
                icon: '🎯',
                title: 'Budget Planning',
                text: 'Go to Settings or the Budgets tab to configure your monthly stipend and category targets without touching any code.'
            });
            return insights;
        }

        // 1. Safe-to-Spend insight
        if (dailyLimit > 0) {
            insights.push({
                icon: '⚡',
                title: 'Safe-to-Spend-Today',
                text: `You have ${currency}${dailyLimit.toLocaleString()}/day safe to spend for the remaining ${daysRemaining} days this month.`
            });
        } else if (budgetRemaining <= 0 && effectiveBudget > 0) {
            insights.push({
                icon: '⚠️',
                title: 'Budget Limit Reached',
                text: `You have reached your planned budget limit. Consider limiting any non-essential discretionary spends for the rest of this month.`
            });
        }

        // 2. Highest Spending Area
        if (topCategory && topCategory.spent > 0) {
            insights.push({
                icon: topCategory.icon || '🍔',
                title: 'Highest Expense Category',
                text: `${topCategory.name} is your largest expense area, taking ${topCategory.percentage}% (${currency}${topCategory.spent.toLocaleString()}) of your spending.`
            });
        }

        // 3. Needs vs Wants evaluation
        if (totalExpense > 0) {
            if (needsPct >= 65) {
                insights.push({
                    icon: '🎯',
                    title: 'Healthy Student Spending',
                    text: `Great discipline! ${needsPct}% of your expenses are essential Needs (mess, books, bus pass, recharge). Discretionary wants are kept at ${wantsPct}%.`
                });
            } else {
                insights.push({
                    icon: '💡',
                    title: 'Wants Alert',
                    text: `Discretionary wants took ${wantsPct}% of your expenses. You could scale down leisure outings this week to build your savings.`
                });
            }
        }

        // 4. Savings Goal progress
        const goals = state.getGoals();
        if (goals.length > 0) {
            const primaryGoal = goals[0];
            const pct = Math.round((primaryGoal.current_amount / primaryGoal.target_amount) * 100);
            insights.push({
                icon: primaryGoal.icon || '💻',
                title: 'Goal in Progress',
                text: `You have completed ${pct}% of your "${primaryGoal.title}" goal (${currency}${primaryGoal.current_amount.toLocaleString()} / ${currency}${primaryGoal.target_amount.toLocaleString()}).`
            });
        }

        return insights;
    }
};
