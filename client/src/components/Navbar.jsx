import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ShieldCheck, Sun, Moon, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ darkMode, setDarkMode }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="navbar-capsule">
      <div 
        className="flex items-center gap-2 cursor-pointer group" 
        onClick={() => navigate('/')}
      >
        <ShieldCheck className="text-primary w-5 h-5 group-hover:drop-shadow-[0_0_12px_rgba(139,92,246,0.6)] transition-all" />
        <span className="text-[12px] font-black tracking-tighter text-white uppercase italic">VeriCheck.AI</span>
      </div>
      
      <div className="flex items-center gap-8">
        <NavLink to="/" className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`} end>Home</NavLink>
        {user ? (
          <>
            <NavLink to="/verify" className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}>Verify</NavLink>
            <NavLink to="/history" className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}>History</NavLink>
            <div className="flex items-center gap-6 ml-4 pl-6 border-l border-white/5 text-text-muted">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                <User size={12} className="text-primary" /> {user.email?.split('@')[0]}
              </div>
              <button 
                onClick={logout}
                className="hover:text-danger transition-colors p-1"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          </>
        ) : (
          <NavLink to="/auth" className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}>Sign In</NavLink>
        )}
        <NavLink to="/architecture" className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}>Arch</NavLink>
        <button 
          onClick={() => setDarkMode(!darkMode)} 
          className="p-2 ml-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-text-muted hover:text-white"
        >
          {darkMode ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
