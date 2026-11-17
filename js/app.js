/**
 * Main Application Controller (PBL Expense Tracker Working Prototype)
 * Handles Admin Authentication, Clean LocalStorage Persistence, Tab Navigation, and Dynamic Views.
 */

const now = new Date();
let currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
let isProgressiveMinimal = false;
let pendingAdminAction = null;

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    updateDynamicMonthBadge();
    updateAdminUI();
    setupNavigation();
    setupModals();
    populateCategoryDropdowns();
    renderAllViews();
    setupEventListeners();
    if (typeof setupDatabaseListeners === 'function') {
        setupDatabaseListeners();
    }
}

/**
 * Dynamic Month Display in Header
 */
function updateDynamicMonthBadge() {
    const badge = document.getElementById('currentMonthBadge');
    if (badge) {
        const monthName = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
        badge.textContent = `📅 ${monthName}`;
    }
}

/**
 * Admin Security & Permission Checks
 */
function updateAdminUI() {
    const isAdmin = state.isAdmin();
    const adminToggleBtn = document.getElementById('adminToggleBtn');
    if (adminToggleBtn) {
        if (isAdmin) {
            adminToggleBtn.innerHTML = `<span>👑</span> <strong>Admin Mode (Unlocked)</strong>`;
            adminToggleBtn.className = 'btn btn-sm btn-outline admin-unlocked';
            adminToggleBtn.title = 'Click to Lock Prototype into Read-Only Mode';
        } else {
            adminToggleBtn.innerHTML = `<span>🔒</span> <strong>Read-Only (Admin Login)</strong>`;
            adminToggleBtn.className = 'btn btn-sm btn-outline admin-locked';
            adminToggleBtn.title = 'Click to Enter Admin PIN to make changes';
        }
    }

    // Top Admin Status Banner
    const banner = document.getElementById('adminModeBanner');
    const bannerText = document.getElementById('adminBannerText');
    const bannerBtn = document.getElementById('bannerAdminActionBtn');
    if (banner && bannerText && bannerBtn) {
        if (isAdmin) {
            banner.style.background = '#ecfdf5';
            banner.style.borderColor = '#a7f3d0';
            banner.style.color = '#065f46';
            bannerText.innerHTML = `👑 <strong>Admin Mode Active</strong>: You have full permissions to add, edit, or delete transactions & budgets. Stored directly in Chrome.`;
            bannerBtn.textContent = '🔒 Lock Mode';
            bannerBtn.className = 'btn btn-sm btn-outline';
            bannerBtn.style.color = '#065f46';
            bannerBtn.style.borderColor = '#059669';
        } else {
            banner.style.background = '#fffbeb';
            banner.style.borderColor = '#fde68a';
            banner.style.color = '#92400e';
            bannerText.innerHTML = `🔒 <strong>Viewer Mode (Read-Only)</strong>: All dummy data removed. Only the Admin can make changes or add data.`;
            bannerBtn.textContent = '👑 Admin Login';
            bannerBtn.className = 'btn btn-sm btn-primary';
            bannerBtn.style.color = '#ffffff';
            bannerBtn.style.borderColor = 'transparent';
        }
    }

    const adminBadges = document.querySelectorAll('.admin-only-badge');
    adminBadges.forEach(el => {
        el.style.display = isAdmin ? 'inline-flex' : 'none';
    });
}

function checkAdminPermission(callback) {
    if (state.isAdmin()) {
        callback();
    } else {
        pendingAdminAction = callback;
        const authModal = document.getElementById('adminAuthModal');
        if (authModal) {
            document.getElementById('adminPinInput').value = '';
            document.getElementById('adminPinError').style.display = 'none';
            authModal.classList.add('active');
            setTimeout(() => document.getElementById('adminPinInput').focus(), 100);
        }
    }
}

/**
 * Tab Navigation
 */
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link[data-tab]');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = link.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
}

function switchTab(tabId) {
    document.querySelectorAll('.nav-link[data-tab]').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));

    const targetLink = document.querySelector(`.nav-link[data-tab="${tabId}"]`);
    const targetPane = document.getElementById(tabId);

    if (targetLink) targetLink.classList.add('active');
    if (targetPane) targetPane.classList.add('active');

    if (tabId === 'analytics-tab') {
        const financials = calculations.calculateFinancials(currentMonth);
        setTimeout(() => chartManager.renderAll(financials), 50);
    } else if (tabId === 'database-tab') {
        if (typeof renderDatabaseTab === 'function') {
            renderDatabaseTab();
        }
    }
}

/**
 * Render all components
 */
function renderAllViews() {
    const financials = calculations.calculateFinancials(currentMonth);
    renderDashboardStats(financials);
    renderInsights(financials);
    renderRecentTransactions(financials);
    renderFullTransactionsTable();
    renderBudgets();
    renderSavingsGoals();
    renderRecurringSubscriptions();
    renderCategoryListInSettings();
    renderSettings();
    if (typeof renderDatabaseTab === 'function') {
        renderDatabaseTab();
    }
    updateAdminUI();
}

