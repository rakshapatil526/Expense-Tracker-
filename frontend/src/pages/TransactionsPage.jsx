import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  Download,
  Plus,
  ArrowDownCircle,
  ArrowUpCircle,
  Edit2,
  Trash2,
  Calendar,
  X,
  CreditCard,
  FileSpreadsheet
} from 'lucide-react';
import api from '../api/client';
import { useNotification } from '../context/NotificationContext';
import TransactionModal from '../components/TransactionModal';

export default function TransactionsPage() {
  const notify = useNotification();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [ordering, setOrdering] = useState('-date');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('expense');
  const [editingTx, setEditingTx] = useState(null);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/finance/categories/');
      setCategories(res.data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (filterType) params.append('type', filterType);
      if (filterCategory) params.append('category', filterCategory);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (ordering) params.append('ordering', ordering);

      const res = await api.get(`/finance/transactions/?${params.toString()}`);
      setTransactions(res.data);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      notify.error('Failed to load transactions.');
    } finally {
      setLoading(false);
    }
  }, [search, filterType, filterCategory, startDate, endDate, ordering, notify]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTransactions();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchTransactions]);

  const handleOpenAdd = (type) => {
    setEditingTx(null);
    setModalType(type);
    setModalOpen(true);
  };

  const handleOpenEdit = (tx) => {
    setEditingTx(tx);
    setModalType(tx.type);
    setModalOpen(true);
  };

  const handleDelete = async (tx) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete transaction "${tx.title}" of $${tx.amount}?`
    );
    if (!confirmed) return;

    try {
      await api.delete(`/finance/transactions/${tx.transaction_id}/`);
      notify.success('Transaction deleted successfully.');
      fetchTransactions();
    } catch (err) {
      notify.error('Failed to delete transaction.');
    }
  };

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (filterType) params.append('type', filterType);
      if (filterCategory) params.append('category', filterCategory);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await api.get(`/finance/transactions/export_csv/?${params.toString()}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transactions_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      notify.success('Transactions CSV exported successfully!');
    } catch (err) {
      notify.error('Failed to export transactions.');
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setFilterType('');
    setFilterCategory('');
    setStartDate('');
    setEndDate('');
    setOrdering('-date');
  };

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

  // Quick totals of currently filtered results
  const totalFilteredIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const totalFilteredExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  return (
    <div className="transactions-page">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Transaction History</h1>
          <p className="page-subtitle">
            Search, filter, categorize, edit, and export your entire financial history
          </p>
        </div>

        <div className="quick-action-buttons">
          <button onClick={handleExportCSV} className="btn btn-outline" title="Export as CSV">
            <Download size={16} />
            <span>Export CSV</span>
          </button>
          <button onClick={() => handleOpenAdd('income')} className="btn btn-income">
            <ArrowDownCircle size={16} />
            <span>Add Income</span>
          </button>
          <button onClick={() => handleOpenAdd('expense')} className="btn btn-expense">
            <ArrowUpCircle size={16} />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="content-card filter-panel-card">
        <div className="filter-controls-row">
          {/* Search Box */}
          <div className="filter-search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search title, category, or notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} className="search-clear-btn">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Type Filter */}
          <div className="filter-select-wrap">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="filter-dropdown"
            >
              <option value="">All Types (Income & Expense)</option>
              <option value="income">Income Only</option>
              <option value="expense">Expense Only</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="filter-select-wrap">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="filter-dropdown"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.category_id} value={c.category_id}>
                  {c.category_name} ({c.type})
                </option>
              ))}
            </select>
          </div>

          {/* Date range */}
          <div className="filter-date-wrap">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="filter-date-input"
              title="Start Date"
            />
            <span className="text-muted">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="filter-date-input"
              title="End Date"
            />
          </div>

          {(search || filterType || filterCategory || startDate || endDate) && (
            <button onClick={handleClearFilters} className="btn btn-secondary btn-sm">
              <X size={14} /> Clear
            </button>
          )}
        </div>

        {/* Filter Summary Pill Bar */}
        <div className="filter-summary-row">
          <span className="summary-count">
            Showing <strong>{transactions.length}</strong> matching transaction{transactions.length !== 1 ? 's' : ''}
          </span>
          <div className="summary-totals">
            <span className="text-income font-semibold">
              Total In: +{formatCurrency(totalFilteredIncome)}
            </span>
            <span className="text-expense font-semibold">
              Total Out: -{formatCurrency(totalFilteredExpense)}
            </span>
          </div>
        </div>
      </div>

      {/* Transactions Table Card */}
      <div className="content-card">
        {loading ? (
          <div className="page-loading">
            <div className="spinner"></div>
            <p>Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <p>No transactions match the selected criteria.</p>
            <button onClick={handleClearFilters} className="btn btn-outline btn-sm">
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Payment Method</th>
                  <th>Description</th>
                  <th className="text-right">Amount</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const isIncome = tx.type === 'income';
                  const catColor = tx.category_details?.color || '#6366f1';
                  return (
                    <tr key={tx.transaction_id}>
                      <td>
                        <strong className="tx-title-text">{tx.title}</strong>
                      </td>
                      <td>
                        <span className={`pill-badge ${isIncome ? 'pill-income' : 'pill-expense'}`}>
                          {isIncome ? <ArrowDownCircle size={12} /> : <ArrowUpCircle size={12} />}
                          {tx.type}
                        </span>
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
                      <td className="tx-description-cell">
                        <span className="text-muted text-sm" title={tx.description}>
                          {tx.description ? tx.description : '—'}
                        </span>
                      </td>
                      <td className={`text-right font-semibold ${isIncome ? 'text-income' : 'text-expense'}`}>
                        {isIncome ? '+' : '-'} {formatCurrency(tx.amount)}
                      </td>
                      <td className="text-right">
                        <div className="card-action-btns justify-end">
                          <button
                            onClick={() => handleOpenEdit(tx)}
                            className="icon-action-btn edit"
                            title="Edit transaction"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(tx)}
                            className="icon-action-btn delete"
                            title="Delete transaction"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultType={modalType}
        editTransaction={editingTx}
        onSuccess={fetchTransactions}
      />
    </div>
  );
}
