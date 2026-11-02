import React, { useState, useEffect, useCallback } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  PieChart as PieIcon,
  TrendingUp,
  ArrowDownCircle,
  ArrowUpCircle,
  PiggyBank,
  Calendar,
  Layers
} from 'lucide-react';
import api from '../api/client';

export default function AnalyticsPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      let url = `/finance/analytics/?year=${selectedYear}`;
      if (selectedMonth) {
        url += `&month=${selectedMonth}`;
      }
      const res = await api.get(url);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(val || 0);
  };

  const monthNames = [
    { num: '1', name: 'January' },
    { num: '2', name: 'February' },
    { num: '3', name: 'March' },
    { num: '4', name: 'April' },
    { num: '5', name: 'May' },
    { num: '6', name: 'June' },
    { num: '7', name: 'July' },
    { num: '8', name: 'August' },
    { num: '9', name: 'September' },
    { num: '10', name: 'October' },
    { num: '11', name: 'November' },
    { num: '12', name: 'December' },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-custom-tooltip">
          <p className="tooltip-label">{label}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} style={{ color: entry.color }} className="tooltip-entry">
              <span className="tooltip-entry-name">{entry.name}:</span>{' '}
              <strong>{formatCurrency(entry.value)}</strong>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0];
      return (
        <div className="chart-custom-tooltip">
          <p className="tooltip-label" style={{ color: d.payload.color }}>
            {d.name}
          </p>
          <p className="tooltip-entry">
            Amount: <strong>{formatCurrency(d.value)}</strong>
          </p>
          <p className="tooltip-entry text-muted">
            Share: <strong>{d.payload.percentage}%</strong>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="analytics-page">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Spending Analytics & Visual Charts</h1>
          <p className="page-subtitle">
            Comprehensive breakdown of monthly trends, cash flow comparisons, and category allocations
          </p>
        </div>

        {/* Filters */}
        <div className="analytics-filter-bar">
          <div className="filter-input-wrap">
            <Calendar size={16} className="filter-icon" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="filter-select"
            >
              {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                <option key={y} value={y}>
                  Year {y}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-input-wrap">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="filter-select"
            >
              <option value="">Full Year (Jan - Dec)</option>
              {monthNames.map((m) => (
                <option key={m.num} value={m.num}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3 Summary Statistic Cards for Selected Period */}
      <div className="metrics-grid">
        <div className="metric-card card-income">
          <div className="metric-header">
            <span className="metric-label">Period Total Income</span>
            <div className="metric-icon-wrap icon-income">
              <ArrowDownCircle size={20} />
            </div>
          </div>
          <div className="metric-value text-income">
            {formatCurrency(data?.total_income)}
          </div>
        </div>

        <div className="metric-card card-expense">
          <div className="metric-header">
            <span className="metric-label">Period Total Expense</span>
            <div className="metric-icon-wrap icon-expense">
              <ArrowUpCircle size={20} />
            </div>
          </div>
          <div className="metric-value text-expense">
            {formatCurrency(data?.total_expense)}
          </div>
        </div>

        <div className="metric-card card-savings">
          <div className="metric-header">
            <span className="metric-label">Net Accumulated Savings</span>
            <div className="metric-icon-wrap icon-savings">
              <PiggyBank size={20} />
            </div>
          </div>
          <div className={`metric-value ${data?.net_savings >= 0 ? 'text-income' : 'text-expense'}`}>
            {formatCurrency(data?.net_savings)}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="page-loading">
          <div className="spinner"></div>
          <p>Rendering interactive charts...</p>
        </div>
      ) : (
        <>
          {/* Chart 1: Income vs Expense Comparison Across 12 Months */}
          <div className="content-card chart-card">
            <div className="card-header-row">
              <div>
                <h3>Income vs Expense Monthly Comparison</h3>
                <p className="card-subtitle">Side-by-side cash flow analysis across months for {selectedYear}</p>
              </div>
            </div>

            <div className="chart-container-large">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={data?.monthly_trends || []} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" height={36} />
                  <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Dual Charts Row: Monthly Savings Trend & Category Breakdown Pie */}
          <div className="analytics-dual-grid">
            {/* Chart 2: Net Monthly Savings Trend (Area Chart) */}
            <div className="content-card chart-card">
              <div className="card-header-row">
                <div>
                  <h3>Monthly Savings Trend</h3>
                  <p className="card-subtitle">Net savings accumulated per month</p>
                </div>
              </div>

              <div className="chart-container-medium">
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={data?.monthly_trends || []} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tickLine={false} />
                    <YAxis tickLine={false} tickFormatter={(v) => `$${v}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="savings"
                      name="Savings"
                      stroke="#6366f1"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#savingsGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Category-wise Spending Donut/Pie Chart */}
            <div className="content-card chart-card">
              <div className="card-header-row">
                <div>
                  <h3>Category Spending Breakdown</h3>
                  <p className="card-subtitle">Proportion of expenses by category</p>
                </div>
              </div>

              {data?.category_expenses?.length === 0 ? (
                <div className="empty-state">
                  <p>No expense transactions recorded in this period.</p>
                </div>
              ) : (
                <div className="pie-chart-with-legend">
                  <div className="pie-wrapper">
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie
                          data={data?.category_expenses}
                          dataKey="amount"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={95}
                          paddingAngle={3}
                        >
                          {data?.category_expenses?.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="chart-legend-list">
                    {data?.category_expenses?.slice(0, 6).map((item) => (
                      <div key={item.name} className="legend-row">
                        <div className="legend-name-wrap">
                          <span className="legend-color-box" style={{ backgroundColor: item.color }} />
                          <span className="legend-name">{item.name}</span>
                        </div>
                        <div className="legend-val-wrap">
                          <span className="legend-val">{formatCurrency(item.amount)}</span>
                          <span className="legend-pct">({item.percentage}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Breakdown by Payment Methods Table / Visual */}
          <div className="content-card chart-card">
            <div className="card-header-row">
              <div>
                <h3>Payment Methods Breakdown</h3>
                <p className="card-subtitle">Where your transaction volume was routed</p>
              </div>
            </div>

            {data?.payment_methods?.length === 0 ? (
              <div className="empty-state">
                <p>No payment method records for this period.</p>
              </div>
            ) : (
              <div className="payment-methods-grid">
                {data?.payment_methods?.map((pm) => (
                  <div key={pm.method} className="pm-metric-box">
                    <span className="pm-title">{pm.label}</span>
                    <h4 className="pm-amount">{formatCurrency(pm.amount)}</h4>
                    <span className="pm-count text-muted text-xs">{pm.count} transactions</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
