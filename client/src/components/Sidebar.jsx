import React from 'react';
import {
  CheckCircle2, XCircle, HelpCircle, RefreshCw,
  AlertTriangle, Activity, Plus, Share, BarChart3,
  LayoutDashboard, History, Settings, Info, ArrowUpRight
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const GOLD  = '#C9A84C';
const GOLDD = 'rgba(201,168,76,0.15)';
const LINE  = 'rgba(255,255,255,0.07)';
const SURF  = 'rgba(255,255,255,0.03)';
const TEXT  = '#E8E4DC';
const MUTED = 'rgba(232,228,220,0.38)';
const DIM   = 'rgba(232,228,220,0.18)';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Workbench', path: '/verify'       },
  { icon: History,         label: 'History',   path: '/history'      },
  { icon: BarChart3,       label: 'Insights',  path: '/architecture' },
];

const FILTERS = [
  { icon: Activity,      label: 'All',         dot: 'rgba(232,228,220,0.3)' },
  { icon: CheckCircle2,  label: 'Verified',    dot: '#4ade80'               },
  { icon: XCircle,       label: 'Refuted',     dot: '#f87171'               },
  { icon: HelpCircle,    label: 'Inconclusive',dot: '#fbbf24'               },
  { icon: RefreshCw,     label: 'Processing',  dot: GOLD                    },
  { icon: AlertTriangle, label: 'Flagged',     dot: '#fb923c'               },
];

export default function Sidebar({ activeFilter, onFilterChange, onExport, onShare, ...props }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNewAnalysis = () => {
    navigate('/verify');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isActivePath = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <aside {...props} className="vf-sidebar">
      <style>{`
        .vf-sidebar {
          width: 240px;
          border-right: 1px solid ${LINE};
          display: flex;
          flex-direction: column;
          padding: 28px 16px;
          position: sticky;
          top: 6px;
          height: calc(100vh - 60px);
          background: #08080E;
          z-index: 40;
          flex-shrink: 0;
          overflow-y: auto;
          transition: transform 0.3s;
        }

        /* ── Hide sidebar on all mobile/tablet sizes ── */
        @media (max-width: 768px) {
          .vf-sidebar {
            display: none !important;
          }
        }

        .nav-btn {
          width: 100%; display: flex; align-items: center;
          gap: 12px; padding: 10px 14px;
          border-radius: 10px; border: none; cursor: pointer;
          background: transparent;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 13.5px; font-weight: 500;
          color: ${MUTED};
          transition: 0.2s cubic-bezier(0.2,0,0,1);
          text-align: left;
          margin-bottom: 2px;
        }
        .nav-btn:hover:not(.active) {
          background: ${SURF};
          color: ${TEXT};
          padding-left: 17px;
        }
        .nav-btn.active {
          background: ${GOLDD};
          color: ${TEXT};
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .filt-btn {
          width: 100%; display: flex; align-items: center;
          gap: 11px; padding: 8px 12px;
          border-radius: 8px; border: none; cursor: pointer;
          background: transparent;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 13px; font-weight: 400;
          color: ${DIM};
          transition: 0.18s;
          text-align: left;
        }
        .filt-btn:hover { color: ${MUTED}; transform: translateX(3px); }
        .filt-btn.active { color: ${TEXT}; font-weight: 500; }

        .sidebar-divider { height: 1px; background: ${LINE}; margin: 20px 0; }

        .action-btn {
          width: 100%; display: flex; align-items: center;
          gap: 9px; padding: 8px 12px;
          border-radius: 8px; border: none; cursor: pointer;
          background: transparent;
          font-family: 'DM Mono', monospace;
          font-size: 9px; font-weight: 500;
          letter-spacing: 0.08em; text-transform: uppercase;
          color: ${DIM};
          transition: 0.2s;
        }
        .action-btn:hover { color: ${MUTED}; background: ${SURF}; }

        .new-btn {
          width: 100%; height: 40px;
          background: ${GOLD}; color: #08080E;
          border: none; border-radius: 10px; cursor: pointer;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-weight: 700; font-size: 12.5px;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: 0.2s;
          margin-bottom: 8px;
        }
        .new-btn:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 4px 15px ${GOLD}30; }
      `}</style>

      {/* ── Navigation ── */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontFamily:"'DM Mono',monospace", fontSize:9, fontWeight:500, color:DIM, textTransform:'uppercase', letterSpacing:'0.12em', paddingLeft:14, marginBottom:12 }}>
          System Navigation
        </p>
        <nav>
          {NAV_ITEMS.map((item, i) => {
            const active = isActivePath(item.path);
            return (
              <button key={i} className={`nav-btn ${active?'active':''}`} onClick={() => navigate(item.path)}>
                <item.icon size={16} strokeWidth={active ? 2.2 : 1.8}/>
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── Contextual Filters ── */}
      {(location.pathname.includes('/history') || location.pathname.includes('/explorer')) && (
        <div style={{ flex:1 }}>
          <p style={{ fontFamily:"'DM Mono',monospace", fontSize:9, fontWeight:500, color:DIM, textTransform:'uppercase', letterSpacing:'0.12em', paddingLeft:14, marginBottom:12 }}>
            Audit Filters
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
            {FILTERS.map((item, i) => {
              const active = activeFilter === item.label;
              return (
                <button key={i} className={`filt-btn ${active?'active':''}`} onClick={() => onFilterChange && onFilterChange(item.label)}>
                  <div style={{ width:6, height:6, borderRadius:'50%', background:active?item.dot:'rgba(255,255,255,0.1)', transition:'0.2s' }}/>
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ flex:1 }}/>

      {/* ── Actions ── */}
      <div style={{ borderTop:`1px solid ${LINE}`, paddingTop:20 }}>
        <button className="new-btn" onClick={handleNewAnalysis}>
          <Plus size={16}/> Launch Audit
        </button>

        <button className="action-btn" onClick={onExport}>
          <Share size={12} style={{ opacity:0.5 }}/> Export Report
        </button>

        <button className="action-btn" onClick={() => {
          if (onShare) onShare();
          else { navigator.clipboard.writeText(window.location.href); }
        }}>
          <ArrowUpRight size={12} style={{ opacity:0.5 }}/> Share Report
        </button>

        <button className="action-btn" onClick={() => navigate('/architecture')}>
          <Info size={12} style={{ opacity:0.5 }}/> System Protocols
        </button>

        <div className="sidebar-divider" style={{ opacity:0.5 }}/>

        <button className="nav-btn" style={{ color:'#f87171' }}
          onClick={() => { if (window.confirm('Confirm secure termination of current session?')) { window.location.href = '/auth'; } }}>
          <XCircle size={16}/> Secure Logout
        </button>
      </div>
    </aside>
  );
}