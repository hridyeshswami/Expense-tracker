-- ====================================================================
-- STUDENT EXPENSE TRACKER — RELATIONAL DATABASE SCHEMA & VIEWS
-- PBL (Project-Based Learning) College Submission
-- Compatible with: MySQL 5.7+, MySQL 8.0+, MariaDB (XAMPP / phpMyAdmin)
-- Normalization: 3rd Normal Form (3NF) with Strict Foreign Keys
-- ====================================================================

CREATE DATABASE IF NOT EXISTS `student_expense_tracker` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `student_expense_tracker`;

SET FOREIGN_KEY_CHECKS = 0;

-- Drop views if exist
DROP VIEW IF EXISTS `vw_upcoming_bills`;
DROP VIEW IF EXISTS `vw_budget_health`;
DROP VIEW IF EXISTS `vw_category_spending_report`;
DROP VIEW IF EXISTS `vw_student_monthly_summary`;

-- Drop tables if re-importing
DROP TABLE IF EXISTS `recurring_expenses`;
DROP TABLE IF EXISTS `savings_goals`;
DROP TABLE IF EXISTS `budgets`;
DROP TABLE IF EXISTS `transactions`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `users`;

-- ====================================================================
-- TABLE 1: USERS (Admin / Student Account & Budget Baseline)
-- ====================================================================
CREATE TABLE `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `monthly_income` DECIMAL(10, 2) DEFAULT 0.00,
    `overall_budget` DECIMAL(10, 2) DEFAULT 0.00,
    `currency_symbol` VARCHAR(10) DEFAULT '₹',
    `student_mode` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ====================================================================
-- TABLE 2: CATEGORIES (Customizable Student Spending Categories)
-- ====================================================================
CREATE TABLE `categories` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(80) NOT NULL,
    `type` ENUM('expense', 'income') NOT NULL DEFAULT 'expense',
    `icon` VARCHAR(50) DEFAULT '🏷️',
    `color` VARCHAR(20) DEFAULT '#4f46e5',
    `is_student_default` TINYINT(1) DEFAULT 1,
    INDEX `idx_categories_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ====================================================================
