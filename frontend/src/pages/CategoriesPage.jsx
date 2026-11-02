import React, { useState, useEffect } from 'react';
import { Tag, Plus, Edit2, Trash2, ArrowDownCircle, ArrowUpCircle, ShieldCheck, User } from 'lucide-react';
import api from '../api/client';
import { useNotification } from '../context/NotificationContext';
import CategoryModal from '../components/CategoryModal';

export default function CategoriesPage() {
  const notify = useNotification();
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('expense');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/finance/categories/');
      setCategories(res.data);
    } catch (err) {
      console.error('Failed to load categories:', err);
      notify.error('Failed to load categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filteredCategories = categories.filter((c) => c.type === activeTab);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (category) => {
    setEditingCategory(category);
    setModalOpen(true);
  };

  const handleDelete = async (category) => {
    if (!category.is_custom) {
      notify.error('Default system categories cannot be deleted.');
      return;
    }
    const confirmed = window.confirm(
      `Are you sure you want to delete custom category "${category.category_name}"?`
    );
    if (!confirmed) return;

    try {
      await api.delete(`/finance/categories/${category.category_id}/`);
      notify.success('Category removed successfully.');
      fetchCategories();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to delete category.';
      notify.error(msg);
    }
  };

  return (
    <div className="categories-page">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Category Management</h1>
          <p className="page-subtitle">
            Organize and classify your spending and revenue streams
          </p>
        </div>

        <button onClick={handleOpenAdd} className="btn btn-primary">
          <Plus size={18} />
          <span>Add Custom Category</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="category-tabs-row">
        <div className="tabs-pill-container">
          <button
            className={`tab-pill ${activeTab === 'expense' ? 'active' : ''}`}
            onClick={() => setActiveTab('expense')}
          >
            <ArrowUpCircle size={16} />
            <span>Expense Categories ({categories.filter((c) => c.type === 'expense').length})</span>
          </button>
          <button
            className={`tab-pill ${activeTab === 'income' ? 'active' : ''}`}
            onClick={() => setActiveTab('income')}
          >
            <ArrowDownCircle size={16} />
            <span>Income Categories ({categories.filter((c) => c.type === 'income').length})</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="page-loading">
          <div className="spinner"></div>
          <p>Loading categories...</p>
        </div>
      ) : (
        <div className="categories-grid">
          {filteredCategories.map((cat) => {
            const catColor = cat.color || '#6366f1';
            return (
              <div key={cat.category_id} className="category-card">
                <div className="category-card-top">
                  <div
                    className="category-icon-circle"
                    style={{ backgroundColor: `${catColor}20`, color: catColor }}
                  >
                    <Tag size={20} />
                  </div>
                  <div className="category-badge-type">
                    {cat.is_custom ? (
                      <span className="pill-badge pill-custom" title="User custom category">
                        <User size={12} /> Custom
                      </span>
                    ) : (
                      <span className="pill-badge pill-default" title="Standard category">
                        <ShieldCheck size={12} /> Default
                      </span>
                    )}
                  </div>
                </div>

                <div className="category-card-info">
                  <h3 className="category-title">{cat.category_name}</h3>
                  <span className="category-type-label">
                    {cat.type === 'income' ? 'Income Stream' : 'Expense Category'}
                  </span>
                </div>

                <div className="category-card-footer">
                  <div className="color-indicator">
                    <span className="color-dot" style={{ backgroundColor: catColor }} />
                    <span className="color-hex">{catColor}</span>
                  </div>

                  {cat.is_custom && (
                    <div className="card-action-btns">
                      <button
                        onClick={() => handleOpenEdit(cat)}
                        className="icon-action-btn edit"
                        title="Edit category"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(cat)}
                        className="icon-action-btn delete"
                        title="Delete category"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CategoryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultType={activeTab}
        editCategory={editingCategory}
        onSuccess={fetchCategories}
      />
    </div>
  );
}
