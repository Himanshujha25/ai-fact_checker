
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_URL 
  || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
      ? '/api' 
      : 'https://ai-fact-checker-rvih.onrender.com/api');

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set the global Axios base URL to prevent 404s across all network requests in production
  useEffect(() => {
    axios.defaults.baseURL = API_BASE;
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.get('/auth/me')
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
      const res = await axios.post('/auth/login', { email, password });
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
      await axios.post('/auth/register', { email, password, fullName, organization });
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
