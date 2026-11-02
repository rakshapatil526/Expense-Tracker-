import React, { useState, useEffect, useCallback } from 'react';
import {
  PiggyBank,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import api from '../api/client';
import { useNotification } from '../context/NotificationContext';
import BudgetModal from '../components/BudgetModal';

export default function BudgetsPage() {
  const notify = useNotification();
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const fetchBudgets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/finance/budgets/?month=${selectedMonth}&year=${selectedYear}`);
      setBudgets(res.data);
    } catch (err) {
      console.error('Failed to load budgets:', err);
      notify.error('Failed to load budgets.');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, notify]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const handleOpenAdd = () => {
    setEditingBudget(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (budget) => {
    setEditingBudget(budget);
    setModalOpen(true);
  };

  const handleDelete = async (budget) => {
    const confirmed = window.confirm(
      `Delete monthly budget for "${budget.category_details?.category_name}"?`
    );
    if (!confirmed) return;

    try {
      await api.delete(`/finance/budgets/${budget.budget_id}/`);
      notify.success('Budget deleted successfully.');
      fetchBudgets();
    } catch (err) {
      notify.error('Failed to delete budget.');
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(val || 0);
  };

  // Aggregates for current month
  const totalBudgeted = budgets.reduce((acc, b) => acc + parseFloat(b.amount || 0), 0);
  const totalSpent = budgets.reduce((acc, b) => acc + parseFloat(b.spent || 0), 0);
  const overallPercentage = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;
  const totalRemaining = Math.max(totalBudgeted - totalSpent, 0);

  return (
    <div className="budgets-page">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Monthly Budget Management</h1>
          <p className="page-subtitle">
            Set category limits, monitor spending progress, and prevent overspending
          </p>
        </div>

        <button onClick={handleOpenAdd} className="btn btn-primary">
          <Plus size={18} />
          <span>Set Category Budget</span>
        </button>
      </div>

      {/* Month Navigator Header */}
      <div className="month-selector-bar">
        <button onClick={handlePrevMonth} className="btn-icon" aria-label="Previous month">
          <ChevronLeft size={20} />
        </button>
        <div className="month-display">
          <h3>
            {monthNames[selectedMonth - 1]} {selectedYear}
          </h3>
          <span>
            {selectedMonth === today.getMonth() + 1 && selectedYear === today.getFullYear()
              ? 'Current Active Month'
              : 'Target Month'}
          </span>
        </div>
        <button onClick={handleNextMonth} className="btn-icon" aria-label="Next month">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Aggregate Overview Card */}
      <div className="budget-overall-card">
        <div className="overall-info-columns">
          <div className="overall-column">
            <span className="overall-label">Total Monthly Budget</span>
            <span className="overall-value text-primary">{formatCurrency(totalBudgeted)}</span>
          </div>
          <div className="overall-column">
            <span className="overall-label">Amount Spent</span>
            <span className="overall-value text-expense">{formatCurrency(totalSpent)}</span>
          </div>
          <div className="overall-column">
            <span className="overall-label">Remaining Budget</span>
            <span className="overall-value text-income">{formatCurrency(totalRemaining)}</span>
          </div>
        </div>

        <div className="overall-progress-section">
          <div className="progress-bar-bg h-4">
            <div
              className={`progress-bar-fill ${
                overallPercentage > 100
                  ? 'progress-danger'
                  : overallPercentage > 75
                  ? 'progress-warning'
                  : 'progress-normal'
              }`}
              style={{ width: `${Math.min(overallPercentage, 100)}%` }}
            />
          </div>
          <div className="progress-bar-labels">
            <span className="font-semibold">{overallPercentage}% overall budget utilized</span>
            <span>
              {totalSpent > totalBudgeted && totalBudgeted > 0 ? (
                <span className="text-danger flex items-center gap-1">
                  <AlertTriangle size={14} /> Over budget by {formatCurrency(totalSpent - totalBudgeted)}
                </span>
              ) : (
                <span className="text-muted">{formatCurrency(totalRemaining)} remaining</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Category Budgets Grid */}
      {loading ? (
        <div className="page-loading">
          <div className="spinner"></div>
          <p>Loading budget limits...</p>
        </div>
      ) : budgets.length === 0 ? (
        <div className="content-card empty-state">
          <PiggyBank size={48} className="text-muted" />
          <h3>No Budgets Set for {monthNames[selectedMonth - 1]} {selectedYear}</h3>
          <p>Create spending caps for your frequent expense categories to track your savings.</p>
          <button onClick={handleOpenAdd} className="btn btn-primary">
            + Set First Budget
          </button>
        </div>
      ) : (
        <div className="budgets-grid">
          {budgets.map((b) => {
            const catName = b.category_details?.category_name || 'General';
            const catColor = b.category_details?.color || '#6366f1';
            const budgetAmt = parseFloat(b.amount || 0);
            const spentAmt = parseFloat(b.spent || 0);
            const pct = b.percentage || 0;
            const remaining = parseFloat(b.remaining || 0);
            const isOver = spentAmt > budgetAmt;

            let progressClass = 'progress-normal';
            if (pct >= 100) {
              progressClass = 'progress-danger';
            } else if (pct >= 75) {
              progressClass = 'progress-warning';
            }

            return (
              <div key={b.budget_id} className="budget-item-card">
                <div className="budget-item-top">
                  <div className="budget-category-info">
                    <span
                      className="category-dot"
                      style={{ backgroundColor: catColor }}
                    />
                    <div>
                      <h4 className="budget-cat-name">{catName}</h4>
                      <span className="budget-pct-text">{pct}% spent</span>
                    </div>
                  </div>

                  <div className="card-action-btns">
                    <button
                      onClick={() => handleOpenEdit(b)}
                      className="icon-action-btn edit"
                      title="Edit budget"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(b)}
                      className="icon-action-btn delete"
                      title="Delete budget"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="budget-amounts-row">
                  <div>
                    <span className="text-muted text-xs">Spent</span>
                    <p className="font-semibold text-expense">{formatCurrency(spentAmt)}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-muted text-xs">Budget Limit</span>
                    <p className="font-semibold">{formatCurrency(budgetAmt)}</p>
                  </div>
                </div>

                <div className="progress-bar-bg">
                  <div
                    className={`progress-bar-fill ${progressClass}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>

                <div className="budget-card-footer">
                  {isOver ? (
                    <span className="budget-status-pill status-danger">
                      <AlertTriangle size={13} /> Over by {formatCurrency(spentAmt - budgetAmt)}
                    </span>
                  ) : (
                    <span className="budget-status-pill status-normal">
                      <CheckCircle2 size={13} /> {formatCurrency(remaining)} remaining
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BudgetModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        currentMonth={selectedMonth}
        currentYear={selectedYear}
        editBudget={editingBudget}
        onSuccess={fetchBudgets}
      />
    </div>
  );
}
