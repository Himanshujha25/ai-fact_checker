import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, Settings, LogOut, Key, Moon, Sun, Home, Gavel, Clock, User, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const GOLD  = '#C9A84C';
const GOLD_L= 'rgba(201,168,76,0.12)';
const LINE  = 'rgba(255,255,255,0.07)';
const TEXT  = '#E8E4DC';
const MUTED = 'rgba(232,228,220,0.38)';
const DIM   = 'rgba(232,228,220,0.18)';
const BG    = 'rgba(8,8,14,0.96)';

const LINKS = [
  { to: '/',        label: 'Overview', end: true },
  { to: '/verify',  label: 'Workbench'           },
];

/* Mobile bottom nav tabs */
const MOB_TABS = [
  { to: '/',        label: 'Home',      icon: Home,  end: true },
  { to: '/verify',  label: 'Workbench', icon: Gavel              },
  { to: '/history', label: 'Archive',   icon: Clock              },
  { to: '/auth',    label: 'Account',   icon: User               },
];

export default function SubNavbar() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const location         = useLocation();
  const [visible,     setVisible]     = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [searchFocus, setSearchFocus] = useState(false);
  const [showSearch,  setShowSearch]  = useState(false); // mobile search overlay
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/history?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  /* hide-on-scroll (desktop only) */
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setVisible(y <= lastScrollY || y <= 80);
      setLastScrollY(y);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [lastScrollY]);

  const initials = user
    ? (user.name ? user.name.charAt(0) : user.email.charAt(0)).toUpperCase()
    : '';

  const isActive = (to, end) => end
    ? location.pathname === to
    : location.pathname.startsWith(to);

  return (
    <>
      <style>{`

        /* ── Desktop nav ── */
        .sn-nav {
          padding: 0 40px;
          position: sticky; top: 0; z-index: 100;
          height: 60px;
          background: rgba(8,8,14,0.92);
          backdrop-filter: blur(18px);
          border-bottom: 1px solid ${LINE};
          display: flex; align-items: center;
          justify-content: space-between;
          font-family: 'DM Sans', system-ui, sans-serif;
        }

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
          width: 30px; height: 30px;
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

        /* ── Mobile bottom bar ── */
        .mob-bar {
          display: none;
          position: fixed; bottom: 0; left: 0; right: 0;
          height: 64px;
          background: rgba(8,8,14,0.97);
          backdrop-filter: blur(24px);
          border-top: 1px solid rgba(255,255,255,0.08);
          z-index: 200;
          padding: 0 8px;
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }

        .mob-tab {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 4px; padding: 10px 4px 8px;
          background: none; border: none; cursor: pointer;
          transition: opacity 0.15s;
          -webkit-tap-highlight-color: transparent;
          text-decoration: none;
        }
        .mob-tab:active { opacity: 0.6; }

        .mob-tab-label {
          font-family: 'DM Mono', monospace;
          font-size: 9px; font-weight: 500;
          letter-spacing: 0.06em; text-transform: uppercase;
          transition: color 0.2s;
        }

        .mob-tab-pill {
          width: 36px; height: 4px; border-radius: 2px;
          background: ${GOLD}; margin-bottom: 2px;
          transition: opacity 0.2s, transform 0.2s;
        }

        /* Mobile search overlay */
        .mob-search-overlay {
          position: fixed; inset: 0; z-index: 300;
          background: rgba(8,8,14,0.97);
          backdrop-filter: blur(20px);
          display: flex; flex-direction: column;
          align-items: center; justify-content: flex-start;
          padding: 80px 24px 24px;
        }
        .mob-search-input {
          width: 100%; box-sizing: border-box;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(201,168,76,0.35);
          border-radius: 12px;
          padding: 16px 20px;
          font-family: 'DM Mono', monospace;
          font-size: 14px; color: ${TEXT};
          outline: none;
        }
        .mob-search-input::placeholder { color: ${DIM}; }

        /* Responsive breakpoints */
        @media (max-width: 768px) {
          .sn-nav        { display: none !important; }
          .mob-bar       { display: flex !important; }
          /* Push page content above the bottom bar */
          body           { padding-bottom: 64px; }
        }

        @media (min-width: 769px) {
          .mob-bar       { display: none !important; }
          .sn-nav        { padding: 0 40px; }
        }

        @media (max-width: 480px) {
          .sn-nav        { padding: 0 16px; }
        }
      `}</style>

      {/* ══════════ DESKTOP NAVBAR ══════════════════════════════ */}
      <motion.nav
        className="sn-nav"
        initial={{ y: 0 }}
        animate={{ y: visible ? 0 : -72 }}
        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Brand + links */}
        <div style={{ display:'flex', alignItems:'center', gap:24 }}>
          <div onClick={() => navigate('/')} style={{ cursor:'pointer', display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:28, height:28, borderRadius:6, overflow:'hidden', border:`1px solid ${LINE}`, background:'rgba(255,255,255,0.03)' }}>
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDjUYtJ0yORs6yPNTdJwSZr__L9nULtru8NP22BYdhBdhZ6B0cJN-JsxA4LCxnq6j2pU2IQkS6GblpdOG0o3gysYwpbLCeQ83wt2WvMf9M92JJWiFzRi63m8paImUIBEq2ZIB6HMVlsxCVQqs_hzrEJdDm30tKnoUduOKeVbc4vgZja05-8yA0Tn7J8j7qmWg2O07LITQ_-vmFQCa81mJvkhJeIjTnQ5hhhHaygn5S9EWhmQX1yTF_Sx5nCPrNgu8416xaiMPc6aCo"
                alt="Logo" style={{ width:'100%', height:'100%', objectFit:'cover' }}
              />
            </div>
            <span style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:16, fontWeight:400, color:TEXT, letterSpacing:'-0.01em', userSelect:'none' }}>
              Truecast
            </span>
          </div>

          <div style={{ width:1, height:18, background:LINE }}/>

          <div style={{ display:'flex', alignItems:'center', gap:28 }}>
            {LINKS.map(link => (
              <NavLink key={link.to} to={link.to} end={link.end}
                className={({ isActive }) => `nav-link${isActive?' active':''}`}>
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Right controls */}
        <div style={{ display:'flex', alignItems:'center', gap:18 }}>
          <div style={{ position:'relative', display:'flex', alignItems:'center' }}>
            <Search size={12} color={DIM} style={{ position:'absolute', left:12, pointerEvents:'none' }}/>
            <input type="text" placeholder="Search evidence…" className="nav-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              onFocus={() => setSearchFocus(true)} onBlur={() => setSearchFocus(false)}/>
          </div>

          <div style={{ width:1, height:18, background:LINE }}/>

          {user ? (
            <div className="nav-user-pill">
              <div style={{ textAlign:'right' }}>
                <p style={{ fontFamily:"'DM Sans',system-ui,sans-serif", fontSize:12, fontWeight:500, color:TEXT, lineHeight:1.2 }}>
                  {user.name || user.email.split('@')[0]}
                </p>
                <p style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:DIM, letterSpacing:'0.08em', textTransform:'uppercase', lineHeight:1 }}>
                  Verified User
                </p>
              </div>
              <div className="nav-avatar" onClick={logout}>
                {initials}
                <div className="nav-logout-overlay"><LogOut size={11} color="#fff"/></div>
              </div>
            </div>
          ) : (
            <NavLink to="/auth" style={{ textDecoration:'none' }}>
              {({ isActive: ia }) => (
                <div style={{ width:34, height:34, borderRadius:'50%', background:ia?GOLD_L:'rgba(255,255,255,0.04)', border:`1px solid ${ia?'rgba(201,168,76,0.35)':LINE}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'background 0.2s, border-color 0.2s' }}>
                  <Key size={15} color={ia?GOLD:DIM}/>
                </div>
              )}
            </NavLink>
          )}
        </div>
      </motion.nav>

      {/* ══════════ MOBILE BOTTOM BAR ═══════════════════════════ */}
      <nav className="mob-bar">
        {MOB_TABS.filter(tab => !(tab.to === '/auth' && user)).map(tab => {
          const active = isActive(tab.to, tab.end);
          const Ic = tab.icon;

          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className="mob-tab"
              style={{ textDecoration:'none' }}
            >
              {/* Active indicator pip */}
              <div style={{ width:32, height:32, borderRadius:10, background:active?GOLD_L:'transparent', border:active?`1px solid rgba(201,168,76,0.25)`:'1px solid transparent', display:'flex', alignItems:'center', justifyContent:'center', transition:'background 0.2s, border-color 0.2s', marginBottom:1 }}>
                <Ic size={17} color={active ? GOLD : DIM} strokeWidth={active ? 2 : 1.5}/>
              </div>
              <span className="mob-tab-label" style={{ color: active ? GOLD : DIM }}>
                {tab.label}
              </span>
            </NavLink>
          );
        })}

        {/* Search tab */}
        <button className="mob-tab" onClick={() => setShowSearch(true)}
          style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4, padding:'10px 4px 8px', background:'none', border:'none', cursor:'pointer' }}>
          <div style={{ width:32, height:32, borderRadius:10, background:'transparent', border:'1px solid transparent', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Search size={17} color={DIM} strokeWidth={1.5}/>
          </div>
          <span className="mob-tab-label" style={{ color:DIM }}>Search</span>
        </button>
      </nav>

      {/* ══════════ MOBILE SEARCH OVERLAY ═══════════════════════ */}
      <AnimatePresence>
        {showSearch && (
          <motion.div className="mob-search-overlay"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            transition={{ duration:0.2 }}>
            <div style={{ width:'100%', maxWidth:480, position:'relative' }}>
              <button onClick={() => setShowSearch(false)}
                style={{ position:'absolute', top:-52, right:0, background:'none', border:'none', cursor:'pointer', color:DIM, display:'flex', alignItems:'center', justifyContent:'center', width:36, height:36 }}>
                <X size={20} color={MUTED}/>
              </button>
              <p style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:DIM, letterSpacing:'0.14em', textTransform:'uppercase', marginBottom:14 }}>
                Search Evidence
              </p>
              <input
                type="text"
                autoFocus
                placeholder="Search claims, reports, sources…"
                className="mob-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
              />
              <p style={{ marginTop:16, fontSize:12, color:DIM, textAlign:'center' }}>
                Press <strong style={{ color:MUTED }}>Esc</strong> or tap outside to close
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}