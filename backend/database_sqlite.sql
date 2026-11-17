-- ====================================================================
-- STUDENT EXPENSE TRACKER — SQLITE DATABASE SCHEMA & VIEWS
-- Compatible with: SQLite 3, DB Browser for SQLite, Python sqlite3
-- Standalone, zero-configuration local database format
-- ====================================================================

PRAGMA foreign_keys = ON;

-- Drop tables if re-initializing
DROP TABLE IF EXISTS recurring_expenses;
DROP TABLE IF EXISTS savings_goals;
DROP TABLE IF EXISTS budgets;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

-- 1. USERS TABLE
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    monthly_income REAL DEFAULT 0.00,
    overall_budget REAL DEFAULT 0.00,
    currency_symbol TEXT DEFAULT '₹',
    student_mode INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. CATEGORIES TABLE
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT CHECK(type IN ('expense', 'income')) DEFAULT 'expense',
    icon TEXT DEFAULT '🏷️',
    color TEXT DEFAULT '#4f46e5',
    is_student_default INTEGER DEFAULT 1
);

-- 3. TRANSACTIONS TABLE
CREATE TABLE transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    type TEXT CHECK(type IN ('expense', 'income')) NOT NULL,
    amount REAL NOT NULL,
    is_need INTEGER DEFAULT 1 CHECK(is_need IN (0, 1)),
    payment_method TEXT CHECK(payment_method IN ('UPI', 'Cash', 'Card', 'Net Banking')) DEFAULT 'UPI',
    note TEXT DEFAULT '',
    transaction_date TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE RESTRICT
);

-- 4. BUDGETS TABLE
CREATE TABLE budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    month_year TEXT NOT NULL, -- Format: YYYY-MM
    allocated_amount REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, category_id, month_year),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
);

-- 5. SAVINGS_GOALS TABLE
CREATE TABLE savings_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    target_amount REAL NOT NULL,
    current_amount REAL DEFAULT 0.00,
    target_date TEXT NOT NULL,
    icon TEXT DEFAULT '🎯',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- 6. RECURRING_EXPENSES TABLE
CREATE TABLE recurring_expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    category_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    billing_cycle TEXT CHECK(billing_cycle IN ('monthly', 'quarterly', 'yearly')) DEFAULT 'monthly',
    next_due_date TEXT NOT NULL,
    payment_method TEXT CHECK(payment_method IN ('UPI', 'Cash', 'Card', 'Net Banking')) DEFAULT 'UPI',
    status TEXT CHECK(status IN ('active', 'paused')) DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE RESTRICT
);

-- ====================================================================
-- SQLITE VIEWS
-- ====================================================================

-- View 1: Monthly Financial Summary
CREATE VIEW IF NOT EXISTS vw_student_monthly_summary AS
SELECT 
    t.user_id,
    strftime('%Y-%m', t.transaction_date) AS month_year,
    SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) AS total_income,
    SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) AS total_expense,
    (SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) - 
     SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END)) AS net_savings,
    SUM(CASE WHEN t.type = 'expense' AND t.is_need = 1 THEN t.amount ELSE 0 END) AS needs_total,
    SUM(CASE WHEN t.type = 'expense' AND t.is_need = 0 THEN t.amount ELSE 0 END) AS wants_total
FROM transactions t
GROUP BY t.user_id, strftime('%Y-%m', t.transaction_date);

-- View 2: Category Spending Report
CREATE VIEW IF NOT EXISTS vw_category_spending_report AS
SELECT 
    t.user_id,
    c.id AS category_id,
    c.name AS category_name,
    c.icon AS category_icon,
    c.color AS category_color,
    strftime('%Y-%m', t.transaction_date) AS month_year,
    COUNT(t.id) AS transaction_count,
    SUM(t.amount) AS total_spent
FROM transactions t
JOIN categories c ON t.category_id = c.id
WHERE t.type = 'expense'
GROUP BY t.user_id, c.id, strftime('%Y-%m', t.transaction_date);

-- ====================================================================
-- INITIAL DATA (Clean Slate)
-- ====================================================================
INSERT INTO users (id, name, email, password_hash, monthly_income, overall_budget, currency_symbol, student_mode)
VALUES (1, 'Student Admin', 'admin@college.edu', '$2y$10$wT7R1Q9e8oV8YjM2kR0C8.zT5Nfx6A8vE.Qp9Uq6Y3lR8Vf4XvG3W', 0.00, 0.00, '₹', 1);

INSERT INTO categories (id, name, type, icon, color, is_student_default) VALUES
(1, 'Food & Canteen', 'expense', '🍔', '#f97316', 1),
(2, 'Transport & Bus Pass', 'expense', '🚌', '#0ea5e9', 1),
(3, 'College & Tuition', 'expense', '🎓', '#8b5cf6', 1),
(4, 'Books & Stationery', 'expense', '📚', '#10b981', 1),
(5, 'Mobile Recharge & WiFi', 'expense', '📱', '#6366f1', 1),
(6, 'Shopping & Personal', 'expense', '🛍️', '#ec4899', 1),
(7, 'Entertainment & Outings', 'expense', '🎮', '#eab308', 1),
(8, 'Hostel & Room Rent', 'expense', '🏠', '#14b8a6', 1),
(9, 'Monthly Allowance', 'income', '💰', '#22c55e', 1),
(10, 'Part-Time Tutoring', 'income', '💼', '#10b981', 1);
