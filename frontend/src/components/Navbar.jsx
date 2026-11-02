import React from 'react';
import { Menu, Plus, ArrowDownCircle, ArrowUpCircle, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onToggleSidebar, onOpenIncomeModal, onOpenExpenseModal }) {
  const { user } = useAuth();

  return (
    <header className="top-navbar">
      <div className="navbar-left">
        <button
          className="mobile-menu-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation"
        >
          <Menu size={22} />
        </button>
        <div className="navbar-greeting">
          <h2>Welcome back, {user?.name?.split(' ')[0] || 'Friend'} 👋</h2>
          <p>Here is your current financial summary</p>
        </div>
      </div>

      <div className="navbar-actions">
        <button
          onClick={onOpenIncomeModal}
          className="btn btn-sm btn-income"
          title="Add new income"
        >
          <ArrowDownCircle size={16} />
          <span>Add Income</span>
        </button>
        <button
          onClick={onOpenExpenseModal}
          className="btn btn-sm btn-expense"
          title="Add new expense"
        >
          <ArrowUpCircle size={16} />
          <span>Add Expense</span>
        </button>
      </div>
    </header>
  );
}
