import React, { useState, useEffect } from 'react';
import { X, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import api from '../api/client';
import { useNotification } from '../context/NotificationContext';

export default function TransactionModal({
  isOpen,
  onClose,
  defaultType = 'expense',
  editTransaction = null,
  onSuccess
}) {
  const notify = useNotification();
  const [type, setType] = useState(defaultType);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (editTransaction) {
        setType(editTransaction.type);
        setTitle(editTransaction.title);
        setAmount(editTransaction.amount);
        setCategoryId(editTransaction.category || (editTransaction.category_details?.category_id || ''));
        setDate(editTransaction.date);
        setPaymentMethod(editTransaction.payment_method || 'cash');
        setDescription(editTransaction.description || '');
      } else {
        setType(defaultType);
        setTitle('');
        setAmount('');
        setCategoryId('');
        setDate(new Date().toISOString().split('T')[0]);
        setPaymentMethod('cash');
        setDescription('');
      }
      setError('');
      fetchCategories(editTransaction ? editTransaction.type : defaultType);
    }
  }, [isOpen, defaultType, editTransaction]);

  const fetchCategories = async (catType) => {
    try {
      const res = await api.get(`/finance/categories/?type=${catType}`);
      setCategories(res.data);
      if (!editTransaction && res.data.length > 0) {
        setCategoryId(res.data[0].category_id);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const handleTypeChange = (newType) => {
    setType(newType);
    fetchCategories(newType);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    setSubmitting(true);
    setError('');

    const payload = {
      title: title.trim(),
      amount: parsedAmount.toFixed(2),
      type,
      category: categoryId ? parseInt(categoryId) : null,
      date,
      payment_method: paymentMethod,
      description: description.trim(),
    };

    try {
      if (editTransaction) {
        await api.put(`/finance/transactions/${editTransaction.transaction_id}/`, payload);
        notify.success('Transaction updated successfully!');
      } else {
        await api.post('/finance/transactions/', payload);
        notify.success(`${type === 'income' ? 'Income' : 'Expense'} recorded successfully!`);
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.category?.[0] ||
        err.response?.data?.amount?.[0] ||
        err.response?.data?.detail ||
        'Failed to save transaction. Please check your inputs.';
      setError(msg);
      notify.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-title-wrap">
            {type === 'income' ? (
              <ArrowDownCircle size={24} className="icon-income" />
            ) : (
              <ArrowUpCircle size={24} className="icon-expense" />
            )}
            <h3>
              {editTransaction
                ? `Edit ${type === 'income' ? 'Income' : 'Expense'}`
                : `Add New ${type === 'income' ? 'Income' : 'Expense'}`}
            </h3>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        {!editTransaction && (
          <div className="type-toggle-pills">
            <button
              type="button"
              className={`toggle-pill ${type === 'expense' ? 'active expense' : ''}`}
              onClick={() => handleTypeChange('expense')}
            >
              Expense
            </button>
            <button
              type="button"
              className={`toggle-pill ${type === 'income' ? 'active income' : ''}`}
              onClick={() => handleTypeChange('income')}
            >
              Income
            </button>
          </div>
        )}

        {error && <div className="form-error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              placeholder={type === 'income' ? 'e.g. Monthly Salary, Freelance project' : 'e.g. Grocery shopping, Electricity bill'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label>Amount ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="form-group flex-1">
              <label>Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>
                    {c.category_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label>Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group flex-1">
              <label>Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="cash">Cash</option>
                <option value="credit_card">Credit Card</option>
                <option value="debit_card">Debit Card</option>
                <option value="upi">UPI / Mobile Pay</option>
                <option value="net_banking">Net Banking / Wire</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Description / Notes</label>
            <textarea
              rows="3"
              placeholder="Add optional details or notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className={`btn ${type === 'income' ? 'btn-income' : 'btn-expense'}`}
              disabled={submitting}
            >
              {submitting ? 'Saving...' : editTransaction ? 'Update Transaction' : `Save ${type === 'income' ? 'Income' : 'Expense'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
