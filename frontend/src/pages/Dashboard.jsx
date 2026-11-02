import React, { useState, useEffect, useCallback } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  PiggyBank,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Calendar,
  CreditCard,
  Plus
} from 'lucide-react';
import api from '../api/client';

export default function Dashboard() {
  const { refreshTrigger, onOpenIncomeModal, onOpenExpenseModal } = useOutletContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/finance/dashboard/');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData, refreshTrigger]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(val || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading && !data) {
    return (
      <div className="page-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const balance = data?.total_balance ?? 0;
  const isPositiveBalance = balance >= 0;

  return (
    <div className="dashboard-page">
      {/* Top Banner & Quick Actions */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Financial Overview</h1>
          <p className="page-subtitle">
            Current activity for <span className="highlight-text">{data?.current_month_name || 'This Month'}</span>
          </p>
        </div>

        <div className="quick-action-buttons">
          <button onClick={onOpenIncomeModal} className="btn btn-income">
            <ArrowDownCircle size={18} />
            <span>Add Income</span>
          </button>
          <button onClick={onOpenExpenseModal} className="btn btn-expense">
            <ArrowUpCircle size={18} />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="metrics-grid">
        {/* Total Balance Card */}
        <div className={`metric-card ${isPositiveBalance ? 'card-positive' : 'card-negative'}`}>
          <div className="metric-header">
            <span className="metric-label">Total Balance</span>
            <div className="metric-icon-wrap icon-balance">
              <Wallet size={20} />
            </div>
          </div>
          <div className="metric-value">
            {formatCurrency(balance)}
          </div>
          <div className="metric-footer">
            <span className="metric-subtext">
              Total Income − Total Expenses
            </span>
          </div>
        </div>

        {/* Total Income Card */}
        <div className="metric-card card-income">
          <div className="metric-header">
            <span className="metric-label">Total Income</span>
            <div className="metric-icon-wrap icon-income">
              <ArrowDownCircle size={20} />
            </div>
          </div>
          <div className="metric-value text-income">
            {formatCurrency(data?.total_income)}
          </div>
          <div className="metric-footer">
            <span className="trend-badge positive">
              <TrendingUp size={14} />
              +{formatCurrency(data?.monthly_income)} this month
            </span>
          </div>
        </div>

        {/* Total Expenses Card */}
        <div className="metric-card card-expense">
          <div className="metric-header">
            <span className="metric-label">Total Expenses</span>
            <div className="metric-icon-wrap icon-expense">
              <ArrowUpCircle size={20} />
            </div>
          </div>
          <div className="metric-value text-expense">
            {formatCurrency(data?.total_expenses)}
          </div>
          <div className="metric-footer">
            <span className="trend-badge negative">
              <TrendingDown size={14} />
              -{formatCurrency(data?.monthly_expenses)} this month
            </span>
          </div>
        </div>

        {/* Monthly Savings Card */}
        <div className="metric-card card-savings">
          <div className="metric-header">
            <span className="metric-label">Monthly Savings</span>
            <div className="metric-icon-wrap icon-savings">
              <PiggyBank size={20} />
            </div>
          </div>
          <div className={`metric-value ${data?.monthly_savings >= 0 ? 'text-income' : 'text-expense'}`}>
            {formatCurrency(data?.monthly_savings)}
          </div>
          <div className="metric-footer">
            <span className="metric-subtext">
              {data?.monthly_savings >= 0 ? 'Net surplus accumulated' : 'Net deficit this month'}
            </span>
          </div>
        </div>
      </div>

      {/* Middle Row: Monthly Budget Snapshot & Quick Links */}
      <div className="dashboard-middle-grid">
        <div className="content-card budget-snapshot-card">
          <div className="card-header-row">
            <div>
              <h3>Monthly Budget Status</h3>
              <p className="card-subtitle">Spending against active category budgets</p>
            </div>
            <Link to="/budgets" className="btn-link">
              Manage Budgets <ArrowRight size={14} />
            </Link>
          </div>

          <div className="budget-snapshot-body">
            <div className="budget-progress-info">
              <div>
                <span className="text-muted">Total Budget:</span>{' '}
                <strong>{formatCurrency(data?.total_budget)}</strong>
              </div>
              <div>
                <span className="text-muted">Month Spent:</span>{' '}
                <strong className="text-expense">{formatCurrency(data?.monthly_expenses)}</strong>
              </div>
            </div>

            <div className="progress-bar-bg">
              <div
                className={`progress-bar-fill ${
                  data?.budget_used_percentage > 100
                    ? 'progress-danger'
                    : data?.budget_used_percentage > 75
                    ? 'progress-warning'
                    : 'progress-normal'
                }`}
                style={{ width: `${Math.min(data?.budget_used_percentage || 0, 100)}%` }}
              />
            </div>
            <div className="progress-bar-labels">
              <span>{data?.budget_used_percentage || 0}% used</span>
              <span>
                {data?.total_budget > 0
                  ? `${formatCurrency(Math.max(data.total_budget - data.monthly_expenses, 0))} remaining`
                  : 'No budgets configured'}
              </span>
            </div>
          </div>
        </div>

        {/* Module Fast Navigation Cards */}
        <div className="content-card quick-nav-card">
          <div className="card-header-row">
            <h3>Quick Actions & Tools</h3>
          </div>
          <div className="quick-links-grid">
            <Link to="/analytics" className="quick-nav-pill">
              <div className="nav-pill-icon bg-indigo">
                <TrendingUp size={18} />
              </div>
              <div className="nav-pill-info">
                <strong>Spending Analytics</strong>
                <span>Charts, trends & category pies</span>
              </div>
            </Link>

            <Link to="/categories" className="quick-nav-pill">
              <div className="nav-pill-icon bg-pink">
                <Wallet size={18} />
              </div>
              <div className="nav-pill-info">
                <strong>Category Management</strong>
                <span>Add custom expense/income categories</span>
              </div>
            </Link>

            <Link to="/transactions" className="quick-nav-pill">
              <div className="nav-pill-icon bg-emerald">
                <CreditCard size={18} />
              </div>
              <div className="nav-pill-info">
                <strong>Transaction History</strong>
                <span>Search, filter, edit & CSV export</span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div className="content-card recent-transactions-card">
        <div className="card-header-row">
          <div>
            <h3>Recent Transactions</h3>
            <p className="card-subtitle">Your latest financial transactions</p>
          </div>
          <Link to="/transactions" className="btn btn-outline btn-sm">
            View All Transactions <ArrowRight size={14} />
          </Link>
        </div>

        {data?.recent_transactions?.length === 0 ? (
          <div className="empty-state">
            <p>No transactions recorded yet.</p>
            <div className="empty-actions">
              <button onClick={onOpenIncomeModal} className="btn btn-income btn-sm">
                + Add First Income
              </button>
              <button onClick={onOpenExpenseModal} className="btn btn-expense btn-sm">
                + Add First Expense
              </button>
            </div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Payment Method</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data?.recent_transactions?.map((tx) => {
                  const isIncome = tx.type === 'income';
                  const catColor = tx.category_details?.color || '#6366f1';
                  return (
                    <tr key={tx.transaction_id}>
                      <td>
                        <div className="tx-title-wrap">
                          <span className={`tx-type-dot ${isIncome ? 'dot-income' : 'dot-expense'}`} />
                          <span className="tx-title-text">{tx.title}</span>
                        </div>
                      </td>
                      <td>
                        <span
                          className="category-badge"
                          style={{
                            backgroundColor: `${catColor}18`,
                            color: catColor,
                            borderColor: `${catColor}40`,
                          }}
                        >
                          {tx.category_details?.category_name || 'General'}
                        </span>
                      </td>
                      <td>
                        <span className="text-muted text-sm flex items-center gap-1">
                          <Calendar size={13} />
                          {formatDate(tx.date)}
                        </span>
                      </td>
                      <td>
                        <span className="payment-method-pill">
                          {tx.payment_method?.replace('_', ' ')?.toUpperCase()}
                        </span>
                      </td>
                      <td className={`text-right font-semibold ${isIncome ? 'text-income' : 'text-expense'}`}>
                        {isIncome ? '+' : '-'} {formatCurrency(tx.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
