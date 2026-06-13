import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, MessageSquare, LogOut, Hexagon } from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <Hexagon size={32} color="var(--accent-blue)" strokeWidth={1.5} />
        AuraOS Admin
      </div>
      
      <nav style={{ flex: 1 }}>
        <NavLink 
          to="/" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard size={20} />
          <span>Command Center</span>
        </NavLink>
        
        <NavLink 
          to="/orders" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <ShoppingCart size={20} />
          <span>Orders</span>
        </NavLink>
        
        <NavLink 
          to="/support" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <MessageSquare size={20} />
          <span>AI Support</span>
        </NavLink>
      </nav>

      <button 
        onClick={handleLogout} 
        className="nav-link logout-btn" 
      >
        <LogOut size={20} style={{ transition: 'color 0.3s' }} />
        <span>Secure Logout</span>
      </button>
    </aside>
  );
};

export default Sidebar;
