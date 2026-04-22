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
import Radar from './pages/Radar';
import Developers from './pages/Developers';

import Sources from './pages/Sources';
import Defense from './pages/Defense';
import Persona from './pages/Persona';
import NarrativeMap from './pages/NarrativeMap';
import IntelDashboard from './pages/IntelDashboard';
import { VoiceProvider } from './context/VoiceContext';
import SentinelAssistant from './components/SentinelAssistant';
import './index.css';

/* ─── Design tokens ───────────────────────────────────────────── */
const GOLD = 'var(--gold)';
const LINE = 'var(--line)';
const TEXT = 'var(--text-main)';
const DIM = 'var(--text-dim)';
const MUTED = 'var(--text-muted)';

/* ─── Auth guard ──────────────────────────────────────────────── */
/* ─── Auth guard ──────────────────────────────────────────────── */
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-bg-main flex flex-col items-center justify-center gap-6">
      <style>{`
        @keyframes app-spin { to { transform: rotate(360deg); } }
        @keyframes app-pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
      `}</style>
      <div className="relative w-[50px] h-[50px]">
        <div 
          className="absolute inset-0 rounded-full border-2 border-gold/10 border-t-gold" 
          style={{ animation: 'app-spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite' }}
        />
        <div 
          className="absolute inset-2 rounded-full border border-gold/5 border-b-gold opacity-60" 
          style={{ animation: 'app-spin 1.5s linear infinite reverse' }}
        />
      </div>
      <div className="text-center">
        <div 
          className="font-mono text-[9px] text-gold tracking-[0.2em] uppercase mb-2"
          style={{ animation: 'app-pulse 2s ease-in-out infinite' }}
        >
          Encrypted Handshake
        </div>
        <div className="font-serif text-[22px] text-text-main font-normal">Initializing Workspace...</div>
      </div>
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
        { label: 'Radar Map',  action: () => navigate('/radar') },
        { label: 'Archive',    action: () => navigate('/history') },
        { label: 'Insights',   action: () => navigate('/architecture') },
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
        { label: 'API Access',      action: () => navigate('/developers') },
      ],
    },
  ];

  return (
    <footer className="bg-bg-main border-t border-line px-5 py-20 md:px-16 md:py-20 lg:py-24 font-sans">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.2fr_repeat(3,1fr)] gap-12 lg:gap-16 mb-16 items-start">
          {/* Brand */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <span className="font-serif text-[22px] font-normal text-text-main tracking-tight mb-4 block">
              Truecast
            </span>
            <p className="text-[13px] text-text-muted leading-[1.8] max-w-[300px] mb-6">
              Like a forecast, but for truth. The global standard for forensic intelligence adjudication.
            </p>
          </div>

          {/* Link columns */}
          {cols.map(col => (
            <div key={col.heading} className="min-w-[120px] text-center md:text-left">
              <p className="font-mono text-[9px] font-semibold tracking-[0.14em] text-gold uppercase mb-[18px]">
                {col.heading}
              </p>
              <div className="flex flex-col gap-[11px]">
                {col.items.map(item => (
                  <button
                    key={item.label}
                    className={`bg-none border-none cursor-pointer p-0 font-sans text-[13px] font-normal transition-colors text-left ${
                      item.static 
                        ? 'cursor-default text-text-dim' 
                        : 'text-text-muted hover:text-text-main'
                    }`}
                    onClick={item.action || undefined}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-line pt-8 flex flex-col md:flex-row justify-between items-center gap-8 md:gap-0">
          <span className="font-mono text-[10px] text-text-dim tracking-[0.07em] text-center md:text-left">
            © 2026 Truecast · like a forecast, but for truth · v1.2.4
          </span>

          <div className="flex items-center gap-8 md:gap-12">
            <div className="text-right">
              <div className="font-serif text-[22px] font-normal text-text-main leading-none">99.9%</div>
              <div className="font-mono text-[9px] text-text-dim tracking-[0.1em] uppercase mt-1">Uptime</div>
            </div>
            <div className="hidden md:block w-px h-8 bg-line" />
            <div className="text-right">
              <div className="font-serif text-[22px] font-normal text-gold leading-none">14ms</div>
              <div className="font-mono text-[9px] text-text-dim tracking-[0.1em] uppercase mt-1">Latency</div>
            </div>
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-main)', overflowX: 'hidden' }}>
      <SubNavbar />
      <main style={{ flex: 1, width: '100%' }}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/"           element={<Home />} />
            <Route path="/auth"       element={<Signin />} />
            <Route path="/signup"     element={<Signup />} />
            <Route path="/verify"     element={<Verify />} />
            <Route path="/radar"      element={<Radar />} />
            <Route path="/developers" element={<Developers />} />
            
            <Route path="/sources"    element={<Sources />} />
            <Route path="/defense"    element={<Defense />} />
            <Route path="/intel"      element={<IntelDashboard />} />
            <Route path="/persona"    element={<Persona />} />
            <Route path="/narratives" element={<NarrativeMap />} />
            <Route path="/architecture" element={<Architecture />} />
            <Route path="/history"    element={<PrivateRoute><History /></PrivateRoute>} />
            <Route path="/history/:id" element={<ReportDetail />} />
            <Route path="/history/:id/explorer/:claimIndex" element={<SourceExplorer />} />
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
    <SentinelAssistant />
  </AuthProvider>
);

export default App;