/**
 * Database Management & SQL Engine Module
 * Powers the in-browser "🗄️ Database" tab, live SQL inspection, SQL dump generator,
 * query sandbox, and Entity-Relationship (ER) model.
 */

const dbEngine = {
    // Current active table view in the Database tab
    activeTable: 'transactions',

    // Database Table Schemas definition (3NF Relational Model)
    schemas: {
        users: {
            title: 'users',
            primaryKey: 'id',
            description: 'Stores student profile credentials, baseline allowance, and budget settings.',
            columns: [
                { name: 'id', type: 'INT', constraints: 'PRIMARY KEY AUTO_INCREMENT', desc: 'Unique user identifier' },
                { name: 'name', type: 'VARCHAR(100)', constraints: 'NOT NULL', desc: 'Full student name' },
                { name: 'email', type: 'VARCHAR(150)', constraints: 'UNIQUE NOT NULL', desc: 'Login / student email' },
                { name: 'password_hash', type: 'VARCHAR(255)', constraints: 'NOT NULL', desc: 'Bcrypt hashed password' },
                { name: 'monthly_income', type: 'DECIMAL(10,2)', constraints: 'DEFAULT 0.00', desc: 'Expected monthly allowance' },
                { name: 'overall_budget', type: 'DECIMAL(10,2)', constraints: 'DEFAULT 0.00', desc: 'Monthly spending cap' },
                { name: 'currency_symbol', type: 'VARCHAR(10)', constraints: "DEFAULT '₹'", desc: 'Currency denomination' },
                { name: 'student_mode', type: 'TINYINT(1)', constraints: 'DEFAULT 1', desc: '1 = College student mode active' },
                { name: 'created_at', type: 'TIMESTAMP', constraints: 'DEFAULT CURRENT_TIMESTAMP', desc: 'Account registration time' }
            ],
            foreignKeys: []
        },
        categories: {
            title: 'categories',
            primaryKey: 'id',
            description: 'Predefined and custom student spending & income categories.',
            columns: [
                { name: 'id', type: 'INT', constraints: 'PRIMARY KEY AUTO_INCREMENT', desc: 'Unique category identifier' },
                { name: 'name', type: 'VARCHAR(80)', constraints: 'NOT NULL', desc: 'Category display name (Canteen, Books, Bus)' },
                { name: 'type', type: "ENUM('expense','income')", constraints: "DEFAULT 'expense'", desc: 'Category classification' },
                { name: 'icon', type: 'VARCHAR(50)', constraints: "DEFAULT '🏷️'", desc: 'Category emoji icon' },
                { name: 'color', type: 'VARCHAR(20)', constraints: "DEFAULT '#4f46e5'", desc: 'Chart display hex color' },
                { name: 'is_student_default', type: 'TINYINT(1)', constraints: 'DEFAULT 1', desc: '1 = Default college category' }
            ],
            foreignKeys: []
        },
        transactions: {
            title: 'transactions',
            primaryKey: 'id',
            description: 'Financial ledger recording expenses and income with Need/Want tag and payment method.',
            columns: [
                { name: 'id', type: 'INT', constraints: 'PRIMARY KEY AUTO_INCREMENT', desc: 'Unique transaction ID' },
                { name: 'user_id', type: 'INT', constraints: 'NOT NULL', desc: 'FK referencing users.id' },
                { name: 'category_id', type: 'INT', constraints: 'NOT NULL', desc: 'FK referencing categories.id' },
                { name: 'type', type: "ENUM('expense','income')", constraints: 'NOT NULL', desc: 'Transaction type' },
                { name: 'amount', type: 'DECIMAL(10,2)', constraints: 'NOT NULL', desc: 'Amount in currency units' },
                { name: 'is_need', type: 'TINYINT(1)', constraints: 'DEFAULT 1', desc: '1 = Need (Essential), 0 = Want (Discretionary)' },
                { name: 'payment_method', type: "ENUM('UPI','Cash','Card','Net Banking')", constraints: "DEFAULT 'UPI'", desc: 'Payment mode' },
                { name: 'note', type: 'VARCHAR(255)', constraints: "DEFAULT ''", desc: 'Description or item note' },
                { name: 'transaction_date', type: 'DATE', constraints: 'NOT NULL', desc: 'Date of transaction' },
                { name: 'created_at', type: 'TIMESTAMP', constraints: 'DEFAULT CURRENT_TIMESTAMP', desc: 'Timestamp of record' }
            ],
            foreignKeys: [
                { column: 'user_id', references: 'users(id)', on_delete: 'CASCADE' },
                { column: 'category_id', references: 'categories(id)', on_delete: 'RESTRICT' }
            ]
        },
        budgets: {
            title: 'budgets',
            primaryKey: 'id',
            description: 'Monthly spending allocations per category with health indicator calculations.',
            columns: [
                { name: 'id', type: 'INT', constraints: 'PRIMARY KEY AUTO_INCREMENT', desc: 'Unique budget ID' },
                { name: 'user_id', type: 'INT', constraints: 'NOT NULL', desc: 'FK referencing users.id' },
                { name: 'category_id', type: 'INT', constraints: 'NOT NULL', desc: 'FK referencing categories.id' },
                { name: 'month_year', type: 'VARCHAR(7)', constraints: 'NOT NULL', desc: 'Billing period format YYYY-MM' },
                { name: 'allocated_amount', type: 'DECIMAL(10,2)', constraints: 'NOT NULL', desc: 'Maximum budget limit' },
                { name: 'created_at', type: 'TIMESTAMP', constraints: 'DEFAULT CURRENT_TIMESTAMP', desc: 'Timestamp created' }
            ],
            foreignKeys: [
                { column: 'user_id', references: 'users(id)', on_delete: 'CASCADE' },
                { column: 'category_id', references: 'categories(id)', on_delete: 'CASCADE' }
            ]
        },
        savings_goals: {
            title: 'savings_goals',
            primaryKey: 'id',
            description: 'Long-term financial targets for students (upgrade laptop, semester exam fees, trips).',
            columns: [
                { name: 'id', type: 'INT', constraints: 'PRIMARY KEY AUTO_INCREMENT', desc: 'Unique savings goal ID' },
                { name: 'user_id', type: 'INT', constraints: 'NOT NULL', desc: 'FK referencing users.id' },
                { name: 'title', type: 'VARCHAR(150)', constraints: 'NOT NULL', desc: 'Goal title' },
                { name: 'target_amount', type: 'DECIMAL(10,2)', constraints: 'NOT NULL', desc: 'Target target amount' },
                { name: 'current_amount', type: 'DECIMAL(10,2)', constraints: 'DEFAULT 0.00', desc: 'Amount currently saved' },
                { name: 'target_date', type: 'DATE', constraints: 'NOT NULL', desc: 'Target deadline date' },
                { name: 'icon', type: 'VARCHAR(50)', constraints: "DEFAULT '🎯'", desc: 'Goal emoji icon' },
                { name: 'created_at', type: 'TIMESTAMP', constraints: 'DEFAULT CURRENT_TIMESTAMP', desc: 'Created timestamp' }
            ],
            foreignKeys: [
                { column: 'user_id', references: 'users(id)', on_delete: 'CASCADE' }
            ]
        },
        recurring_expenses: {
            title: 'recurring_expenses',
            primaryKey: 'id',
            description: 'Scheduled student subscriptions and recurring obligations with due-date alerts.',
            columns: [
                { name: 'id', type: 'INT', constraints: 'PRIMARY KEY AUTO_INCREMENT', desc: 'Unique recurring item ID' },
                { name: 'user_id', type: 'INT', constraints: 'NOT NULL', desc: 'FK referencing users.id' },
                { name: 'title', type: 'VARCHAR(150)', constraints: 'NOT NULL', desc: 'Subscription / bill name' },
                { name: 'category_id', type: 'INT', constraints: 'NOT NULL', desc: 'FK referencing categories.id' },
                { name: 'amount', type: 'DECIMAL(10,2)', constraints: 'NOT NULL', desc: 'Payment amount per cycle' },
                { name: 'billing_cycle', type: "ENUM('monthly','quarterly','yearly')", constraints: "DEFAULT 'monthly'", desc: 'Frequency' },
                { name: 'next_due_date', type: 'DATE', constraints: 'NOT NULL', desc: 'Next payment deadline' },
                { name: 'payment_method', type: "ENUM('UPI','Cash','Card','Net Banking')", constraints: "DEFAULT 'UPI'", desc: 'Preferred payment mode' },
                { name: 'status', type: "ENUM('active','paused')", constraints: "DEFAULT 'active'", desc: 'Subscription status' },
                { name: 'created_at', type: 'TIMESTAMP', constraints: 'DEFAULT CURRENT_TIMESTAMP', desc: 'Created timestamp' }
            ],
            foreignKeys: [
                { column: 'user_id', references: 'users(id)', on_delete: 'CASCADE' },
                { column: 'category_id', references: 'categories(id)', on_delete: 'RESTRICT' }
            ]
        }
    },

    // Retrieve relational tabular data from Chrome localStorage
    getRelationalData(tableName) {
        const profile = state.getProfile();
        switch (tableName) {
            case 'users':
                return state.getUsers().map((u, idx) => ({
                    id: u.id || (idx + 1),
                    name: u.name,
                    email: u.email,
                    password_hash: '$2y$10$e8wB6R3qXyZ1kM9vQp7T2.hGf5Uo8N9aB3vE.Qp9Uq6Y3lR8Vf4Xv',
                    monthly_income: u.monthly_income || 0,
                    overall_budget: u.overall_budget || 0,
                    currency_symbol: profile.currency_symbol || '₹',
                    student_mode: u.role === 'admin' ? 0 : 1,
                    created_at: '2026-09-01 10:00:00'
                }));
            case 'categories':
                return state.getCategories().map(c => ({
                    id: c.id,
                    name: c.name,
                    type: c.type || 'expense',
                    icon: c.icon || '🏷️',
                    color: c.color || '#4f46e5',
                    is_student_default: 1
                }));
            case 'transactions':
                return state.getTransactions().map(t => {
                    const cat = state.getCategoryById(t.category_id);
                    return {
                        id: t.id,
                        user_id: 1,
                        category_id: t.category_id,
                        category_name: cat.name,
                        type: t.type,
                        amount: parseFloat(t.amount),
                        is_need: t.type === 'expense' ? (parseInt(t.is_need) === 1 ? 1 : 0) : 1,
                        payment_method: t.payment_method || 'UPI',
                        note: t.note || '',
                        transaction_date: t.date || ''
                    };
                });
            case 'budgets':
                return state.getBudgets().map(b => {
                    const cat = state.getCategoryById(b.category_id);
                    return {
                        id: b.id,
                        user_id: 1,
                        category_id: b.category_id,
                        category_name: cat.name,
                        month_year: b.month_year,
                        allocated_amount: parseFloat(b.allocated_amount)
                    };
                });
            case 'savings_goals':
                return state.getGoals().map(g => ({
                    id: g.id,
                    user_id: 1,
                    title: g.title,
                    target_amount: parseFloat(g.target_amount),
                    current_amount: parseFloat(g.current_amount || 0),
                    target_date: g.target_date,
                    icon: g.icon || '🎯'
                }));
            case 'recurring_expenses':
                return state.getRecurring().map(r => {
                    const cat = state.getCategoryById(r.category_id);
                    return {
                        id: r.id,
                        user_id: 1,
                        title: r.title,
                        category_id: r.category_id,
                        category_name: cat.name,
                        amount: parseFloat(r.amount),
                        billing_cycle: r.billing_cycle || 'monthly',
                        next_due_date: r.next_due_date,
                        payment_method: r.payment_method || 'UPI',
                        status: r.status || 'active'
                    };
                });
            default:
                return [];
        }
    },

    // Generate dynamic SQL DDL statement for a table
    getTableDDL(tableName) {
        const schema = this.schemas[tableName];
        if (!schema) return '';

        let sql = `CREATE TABLE \`${tableName}\` (\n`;
        const colLines = schema.columns.map(c => `    \`${c.name}\` ${c.type} ${c.constraints}`);
        sql += colLines.join(',\n');

        if (schema.foreignKeys && schema.foreignKeys.length > 0) {
            sql += ',\n';
            const fkLines = schema.foreignKeys.map(fk => 
                `    CONSTRAINT \`fk_${tableName}_${fk.column}\` FOREIGN KEY (\`${fk.column}\`) REFERENCES \`${fk.references.replace('(', '`(`')}\` ON DELETE ${fk.on_delete}`
            );
            sql += fkLines.join(',\n');
        }

        sql += `\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;
        return sql;
    },

    // Generate complete .SQL Dump of live database
    generateLiveSQLDump() {
        let dump = `-- ====================================================================\n`;
        dump += `-- STUDENT EXPENSE TRACKER — LIVE DATABASE DUMP\n`;
        dump += `-- Generated on: ${new Date().toISOString()}\n`;
        dump += `-- Database Engine: MySQL / MariaDB (InnoDB)\n`;
        dump += `-- ====================================================================\n\n`;
        dump += `CREATE DATABASE IF NOT EXISTS \`student_expense_tracker\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n`;
        dump += `USE \`student_expense_tracker\`;\n\n`;
        dump += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

        Object.keys(this.schemas).forEach(tableName => {
            dump += `-- --------------------------------------------------------\n`;
            dump += `-- Table structure for table \`${tableName}\`\n`;
            dump += `-- --------------------------------------------------------\n`;
            dump += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
            dump += this.getTableDDL(tableName) + `\n\n`;

            const rows = this.getRelationalData(tableName);
            if (rows && rows.length > 0) {
                dump += `-- Dumping data for table \`${tableName}\` (${rows.length} rows)\n`;
                const schema = this.schemas[tableName];
                const validColNames = schema.columns.map(c => c.name);

                rows.forEach(row => {
                    const values = validColNames.map(col => {
                        const val = row[col];
                        if (val === null || val === undefined) return 'NULL';
                        if (typeof val === 'number') return val;
                        return `'${String(val).replace(/'/g, "''")}'`;
                    });
                    dump += `INSERT INTO \`${tableName}\` (\`${validColNames.join('`, `')}\`) VALUES (${values.join(', ')});\n`;
                });
                dump += `\n`;
            }
        });

        dump += `SET FOREIGN_KEY_CHECKS = 1;\n`;
        return dump;
    },

    // Trigger download of live .SQL dump file
    downloadSQLDump() {
        const sqlContent = this.generateLiveSQLDump();
        const blob = new Blob([sqlContent], { type: 'text/sql;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `student_expense_tracker_database_${new Date().toISOString().split('T')[0]}.sql`;
        link.click();
    },

    // Simple In-Browser SQL Query Engine Simulator
    runSQLQuery(queryStr) {
        queryStr = (queryStr || '').trim().replace(/;$/, '');
        if (!queryStr) {
            return { success: false, error: 'Please enter an SQL query to execute.' };
        }

        const upper = queryStr.toUpperCase();
        if (!upper.startsWith('SELECT')) {
            return {
                success: false,
                error: 'For security and data integrity in this prototype, only SELECT queries are permitted in the live inspector console.'
            };
        }

        // Determine target table
        let targetTable = null;
        ['transactions', 'categories', 'budgets', 'savings_goals', 'recurring_expenses', 'users'].forEach(t => {
            const regex = new RegExp(`\\bFROM\\s+${t}\\b`, 'i');
            if (regex.test(queryStr)) {
                targetTable = t;
            }
        });

        if (!targetTable) {
            return {
                success: false,
                error: `Table not recognized. Available tables: users, categories, transactions, budgets, savings_goals, recurring_expenses.`
            };
        }

        let rows = this.getRelationalData(targetTable);

        // Simple filtering simulator for WHERE clauses
        if (upper.includes('WHERE')) {
            if (upper.includes("TYPE = 'EXPENSE'") || upper.includes('TYPE="EXPENSE"')) {
                rows = rows.filter(r => r.type === 'expense');
            } else if (upper.includes("TYPE = 'INCOME'") || upper.includes('TYPE="INCOME"')) {
                rows = rows.filter(r => r.type === 'income');
            } else if (upper.includes('IS_NEED = 1') || upper.includes('IS_NEED=1')) {
                rows = rows.filter(r => parseInt(r.is_need) === 1);
            } else if (upper.includes('IS_NEED = 0') || upper.includes('IS_NEED=0')) {
                rows = rows.filter(r => parseInt(r.is_need) === 0);
            } else if (upper.includes('PAYMENT_METHOD') && upper.includes('UPI')) {
                rows = rows.filter(r => r.payment_method === 'UPI');
            }
        }

        // Simple aggregation simulator for GROUP BY / SUM
        if (upper.includes('GROUP BY') || upper.includes('SUM(')) {
            if (targetTable === 'transactions') {
                const grouped = {};
                rows.forEach(r => {
                    const key = r.category_name || `Category ${r.category_id}`;
                    grouped[key] = (grouped[key] || 0) + (parseFloat(r.amount) || 0);
                });
                const aggRows = Object.entries(grouped).map(([cat, sum]) => ({
                    Category: cat,
                    Total_Amount: `₹${sum.toLocaleString()}`,
                    Record_Count: rows.filter(r => (r.category_name || `Category ${r.category_id}`) === cat).length
                }));
                return { success: true, count: aggRows.length, data: aggRows };
            }
        }

        return { success: true, count: rows.length, data: rows };
    }
};

/**
 * Render Database Tab in UI
 */
function renderDatabaseTab() {
    const container = document.getElementById('databaseTabContent');
    if (!container) return;

    // Table Counts
    const counts = {
        users: dbEngine.getRelationalData('users').length,
        categories: dbEngine.getRelationalData('categories').length,
        transactions: dbEngine.getRelationalData('transactions').length,
        budgets: dbEngine.getRelationalData('budgets').length,
        savings_goals: dbEngine.getRelationalData('savings_goals').length,
        recurring_expenses: dbEngine.getRelationalData('recurring_expenses').length
    };

    // Update table pills badges
    Object.entries(counts).forEach(([t, count]) => {
        const badgeEl = document.getElementById(`db-pill-count-${t}`);
        if (badgeEl) badgeEl.textContent = count;
    });

    renderActiveTableDetails();
}

/**
 * Render the currently selected table's schema and live rows
 */
function renderActiveTableDetails() {
    const table = dbEngine.activeTable || 'transactions';
    const schema = dbEngine.schemas[table];
    const rows = dbEngine.getRelationalData(table);

    // Update active pill styling
    document.querySelectorAll('.db-table-pill').forEach(btn => {
        if (btn.getAttribute('data-table') === table) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // 1. Table Info Header
    const titleEl = document.getElementById('dbActiveTableTitle');
    const descEl = document.getElementById('dbActiveTableDesc');
    const ddlEl = document.getElementById('dbActiveTableDDL');

    if (titleEl) titleEl.textContent = `Table: \`${table}\``;
    if (descEl) descEl.textContent = schema ? schema.description : '';
    if (ddlEl) ddlEl.textContent = dbEngine.getTableDDL(table);

    // 2. Schema Columns Table
    const schemaTbody = document.getElementById('dbSchemaColumnsTbody');
    if (schemaTbody && schema) {
        schemaTbody.innerHTML = schema.columns.map(col => `
            <tr>
                <td><code>${col.name}</code></td>
                <td><span class="badge badge-primary">${col.type}</span></td>
                <td><small style="color:#64748b;">${col.constraints}</small></td>
                <td>${col.desc}</td>
            </tr>
        `).join('');
    }

    // 3. Live Data Rows Table
    const dataThead = document.getElementById('dbLiveDataThead');
    const dataTbody = document.getElementById('dbLiveDataTbody');
    const rowCountEl = document.getElementById('dbLiveRowCountBadge');

    if (rowCountEl) rowCountEl.textContent = `${rows.length} records`;

    if (dataThead && dataTbody && schema) {
        // Build table headers
        const cols = schema.columns.map(c => c.name);
        dataThead.innerHTML = `<tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr>`;

        if (rows.length === 0) {
            dataTbody.innerHTML = `<tr><td colspan="${cols.length}" style="text-align:center; padding:2rem; color:#94a3b8;">
                <div style="font-size:1.6rem; margin-bottom:0.25rem;">📭</div>
                No records currently inserted in table \`${table}\`.
            </td></tr>`;
        } else {
            dataTbody.innerHTML = rows.map(r => `
                <tr>
                    ${cols.map(c => {
                        let val = r[c];
                        if (val === null || val === undefined) return '<td style="color:#94a3b8;">NULL</td>';
                        if (c === 'amount' || c === 'allocated_amount' || c === 'monthly_income') {
                            return `<td style="font-weight:600;">₹${parseFloat(val).toLocaleString()}</td>`;
                        }
                        if (c === 'is_need') {
                            return `<td>${parseInt(val) === 1 ? '<span class="badge badge-need">1 (Need)</span>' : '<span class="badge badge-want">0 (Want)</span>'}</td>`;
                        }
                        if (c === 'password_hash') {
                            return `<td title="${val}"><code style="font-size:0.75rem;">$2y$10$wT7R... (Bcrypt)</code></td>`;
                        }
                        return `<td>${val}</td>`;
                    }).join('')}
                </tr>
            `).join('');
        }
    }
}

/**
 * Setup Database Tab Interaction Listeners
 */
function setupDatabaseListeners() {
    // Table selector pills
    document.querySelectorAll('.db-table-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            dbEngine.activeTable = btn.getAttribute('data-table');
            renderActiveTableDetails();
        });
    });

    // Toggle Schema DDL Viewer
    const toggleDdlBtn = document.getElementById('toggleDdlViewBtn');
    const ddlContainer = document.getElementById('dbDdlContainer');
    if (toggleDdlBtn && ddlContainer) {
        toggleDdlBtn.addEventListener('click', () => {
            const isHidden = ddlContainer.style.display === 'none';
            ddlContainer.style.display = isHidden ? 'block' : 'none';
            toggleDdlBtn.textContent = isHidden ? '🙈 Hide SQL DDL' : '📜 View SQL DDL';
        });
    }

    // Export Live SQL Dump
    const exportDumpBtn = document.getElementById('dbExportSqlDumpBtn');
    if (exportDumpBtn) {
        exportDumpBtn.addEventListener('click', () => {
            dbEngine.downloadSQLDump();
        });
    }

    // Preset query selector
    const presetSelect = document.getElementById('sqlPresetQuerySelect');
    const queryInput = document.getElementById('sqlConsoleInput');
    if (presetSelect && queryInput) {
        presetSelect.addEventListener('change', () => {
            if (presetSelect.value) {
                queryInput.value = presetSelect.value;
            }
        });
    }

    // Run SQL Query
    const runBtn = document.getElementById('runSqlQueryBtn');
    if (runBtn && queryInput) {
        runBtn.addEventListener('click', () => {
            executeAndDisplayQuery(queryInput.value);
        });
    }
}

function executeAndDisplayQuery(sql) {
    const resultBox = document.getElementById('sqlQueryResultBox');
    if (!resultBox) return;

    const res = dbEngine.runSQLQuery(sql);
    if (!res.success) {
        resultBox.innerHTML = `
            <div style="background:#fef2f2; border:1px solid #fecaca; color:#991b1b; padding:0.75rem 1rem; border-radius:8px; font-size:0.875rem;">
                ❌ <strong>SQL Error:</strong> ${res.error}
            </div>
        `;
        return;
    }

    if (res.data.length === 0) {
        resultBox.innerHTML = `
            <div style="background:#f8fafc; border:1px solid #e2e8f0; color:#64748b; padding:1rem; border-radius:8px; text-align:center; font-size:0.875rem;">
                Query executed successfully. Result: 0 rows returned.
            </div>
        `;
        return;
    }

    const headers = Object.keys(res.data[0]);
    resultBox.innerHTML = `
        <div style="margin-bottom:0.5rem; font-size:0.8rem; color:#10b981; font-weight:600;">
            ✓ Query executed successfully (${res.count} rows returned)
        </div>
        <div class="table-wrapper" style="max-height: 240px; overflow-y: auto;">
            <table class="table">
                <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
                <tbody>
                    ${res.data.map(row => `
                        <tr>${headers.map(h => `<td>${row[h] !== null && row[h] !== undefined ? row[h] : 'NULL'}</td>`).join('')}</tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}
