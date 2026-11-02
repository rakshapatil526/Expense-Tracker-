import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowDownCircle,
  ArrowUpCircle,
  Tag,
  PiggyBank,
  PieChart,
  History,
  LogOut,
  Wallet
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export default function Sidebar({ isOpen, onClose }) {
  const { logout, user } = useAuth();
  const notify = useNotification();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    notify.info('Logged out successfully');
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/add-income', label: 'Add Income', icon: ArrowDownCircle },
    { to: '/add-expense', label: 'Add Expense', icon: ArrowUpCircle },
    { to: '/categories', label: 'Categories', icon: Tag },
    { to: '/budgets', label: 'Budgets', icon: PiggyBank },
    { to: '/analytics', label: 'Analytics & Charts', icon: PieChart },
    { to: '/transactions', label: 'Transactions', icon: History },
  ];

  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-logo">
            <Wallet size={24} className="brand-icon" />
          </div>
          <div className="brand-text">
            <h3>ExpenseTrack</h3>
            <span>Personal Finance</span>
          </div>
        </div>

        <div className="sidebar-user-pill">
          <div className="avatar-circle">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="user-details">
            <p className="user-name">{user?.name || 'User'}</p>
            <p className="user-email">{user?.email || ''}</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-section-title">MAIN MENU</span>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <Icon size={19} className="nav-icon" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
