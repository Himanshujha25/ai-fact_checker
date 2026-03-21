import React, { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Verify from './pages/Verify';
import Architecture from './pages/Architecture';
import History from './pages/History';
import ReportDetail from './pages/ReportDetail';
import Auth from './pages/Auth';
import './index.css';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-bg-deep">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Initializing Neural Session...</span>
      </div>
    </div>
  );
  if (!user) return <Auth />;
  return children;
};

const AppContent = () => {
  const [darkMode, setDarkMode] = useState(true);
  const location = useLocation();

  // Apply theme to body 
  React.useEffect(() => {
    if (darkMode) {
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
      <main className="flex-1 w-full max-w-[1400px] mx-auto">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/verify" element={<PrivateRoute><Verify /></PrivateRoute>} />
            <Route path="/architecture" element={<Architecture />} />
            <Route path="/history" element={<PrivateRoute><History /></PrivateRoute>} />
            <Route path="/history/:id" element={<PrivateRoute><ReportDetail /></PrivateRoute>} />
          </Routes>
        </AnimatePresence>
      </main>
      <footer className="py-12 px-8 border-t border-glass-border">
        <p className="text-[10px] font-black uppercase tracking-[0.1em] text-text-muted text-center opacity-40">
          © 2026 VeriCheck.AI Labs | Rate Limited · Cached · Gemini Powered · Tavily Powered 
        </p>
      </footer>
    </div>
  );
};

const App = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
