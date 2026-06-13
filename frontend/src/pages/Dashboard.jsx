import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart 
} from 'recharts';
import { DollarSign, ShoppingBag, Package, AlertOctagon } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const MetricCard = ({ title, value, icon: Icon, trend, colorClass }) => (
  <div className="glass-panel metric-card-hover" style={{ padding: '24px', flex: 1, minWidth: '240px' }}>
    <div className="flex justify-between items-center" style={{ marginBottom: '16px' }}>
      <h3 style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '13px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</h3>
      <div style={{ 
        padding: '8px', 
        borderRadius: '8px', 
        background: `rgba(var(--${colorClass}-rgb, 59, 130, 246), 0.1)`,
        color: `var(--${colorClass})`
      }}>
        <Icon size={20} />
      </div>
    </div>
    <div className="flex items-center gap-4">
      <h2 style={{ fontSize: '32px', fontWeight: 700 }}>{value}</h2>
      {trend && (
        <span style={{ 
          fontSize: '12px', 
          fontWeight: 600, 
          color: trend.startsWith('+') ? 'var(--accent-green)' : 'var(--accent-red)',
          background: trend.startsWith('+') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          padding: '4px 8px',
          borderRadius: '12px'
        }}>
          {trend}
        </span>
      )}
    </div>
  </div>
);

const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    ordersToday: 0,
    pendingShipments: 0,
    urgentTickets: 0,
    revenueTrend: '+0',
    ordersTrend: '+0',
    pendingPercent: '0',
    urgentPercent: '0'
  });
  const [chartData, setChartData] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState(false);
  const [days, setDays] = useState(30);

  const fetchDashboardData = async (selectedDays, isInitial = false) => {
    try {
      if (isInitial) setInitialLoading(true);
      else setChartLoading(true);
      setError(false);

      const token = localStorage.getItem('token');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(`${API_URL}/api/dashboard/metrics?days=${selectedDays}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      
      if (res.ok) {
        setMetrics(data.metrics);
        setChartData(data.chartData);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard metrics:', err);
      setError(true);
    } finally {
      setInitialLoading(false);
      setChartLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchDashboardData(days, true);
  }, []);

  const handleDaysChange = (e) => {
    const newDays = parseInt(e.target.value);
    setDays(newDays);
    fetchDashboardData(newDays, false);
  };

  const periodLabel = days === 7 ? 'last 7 days' : days === 90 ? 'last 90 days' : 'last 30 days';

  if (initialLoading) {
    return <div style={{ padding: '40px', color: 'var(--text-muted)' }}>Loading dashboard data...</div>;
  }

  if (error && chartData.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <p style={{ marginBottom: '16px' }}>Failed to load dashboard. Check if the backend server is running.</p>
        <button className="glass-button" onClick={() => fetchDashboardData(days, true)}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Command Center</h1>
        <p className="page-subtitle">Real-time overview of your business metrics</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <MetricCard 
          title="Total Revenue" 
          value={`$${metrics.totalRevenue.toLocaleString()}`} 
          icon={DollarSign} 
          trend={`${metrics.revenueTrend}%`} 
          colorClass="accent-green" 
        />
        <MetricCard 
          title="Orders Today" 
          value={metrics.ordersToday.toLocaleString()} 
          icon={ShoppingBag} 
          trend={`${metrics.ordersTrend}%`} 
          colorClass="accent-blue" 
        />
        <MetricCard 
          title="Pending Shipments" 
          value={metrics.pendingShipments.toString()} 
          icon={Package} 
          trend={`${metrics.pendingPercent}% of total`} 
          colorClass="accent-orange" 
        />
        <MetricCard 
          title="Urgent Tickets" 
          value={metrics.urgentTickets.toString()} 
          icon={AlertOctagon} 
          trend={`${metrics.urgentPercent}% of total`} 
          colorClass="accent-red" 
        />
      </div>

      <div className="glass-panel" style={{ padding: '32px 16px', height: '400px' }}>
        <div className="flex justify-between items-center mobile-flex-col" style={{ marginBottom: '24px', gap: '16px', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '4px' }}>Revenue Overview</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Sales performance over the {periodLabel}</p>
          </div>
          <select className="glass-input" style={{ width: '150px' }} value={days} onChange={handleDaysChange}>
            <option value="7" style={{ color: 'black' }}>Last 7 Days</option>
            <option value="30" style={{ color: 'black' }}>Last 30 Days</option>
            <option value="90" style={{ color: 'black' }}>Last 90 Days</option>
          </select>
        </div>
        
        <div style={{ position: 'relative', width: '100%', height: '85%' }}>
          {chartLoading && (
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(2, 6, 23, 0.5)', backdropFilter: 'blur(4px)',
              borderRadius: '8px', zIndex: 10
            }}>
              <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>Updating chart...</span>
            </div>
          )}
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 15, left: 5, bottom: 30 }}>
            <defs>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="var(--text-muted)" 
              tick={{fill: 'var(--text-muted)', fontSize: 12}} 
              axisLine={false} 
              tickLine={false} 
              minTickGap={days <= 7 ? 10 : 30}
              tickMargin={12}
            />
            <YAxis 
              stroke="var(--text-muted)" 
              tick={{fill: 'var(--text-muted)', fontSize: 12}} 
              axisLine={false} 
              tickLine={false} 
              tickFormatter={(value) => {
                if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
                return `$${value}`;
              }} 
              width={55}
              padding={{ bottom: 20 }}
            />
            <Tooltip 
              cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2, strokeDasharray: '4 4' }}
              contentStyle={{ 
                background: 'rgba(15, 23, 42, 0.9)', 
                border: '1px solid var(--glass-border)',
                borderRadius: '8px',
                color: 'white',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)'
              }}
              formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
              itemStyle={{ color: 'var(--accent-blue)', fontWeight: 600 }}
              labelStyle={{ color: 'var(--text-muted)', marginBottom: '4px' }}
            />
            <Area 
              type="natural" 
              dataKey="sales" 
              stroke="var(--accent-blue)" 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#colorSales)" 
              activeDot={{ r: 6, fill: 'var(--bg-darker)', stroke: 'var(--accent-blue)', strokeWidth: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