/**
 * Render Dashboard Cards (Slide 17)
 */
function renderDashboardStats(f) {
    const curr = f.currency;

    // Slide 17 Card 1: Total Balance
    document.getElementById('statBalance').textContent = `${curr}${f.totalBalance.toLocaleString()}`;

    // Slide 17 Card 2: Income
    document.getElementById('statIncome').textContent = `${curr}${f.totalIncome.toLocaleString()}`;

    // Slide 17 Card 3: Expenses
    document.getElementById('statExpense').textContent = `${curr}${f.totalExpense.toLocaleString()}`;

    // Slide 17 Card 4: Budget Remaining
    document.getElementById('statBudgetRemaining').textContent = `${curr}${f.budgetRemaining.toLocaleString()}`;
    const budgetPct = f.effectiveBudget > 0 ? Math.round((f.totalExpense / f.effectiveBudget) * 100) : 0;
    document.getElementById('statBudgetMeta').textContent = f.effectiveBudget > 0 
        ? `${budgetPct}% of ${curr}${f.effectiveBudget.toLocaleString()} spent`
        : 'Set monthly budget in Settings';

    // Slide 17 Card 5: Safe-to-Spend Daily Limit
    document.getElementById('statDailyLimit').textContent = `${curr}${f.dailyLimit}/day`;
    document.getElementById('statDailyMeta').textContent = `${f.daysRemaining} days left in month`;

    // Slide 17 Card 6: Top Category
    document.getElementById('statTopCategory').textContent = `${f.topCategory.name || 'None yet'}`;
    document.getElementById('statTopCatMeta').textContent = f.topCategory.spent > 0 
        ? `${curr}${f.topCategory.spent.toLocaleString()} (${f.topCategory.percentage}%)` 
        : 'No expenses logged yet';

    // Slide 17 Card 7: Featured Savings Goal
    const goals = state.getGoals();
    if (goals.length > 0) {
        const g = goals[0];
        const pct = Math.min(100, Math.round((g.current_amount / g.target_amount) * 100));
        document.getElementById('statGoalTitle').textContent = g.title;
        document.getElementById('statGoalValue').textContent = `${curr}${g.current_amount.toLocaleString()} / ${curr}${g.target_amount.toLocaleString()}`;
        document.getElementById('statGoalProgress').style.width = `${pct}%`;
        document.getElementById('statGoalMeta').textContent = `${pct}% achieved`;
    } else {
        document.getElementById('statGoalTitle').textContent = 'Savings Goal';
        document.getElementById('statGoalValue').textContent = `${curr}0 / ${curr}0`;
        document.getElementById('statGoalProgress').style.width = '0%';
        document.getElementById('statGoalMeta').textContent = 'No active goals set';
    }
}

/**
 * Render Plain-Language Insights Panel (Slide 15)
 */
function renderInsights(financials) {
    const list = calculations.generateInsights(financials);
    const container = document.getElementById('insightsContainer');
    if (!container) return;

    container.innerHTML = list.map(item => `
        <div class="insight-card">
            <div class="insight-icon">${item.icon}</div>
            <div class="insight-body">
                <strong>${item.title}</strong>
                <p>${item.text}</p>
            </div>
        </div>
    `).join('');
}

/**
 * Render Recent Transactions on Dashboard
 */
