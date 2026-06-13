import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, ChevronDown } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const PAGE_SIZE = 30;

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const ordersRef = useRef([]);

  const fetchOrders = async (searchQuery = '', append = false) => {
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);

      const token = localStorage.getItem('token');
      const currentOrders = append ? ordersRef.current : [];
      const skip = currentOrders.length;
      const params = new URLSearchParams({ skip: skip.toString(), limit: PAGE_SIZE.toString() });
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`${API_URL}/api/orders?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        const newOrders = append ? [...currentOrders, ...data.orders] : data.orders;
        setOrders(newOrders);
        ordersRef.current = newOrders;
        setHasMore(data.hasMore);
        setTotalCount(data.total);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Initial load on mount
  useEffect(() => {
    fetchOrders('', false);
  }, []);

  // Debounced search (only fires when search actually changes from user input)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timeoutId = setTimeout(() => {
      ordersRef.current = [];
      fetchOrders(search, false);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [search]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/orders/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const updated = orders.map(order => 
          order.orderId === id ? { ...order, status: newStatus } : order
        );
        setOrders(updated);
        ordersRef.current = updated;
      }
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const filteredOrders = Array.isArray(orders) ? orders.filter(order => {
    return statusFilter === 'All' || order.status === statusFilter;
  }) : [];

  const handleLoadMore = () => {
    fetchOrders(search, true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <h1 className="page-title">Order Management</h1>
          <p className="page-subtitle">Track, process, and manage customer orders</p>
        </div>
        <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
          <div className="glass-input flex items-center gap-2" style={{ flex: 1, padding: '8px 16px', minWidth: '200px' }}>
            <Search size={18} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Search ID or email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'inherit', width: '100%', outline: 'none' }}
            />
          </div>
          <div className="glass-input flex items-center gap-2" style={{ padding: '8px 16px' }}>
            <Filter size={18} color="var(--text-muted)" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'inherit', outline: 'none' }}
            >
              <option value="All" style={{ color: 'black' }}>All</option>
              <option value="Pending" style={{ color: 'black' }}>Pending</option>
              <option value="Shipped" style={{ color: 'black' }}>Shipped</option>
              <option value="Delivered" style={{ color: 'black' }}>Delivered</option>
            </select>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading orders...
          </div>
        ) : (
          <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
            <table style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse', textAlign: 'left', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '12%' }} />
                <col style={{ width: '28%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '20%' }} />
              </colgroup>
              <thead style={{ 
                position: 'sticky', 
                top: 0, 
                background: 'rgba(15, 23, 42, 0.95)',
                backdropFilter: 'blur(10px)',
                zIndex: 10,
                borderBottom: '1px solid var(--glass-border)'
              }}>
                <tr>
                  <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '13px' }}>Order ID</th>
                  <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '13px' }}>Customer Email</th>
                  <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '13px' }}>Date</th>
                  <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '13px' }}>Total</th>
                  <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '13px' }}>Status</th>
                  <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '13px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, idx) => (
                  <tr key={order._id || idx} style={{ 
                    borderBottom: '1px solid var(--glass-border)',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '14px 16px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.orderId || '—'}</td>
                    <td style={{ padding: '14px 16px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.customerEmail || '—'}</td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      ${order.totalAmount != null ? order.totalAmount.toFixed(2) : '0.00'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className={`badge badge-${(order.status || 'pending').toLowerCase()}`}>
                        {order.status || 'Pending'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <select 
                        className="glass-input" 
                        style={{ padding: '5px 10px', fontSize: '13px', width: '100%', maxWidth: '140px' }}
                        value={order.status || 'Pending'}
                        onChange={(e) => handleStatusChange(order.orderId, e.target.value)}
                      >
                        <option value="Pending" style={{ color: 'black' }}>Set Pending</option>
                        <option value="Shipped" style={{ color: 'black' }}>Set Shipped</option>
                        <option value="Delivered" style={{ color: 'black' }}>Set Delivered</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Load More / End of list */}
            <div style={{ padding: '20px', textAlign: 'center' }}>
              {hasMore ? (
                <button 
                  className="glass-button flex items-center justify-center gap-2"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  style={{ margin: '0 auto', padding: '10px 24px', fontSize: '14px' }}
                >
                  <ChevronDown size={16} />
                  {loadingMore ? 'Loading...' : 'Load More Orders'}
                </button>
              ) : filteredOrders.length > 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                  No more {statusFilter !== 'All' ? statusFilter.toLowerCase() : ''} orders to load
                </p>
              ) : null}
            </div>
            
            {filteredOrders.length === 0 && !loading && (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No orders found matching your criteria.
              </div>
            )}
          </div>
        )}
        
        <div style={{ 
          padding: '12px 16px', 
          borderTop: '1px solid var(--glass-border)', 
          color: 'var(--text-muted)', 
          fontSize: '13px',
          display: 'flex',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <span>Showing {filteredOrders.length} of {totalCount} orders</span>
        </div>
      </div>
    </div>
  );
};

export default Orders;
