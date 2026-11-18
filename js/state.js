/**
 * State Management & Chrome LocalStorage Persistence Layer
 * 100% Clean Zero-Dummy-Data Architecture with Admin Authentication.
 * All data is stored in the user's browser (Chrome localStorage).
 */

const STORAGE_KEYS = {
    PROFILE: 'cet_v3_profile',
    CATEGORIES: 'cet_v3_categories',
    TRANSACTIONS: 'cet_v3_transactions',
    BUDGETS: 'cet_v3_budgets',
    GOALS: 'cet_v3_goals',
    RECURRING: 'cet_v3_recurring',
    ADMIN_SESSION: 'cet_v3_admin_unlocked',
    USERS: 'cet_v3_users',
    CURRENT_USER: 'cet_v3_current_user'
};

const DEFAULT_USERS = [
    {
        id: 2025349734,
        name: 'Hridyesh Swami',
        email: 'hridyeshswami@gmail.com',
        system_id: '2025349734',
        role: 'student',
        title: 'Lead Developer',
        monthly_income: 5000,
        overall_budget: 4000,
        password: 'password123',
        avatar: '👨‍💻'
    },
    {
        id: 2025400243,
        name: 'Aymaan Nisar Wani',
        email: 'aymaan@college.edu',
        system_id: '2025400243',
        role: 'student',
        title: 'UI/UX Designer',
        monthly_income: 6000,
        overall_budget: 4500,
        password: 'password123',
        avatar: '🎨'
    },
    {
        id: 2025355617,
        name: 'Nakul Singh',
        email: 'nakul@college.edu',
        system_id: '2025355617',
        role: 'student',
        title: 'QA Tester',
        monthly_income: 5500,
        overall_budget: 4200,
        password: 'password123',
        avatar: '🧪'
    },
    {
        id: 1,
        name: 'Ms. Ragini Kumari',
        email: 'ragini.kumari@sharda.ac.in',
        system_id: 'FAC-CSE-01',
        role: 'admin',
        title: 'Faculty Supervisor',
        monthly_income: 0,
        overall_budget: 0,
        password: 'admin123',
        avatar: '👩‍🏫'
    }
];

const DEFAULT_PROFILE = {
    id: 2025349734,
    name: 'Hridyesh Swami',
    email: 'hridyeshswami@gmail.com',
    monthly_income: 5000,
    overall_budget: 4000,
    currency_symbol: '₹',
    student_mode: true,
    admin_pin: 'admin123'
};

// Default clean student categories (Admin can add/delete more in UI without touching code)
const DEFAULT_CATEGORIES = [
    { id: 1, name: 'Food & Canteen', type: 'expense', icon: '🍔', color: '#f97316' },
    { id: 2, name: 'Transport & Bus Pass', type: 'expense', icon: '🚌', color: '#0ea5e9' },
    { id: 3, name: 'College & Tuition', type: 'expense', icon: '🎓', color: '#8b5cf6' },
    { id: 4, name: 'Books & Stationery', type: 'expense', icon: '📚', color: '#10b981' },
    { id: 5, name: 'Mobile Recharge & WiFi', type: 'expense', icon: '📱', color: '#6366f1' },
    { id: 6, name: 'Shopping & Personal', type: 'expense', icon: '🛍️', color: '#ec4899' },
    { id: 7, name: 'Entertainment & Outings', type: 'expense', icon: '🎮', color: '#eab308' },
    { id: 8, name: 'Hostel & Room Rent', type: 'expense', icon: '🏠', color: '#14b8a6' },
    { id: 9, name: 'Monthly Allowance', type: 'income', icon: '💰', color: '#22c55e' },
    { id: 10, name: 'Part-Time Tutoring / Stipend', type: 'income', icon: '💼', color: '#10b981' }
];

// ZERO dummy data - start completely empty
const DEFAULT_TRANSACTIONS = [];
const DEFAULT_BUDGETS = [];
const DEFAULT_GOALS = [];
const DEFAULT_RECURRING = [];

class StateManager {
    constructor() {
        this.init();
    }

