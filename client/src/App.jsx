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
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: '1.25rem', fontWeight: 800 }}>Loading Session...</div>;
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
    <div className="app-container">
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
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
      <footer className="main-footer">
        <p>© 2026 VeriCheck.AI Labs | Rate Limited · Cached · Gemini Powered</p>
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