function renderRecentTransactions(financials) {
    const tbody = document.getElementById('recentTransactionsBody');
    if (!tbody) return;

    const recent = financials.monthlyTransactions.slice(0, 5);

    if (recent.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#94a3b8; padding:2rem;">No transactions recorded this month. Click "+ Quick Add" to start.</td></tr>`;
        return;
    }

    tbody.innerHTML = recent.map(t => {
        const cat = state.getCategoryById(t.category_id);
        const isExpense = t.type === 'expense';
        const sign = isExpense ? '-' : '+';
        const color = isExpense ? '#ef4444' : '#10b981';
        const needBadge = isExpense ? (parseInt(t.is_need) === 1 ? `<span class="badge badge-need">Need</span>` : `<span class="badge badge-want">Want</span>`) : `<span class="badge badge-success">Income</span>`;
        const methodBadge = `<span class="badge badge-${(t.payment_method || 'UPI').toLowerCase().replace(' ', '')}">${t.payment_method || 'UPI'}</span>`;

        return `
            <tr>
                <td><strong>${t.date}</strong></td>
                <td><span style="margin-right:0.4rem;">${cat.icon}</span> ${cat.name}</td>
                <td>${t.note || '-'}</td>
                <td>${needBadge} ${methodBadge}</td>
                <td style="font-weight:700; color:${color}; text-align:right;">
                    ${sign}${financials.currency}${parseFloat(t.amount).toLocaleString()}
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Render Full Transactions Table with Filtering
 */
function renderFullTransactionsTable() {
    const tbody = document.getElementById('fullTransactionsBody');
    if (!tbody) return;

    const searchTerm = (document.getElementById('txSearchInput')?.value || '').toLowerCase();
    const filterCat = document.getElementById('txCatFilter')?.value || '';
    const filterNeed = document.getElementById('txNeedFilter')?.value || '';
    const filterMethod = document.getElementById('txMethodFilter')?.value || '';

    let trans = state.getTransactions();
    const profile = state.getProfile();
    const curr = profile.currency_symbol || '₹';

    trans = trans.filter(t => {
        const cat = state.getCategoryById(t.category_id);
        const matchSearch = !searchTerm || (t.note && t.note.toLowerCase().includes(searchTerm)) || cat.name.toLowerCase().includes(searchTerm);
        const matchCat = !filterCat || t.category_id === parseInt(filterCat);
        const matchNeed = !filterNeed || (t.type === 'expense' && t.is_need.toString() === filterNeed);
        const matchMethod = !filterMethod || t.payment_method === filterMethod;
        return matchSearch && matchCat && matchNeed && matchMethod;
    });

    if (trans.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#94a3b8; padding:2.5rem;">
            <div style="font-size:1.8rem; margin-bottom:0.5rem;">📝</div>
            <strong>No transactions logged yet</strong>
            <p style="font-size:0.85rem; color:#64748b; margin-top:0.25rem;">Admin can click "+ Add Expense" or "+ Add Income" to start recording.</p>
        </td></tr>`;
        return;
    }

    tbody.innerHTML = trans.map(t => {
        const cat = state.getCategoryById(t.category_id);
        const isExpense = t.type === 'expense';
        const sign = isExpense ? '-' : '+';
        const color = isExpense ? '#ef4444' : '#10b981';
        const needBadge = isExpense ? (parseInt(t.is_need) === 1 ? `<span class="badge badge-need">Need</span>` : `<span class="badge badge-want">Want</span>`) : `<span class="badge badge-success">Income</span>`;
        const methodBadge = `<span class="badge badge-${(t.payment_method || 'UPI').toLowerCase().replace(' ', '')}">${t.payment_method || 'UPI'}</span>`;

        return `
            <tr>
                <td>${t.date}</td>
                <td><strong><span style="margin-right:0.35rem;">${cat.icon}</span> ${cat.name}</strong></td>
                <td>${t.note || '-'}</td>
                <td>${needBadge}</td>
                <td>${methodBadge}</td>
                <td style="font-weight:700; color:${color};">
                    ${sign}${curr}${parseFloat(t.amount).toLocaleString()}
                </td>
                <td style="text-align:center;">
                    <button class="btn btn-sm btn-outline" style="color:#ef4444;" title="Delete (Admin only)" onclick="handleDeleteTransaction(${t.id})">🗑️</button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Render Budgets with Health Status Badges
 */
function renderBudgets() {
    const container = document.getElementById('budgetCardsContainer');
    if (!container) return;

    const budgets = state.getBudgets(currentMonth);
    const financials = calculations.calculateFinancials(currentMonth);
    const curr = financials.currency;

    if (budgets.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align:center; background:#ffffff; border:1px dashed #cbd5e1; border-radius:12px; padding:3rem 1.5rem;">
                <div style="font-size:2rem; margin-bottom:0.5rem;">🎯</div>
                <h3 style="font-size:1.1rem; font-weight:700;">No Category Budgets Set Yet</h3>
                <p style="font-size:0.85rem; color:#64748b; margin:0.4rem 0 1rem;">Admin can set monthly limits for Food, Books, Transport, etc. to activate the budget health meter.</p>
                <button class="btn btn-primary" onclick="document.getElementById('openSetBudgetBtn').click()">+ Set Category Budget</button>
            </div>
        `;
        return;
    }

    container.innerHTML = budgets.map(b => {
        const cat = state.getCategoryById(b.category_id);
        const spent = financials.categorySpending[b.category_id] || 0;
        const allocated = parseFloat(b.allocated_amount);
        const health = calculations.getBudgetHealth(allocated, spent);
        const remaining = Math.max(0, allocated - spent);

        return `
            <div class="stat-card">
                <div class="stat-header">
                    <div>
                        <span style="font-size:1.3rem; margin-right:0.4rem;">${cat.icon}</span>
                        <strong style="font-size:1.05rem;">${cat.name}</strong>
                    </div>
                    <span class="badge badge-${health.class}">${health.status}</span>
                </div>
                <div style="margin: 0.75rem 0;">
                    <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:0.25rem;">
                        <span style="color:#64748b;">Spent: ${curr}${spent.toLocaleString()}</span>
                        <span style="font-weight:600;">Limit: ${curr}${allocated.toLocaleString()}</span>
                    </div>
                    <div class="progress-container">
                        <div class="progress-bar progress-${health.class}" style="width: ${Math.min(100, health.percentage)}%;"></div>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:#64748b; margin-top:0.25rem;">
                        <span>${health.percentage}% utilized</span>
                        <span>Remaining: ${curr}${remaining.toLocaleString()}</span>
                    </div>
                </div>
                <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:0.5rem;">
                    <button class="btn btn-sm btn-outline" style="color:#ef4444;" onclick="handleDeleteBudget(${b.id})">Remove</button>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Render Savings Goals
 */
function renderSavingsGoals() {
    const container = document.getElementById('goalsContainer');
    if (!container) return;

    const goals = state.getGoals();
    const curr = state.getProfile().currency_symbol || '₹';

    if (goals.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align:center; background:#ffffff; border:1px dashed #cbd5e1; border-radius:12px; padding:3rem 1.5rem;">
                <div style="font-size:2rem; margin-bottom:0.5rem;">💰</div>
                <h3 style="font-size:1.1rem; font-weight:700;">No Savings Goals Created</h3>
                <p style="font-size:0.85rem; color:#64748b; margin:0.4rem 0 1rem;">Set target savings for a laptop, certification course, semester exam fees, or a trip home.</p>
                <button class="btn btn-primary" onclick="document.getElementById('openAddGoalBtn').click()">+ New Savings Goal</button>
            </div>
        `;
        return;
    }

    const today = new Date();

    container.innerHTML = goals.map(g => {
        const target = parseFloat(g.target_amount);
        const current = parseFloat(g.current_amount);
        const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
        const remaining = Math.max(0, target - current);

        const targetDate = new Date(g.target_date);
        const diffTime = targetDate - today;
        const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        const monthlySavingNeeded = daysLeft > 0 ? Math.round((remaining / daysLeft) * 30) : 0;

        return `
            <div class="goal-card">
                <div>
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.75rem;">
                        <div style="display:flex; align-items:center; gap:0.5rem;">
                            <span style="font-size:1.6rem;">${g.icon || '🎯'}</span>
                            <div>
                                <h4 style="font-size:1.1rem; font-weight:700;">${g.title}</h4>
                                <span style="font-size:0.8rem; color:#64748b;">Target Date: ${g.target_date} (${daysLeft} days left)</span>
                            </div>
                        </div>
                        <span class="badge badge-primary">${pct}%</span>
                    </div>

                    <div style="margin: 1rem 0;">
                        <div style="display:flex; justify-content:space-between; font-size:0.9rem; margin-bottom:0.35rem;">
                            <span style="font-weight:700; color:#10b981;">${curr}${current.toLocaleString()}</span>
                            <span style="color:#64748b;">Target: ${curr}${target.toLocaleString()}</span>
                        </div>
                        <div class="progress-container" style="height:10px;">
                            <div class="progress-bar progress-success" style="width: ${pct}%;"></div>
                        </div>
                        <p style="font-size:0.8rem; color:#64748b; margin-top:0.4rem;">
                            💡 Save <strong>${curr}${monthlySavingNeeded.toLocaleString()}/month</strong> to meet this deadline.
                        </p>
                    </div>
                </div>

                <div style="display:flex; gap:0.5rem; margin-top:1rem; border-top:1px solid #e2e8f0; padding-top:0.75rem;">
                    <button class="btn btn-sm btn-primary" style="flex:1;" onclick="handleOpenDepositModal(${g.id}, '${g.title}')">+ Deposit</button>
                    <button class="btn btn-sm btn-outline" style="color:#ef4444;" onclick="handleDeleteGoal(${g.id})">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Render Recurring Subscriptions
 */
function renderRecurringSubscriptions() {
    const tbody = document.getElementById('recurringTableBody');
    if (!tbody) return;

    const recurring = state.getRecurring();
    const curr = state.getProfile().currency_symbol || '₹';

    if (recurring.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#94a3b8; padding:2.5rem;">
            <div style="font-size:1.8rem; margin-bottom:0.5rem;">🔁</div>
            <strong>No active subscriptions or bills</strong>
            <p style="font-size:0.85rem; color:#64748b; margin-top:0.25rem;">Track recurring payments like hostel WiFi, mobile 5G plans, or Spotify.</p>
        </td></tr>`;
        return;
    }

    const today = new Date();

    tbody.innerHTML = recurring.map(r => {
        const cat = state.getCategoryById(r.category_id);
        const dueDate = new Date(r.next_due_date);
        const daysLeft = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

        let badge = `<span class="badge badge-primary">In ${daysLeft} days</span>`;
        if (daysLeft < 0) {
            badge = `<span class="badge badge-danger">Overdue</span>`;
        } else if (daysLeft <= 3) {
            badge = `<span class="badge badge-warning">Due Soon (${daysLeft}d)</span>`;
        }

        return `
            <tr>
                <td><strong>${r.title}</strong></td>
                <td><span style="margin-right:0.35rem;">${cat.icon}</span> ${cat.name}</td>
                <td>${r.billing_cycle.toUpperCase()}</td>
                <td><span class="badge badge-${(r.payment_method || 'UPI').toLowerCase()}">${r.payment_method}</span></td>
                <td style="font-weight:700;">${curr}${parseFloat(r.amount).toLocaleString()}</td>
                <td>${r.next_due_date} ${badge}</td>
                <td>
                    <button class="btn btn-sm btn-outline" style="color:#ef4444;" onclick="handleDeleteRecurring(${r.id})">🗑️</button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Render Category List in Settings for Admin Management
 */
function renderCategoryListInSettings() {
    const container = document.getElementById('categoriesListSettings');
    if (!container) return;

    const categories = state.getCategories();
    container.innerHTML = categories.map(c => `
        <div style="display:flex; align-items:center; justify-content:space-between; padding:0.4rem 0.6rem; border:1px solid #e2e8f0; border-radius:6px; background:#ffffff; font-size:0.85rem;">
            <span><span style="margin-right:0.35rem;">${c.icon}</span> ${c.name} <span style="font-size:0.75rem; color:#94a3b8;">(${c.type})</span></span>
            <button class="btn btn-sm btn-outline" style="padding:2px 6px; color:#ef4444;" onclick="handleDeleteCategory(${c.id})">🗑️</button>
        </div>
    `).join('');
}

/**
 * Settings view
 */
function renderSettings() {
    const profile = state.getProfile();
    const incInput = document.getElementById('settingsIncome');
    const budInput = document.getElementById('settingsBudget');
    const currInput = document.getElementById('settingsCurrency');
    const studentToggle = document.getElementById('settingsStudentMode');
    const pinDisplay = document.getElementById('currentAdminPinDisplay');

    if (incInput) incInput.value = profile.monthly_income || 0;
    if (budInput) budInput.value = profile.overall_budget || 0;
    if (currInput) currInput.value = profile.currency_symbol || '₹';
    if (studentToggle) studentToggle.checked = !!profile.student_mode;
    if (pinDisplay) pinDisplay.textContent = profile.admin_pin || 'admin123';
}

/**
 * Populate Dropdowns
 */
function populateCategoryDropdowns() {
    const categories = state.getCategories();
    const dropdowns = [
        document.getElementById('txCategorySelect'),
        document.getElementById('budgetCategorySelect'),
        document.getElementById('recurringCategorySelect'),
        document.getElementById('txCatFilter')
    ];

    dropdowns.forEach(dd => {
        if (!dd) return;
        const isFilter = dd.id === 'txCatFilter';
        dd.innerHTML = isFilter ? '<option value="">All Categories</option>' : '';
        categories.forEach(c => {
            if (!isFilter && dd.id === 'txCategorySelect' && c.type === 'income') return;
            dd.innerHTML += `<option value="${c.id}">${c.icon} ${c.name}</option>`;
        });
    });
}

/**
 * Modals & Forms setup
 */
function setupModals() {
    // Admin Toggle / Login
    const adminToggleBtn = document.getElementById('adminToggleBtn');
    const adminModal = document.getElementById('adminAuthModal');
    const closeAdminModal = document.getElementById('closeAdminAuthModal');

    if (adminToggleBtn) {
        adminToggleBtn.addEventListener('click', () => {
            if (state.isAdmin()) {
                if (confirm('Lock Admin Mode? Prototype will switch to Read-Only mode for viewers.')) {
                    state.lockAdmin();
                    updateAdminUI();
                    alert('Admin Mode locked. Viewers can now browse the dashboard safely without altering your data.');
                }
            } else {
                document.getElementById('adminPinInput').value = '';
                document.getElementById('adminPinError').style.display = 'none';
                adminModal.classList.add('active');
                setTimeout(() => document.getElementById('adminPinInput').focus(), 100);
            }
        });
    }

    const bannerAdminBtn = document.getElementById('bannerAdminActionBtn');
    if (bannerAdminBtn) {
        bannerAdminBtn.addEventListener('click', () => {
            if (state.isAdmin()) {
                if (confirm('Lock Admin Mode? Prototype will switch to Read-Only mode for viewers.')) {
                    state.lockAdmin();
                    updateAdminUI();
                    alert('Admin Mode locked. Viewers can now browse the dashboard safely without altering your data.');
                }
            } else {
                document.getElementById('adminPinInput').value = '';
                document.getElementById('adminPinError').style.display = 'none';
                adminModal.classList.add('active');
                setTimeout(() => document.getElementById('adminPinInput').focus(), 100);
            }
        });
    }

    if (closeAdminModal && adminModal) {
        closeAdminModal.addEventListener('click', () => adminModal.classList.remove('active'));
    }

    const adminAuthForm = document.getElementById('adminAuthForm');
    if (adminAuthForm) {
        adminAuthForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const pin = document.getElementById('adminPinInput').value;
            if (state.unlockAdmin(pin)) {
                adminModal.classList.remove('active');
                updateAdminUI();
                alert('👑 Admin Mode Unlocked! You now have full permission to add, edit, or delete data.');
                if (pendingAdminAction) {
                    const action = pendingAdminAction;
                    pendingAdminAction = null;
                    action();
                }
            } else {
                document.getElementById('adminPinError').style.display = 'block';
            }
        });
    }

    // Quick Add Expense
    const openAddBtn = document.getElementById('openAddExpenseBtn');
    const modalAdd = document.getElementById('addExpenseModal');
    const closeAdd = document.getElementById('closeAddExpenseModal');

    if (openAddBtn && modalAdd) {
        openAddBtn.addEventListener('click', () => {
            checkAdminPermission(() => {
                modalAdd.classList.add('active');
                document.getElementById('txDate').valueAsDate = new Date();
            });
        });
    }

    if (closeAdd && modalAdd) {
        closeAdd.addEventListener('click', () => modalAdd.classList.remove('active'));
    }

    // Set Budget Modal
    const openBudgetBtn = document.getElementById('openSetBudgetBtn');
    const modalBudget = document.getElementById('setBudgetModal');
    const closeBudget = document.getElementById('closeBudgetModal');

    if (openBudgetBtn && modalBudget) {
        openBudgetBtn.addEventListener('click', () => {
            checkAdminPermission(() => {
                modalBudget.classList.add('active');
            });
        });
    }
    if (closeBudget && modalBudget) {
        closeBudget.addEventListener('click', () => modalBudget.classList.remove('active'));
    }

    // New Goal Modal
    const openGoalBtn = document.getElementById('openAddGoalBtn');
    const modalGoal = document.getElementById('addGoalModal');
    const closeGoal = document.getElementById('closeGoalModal');

    if (openGoalBtn && modalGoal) {
        openGoalBtn.addEventListener('click', () => {
            checkAdminPermission(() => {
                modalGoal.classList.add('active');
            });
        });
    }
    if (closeGoal && modalGoal) {
        closeGoal.addEventListener('click', () => modalGoal.classList.remove('active'));
    }

    // Deposit Modal
    const modalDeposit = document.getElementById('depositModal');
    const closeDeposit = document.getElementById('closeDepositModal');
    if (closeDeposit && modalDeposit) {
        closeDeposit.addEventListener('click', () => modalDeposit.classList.remove('active'));
    }

    // New Recurring Modal
    const openRecBtn = document.getElementById('openAddRecurringBtn');
    const modalRec = document.getElementById('addRecurringModal');
    const closeRec = document.getElementById('closeRecurringModal');

    if (openRecBtn && modalRec) {
        openRecBtn.addEventListener('click', () => {
            checkAdminPermission(() => {
                modalRec.classList.add('active');
            });
        });
    }
    if (closeRec && modalRec) {
        closeRec.addEventListener('click', () => modalRec.classList.remove('active'));
    }
}

/**
 * Event Listeners for Forms & Filters
 */
function setupEventListeners() {
    // Quick Add Expense Form
    const expenseForm = document.getElementById('addExpenseForm');
    if (expenseForm) {
        expenseForm.addEventListener('submit', (e) => {
            e.preventDefault();
            checkAdminPermission(() => {
                const amount = parseFloat(document.getElementById('txAmount').value);
                const categoryId = parseInt(document.getElementById('txCategorySelect').value);
                const isNeed = parseInt(document.querySelector('input[name="txNeed"]:checked')?.value || 1);
                const paymentMethod = document.querySelector('input[name="txPaymentMethod"]:checked')?.value || 'UPI';
                const note = document.getElementById('txNote').value;
                const date = document.getElementById('txDate').value || new Date().toISOString().split('T')[0];

                state.addTransaction({
                    type: 'expense',
                    amount,
                    category_id: categoryId,
                    is_need: isNeed,
                    payment_method: paymentMethod,
                    note,
                    date
                });

                document.getElementById('addExpenseModal').classList.remove('active');
                expenseForm.reset();
                renderAllViews();
            });
        });
    }

    // Quick Add Income Form
    const incomeForm = document.getElementById('addIncomeForm');
    if (incomeForm) {
        incomeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            checkAdminPermission(() => {
                const amount = parseFloat(document.getElementById('incAmount').value);
                const note = document.getElementById('incNote').value || 'Allowance / Stipend';
                const paymentMethod = document.getElementById('incPaymentMethod').value || 'Bank Transfer';
                const date = document.getElementById('incDate').value || new Date().toISOString().split('T')[0];

                state.addTransaction({
                    type: 'income',
                    amount,
                    category_id: 9, // Monthly Allowance
                    is_need: 1,
                    payment_method: paymentMethod,
                    note,
                    date
                });

                document.getElementById('addIncomeModal').classList.remove('active');
                incomeForm.reset();
                renderAllViews();
            });
        });
    }

    const openIncomeBtn = document.getElementById('openAddIncomeBtn');
    if (openIncomeBtn) {
        openIncomeBtn.addEventListener('click', () => {
            checkAdminPermission(() => {
                const modal = document.getElementById('addIncomeModal');
                if (modal) {
                    document.getElementById('incDate').valueAsDate = new Date();
                    modal.classList.add('active');
                }
            });
        });
    }
    const closeIncomeBtn = document.getElementById('closeAddIncomeModal');
    if (closeIncomeBtn) {
        closeIncomeBtn.addEventListener('click', () => {
            document.getElementById('addIncomeModal')?.classList.remove('active');
        });
    }

    // Set Budget Form
    const budgetForm = document.getElementById('setBudgetForm');
    if (budgetForm) {
        budgetForm.addEventListener('submit', (e) => {
            e.preventDefault();
            checkAdminPermission(() => {
                const categoryId = document.getElementById('budgetCategorySelect').value;
                const amount = parseFloat(document.getElementById('budgetAmount').value);
                state.setBudget(categoryId, amount, currentMonth);
                document.getElementById('setBudgetModal').classList.remove('active');
                budgetForm.reset();
                renderAllViews();
            });
        });
    }

    // Add Goal Form
    const goalForm = document.getElementById('addGoalForm');
    if (goalForm) {
        goalForm.addEventListener('submit', (e) => {
            e.preventDefault();
            checkAdminPermission(() => {
                const title = document.getElementById('goalTitle').value;
                const targetAmount = parseFloat(document.getElementById('goalTarget').value);
                const currentAmount = parseFloat(document.getElementById('goalCurrent').value || 0);
                const targetDate = document.getElementById('goalDate').value;
                const icon = document.getElementById('goalIcon').value || '🎯';

                state.addGoal({ title, target_amount: targetAmount, current_amount: currentAmount, target_date: targetDate, icon });
                document.getElementById('addGoalModal').classList.remove('active');
                goalForm.reset();
                renderAllViews();
            });
        });
    }

    // Deposit Form
    const depositForm = document.getElementById('depositForm');
    if (depositForm) {
        depositForm.addEventListener('submit', (e) => {
            e.preventDefault();
            checkAdminPermission(() => {
                const goalId = document.getElementById('depositGoalId').value;
                const amount = parseFloat(document.getElementById('depositAmount').value);
                state.depositToGoal(goalId, amount);
                document.getElementById('depositModal').classList.remove('active');
                depositForm.reset();
                renderAllViews();
            });
        });
    }

    // Add Recurring Form
    const recForm = document.getElementById('addRecurringForm');
    if (recForm) {
        recForm.addEventListener('submit', (e) => {
            e.preventDefault();
            checkAdminPermission(() => {
                const title = document.getElementById('recTitle').value;
                const categoryId = parseInt(document.getElementById('recurringCategorySelect').value);
                const amount = parseFloat(document.getElementById('recAmount').value);
                const billingCycle = document.getElementById('recCycle').value;
                const nextDueDate = document.getElementById('recDueDate').value;
                const paymentMethod = document.getElementById('recPaymentMethod').value;

                state.addRecurring({ title, category_id: categoryId, amount, billing_cycle: billingCycle, next_due_date: nextDueDate, payment_method: paymentMethod, status: 'active' });
                document.getElementById('addRecurringModal').classList.remove('active');
                recForm.reset();
                renderAllViews();
            });
        });
    }

    // Settings Form
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            checkAdminPermission(() => {
                const profile = state.getProfile();
                profile.monthly_income = parseFloat(document.getElementById('settingsIncome').value) || 0;
                profile.overall_budget = parseFloat(document.getElementById('settingsBudget').value) || 0;
                profile.currency_symbol = document.getElementById('settingsCurrency').value;
                profile.student_mode = document.getElementById('settingsStudentMode').checked;

                state.saveProfile(profile);
                alert('Budget settings saved directly into your Chrome local storage!');
                renderAllViews();
            });
        });
    }

    // Change Admin PIN Form
    const changePinForm = document.getElementById('changePinForm');
    if (changePinForm) {
        changePinForm.addEventListener('submit', (e) => {
            e.preventDefault();
            checkAdminPermission(() => {
                const newPin = document.getElementById('newAdminPin').value;
                if (state.setAdminPin(newPin)) {
                    alert(`Admin PIN updated to: "${newPin}". Keep this PIN safe!`);
                    document.getElementById('newAdminPin').value = '';
                    renderSettings();
                }
            });
        });
    }

    // Add Custom Category Form
    const addCategoryForm = document.getElementById('addCategoryForm');
    if (addCategoryForm) {
        addCategoryForm.addEventListener('submit', (e) => {
            e.preventDefault();
            checkAdminPermission(() => {
                const name = document.getElementById('newCatName').value;
                const icon = document.getElementById('newCatIcon').value || '🏷️';
                const type = document.getElementById('newCatType').value || 'expense';

                state.addCategory({ name, icon, type, color: '#4f46e5' });
                alert(`New Category "${name}" added to Chrome local storage without code changes!`);
                addCategoryForm.reset();
                populateCategoryDropdowns();
                renderAllViews();
            });
        });
    }

    // Wipe / Clear All Data
    const wipeDataBtn = document.getElementById('wipeAllDataBtn');
    if (wipeDataBtn) {
        wipeDataBtn.addEventListener('click', () => {
            checkAdminPermission(() => {
                if (confirm('Are you sure you want to wipe all transaction and budget data from your browser?')) {
                    state.wipeAllData();
                    renderAllViews();
                    alert('All data wiped clean from Chrome local storage.');
                }
            });
        });
    }

    // Export Backup JSON
    const exportJsonBtn = document.getElementById('exportBackupJsonBtn');
    if (exportJsonBtn) {
        exportJsonBtn.addEventListener('click', () => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(state.exportBackupJSON());
            const dlAnchor = document.createElement('a');
            dlAnchor.setAttribute("href", dataStr);
            dlAnchor.setAttribute("download", `student_expense_backup_${new Date().toISOString().split('T')[0]}.json`);
            dlAnchor.click();
        });
    }

    // Import Backup JSON
    const importInput = document.getElementById('importBackupFileInput');
    if (importInput) {
        importInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(evt) {
                checkAdminPermission(() => {
                    const success = state.importBackupJSON(evt.target.result);
                    if (success) {
                        alert('Backup successfully restored to Chrome local storage!');
                        populateCategoryDropdowns();
                        renderAllViews();
                    } else {
                        alert('Invalid backup file. Please upload a valid JSON backup.');
                    }
                });
            };
            reader.readAsText(file);
        });
    }

    // Transaction search & filters
    ['txSearchInput', 'txCatFilter', 'txNeedFilter', 'txMethodFilter'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', renderFullTransactionsTable);
            el.addEventListener('change', renderFullTransactionsTable);
        }
    });

    // Progressive Dashboard toggle
    const progToggle = document.getElementById('progressiveToggleBtn');
    if (progToggle) {
        progToggle.addEventListener('click', () => {
            isProgressiveMinimal = !isProgressiveMinimal;
            const advancedSection = document.getElementById('advancedDashboardWidgets');
            if (advancedSection) {
                advancedSection.style.display = isProgressiveMinimal ? 'none' : 'block';
            }
            progToggle.textContent = isProgressiveMinimal ? '⚡ Switch to Full View' : '✨ Beginner Minimal View';
        });
    }

    // Export to CSV
    const exportBtn = document.getElementById('exportCsvBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportTransactionsToCSV);
    }
}

/**
 * Handlers called directly from HTML buttons
 */
window.handleDeleteTransaction = function(id) {
    checkAdminPermission(() => {
        if (confirm('Delete this transaction?')) {
            state.deleteTransaction(id);
            renderAllViews();
        }
    });
};

window.handleDeleteBudget = function(id) {
    checkAdminPermission(() => {
        if (confirm('Remove this category budget?')) {
            state.deleteBudget(id);
            renderAllViews();
        }
    });
};

window.handleDeleteGoal = function(id) {
    checkAdminPermission(() => {
        if (confirm('Delete this savings goal?')) {
            state.deleteGoal(id);
            renderAllViews();
        }
    });
};

window.handleOpenDepositModal = function(id, title) {
    checkAdminPermission(() => {
        document.getElementById('depositGoalId').value = id;
        document.getElementById('depositGoalTitle').textContent = title;
        document.getElementById('depositModal').classList.add('active');
    });
};

window.handleDeleteRecurring = function(id) {
    checkAdminPermission(() => {
        if (confirm('Delete this recurring subscription?')) {
            state.deleteRecurring(id);
            renderAllViews();
        }
    });
};

window.handleDeleteCategory = function(id) {
    checkAdminPermission(() => {
        if (confirm('Delete this category?')) {
            state.deleteCategory(id);
            populateCategoryDropdowns();
            renderAllViews();
        }
    });
};

/**
 * CSV Export
 */
function exportTransactionsToCSV() {
    const trans = state.getTransactions();
    if (trans.length === 0) {
        alert('No transactions to export.');
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,Date,Type,Category,Note,Need/Want,Payment Method,Amount\n";
    trans.forEach(t => {
        const cat = state.getCategoryById(t.category_id);
        const nw = t.type === 'expense' ? (parseInt(t.is_need) === 1 ? 'Need' : 'Want') : 'Income';
        csvContent += `"${t.date}","${t.type}","${cat.name}","${t.note || ''}","${nw}","${t.payment_method}","${t.amount}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `student_expenses_${currentMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
