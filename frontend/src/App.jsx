import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate, NavLink } from 'react-router-dom';
import { Hexagon, Menu, Info, LayoutDashboard, ShoppingCart, MessageSquare, LogOut } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Support from './pages/Support';

// Simple auth wrapper for demo
const ProtectedRoute = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const isAuthenticated = localStorage.getItem('token');
  const location = useLocation();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="dashboard-layout">
      {/* Mobile Top Navbar */}
      <div className="mobile-top-header">
        <div className="flex items-center gap-2">
          <Hexagon size={24} color="var(--accent-blue)" strokeWidth={1.5} />
          <span style={{ fontWeight: 700, fontSize: '18px' }}>AuraOS Admin</span>
        </div>
        <div>
          <button
            className="glass-button"
            style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu size={20} />
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="glass-panel" style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: '16px',
            borderTop: 'none',
            borderRadius: '0 0 16px 16px',
            gap: '8px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            background: 'rgba(15, 23, 42, 0.95)'
          }}>
            <NavLink to="/" onClick={() => setIsMobileMenuOpen(false)} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-main)', textDecoration: 'none', fontSize: '15px', fontWeight: 500, borderRadius: '8px' }} className={({isActive}) => isActive ? 'mobile-nav-active' : ''}>
              <LayoutDashboard size={18} /> Command Center
            </NavLink>
            <NavLink to="/orders" onClick={() => setIsMobileMenuOpen(false)} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-main)', textDecoration: 'none', fontSize: '15px', fontWeight: 500, borderRadius: '8px' }} className={({isActive}) => isActive ? 'mobile-nav-active' : ''}>
              <ShoppingCart size={18} /> Orders
            </NavLink>
            <NavLink to="/support" onClick={() => setIsMobileMenuOpen(false)} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-main)', textDecoration: 'none', fontSize: '15px', fontWeight: 500, borderRadius: '8px' }} className={({isActive}) => isActive ? 'mobile-nav-active' : ''}>
              <MessageSquare size={18} /> AI Support
            </NavLink>
            
            <div style={{ height: '1px', background: 'var(--glass-border)', margin: '8px 0' }}></div>
            
            <button
              onClick={handleLogout}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textAlign: 'left', color: 'var(--accent-red)', width: '100%', fontWeight: 600, fontSize: '15px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <LogOut size={18} /> Secure Logout
            </button>
          </div>
        )}
      </div>

      <Sidebar />
      <main className="main-content">
        {localStorage.getItem('role') === 'demo' && (
          <div style={{
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: 'var(--text-main)'
          }}>
            <Info size={20} color="var(--accent-blue)" />
            <p style={{ fontSize: '14px', margin: 0, fontWeight: 500 }}>
              <strong style={{ color: 'var(--accent-blue)' }}>Demo Mode Active:</strong> You have read-only access. You can explore the app, but actions like modifying orders or deleting tickets will be simulated.
            </p>
          </div>
        )}
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />

        {/* Redirect unknown routes to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
