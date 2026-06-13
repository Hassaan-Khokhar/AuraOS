import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hexagon, Lock, UserCheck, ArrowRight } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        localStorage.setItem('token', data.token);
        if (data.user && data.user.role) {
          localStorage.setItem('role', data.user.role);
        }
        navigate('/');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      console.error(err);
      setError('Cannot connect to server. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setEmail('demo@admin.com');
    setPassword('admin123');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '420px',
        padding: '40px',
        textAlign: 'center'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <div style={{ 
            background: 'rgba(59, 130, 246, 0.1)', 
            padding: '16px', 
            borderRadius: '50%',
            border: '1px solid rgba(59, 130, 246, 0.3)'
          }}>
            <Hexagon size={48} color="var(--accent-blue)" strokeWidth={1.5} />
          </div>
        </div>
        
        <h1 style={{ fontSize: '28px', marginBottom: '8px', fontWeight: '700' }}>Secure Access</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Authorized personnel only</p>
        
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-red)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex-col gap-4">
          <div className="flex-col gap-2" style={{ textAlign: 'left' }}>
            <label style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>Admin Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="glass-input" 
              placeholder="admin@aura.com" 
              required
            />
          </div>
          
          <div className="flex-col gap-2" style={{ textAlign: 'left', marginBottom: '16px' }}>
            <label style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="glass-input" 
              placeholder="••••••••" 
              required
            />
          </div>
          
          <button type="submit" className="glass-button flex items-center justify-center gap-2" disabled={loading}>
            {loading ? 'Authenticating...' : (
              <>
                <Lock size={18} />
                Access Command Center
              </>
            )}
          </button>
        </form>

        <div 
          onClick={handleDemoLogin}
          className="demo-card"
          style={{
            marginTop: '32px',
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--glass-border)',
            borderRadius: '12px',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
            e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
            e.currentTarget.style.borderColor = 'var(--glass-border)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              background: 'rgba(59, 130, 246, 0.1)', 
              padding: '10px', 
              borderRadius: '8px',
              color: 'var(--accent-blue)'
            }}>
              <UserCheck size={20} />
            </div>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '2px' }}>
                Recruiter Quick Access
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Click to auto-fill demo credentials
              </p>
            </div>
          </div>
          <ArrowRight size={18} color="var(--text-muted)" style={{ opacity: 0.7 }} />
        </div>
      </div>
    </div>
  );
};

export default Login;
