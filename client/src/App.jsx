import React from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import SubNavbar from './components/SubNavbar';
import Home from './pages/Home';
import Verify from './pages/Verify';
import Architecture from './pages/Architecture';
import History from './pages/History';
import ReportDetail from './pages/ReportDetail';
import SourceExplorer from './pages/SourceExplorer';
import Signin from './pages/Signin';
import Signup from './pages/Signup';
import './index.css';

/* ─── Design tokens ───────────────────────────────────────────── */
const GOLD  = '#C9A84C';
const LINE  = 'rgba(255,255,255,0.07)';
const TEXT  = '#E8E4DC';
const DIM   = 'rgba(232,228,220,0.18)';
const MUTED = 'rgba(232,228,220,0.38)';

/* ─── Auth guard ──────────────────────────────────────────────── */
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{
      minHeight: '100vh', background: '#08080E',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 16,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: `2px solid rgba(201,168,76,0.15)`,
        borderTopColor: GOLD,
        animation: 'app-spin 0.85s linear infinite',
      }} />
      <style>{`@keyframes app-spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 10, letterSpacing: '0.12em',
        color: DIM, textTransform: 'uppercase',
      }}>
        Initializing session…
      </span>
    </div>
  );
  if (!user) return <Navigate to="/auth" replace />;
  return children;
};

/* ─── Footer ──────────────────────────────────────────────────── */
const AppFooter = () => {
  const navigate = useNavigate();

  const cols = [
    {
      heading: 'Product',
      items: [
        { label: 'Workbench',  action: () => navigate('/verify') },
        { label: 'Archive',    action: () => navigate('/history') },
        { label: 'Insights',   action: () => navigate('/architecture') },
      ],
    },
    {
      heading: 'Resources',
      items: [
        { label: 'API Docs',        action: null },
        { label: 'Legal Archives',  action: null },
        { label: 'Source Registry', action: null },
      ],
    },
    {
      heading: 'Security',
      items: [
        { label: 'AES-256 Vault', static: true },
        { label: 'RSA-4096 Sign', static: true },
        { label: 'SOC-2 Attested', static: true },
      ],
    },
    {
      heading: 'Engine',
      items: [
        { label: 'Gemini 2.5 Pro',  static: true },
        { label: 'OSINT Synthesis', static: true },
        { label: 'Neural Graph',    static: true },
      ],
    },
  ];

  return (
    <footer style={{
      background: '#08080E',
      borderTop: `1px solid ${LINE}`,
      padding: '80px 64px 44px',
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600&family=DM+Serif+Display@0;1&family=DM+Mono:wght@400;500&display=swap');
        .ft-col-link {
          background: none; border: none; cursor: pointer; padding: 0;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 13px; font-weight: 400; color: ${MUTED};
          transition: color 0.2s; text-align: left;
        }
        .ft-col-link:hover { color: ${TEXT}; }
        .ft-col-link.static { cursor: default; color: rgba(232,228,220,0.22); }
        .ft-col-link.static:hover { color: rgba(232,228,220,0.22); }
      `}</style>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr repeat(4, 1fr)',
        gap: 64,
        marginBottom: 64,
        alignItems: 'start',
      }}>
        {/* Brand */}
        <div>
          <span style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 22, fontWeight: 400, color: TEXT,
            letterSpacing: '-0.01em',
            display: 'block', marginBottom: 16,
          }}>
            Truecast
          </span>
          <p style={{
            fontSize: 13, color: MUTED, lineHeight: 1.8,
            maxWidth: 300, marginBottom: 24,
          }}>
            Like a forecast, but for truth. The global standard for forensic intelligence adjudication.
          </p>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '6px 14px',
            background: 'rgba(74,222,128,0.06)',
            border: '1px solid rgba(74,222,128,0.15)',
            borderRadius: 100,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px #4ade80' }} />
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10, color: 'rgba(74,222,128,0.7)',
              letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500,
            }}>
              Protocol Operational
            </span>
          </div>
        </div>

        {/* Link columns */}
        {cols.map(col => (
          <div key={col.heading} style={{ minWidth: 120 }}>
            <p style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 9, fontWeight: 600, letterSpacing: '0.14em',
              color: GOLD, textTransform: 'uppercase',
              marginBottom: 18,
            }}>
              {col.heading}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {col.items.map(item => (
                <button
                  key={item.label}
                  className={`ft-col-link${item.static ? ' static' : ''}`}
                  onClick={item.action || undefined}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        borderTop: `1px solid ${LINE}`,
        paddingTop: 32,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 10, color: DIM, letterSpacing: '0.07em',
        }}>
          © 2026 Truecast · like a forecast, but for truth · v1.2.4
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: 22, fontWeight: 400, color: TEXT, lineHeight: 1,
            }}>99.9%</div>
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 9, color: DIM, letterSpacing: '0.1em',
              textTransform: 'uppercase', marginTop: 4,
            }}>Uptime</div>
          </div>
          <div style={{ width: 1, height: 32, background: LINE }} />
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: 22, fontWeight: 400, color: GOLD, lineHeight: 1,
            }}>14ms</div>
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 9, color: DIM, letterSpacing: '0.1em',
              textTransform: 'uppercase', marginTop: 4,
            }}>Latency</div>
          </div>
        </div>
      </div>
    </footer>
  );
};

/* ─── App shell ───────────────────────────────────────────────── */
const AppContent = () => {
  const location = useLocation();
  // Pages that render their own full-screen layout (no shared footer)
  const standalonePages = ['/auth', '/signup'];
  const isStandalone = standalonePages.includes(location.pathname);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#08080E' }}>
      <SubNavbar />
      <main style={{ flex: 1, width: '100%' }}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/"           element={<Home />} />
            <Route path="/auth"       element={<Signin />} />
            <Route path="/signup"     element={<Signup />} />
            <Route path="/verify"     element={<PrivateRoute><Verify /></PrivateRoute>} />
            <Route path="/architecture" element={<Architecture />} />
            <Route path="/history"    element={<PrivateRoute><History /></PrivateRoute>} />
            <Route path="/history/:id" element={<PrivateRoute><ReportDetail /></PrivateRoute>} />
            <Route path="/history/:id/explorer/:claimIndex" element={<PrivateRoute><SourceExplorer /></PrivateRoute>} />
          </Routes>
        </AnimatePresence>
      </main>
      {!isStandalone && <AppFooter />}
    </div>
  );
};

const App = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;