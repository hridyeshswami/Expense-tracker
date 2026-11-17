# 🎓 Student Expense Tracker — PHP & MySQL Backend Guide

> **Prepared for College PBL Project Evaluation & Viva**  
> Technology: **PHP 7.4+ / 8.x + MySQL / MariaDB (XAMPP Compatible)**  
> Architecture: RESTful JSON API endpoints, Session-ready PDO connection, BCrypt password hashing.

---

## 🗄️ 1. Database Setup Instructions (XAMPP / phpMyAdmin)

1. **Start Apache & MySQL**:
   - Open the **XAMPP Control Panel**.
   - Click **Start** for both `Apache` and `MySQL`.
2. **Open phpMyAdmin**:
   - In your browser, open [http://localhost/phpmyadmin](http://localhost/phpmyadmin).
3. **Import `database.sql`**:
   - Click on the **Import** tab at the top.
   - Choose the file: `backend/database.sql`.
   - Click **Go** / **Import** at the bottom.
   - The `student_expense_tracker` database will be created with all 6 tables in a completely clean state (zero dummy records). All data can be added dynamically by the Admin.

---

## 🚀 2. Deploying the Backend on XAMPP

1. Copy the `student-expense-tracker` project folder into your XAMPP web root:
   ```
   C:\xampp\htdocs\student-expense-tracker
   ```
2. Verify the database credentials in `backend/config/db.php`:
   ```php
   $db_host = "localhost";
   $db_name = "student_expense_tracker";
   $db_user = "root";
   $db_pass = ""; // default is empty in XAMPP
   ```
3. Test the API in your browser or Postman:
   - Profile: `http://localhost/student-expense-tracker/backend/api/auth.php?action=profile&user_id=1`
   - Insights: `http://localhost/student-expense-tracker/backend/api/insights.php?user_id=1`
   - Transactions: `http://localhost/student-expense-tracker/backend/api/transactions.php?user_id=1`

---

## 📡 3. REST API Endpoints Reference

| Endpoint | Method | Description | Slide Reference |
| :--- | :--- | :--- | :--- |
| `/api/auth.php?action=login` | `POST` | User login with hashed verification | Slide 16 |
| `/api/auth.php?action=register`| `POST` | Register a new student profile | Slide 16 |
| `/api/auth.php?action=profile` | `GET` | Get current user financial overview | Slide 16 |
| `/api/transactions.php` | `GET` | Get filtered transaction list | Slide 10, 16 |
| `/api/transactions.php` | `POST` | Record Quick Expense / Income | Slide 11, 16 |
| `/api/transactions.php?id=X` | `DELETE`| Remove a transaction | Slide 16 |
| `/api/budgets.php` | `GET` | Category budgets with Health Status | Slide 6, 14, 15 |
| `/api/budgets.php` | `POST` | Set monthly category limit | Slide 4, 15 |
| `/api/goals.php` | `GET` | Savings goals + daily saving needed | Slide 15, 17 |
| `/api/goals.php` | `PUT` | Deposit savings to goal | Slide 15 |
| `/api/recurring.php` | `GET` | Subscriptions & upcoming due dates | Slide 15 |
| `/api/insights.php` | `GET` | Safe-to-Spend-Today & Plain Insights| Slide 6, 15, 17 |

---

## 💡 4. Key PBL Algorithm Details

### A. Smart Daily Spending Limit (Safe-to-Spend-Today)
$$\text{Daily Limit} = \frac{\text{Remaining Monthly Budget}}{\text{Days Remaining in Month}}$$
- *Example:* If budget remaining is ₹8,500 and 20 days remain, safe daily limit = ₹425/day.

### B. Budget Health Indicator
- **Under Control** (Green): Spent $< 70\%$ of budget
- **Getting Close** (Amber): Spent between $70\%$ and $95\%$
- **Exceeded** (Red): Spent $> 95\%$ or over limit

### C. Need vs Want Split
- Classifies each student transaction (Mess vs Cafe, Textbooks vs Cinema) to give a healthy $70/30$ or $80/20$ guidance.

---

## 🎓 5. Sample Viva Questions & Model Answers

**Q1: Why did you choose to build a student-specific expense tracker rather than using YNAB or Monefy?**  
*Answer:* As demonstrated in our competitor research (Slides 4-13), apps like YNAB and Monarch are overly complex, paid, and require complex bank syncing. Students primarily need fast manual entry, UPI/Cash logging, Safe-to-Spend daily guidance, and student-focused categories like Canteen, Books, and Bus Pass.

**Q2: How does the Safe-to-Spend calculation adapt when an expense is recorded?**  
*Answer:* The backend subtracts the expense from the remaining monthly budget and recalculates the quotient over the remaining days in the billing cycle in real-time.

**Q3: How are passwords stored in the database?**  
*Answer:* Using PHP's `password_hash()` with the industry-standard `PASSWORD_BCRYPT` algorithm, ensuring salted, one-way cryptographic protection against rainbow table attacks.
