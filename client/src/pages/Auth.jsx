import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Mail, Lock, LogIn, UserPlus, Eye, EyeOff, ArrowRight, Zap, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? '/api' 
        : 'https://ai-fact-checker-rvih.onrender.com/api';
        
      const endpoint = isLogin ? `${API_BASE}/auth/login` : `${API_BASE}/auth/register`;
      const response = await axios.post(endpoint, { email, password });
      
      if (isLogin) {
        login(response.data.user, response.data.token);
        setSuccess('Authentication successful. Redirecting...');
        setTimeout(() => navigate('/verify'), 1200);
      } else {
        setSuccess('Account created. Please sign in.');
        setIsLogin(true);
        setPassword('');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 relative overflow-hidden bg-bg-deep group">
      {/* Dynamic Background Atmosphere */}
      <div className="fixed top-[-10%] left-1/2 -translate-x-1/2 w-[120%] h-[100%] bg-primary/10 blur-[150px] rounded-full pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity duration-1000" />
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--color-primary) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-[450px] relative z-10"
      >
        {/* The Card */}
        <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[40px] p-12 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] relative overflow-hidden">
          {/* Top Decorative Sheen */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          
          <div className="flex flex-col items-center mb-10">
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-transparent border border-primary/20 group-hover:scale-110 transition-transform duration-500">
              <ShieldCheck size={32} className="text-primary" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white mb-2 italic">VeriCheck Pro</h1>
            <p className="text-sm font-bold text-text-muted uppercase tracking-[0.2em] opacity-60">
              {isLogin ? 'Secure Entry Protocol' : 'Identity Genesis'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted pl-1">
                <Mail size={12} className="text-primary" /> Authority Email
              </label>
              <div className="relative group/input">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-4 pr-4 transition-all focus:border-primary focus:bg-primary/[0.02]" 
                  placeholder="agent@vericheck.ai"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted pl-1">
                <Lock size={12} className="text-primary" /> Security Key
              </label>
              <div className="relative group/input">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-4 pr-12 transition-all focus:border-primary focus:bg-primary/[0.02]" 
                  placeholder="••••••••"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs font-bold">
                  {error}
                </motion.div>
              )}
              {success && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-4 rounded-xl bg-accent/10 border border-accent/20 text-accent text-xs font-bold">
                  {success}
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full btn-elite py-5 text-base shadow-[0_15px_40px_-5px_rgba(139,92,246,0.3)] hover:shadow-[0_20px_60px_-10px_rgba(139,92,246,0.5)]"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <div className="flex items-center gap-2">
                  <span>{isLogin ? 'Initiate Workspace' : 'Create Identity'}</span>
                  <ArrowRight size={18} />
                </div>
              )}
            </button>
          </form>

          <div className="mt-10 flex flex-col items-center gap-6">
            <div className="flex items-center gap-4 w-full text-[10px] font-black uppercase tracking-[0.2em] text-text-muted/40">
              <div className="h-px flex-1 bg-white/5" />
              <span>Protocol Switch</span>
              <div className="h-px flex-1 bg-white/5" />
            </div>

            <button 
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs font-bold text-text-muted hover:text-white transition-colors flex items-center gap-2 group/switch"
            >
              {isLogin ? "Need a new clearance level? " : "Already held valid credentials? "}
              <span className="text-primary group-hover:underline">
                {isLogin ? "Register Account" : "Sign In Now"}
              </span>
            </button>
          </div>

          {/* Bottom Security Badge */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 text-white/10 text-[8px] font-black tracking-widest uppercase">
            <Sparkles size={8} /> AES-256 Quantum Shield Active
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Simplified Loader for buttons
const Loader2 = ({ className, size }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
);

export default Auth;