import React, { useState, useEffect } from 'react';
import { X, Tag } from 'lucide-react';
import api from '../api/client';
import { useNotification } from '../context/NotificationContext';

const COLOR_PALETTE = [
  '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4',
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#64748b'
];

export default function CategoryModal({
  isOpen,
  onClose,
  defaultType = 'expense',
  editCategory = null,
  onSuccess
}) {
  const notify = useNotification();
  const [name, setName] = useState('');
  const [type, setType] = useState(defaultType);
  const [color, setColor] = useState('#3b82f6');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (editCategory) {
        setName(editCategory.category_name);
        setType(editCategory.type);
        setColor(editCategory.color || '#3b82f6');
      } else {
        setName('');
        setType(defaultType);
        setColor('#3b82f6');
      }
      setError('');
    }
  }, [isOpen, defaultType, editCategory]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name cannot be empty.');
      return;
    }

    setSubmitting(true);
    setError('');

    const payload = {
      category_name: name.trim(),
      type,
      color,
      icon: 'tag',
    };

    try {
      if (editCategory) {
        await api.put(`/finance/categories/${editCategory.category_id}/`, payload);
        notify.success('Category updated successfully!');
      } else {
        await api.post('/finance/categories/', payload);
        notify.success('Custom category created successfully!');
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.category_name?.[0] ||
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Failed to save category.';
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
            <Tag size={22} style={{ color }} />
            <h3>{editCategory ? 'Edit Category' : 'Create Custom Category'}</h3>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        {error && <div className="form-error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Category Type</label>
            <div className="type-toggle-pills">
              <button
                type="button"
                className={`toggle-pill ${type === 'expense' ? 'active expense' : ''}`}
                onClick={() => setType('expense')}
                disabled={Boolean(editCategory)}
              >
                Expense
              </button>
              <button
                type="button"
                className={`toggle-pill ${type === 'income' ? 'active income' : ''}`}
                onClick={() => setType('income')}
                disabled={Boolean(editCategory)}
              >
                Income
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Category Name *</label>
            <input
              type="text"
              placeholder="e.g. Subscriptions, Side Hustle, Pet Care"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Select Badge Color</label>
            <div className="color-picker-grid">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`color-swatch ${color === c ? 'selected' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : editCategory ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
