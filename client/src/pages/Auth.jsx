
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Mail, Lock, LogIn, ChevronRight, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
        navigate('/verify');
      } else {
        await axios.post('/api/auth/register', { email, password });
        setIsLogin(true);
        setError('Account created! Please log in.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: 'calc(100vh - 120px)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ width: '100%', maxWidth: '450px', transformOrigin: 'center' }}
      >
        <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
          <div style={{ width: 60, height: 60, background: 'rgba(99,102,241,0.1)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <ShieldCheck color="#6366f1" size={32} />
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            {isLogin ? 'Welcome back' : 'Create an account'}
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            {isLogin ? 'Enter your credentials to access your reports' : 'Join VeriCheck to start auditing claims at scale'}
          </p>
        </div>

        <div className="glass-card" style={{ padding: '2.5rem', textAlign: 'left' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="input-group">
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Mail size={14} /> EMAIL ADDRESS
              </label>
              <input
                type="email" required placeholder="name@company.com"
                value={email} onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '0.9rem 1.1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-light)', borderRadius: '12px', color: 'white' }}
              />
            </div>

            <div className="input-group">
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Lock size={14} /> PASSWORD
              </label>
              <input
                type="password" required placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '0.9rem 1.1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-light)', borderRadius: '12px', color: 'white' }}
              />
            </div>

            {error && <div style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 600, padding: '8px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</div>}

            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
              {loading ? 'Processing...' : isLogin ? (<span>Sign In <LogIn size={18} /></span>) : (<span>Create Account <UserPlus size={18} /></span>)}
            </button>
          </form>

          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button
              onClick={() => setIsLogin(!isLogin)}
              style={{ background: 'transparent', border: 'none', color: '#6366f1', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
