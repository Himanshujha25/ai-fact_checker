import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Search, Bell, Settings, LogOut, Key, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

/* ─── Design tokens ───────────────────────────────────────────── */
const GOLD  = '#C9A84C';
const LINE  = 'rgba(255,255,255,0.07)';
const TEXT  = '#E8E4DC';
const MUTED = 'rgba(232,228,220,0.38)';
const DIM   = 'rgba(232,228,220,0.18)';

const LINKS = [
  { to: '/',             label: 'Overview',  end: true },
   { to: '/verify',       label: 'Workbench'            },
  // { to: '/history',      label: 'Archive'              },
  // { to: '/architecture', label: 'Protocol'             },
];

export default function SubNavbar() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const [visible,      setVisible]      = useState(true);
  const [lastScrollY,  setLastScrollY]  = useState(0);
  const [searchFocus,  setSearchFocus]  = useState(false);
  const [theme,        setTheme]        = useState(localStorage.getItem('theme') || 'light');

  /* ── hide-on-scroll ── */
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setVisible(y <= lastScrollY || y <= 80);
      setLastScrollY(y);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [lastScrollY]);

  /* ── theme sync ── */
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const initials = user
    ? (user.name ? user.name.charAt(0) : user.email.charAt(0)).toUpperCase()
    : '';

  return (
    <motion.nav
      initial={{ y: 0 }}
      animate={{ y: visible ? 0 : -72 }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      style={{
        position: 'sticky', top: 0, zIndex: 100,
        height: 60,
        background: 'rgba(8,8,14,0.92)',
        backdropFilter: 'blur(18px)',
        borderBottom: `1px solid ${LINE}`,
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=DM+Serif+Display@0;1&family=DM+Mono:wght@400;500&display=swap');

        .nav-link {
          font-family: 'DM Mono', monospace;
          font-size: 10px; font-weight: 500;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: ${DIM}; text-decoration: none;
          padding: 6px 0; position: relative;
          transition: color 0.2s;
        }
        .nav-link::after {
          content: ''; position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 1.5px; background: ${GOLD};
          transform: scaleX(0); transform-origin: left;
          transition: transform 0.25s ease;
        }
        .nav-link:hover { color: ${MUTED}; }
        .nav-link.active { color: ${TEXT}; }
        .nav-link.active::after { transform: scaleX(1); }

        .nav-icon-btn {
          background: none; border: none; cursor: pointer; padding: 0;
          color: ${DIM}; display: flex; align-items: center;
          transition: color 0.2s;
        }
        .nav-icon-btn:hover { color: rgba(232,228,220,0.65); }

        .nav-search {
          height: 34px; width: 170px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 100px;
          padding: 0 14px 0 36px;
          font-family: 'DM Mono', monospace;
          font-size: 10px; color: ${TEXT};
          outline: none; transition: border-color 0.2s, background 0.2s, width 0.3s;
        }
        .nav-search::placeholder { color: ${DIM}; }
        .nav-search:focus {
          border-color: rgba(201,168,76,0.35);
          background: rgba(201,168,76,0.04);
          width: 210px;
        }

        .nav-avatar {
          width: 30px; height: 30px; border-radius: '50%';
          border-radius: 50%;
          background: rgba(201,168,76,0.15);
          border: 1px solid rgba(201,168,76,0.3);
          color: ${GOLD};
          font-family: 'DM Mono', monospace;
          font-size: 11px; font-weight: 500;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: background 0.2s;
          position: relative;
        }
        .nav-avatar:hover { background: rgba(201,168,76,0.25); }

        .nav-user-pill {
          display: flex; align-items: center; gap: 10px;
          padding: 4px 12px 4px 10px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 100px; cursor: pointer;
          transition: border-color 0.2s;
        }
        .nav-user-pill:hover { border-color: rgba(255,255,255,0.14); }

        .nav-logout-overlay {
          position: absolute; inset: 0; border-radius: 50%;
          background: rgba(248,113,113,0.85);
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity 0.2s;
        }
        .nav-avatar:hover .nav-logout-overlay { opacity: 1; }
      `}</style>

      {/* ── Brand + Nav links ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
        {/* Wordmark */}
        <div
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
        >
          <span style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 16, fontWeight: 400, color: TEXT,
            letterSpacing: '-0.01em', userSelect: 'none',
          }}>
            The Verified Editorial
          </span>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 18, background: LINE }} />

        {/* Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          {LINKS.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </div>

      {/* ── Right controls ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        {/* Search */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={12} color={DIM} style={{ position: 'absolute', left: 12, pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search evidence…"
            className="nav-search"
            onFocus={() => setSearchFocus(true)}
            onBlur={() => setSearchFocus(false)}
          />
        </div>

        <div style={{ width: 1, height: 18, background: LINE }} />

        {/* Icon buttons */}
        {/* <button
          className="nav-icon-btn"
          onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>
        <button className="nav-icon-btn"><Bell size={16} /></button>
        <button className="nav-icon-btn"><Settings size={16} /></button> */}

        <div style={{ width: 1, height: 18, background: LINE }} />

        {/* User / auth */}
        {user ? (
          <div className="nav-user-pill">
            <div style={{ textAlign: 'right' }}>
              <p style={{
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: 12, fontWeight: 500, color: TEXT, lineHeight: 1.2,
              }}>
                {user.name || user.email.split('@')[0]}
              </p>
              <p style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 8, color: DIM, letterSpacing: '0.08em',
                textTransform: 'uppercase', lineHeight: 1,
              }}>
                Verified User
              </p>
            </div>
            <div className="nav-avatar" onClick={logout}>
              {initials}
              <div className="nav-logout-overlay">
                <LogOut size={11} color="#fff" />
              </div>
            </div>
          </div>
        ) : (
          <NavLink
            to="/auth"
            style={{ textDecoration: 'none' }}
          >
            {({ isActive }) => (
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: isActive ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isActive ? 'rgba(201,168,76,0.35)' : LINE}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'background 0.2s, border-color 0.2s',
              }}>
                <Key size={15} color={isActive ? GOLD : DIM} />
              </div>
            )}
          </NavLink>
        )}
      </div>
    </motion.nav>
  );
}