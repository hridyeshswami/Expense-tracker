/**
 * Chart.js Integration for Visual Financial Analytics
 * Real-time visualizations driven 100% by user data - ZERO dummy/hardcoded data.
 */

let categoryChartInstance = null;
let needsWantsChartInstance = null;
let paymentMethodChartInstance = null;
let trendChartInstance = null;

const chartManager = {
    renderAll(financials) {
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not loaded. Visual charts will be skipped.');
            return;
        }

        this.renderCategoryChart(financials);
        this.renderNeedsWantsChart(financials);
        this.renderPaymentMethodChart(financials);
        this.renderTrendChart(financials);
    },

    showEmptyCanvasMessage(ctxId, message) {
        const ctx = document.getElementById(ctxId);
        if (!ctx) return;
        const container = ctx.parentElement;
        if (!container) return;

        let emptyEl = container.querySelector('.chart-empty-state');
        if (!emptyEl) {
            emptyEl = document.createElement('div');
            emptyEl.className = 'chart-empty-state';
            emptyEl.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#94a3b8; font-size:0.875rem; text-align:center; pointer-events:none;';
            container.appendChild(emptyEl);
        }
        emptyEl.innerHTML = `<span style="font-size:1.8rem; margin-bottom:0.25rem;">📊</span><span>${message}</span>`;
        emptyEl.style.display = 'flex';
        ctx.style.display = 'none';
    },

    hideEmptyCanvasMessage(ctxId) {
        const ctx = document.getElementById(ctxId);
        if (!ctx) return;
        const container = ctx.parentElement;
        if (!container) return;
        const emptyEl = container.querySelector('.chart-empty-state');
        if (emptyEl) {
            emptyEl.style.display = 'none';
        }
        ctx.style.display = 'block';
    },

    renderCategoryChart(financials) {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) return;

        if (categoryChartInstance) {
            categoryChartInstance.destroy();
            categoryChartInstance = null;
        }

        const entries = Object.entries(financials.categorySpending || {}).filter(([_, spent]) => spent > 0);

        if (entries.length === 0) {
            this.showEmptyCanvasMessage('categoryChart', 'No category expenses recorded yet.<br>Admin can add expenses using "+ Quick Add".');
            return;
        }

        this.hideEmptyCanvasMessage('categoryChart');

        const labels = [];
        const data = [];
        const colors = [];

        entries.forEach(([catId, spent]) => {
            const cat = state.getCategoryById(catId);
            labels.push(cat.name);
            data.push(spent);
            colors.push(cat.color || '#4f46e5');
        });

        categoryChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { boxWidth: 12, font: { size: 11, family: 'Inter' } }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const val = context.raw || 0;
                                return ` ${context.label}: ${financials.currency}${val.toLocaleString()}`;
                            }
                        }
                    }
                },
                cutout: '68%'
            }
        });
    },

    renderNeedsWantsChart(financials) {
        const ctx = document.getElementById('needsWantsChart');
        if (!ctx) return;

        if (needsWantsChartInstance) {
            needsWantsChartInstance.destroy();
            needsWantsChartInstance = null;
        }

        const needs = financials.needsTotal || 0;
        const wants = financials.wantsTotal || 0;

        if (needs === 0 && wants === 0) {
            this.showEmptyCanvasMessage('needsWantsChart', 'No expenses categorized yet.<br>Log expenses with Need or Want tag.');
            return;
        }

        this.hideEmptyCanvasMessage('needsWantsChart');

        needsWantsChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Needs (Essentials)', 'Wants (Discretionary)'],
                datasets: [{
                    data: [needs, wants],
                    backgroundColor: ['#4f46e5', '#ec4899'],
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { boxWidth: 12, font: { size: 11, family: 'Inter' } }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const val = context.raw || 0;
                                return ` ${context.label}: ${financials.currency}${val.toLocaleString()}`;
                            }
                        }
                    }
                },
                cutout: '68%'
            }
        });
    },

    renderPaymentMethodChart(financials) {
        const ctx = document.getElementById('paymentMethodChart');
        if (!ctx) return;

        if (paymentMethodChartInstance) {
            paymentMethodChartInstance.destroy();
            paymentMethodChartInstance = null;
        }

        const spentMethods = Object.entries(financials.paymentMethodSpending || {}).filter(([_, amt]) => amt > 0);

        if (spentMethods.length === 0) {
            this.showEmptyCanvasMessage('paymentMethodChart', 'No payment data available.<br>Log expenses with UPI, Cash, or Card.');
            return;
        }

        this.hideEmptyCanvasMessage('paymentMethodChart');

        const labels = spentMethods.map(([method]) => method);
        const data = spentMethods.map(([_, amt]) => amt);

        paymentMethodChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Amount Spent',
                    data: data,
                    backgroundColor: ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6'],
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return ` Spent: ${financials.currency}${context.raw.toLocaleString()}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { font: { size: 11 } }
                    },
                    x: {
                        ticks: { font: { size: 11 } }
                    }
                }
            }
        });
    },

    renderTrendChart(financials) {
        const ctx = document.getElementById('trendChart');
        if (!ctx) return;

        if (trendChartInstance) {
            trendChartInstance.destroy();
            trendChartInstance = null;
        }

        // Dynamically compute real monthly trends strictly from user transactions
        const allTransactions = state.getTransactions();

        if (allTransactions.length === 0 && financials.totalIncome === 0) {
            this.showEmptyCanvasMessage('trendChart', 'No monthly history yet.<br>Trends will appear as Admin logs real data.');
            return;
        }

        this.hideEmptyCanvasMessage('trendChart');

        // Group by YYYY-MM
        const monthlySummary = {};
        allTransactions.forEach(t => {
            if (!t.date) return;
            const m = t.date.substring(0, 7);
            if (!monthlySummary[m]) {
                monthlySummary[m] = { income: 0, expense: 0 };
            }
            if (t.type === 'income') {
                monthlySummary[m].income += parseFloat(t.amount) || 0;
            } else {
                monthlySummary[m].expense += parseFloat(t.amount) || 0;
            }
        });

        // Ensure current month is included
        const now = new Date();
        const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlySummary[currentMonthKey]) {
            monthlySummary[currentMonthKey] = {
                income: financials.totalIncome,
                expense: financials.totalExpense
            };
        } else {
            if (monthlySummary[currentMonthKey].income === 0 && financials.totalIncome > 0) {
                monthlySummary[currentMonthKey].income = financials.totalIncome;
            }
        }

        const sortedMonths = Object.keys(monthlySummary).sort();
        const labels = sortedMonths.map(m => {
            const [y, mon] = m.split('-');
            const d = new Date(parseInt(y), parseInt(mon) - 1, 1);
            return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        });
        const incomeData = sortedMonths.map(m => monthlySummary[m].income);
        const expenseData = sortedMonths.map(m => monthlySummary[m].expense);

        trendChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Income',
                        data: incomeData,
                        backgroundColor: '#10b981',
                        borderRadius: 6
                    },
                    {
                        label: 'Expenses',
                        data: expenseData,
                        backgroundColor: '#f97316',
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 12 } },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return ` ${context.dataset.label}: ${financials.currency}${context.raw.toLocaleString()}`;
                            }
                        }
                    }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }
};
