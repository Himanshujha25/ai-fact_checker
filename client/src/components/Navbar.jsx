import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ShieldCheck, Sun, Moon, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ darkMode, setDarkMode }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <div style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '-1px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => navigate('/')}>
        <ShieldCheck color="#6366f1" size={24} /> VERICHECK.AI
      </div>
      <div className="nav-links">
        <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>Home</NavLink>
        {user ? (
          <>
            <NavLink to="/verify" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Verify</NavLink>
            <NavLink to="/history" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>History</NavLink>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginLeft: '1rem', paddingLeft: '1.5rem', borderLeft: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', color: '#94a3b8' }}>
                <User size={14} /> {user.email?.split('@')[0]}
              </div>
              <button 
                onClick={logout}
                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          </>
        ) : (
          <NavLink to="/auth" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Sign In</NavLink>
        )}
        <NavLink to="/architecture" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Arch</NavLink>
        <button onClick={() => setDarkMode(!darkMode)} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: '4px', marginLeft: '8px' }}>
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
