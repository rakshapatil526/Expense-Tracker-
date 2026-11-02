import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import TransactionModal from './TransactionModal';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState('expense');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleOpenIncome = () => {
    setTransactionType('income');
    setTransactionModalOpen(true);
  };

  const handleOpenExpense = () => {
    setTransactionType('expense');
    setTransactionModalOpen(true);
  };

  const handleTransactionSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="app-layout">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="main-wrapper">
        <Navbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenIncomeModal={handleOpenIncome}
          onOpenExpenseModal={handleOpenExpense}
        />

        <main className="content-container">
          <Outlet context={{ refreshTrigger, onOpenIncomeModal: handleOpenIncome, onOpenExpenseModal: handleOpenExpense }} />
        </main>
      </div>

      <TransactionModal
        isOpen={transactionModalOpen}
        onClose={() => setTransactionModalOpen(false)}
        defaultType={transactionType}
        onSuccess={handleTransactionSuccess}
      />
    </div>
  );
}
