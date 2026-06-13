import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Hexagon, Menu } from 'lucide-react';
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
        <div style={{ position: 'relative' }}>
          <button 
            className="glass-button" 
            style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu size={20} />
          </button>
          
          {isMobileMenuOpen && (
            <div className="glass-panel" style={{ 
              position: 'absolute', 
              top: '100%', 
              right: 0, 
              marginTop: '8px', 
              width: '160px',
              display: 'flex',
              flexDirection: 'column',
              padding: '8px'
            }}>
              <button 
                onClick={handleLogout}
                style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--accent-red)', width: '100%', fontWeight: 600, fontSize: '14px', borderRadius: '8px' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                Secure Logout
              </button>
            </div>
          )}
        </div>
      </div>

      <Sidebar />
      <main className="main-content">
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