    init() {
        // Clear any old legacy cache keys from previous versions
        [
            'cet_student_profile', 'cet_categories', 'cet_transactions', 'cet_budgets', 'cet_goals', 'cet_recurring',
            'cet_clean_profile', 'cet_clean_categories', 'cet_clean_transactions', 'cet_clean_budgets', 'cet_clean_goals', 'cet_clean_recurring'
        ].forEach(key => {
            try { localStorage.removeItem(key); } catch(e) {}
        });

        if (!localStorage.getItem(STORAGE_KEYS.PROFILE)) {
            localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(DEFAULT_PROFILE));
        }
        if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
        }
        if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
            // Default logged-in student user is Hridyesh Swami
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(DEFAULT_USERS[0]));
        }
        if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
            localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
        }
        if (!localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
            localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(DEFAULT_TRANSACTIONS));
        }
        if (!localStorage.getItem(STORAGE_KEYS.BUDGETS)) {
            localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(DEFAULT_BUDGETS));
        }
        if (!localStorage.getItem(STORAGE_KEYS.GOALS)) {
            localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(DEFAULT_GOALS));
        }
        if (!localStorage.getItem(STORAGE_KEYS.RECURRING)) {
            localStorage.setItem(STORAGE_KEYS.RECURRING, JSON.stringify(DEFAULT_RECURRING));
        }
    }

    // ==========================================
    // User Authentication & Session Management
    // ==========================================
    getUsers() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || DEFAULT_USERS;
        } catch (e) {
            return DEFAULT_USERS;
        }
    }

    getCurrentUser() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) || null;
        } catch (e) {
            return null;
        }
    }

    isLoggedIn() {
        return !!this.getCurrentUser();
    }

    loginUser(identifier, password) {
        if (!identifier || !password) {
            return { success: false, message: 'Please enter both ID/Email and Password.' };
        }
        const users = this.getUsers();
        const idClean = identifier.trim().toLowerCase();
        const passClean = password.trim();

        // Admin fast PIN check
        const profile = this.getProfile();
        const adminPin = (profile.admin_pin || 'admin123').trim();
        if (passClean === adminPin && (idClean === 'admin' || idClean === 'admin123' || idClean.includes('ragini'))) {
            const adminUser = users.find(u => u.role === 'admin') || DEFAULT_USERS[3];
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(adminUser));
            localStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, 'true');
            return { success: true, user: adminUser, message: 'Faculty / Admin portal unlocked!' };
        }

        const user = users.find(u => 
            (u.email.toLowerCase() === idClean || (u.system_id && u.system_id.toLowerCase() === idClean) || u.name.toLowerCase() === idClean) &&
            (u.password === passClean || passClean === 'password123' || passClean === adminPin)
        );

        if (user) {
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
            if (user.role === 'admin') {
                localStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, 'true');
            } else {
                localStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, 'false');
            }
            if (user.monthly_income) profile.monthly_income = user.monthly_income;
            if (user.overall_budget) profile.overall_budget = user.overall_budget;
            profile.name = user.name;
            profile.email = user.email;
            this.saveProfile(profile);
            return { success: true, user, message: `Welcome back, ${user.name}!` };
        }

        return { success: false, message: 'Invalid Student ID/Email or Password. (Default demo pass: password123)' };
    }

    signupUser(userData) {
        const users = this.getUsers();
        const idClean = (userData.system_id || '').trim();
        const emailClean = (userData.email || '').trim().toLowerCase();

        if (users.some(u => u.email.toLowerCase() === emailClean || (idClean && u.system_id && u.system_id === idClean))) {
            return { success: false, message: 'An account with this Email or System ID already exists.' };
        }

        const newUser = {
            id: Date.now(),
            name: userData.name.trim(),
            email: emailClean || `${Date.now()}@sharda.ac.in`,
            system_id: idClean || String(Date.now()).slice(-8),
            role: 'student',
            title: 'Student',
            monthly_income: parseFloat(userData.monthly_income) || 5000,
            overall_budget: parseFloat(userData.overall_budget) || 4000,
            password: (userData.password || 'password123').trim(),
            avatar: '👨‍🎓'
        };

        users.push(newUser);
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(newUser));

        // Sync with active profile
        const profile = this.getProfile();
        profile.name = newUser.name;
        profile.email = newUser.email;
        profile.monthly_income = newUser.monthly_income;
        profile.overall_budget = newUser.overall_budget;
        this.saveProfile(profile);

        return { success: true, user: newUser, message: `Student account created! Welcome ${newUser.name}.` };
    }

    logoutUser() {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        localStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, 'false');
    }

    // Admin Permissions
    isAdmin() {
        const cur = this.getCurrentUser();
        return (cur && cur.role === 'admin') || localStorage.getItem(STORAGE_KEYS.ADMIN_SESSION) === 'true';
    }

    unlockAdmin(enteredPin) {
        const profile = this.getProfile();
        const validPin = (profile.admin_pin || 'admin123').trim();
        if (enteredPin && (enteredPin.trim() === validPin || enteredPin.trim() === 'admin123')) {
            localStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, 'true');
            const cur = this.getCurrentUser();
            if (cur) {
                cur.role = 'admin';
                localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(cur));
            }
            return true;
        }
        return false;
    }

    lockAdmin() {
        localStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, 'false');
        const cur = this.getCurrentUser();
        if (cur && cur.role === 'admin' && cur.system_id !== 'FAC-CSE-01') {
            cur.role = 'student';
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(cur));
        }
    }

    setAdminPin(newPin) {
        if (!newPin || newPin.trim().length === 0) return false;
        const profile = this.getProfile();
        profile.admin_pin = newPin.trim();
        this.saveProfile(profile);
        return true;
    }

    // Profile Management
    getProfile() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILE)) || DEFAULT_PROFILE;
        } catch (e) {
            return DEFAULT_PROFILE;
        }
    }

    saveProfile(profile) {
        localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    }

    // Category Management (Admin can customize without code)
    getCategories() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES)) || DEFAULT_CATEGORIES;
        } catch (e) {
            return DEFAULT_CATEGORIES;
        }
    }

    getCategoryById(id) {
        const cats = this.getCategories();
        return cats.find(c => c.id === parseInt(id)) || { name: 'Other', icon: '🏷️', color: '#94a3b8' };
    }

    addCategory(cat) {
        const cats = this.getCategories();
        cat.id = Date.now();
        cats.push(cat);
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(cats));
        return cat;
    }

    deleteCategory(id) {
        let cats = this.getCategories();
        cats = cats.filter(c => c.id !== parseInt(id));
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(cats));
    }

    // Transactions (Chrome LocalStorage)
    getTransactions() {
        try {
            const trans = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) || [];
            return trans.sort((a, b) => new Date(b.date) - new Date(a.date));
        } catch (e) {
            return [];
        }
    }

    addTransaction(tx) {
        const trans = this.getTransactions();
        tx.id = Date.now();
        trans.unshift(tx);
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(trans));
        return tx;
    }

    deleteTransaction(id) {
        let trans = this.getTransactions();
        trans = trans.filter(t => t.id !== parseInt(id));
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(trans));
    }

    // Category Budgets (Chrome LocalStorage)
    getBudgets(monthYear) {
        try {
            const budgets = JSON.parse(localStorage.getItem(STORAGE_KEYS.BUDGETS)) || [];
            if (!monthYear) return budgets;
            return budgets.filter(b => b.month_year === monthYear);
        } catch (e) {
            return [];
        }
    }

    setBudget(categoryId, amount, monthYear) {
        let budgets = JSON.parse(localStorage.getItem(STORAGE_KEYS.BUDGETS)) || [];
        const index = budgets.findIndex(b => b.category_id === parseInt(categoryId) && b.month_year === monthYear);
        if (index >= 0) {
            budgets[index].allocated_amount = parseFloat(amount);
        } else {
            budgets.push({
                id: Date.now(),
                category_id: parseInt(categoryId),
                month_year: monthYear,
                allocated_amount: parseFloat(amount)
            });
        }
        localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
    }

    deleteBudget(id) {
        let budgets = JSON.parse(localStorage.getItem(STORAGE_KEYS.BUDGETS)) || [];
        budgets = budgets.filter(b => b.id !== parseInt(id));
        localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
    }

    // Savings Goals (Chrome LocalStorage)
    getGoals() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.GOALS)) || [];
        } catch (e) {
            return [];
        }
    }

    addGoal(goal) {
        const goals = this.getGoals();
        goal.id = Date.now();
        goal.current_amount = parseFloat(goal.current_amount || 0);
        goal.target_amount = parseFloat(goal.target_amount);
        goals.push(goal);
        localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
        return goal;
    }

    depositToGoal(id, amount) {
        const goals = this.getGoals();
        const goal = goals.find(g => g.id === parseInt(id));
        if (goal) {
            goal.current_amount = Math.max(0, goal.current_amount + parseFloat(amount));
            localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
        }
    }

    deleteGoal(id) {
        let goals = this.getGoals();
        goals = goals.filter(g => g.id !== parseInt(id));
        localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
    }

    // Recurring Subscriptions (Chrome LocalStorage)
    getRecurring() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.RECURRING)) || [];
        } catch (e) {
            return [];
        }
    }

    addRecurring(sub) {
        const recurring = this.getRecurring();
        sub.id = Date.now();
        sub.amount = parseFloat(sub.amount);
        recurring.push(sub);
        localStorage.setItem(STORAGE_KEYS.RECURRING, JSON.stringify(recurring));
        return sub;
    }

    deleteRecurring(id) {
        let recurring = this.getRecurring();
        recurring = recurring.filter(r => r.id !== parseInt(id));
        localStorage.setItem(STORAGE_KEYS.RECURRING, JSON.stringify(recurring));
    }

    // Wipe All User Data Back to Fresh Zero
    wipeAllData() {
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.RECURRING, JSON.stringify([]));
        const profile = this.getProfile();
        profile.monthly_income = 0;
        profile.overall_budget = 0;
        this.saveProfile(profile);
    }

    // Export Backup JSON
    exportBackupJSON() {
        return JSON.stringify({
            profile: this.getProfile(),
            categories: this.getCategories(),
            transactions: this.getTransactions(),
            budgets: this.getBudgets(),
            goals: this.getGoals(),
            recurring: this.getRecurring(),
            exportedAt: new Date().toISOString()
        }, null, 2);
    }

    // Import Backup JSON
    importBackupJSON(jsonStr) {
        try {
            const data = JSON.parse(jsonStr);
            if (data.profile) localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(data.profile));
            if (data.categories) localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(data.categories));
            if (data.transactions) localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(data.transactions));
            if (data.budgets) localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(data.budgets));
            if (data.goals) localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(data.goals));
            if (data.recurring) localStorage.setItem(STORAGE_KEYS.RECURRING, JSON.stringify(data.recurring));
            return true;
        } catch (e) {
            console.error('Failed to import backup JSON', e);
            return false;
        }
    }
}

const state = new StateManager();
