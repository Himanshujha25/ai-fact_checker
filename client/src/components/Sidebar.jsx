
import React from 'react';
import { NavLink } from 'react-router-dom';
import { ShieldCheck, Home, ScanSearch, History, Cpu, Globe, Zap } from 'lucide-react';

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <ShieldCheck color="#6366f1" size={28} />
        <span>VERICHECK<strong style={{ color: '#6366f1' }}>.AI</strong></span>
      </div>

      <nav className="nav-links">
        <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
          <Home size={18} /> Home
        </NavLink>
        <NavLink to="/verify" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <ScanSearch size={18} /> Verify Claims
        </NavLink>
        <NavLink to="/history" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <History size={18} /> History
        </NavLink>
        <NavLink to="/architecture" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Cpu size={18} /> Architecture
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '12px', fontSize: '0.75rem', color: '#94a3b8' }}>
          <Zap size={14} color="#6366f1" fill="#6366f1" />
          <span>Pro Plan Activated</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