-- TABLE 3: TRANSACTIONS (Financial Ledger with Need/Want & Payment Mode)
-- ====================================================================
CREATE TABLE `transactions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `category_id` INT NOT NULL,
    `type` ENUM('expense', 'income') NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `is_need` TINYINT(1) DEFAULT 1 COMMENT '1 = Essential Need, 0 = Discretionary Want',
    `payment_method` ENUM('UPI', 'Cash', 'Card', 'Net Banking') DEFAULT 'UPI',
    `note` VARCHAR(255) DEFAULT '',
    `transaction_date` DATE NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_trans_user_date` (`user_id`, `transaction_date`),
    INDEX `idx_trans_category` (`category_id`),
    CONSTRAINT `fk_trans_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_trans_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ====================================================================
-- TABLE 4: BUDGETS (Category Monthly Spending Allocations)
-- ====================================================================
CREATE TABLE `budgets` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `category_id` INT NOT NULL,
    `month_year` VARCHAR(7) NOT NULL COMMENT 'Format: YYYY-MM (e.g. 2026-10)',
    `allocated_amount` DECIMAL(10, 2) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_user_category_month` (`user_id`, `category_id`, `month_year`),
    INDEX `idx_budget_month` (`month_year`),
    CONSTRAINT `fk_budget_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_budget_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ====================================================================
-- TABLE 5: SAVINGS_GOALS (Long-Term Student Targets & Deadlines)
-- ====================================================================
CREATE TABLE `savings_goals` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `target_amount` DECIMAL(10, 2) NOT NULL,
    `current_amount` DECIMAL(10, 2) DEFAULT 0.00,
    `target_date` DATE NOT NULL,
    `icon` VARCHAR(50) DEFAULT '🎯',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_goals_user` (`user_id`),
    CONSTRAINT `fk_goals_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ====================================================================
-- TABLE 6: RECURRING_EXPENSES (Subscriptions & Regular Bills)
-- ====================================================================
CREATE TABLE `recurring_expenses` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `category_id` INT NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `billing_cycle` ENUM('monthly', 'quarterly', 'yearly') DEFAULT 'monthly',
    `next_due_date` DATE NOT NULL,
    `payment_method` ENUM('UPI', 'Cash', 'Card', 'Net Banking') DEFAULT 'UPI',
    `status` ENUM('active', 'paused') DEFAULT 'active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_recurring_due` (`next_due_date`, `status`),
    CONSTRAINT `fk_rec_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_rec_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- ====================================================================
-- RELATIONAL SQL VIEWS (Demonstrating Advanced Database Design for PBL)
-- ====================================================================

-- View 1: Monthly Financial Summary (Total Income, Total Expense, Net Balance)
CREATE OR REPLACE VIEW `vw_student_monthly_summary` AS
SELECT 
    t.user_id,
    DATE_FORMAT(t.transaction_date, '%Y-%m') AS month_year,
    SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) AS total_income,
    SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) AS total_expense,
    (SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) - 
     SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END)) AS net_savings,
    SUM(CASE WHEN t.type = 'expense' AND t.is_need = 1 THEN t.amount ELSE 0 END) AS needs_total,
    SUM(CASE WHEN t.type = 'expense' AND t.is_need = 0 THEN t.amount ELSE 0 END) AS wants_total
FROM `transactions` t
GROUP BY t.user_id, DATE_FORMAT(t.transaction_date, '%Y-%m');

-- View 2: Category Spending Report with Icons and Total Spent
CREATE OR REPLACE VIEW `vw_category_spending_report` AS
SELECT 
    t.user_id,
    c.id AS category_id,
    c.name AS category_name,
    c.icon AS category_icon,
    c.color AS category_color,
    DATE_FORMAT(t.transaction_date, '%Y-%m') AS month_year,
    COUNT(t.id) AS transaction_count,
    SUM(t.amount) AS total_spent
FROM `transactions` t
JOIN `categories` c ON t.category_id = c.id
WHERE t.type = 'expense'
GROUP BY t.user_id, c.id, c.name, c.icon, c.color, DATE_FORMAT(t.transaction_date, '%Y-%m');

-- View 3: Budget Health Analysis (Under Control, Getting Close, Exceeded)
CREATE OR REPLACE VIEW `vw_budget_health` AS
SELECT 
    b.id AS budget_id,
    b.user_id,
    b.month_year,
    c.name AS category_name,
    c.icon AS category_icon,
    b.allocated_amount,
    COALESCE(SUM(t.amount), 0) AS spent_amount,
    (b.allocated_amount - COALESCE(SUM(t.amount), 0)) AS remaining_amount,
    ROUND((COALESCE(SUM(t.amount), 0) / b.allocated_amount) * 100, 1) AS utilization_pct,
    CASE 
        WHEN (COALESCE(SUM(t.amount), 0) / b.allocated_amount) > 0.95 THEN 'Exceeded'
        WHEN (COALESCE(SUM(t.amount), 0) / b.allocated_amount) >= 0.70 THEN 'Getting Close'
        ELSE 'Under Control'
    END AS health_status
FROM `budgets` b
JOIN `categories` c ON b.category_id = c.id
LEFT JOIN `transactions` t ON t.category_id = b.category_id 
    AND t.user_id = b.user_id 
    AND t.type = 'expense' 
    AND DATE_FORMAT(t.transaction_date, '%Y-%m') = b.month_year
GROUP BY b.id, b.user_id, b.month_year, c.name, c.icon, b.allocated_amount;

-- View 4: Upcoming Due Subscriptions & Bill Reminders
CREATE OR REPLACE VIEW `vw_upcoming_bills` AS
SELECT 
    r.id,
    r.user_id,
    r.title,
    c.name AS category_name,
    c.icon AS category_icon,
    r.amount,
    r.billing_cycle,
    r.payment_method,
    r.next_due_date,
    DATEDIFF(r.next_due_date, CURDATE()) AS days_until_due,
    CASE 
        WHEN DATEDIFF(r.next_due_date, CURDATE()) < 0 THEN 'Overdue'
        WHEN DATEDIFF(r.next_due_date, CURDATE()) <= 3 THEN 'Due Soon'
        ELSE 'Upcoming'
    END AS urgency_status
FROM `recurring_expenses` r
JOIN `categories` c ON r.category_id = c.id
WHERE r.status = 'active';

-- ====================================================================
-- INITIAL SEED DATA (Standard Student Categories & Admin Account)
-- ZERO dummy transactions or budgets. 100% ready for user entry.
-- ====================================================================

-- Insert Default Admin User (Password: admin123)
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `monthly_income`, `overall_budget`, `currency_symbol`, `student_mode`)
VALUES (
    1, 
    'Student Admin', 
    'admin@college.edu', 
    '$2y$10$wT7R1Q9e8oV8YjM2kR0C8.zT5Nfx6A8vE.Qp9Uq6Y3lR8Vf4XvG3W', 
    0.00, 
    0.00, 
    '₹', 
    1
);

-- Insert Standard Student Mode Categories (Admin can add/remove categories without code)
INSERT INTO `categories` (`id`, `name`, `type`, `icon`, `color`, `is_student_default`) VALUES
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

-- All transaction, budget, goal, and recurring tables start empty (0 dummy records).
