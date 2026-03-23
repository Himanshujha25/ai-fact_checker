
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

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
      const { token, ...userData } = res.data;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
    } catch (err) {
      console.error('Login Failed:', err.response?.data || err.message);
      // Safely extract string to prevent React object crash (Error #31)
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
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
