# 🎓 Student Expense Tracker (All-in-One Finance & Budget Prototype)
### *Competitor Research & Improvement Areas Implementation*
**Prepared for College PBL (Project-Based Learning) Project Submission & Viva**

---

## 🌟 1. Project Overview & Core USP

> **Core USP (Slide 19):**  
> *"A simple, student-friendly expense tracker that records spending and explains what the user can do next."*

Most commercial expense trackers (such as YNAB, Monarch, Goodbudget, and Toshl) are built for salaried professionals with complex bank syncs, investment tracking, and steep learning curves. 

This prototype directly implements the improvements identified across **10 competitor platforms** in the research report, prioritizing speed, Indian student workflows (UPI & Cash), and actionable daily limits.

---

## 🚀 2. Two Running Modes (Dual Architecture)

To give you the best of both worlds for your project demonstration:

1. **Instant Browser Prototype (Zero Setup / Ready Now)**:
   - Built with **HTML5, modern CSS3, Vanilla JavaScript, and Chart.js**.
   - Runs immediately in any browser using persistent browser `localStorage`.
   - **Zero Dummy Data**: Starts completely clean at ₹0. Only the Admin can add, edit, or delete transactions, budgets, goals, and categories without any code changes!
   - Zero software installation needed!

2. **Official College PBL Backend (PHP + MySQL)**:
   - Located in the `backend/` folder.
   - Clean `database.sql` with relational tables and zero dummy records.
   - Modular REST API endpoints (`auth.php`, `transactions.php`, `budgets.php`, `goals.php`, `recurring.php`, `insights.php`).
   - Ready to import into **XAMPP / phpMyAdmin / Apache** for formal project submission, code defense, and viva examination!

---

## 🎯 3. Feature Mapping to Your Presentation Slides

| # | Proposed Feature | Slide | Implementation Details |
|---|---|---|---|
| **01** | **Student Mode** | Slide 4, 15 | Dedicated student categories: *Food & Canteen, Transport & Bus Pass, College & Tuition, Books & Stationery, Mobile & WiFi, Shopping, Entertainment, Hostel Rent*. Admin can add/remove categories without code! |
| **02** | **Smart Daily Spending Limit** | Slide 6, 15, 17 | $\text{Daily Limit} = \frac{\text{Remaining Budget}}{\text{Remaining Days in Month}}$. Updates automatically in real time as the Admin records expenses! |
| **03** | **Plain-Language Spending Insights** | Slide 15 | AI-style text cards explaining habits in clear English based on real student entries. |
| **04** | **Budget Health Indicator** | Slide 7, 15 | Category status badges: <br>🟢 **Under Control** (&lt;70%) <br>🟡 **Getting Close** (70–95%) <br>🔴 **Exceeded** (&gt;95%) |
| **05** | **Need vs Want Analysis** | Slide 15 | 1-click toggle on expense entry classifying purchases into essential *Needs* or discretionary *Wants*, visualized in an interactive donut chart. |
| **06** | **Payment Method Breakdown** | Slide 10, 15 | Tracks spending by **UPI**, **Cash**, **Debit Card**, and **Net Banking** with a dedicated bar chart. |
| **07** | **Monthly Financial Summary** | Slide 8, 17 | Dashboard cards: Total Balance, Monthly Income, Expenses, Budget Remaining, Top Category. Starts at ₹0 until real data is logged. |
| **08** | **Savings Goal Tracker** | Slide 15, 17 | Target amount, current savings, percentage progress bar, and required monthly saving estimation (e.g. Coding Laptop Upgrade ₹12k / ₹30k). |
| **09** | **Recurring Expense Reminders** | Slide 15 | Subscriptions & recurring bills (WiFi, Spotify, Bus Pass) with due dates and urgency tags (*Due Soon*, *Upcoming*, *Overdue*). |
| **10** | **Progressive Dashboard** | Slide 12, 15 | Button to toggle between **Beginner Minimal View** (cards only) and **Full View** with all transaction tables and charts. |

---

## 💻 4. How to Run the Prototype

### Option A: Instant Run (Double-Click or Local Server)
Simply double-click `index.html` in your file explorer, OR run a quick local server using Python:
```powershell
cd C:\Users\LENOVO\.gemini\antigravity\scratch\student-expense-tracker
python -m http.server 8000
```
Then open: [http://localhost:8000](http://localhost:8000)

### Option B: Run with PHP & MySQL (XAMPP for College Submission)
1. Copy the `student-expense-tracker` folder to `C:\xampp\htdocs\`.
2. Start **Apache** and **MySQL** in XAMPP Control Panel.
3. Open `http://localhost/phpmyadmin` and import `backend/database.sql`.
4. Detailed setup and viva instructions are provided in `backend/README.md`.

---

## 📁 5. Complete Self-Contained Project Directory Structure

```
student-expense-tracker/
├── index.html                   # Main responsive single-page application (All-in-One)
├── Start_Expense_Tracker.bat    # 1-click launcher to open the app directly in browser
├── Run_Server.bat               # 1-click launcher for local server (port 8000)
├── README.md                    # Project documentation & presentation guide
├── DATABASE_DESIGN_REPORT.md    # Complete 3NF database architecture & viva documentation
├── css/
│   └── style.css                # Custom CSS design system (cards, badges, modals, themes)
├── js/
│   ├── state.js                 # State & Chrome localStorage persistence (clean ₹0 initial state)
│   ├── calculations.js          # Safe-to-spend formula & plain insights engine
│   ├── charts.js                # Chart.js visualizations (Needs/Wants, Categories, Methods)
│   ├── database.js              # In-browser SQL workbench, live table views & SQL dump export
│   └── app.js                   # UI controllers, Admin auth, tab switching & event listeners
└── backend/
    ├── README.md                # Comprehensive XAMPP guide, API reference & Viva Q&A
    ├── database.sql             # MySQL/MariaDB 3NF schema, 4 views & default categories
    ├── database_sqlite.sql      # SQLite 3 schema & views
    ├── config/
    │   └── db.php               # PDO database connection & CORS handler
    └── api/
        ├── auth.php             # User login, registration & profile API
        ├── transactions.php     # Expense & Income CRUD + filters
        ├── budgets.php          # Category budgets & health indicator logic
        ├── goals.php            # Savings goal progress & deposit tracking
        ├── recurring.php        # Subscriptions & upcoming due dates
        └── insights.php         # Server-side insights & safe daily limit engine
```
