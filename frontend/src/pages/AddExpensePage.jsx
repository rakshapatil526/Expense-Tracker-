import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpCircle, Check, ArrowLeft, Tag, Calendar, DollarSign, CreditCard, FileText } from 'lucide-react';
import api from '../api/client';
import { useNotification } from '../context/NotificationContext';

export default function AddExpensePage() {
  const navigate = useNavigate();
  const notify = useNotification();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchExpenseCategories();
  }, []);

  const fetchExpenseCategories = async () => {
    try {
      const res = await api.get('/finance/categories/?type=expense');
      setCategories(res.data);
      if (res.data.length > 0) {
        setCategoryId(res.data[0].category_id);
      }
    } catch (err) {
      console.error('Failed to load expense categories:', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Expense title is required.');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please provide a valid expense amount greater than zero.');
      return;
    }

    setSubmitting(true);
    setError('');

    const payload = {
      title: title.trim(),
      amount: parsedAmount.toFixed(2),
      type: 'expense',
      category: categoryId ? parseInt(categoryId) : null,
      date,
      payment_method: paymentMethod,
      description: description.trim(),
    };

    try {
      await api.post('/finance/transactions/', payload);
      notify.success('Expense transaction saved successfully!');
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.category?.[0] ||
        err.response?.data?.amount?.[0] ||
        err.response?.data?.detail ||
        'Failed to save expense. Please check the entered details.';
      setError(msg);
      notify.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-page-container">
      <div className="form-page-card">
        <div className="form-page-header expense-header">
          <div className="header-icon-pill bg-expense-light">
            <ArrowUpCircle size={28} className="text-expense" />
          </div>
          <div>
            <h2>Record Expense</h2>
            <p>Log a new outgoing cost, bill payment, purchase, or subscription</p>
          </div>
        </div>

        {error && <div className="form-error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="custom-form">
          <div className="form-group">
            <label>
              <FileText size={16} /> Expense Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Weekly Grocery Run, Dinner at Italian Bistro, Electricity Bill"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label>
                <DollarSign size={16} /> Amount ($) *
              </label>
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
              <label>
                <Tag size={16} /> Expense Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={loadingCategories}
              >
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
              <label>
                <Calendar size={16} /> Expense Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group flex-1">
              <label>
                <CreditCard size={16} /> Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="credit_card">Credit Card</option>
                <option value="debit_card">Debit Card</option>
                <option value="cash">Cash</option>
                <option value="upi">UPI / Mobile Payment</option>
                <option value="net_banking">Net Banking / Wire</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Description / Notes</label>
            <textarea
              rows="4"
              placeholder="Add optional notes, receipt details, or vendor names..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft size={16} /> Back
            </button>
            <button
              type="submit"
              className="btn btn-expense btn-lg"
              disabled={submitting}
            >
              {submitting ? 'Saving Expense...' : (
                <>
                  <Check size={18} /> Save Expense
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
