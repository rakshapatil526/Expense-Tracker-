import React, { useState, useEffect } from 'react';
import { X, PiggyBank } from 'lucide-react';
import api from '../api/client';
import { useNotification } from '../context/NotificationContext';

export default function BudgetModal({
  isOpen,
  onClose,
  currentMonth,
  currentYear,
  editBudget = null,
  onSuccess
}) {
  const notify = useNotification();
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [month, setMonth] = useState(currentMonth || new Date().getMonth() + 1);
  const [year, setYear] = useState(currentYear || new Date().getFullYear());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchExpenseCategories();
      if (editBudget) {
        setCategoryId(editBudget.category || (editBudget.category_details?.category_id || ''));
        setAmount(editBudget.amount);
        setMonth(editBudget.month);
        setYear(editBudget.year);
      } else {
        setAmount('');
        setMonth(currentMonth || new Date().getMonth() + 1);
        setYear(currentYear || new Date().getFullYear());
      }
      setError('');
    }
  }, [isOpen, currentMonth, currentYear, editBudget]);

  const fetchExpenseCategories = async () => {
    try {
      const res = await api.get('/finance/categories/?type=expense');
      setCategories(res.data);
      if (!editBudget && res.data.length > 0) {
        setCategoryId(res.data[0].category_id);
      }
    } catch (err) {
      console.error('Failed to load expense categories:', err);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid positive budget amount.');
      return;
    }
    if (!categoryId) {
      setError('Please select an expense category.');
      return;
    }

    setSubmitting(true);
    setError('');

    const payload = {
      category: parseInt(categoryId),
      amount: parsedAmount.toFixed(2),
      month: parseInt(month),
      year: parseInt(year),
    };

    try {
      if (editBudget) {
        await api.put(`/finance/budgets/${editBudget.budget_id}/`, payload);
        notify.success('Monthly budget updated successfully!');
      } else {
        await api.post('/finance/budgets/', payload);
        notify.success('Monthly category budget set successfully!');
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.[0] ||
        err.response?.data?.category?.[0] ||
        err.response?.data?.amount?.[0] ||
        err.response?.data?.detail ||
        'Failed to save budget.';
      setError(msg);
      notify.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-title-wrap">
            <PiggyBank size={24} className="text-primary" />
            <h3>{editBudget ? 'Edit Monthly Budget' : 'Set Category Budget'}</h3>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        {error && <div className="form-error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Expense Category *</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={Boolean(editBudget)}
              required
            >
              {categories.map((c) => (
                <option key={c.category_id} value={c.category_id}>
                  {c.category_name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Budget Amount ($) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="e.g. 500.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label>Month</label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                disabled={Boolean(editBudget)}
              >
                {monthNames.map((name, idx) => (
                  <option key={name} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group flex-1">
              <label>Year</label>
              <input
                type="number"
                min="2020"
                max="2100"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                disabled={Boolean(editBudget)}
                required
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : editBudget ? 'Update Budget' : 'Set Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
