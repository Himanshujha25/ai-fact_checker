
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

import { API_BASE } from '../config';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Clear any sticky HMR cache of baseURL to fix double prefixing
    axios.defaults.baseURL = '';
    
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.get(`${API_BASE}/auth/me`)
        .then(res => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const syncGuestData = async () => {
    try {
      const gv = JSON.parse(localStorage.getItem('guest_verifications') || '[]');
      const gf = JSON.parse(localStorage.getItem('guest_forensics') || '[]');
      
      if (gv.length > 0 || gf.length > 0) {
        console.log(`📡 [Sync] Migrating ${gv.length} verifications and ${gf.length} forensics to account...`);
        await axios.post(`${API_BASE}/auth/sync-history`, {
          guestVerifications: gv,
          guestForensics: gf
        });
        localStorage.removeItem('guest_verifications');
        localStorage.removeItem('guest_forensics');
      }
    } catch (err) {
      console.warn('  ⚠ Sync failed:', err.message);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
      const { token, ...userData } = res.data;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
      await syncGuestData();
    } catch (err) {
      console.error('Login Failed:', err.response?.data || err.message);
      // Safely extract string to prevent React object crash (Error #31)
      const rawErr = err.response?.data?.error || err.message;
      throw new Error(typeof rawErr === 'object' ? JSON.stringify(rawErr) : rawErr);
    }
  };

  const googleLogin = async (credential) => {
    try {
      const res = await axios.post(`${API_BASE}/auth/google`, { credential });
      const { token, ...userData } = res.data;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
      await syncGuestData();
    } catch (err) {
      console.error('Google Login Failed:', err.response?.data || err.message);
      const rawErr = err.response?.data?.error || err.message;
      throw new Error(typeof rawErr === 'object' ? JSON.stringify(rawErr) : rawErr);
    }
  };

  const signup = async (email, password, fullName, organization) => {
    try {
      await axios.post(`${API_BASE}/auth/register`, { email, password, fullName, organization });
      // After registration, automatically log in
      await login(email, password);
    } catch (err) {
      console.error('Signup Failed:', err.response?.data || err.message);
      const rawErr = err.response?.data?.error || err.message;
      throw new Error(typeof rawErr === 'object' ? JSON.stringify(rawErr) : rawErr);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, googleLogin, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
