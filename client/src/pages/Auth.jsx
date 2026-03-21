import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Mail, Lock, LogIn, UserPlus, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

/* ─── Inline styles scoped to this component ─── */
const S = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.18) 0%, transparent 70%), #0b0c14',
    padding: '2rem',
    fontFamily: '"DM Sans", sans-serif',
    position: 'relative',
    overflow: 'hidden',
  },
  /* decorative blobs */
  blob1: {
    position: 'fixed', top: '-120px', left: '-120px',
    width: '420px', height: '420px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  blob2: {
    position: 'fixed', bottom: '-100px', right: '-80px',
    width: '340px', height: '340px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(139,92,246,0.16) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  /* grid overlay */
  grid: {
    position: 'fixed', inset: 0, pointerEvents: 'none',
    backgroundImage: `
      linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)
    `,
    backgroundSize: '48px 48px',
  },
  card: {
    width: '100%', maxWidth: '440px',
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: '24px',
    padding: '2.75rem 2.5rem',
    boxShadow: '0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
    position: 'relative',
    overflow: 'hidden',
  },
  cardSheen: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.6), transparent)',
    pointerEvents: 'none',
  },
  logo: {
    width: 56, height: 56,
    background: 'transparent',
    borderRadius: '16px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 1.5rem',
    border: 'none',
    boxShadow: 'none',
  },
  heading: {
    fontSize: '1.85rem', fontWeight: 800,
    letterSpacing: '-0.03em', color: '#f1f5f9',
    textAlign: 'center', marginBottom: '0.35rem',
    lineHeight: 1.2,
  },
  subheading: {
    fontSize: '0.85rem', color: '#64748b',
    textAlign: 'center', marginBottom: '2.25rem',
    lineHeight: 1.6,
  },
  fieldWrap: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  label: {
    fontSize: '0.72rem', fontWeight: 700,
    color: '#475569', letterSpacing: '0.1em',
    textTransform: 'uppercase',
    display: 'flex', alignItems: 'center', gap: '6px',
  },
  inputWrap: { position: 'relative' },
  input: {
    width: '100%', padding: '0.85rem 1rem 0.85rem 2.75rem',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px', color: '#f1f5f9',
    fontSize: '0.92rem', outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  inputIcon: {
    position: 'absolute', left: '0.9rem', top: '50%',
    transform: 'translateY(-50%)', pointerEvents: 'none',
  },
  eyeBtn: {
    position: 'absolute', right: '0.9rem', top: '50%',
    transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#475569', padding: 0, display: 'flex',
  },
  errorBox: {
    padding: '0.7rem 1rem',
    background: 'rgba(239,68,68,0.08)',
    border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: '10px', color: '#f87171',
    fontSize: '0.8rem', fontWeight: 600,
  },
  successBox: {
    padding: '0.7rem 1rem',
    background: 'rgba(34,197,94,0.08)',
    border: '1px solid rgba(34,197,94,0.2)',
    borderRadius: '10px', color: '#4ade80',
    fontSize: '0.8rem', fontWeight: 600,
  },
  submitBtn: {
    width: '100%', padding: '0.95rem',
    background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)',
    border: 'none', borderRadius: '12px',
    color: '#fff', fontWeight: 700, fontSize: '0.95rem',
    cursor: 'pointer', display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: '8px',
    boxShadow: '0 4px 24px rgba(99,102,241,0.35)',
    transition: 'opacity 0.2s, transform 0.15s, box-shadow 0.2s',
    fontFamily: 'inherit',
    letterSpacing: '-0.01em',
  },
  divider: {
    display: 'flex', alignItems: 'center', gap: '1rem',
    margin: '1.5rem 0',
  },
  dividerLine: { flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' },
  dividerText: { fontSize: '0.75rem', color: '#334155', fontWeight: 600 },
  switchBtn: {
    width: '100%', padding: '0.75rem',
    background: 'rgba(99,102,241,0.06)',
    border: '1px solid rgba(99,102,241,0.2)',
    borderRadius: '12px', color: '#818cf8',
    fontWeight: 600, fontSize: '0.85rem',
    cursor: 'pointer', transition: 'background 0.2s, border-color 0.2s',
    fontFamily: 'inherit',
  },
  badge: {
    position: 'absolute', top: '1.2rem', right: '1.4rem',
    display: 'flex', alignItems: 'center', gap: '5px',
    background: 'rgba(34,197,94,0.1)',
    border: '1px solid rgba(34,197,94,0.2)',
    borderRadius: '20px', padding: '3px 10px',
    fontSize: '0.68rem', fontWeight: 700, color: '#4ade80',
    letterSpacing: '0.06em',
  },
  badgeDot: {
    width: 6, height: 6, borderRadius: '50%',
    background: '#4ade80',
    boxShadow: '0 0 6px #4ade80',
    animation: 'pulse 2s infinite',
  },
};

export default function Auth() {
  const [isLogin, setIsLogin]   = useState(true);
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const { login } = useAuth();
  const navigate  = useNavigate();

  const focusStyle  = { borderColor: 'rgba(99,102,241,0.5)', boxShadow: '0 0 0 3px rgba(99,102,241,0.12)' };
  const normalStyle = {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
        navigate('/verify');
      } else {
        await axios.post('/api/auth/register', { email, password });
        setIsLogin(true);
        setSuccess('Account created! You can sign in now.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cardVariants = {
    hidden:  { opacity: 0, y: 24, scale: 0.97 },
    visible: { opacity: 1, y: 0,  scale: 1, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
    exit:    { opacity: 0, y: -16, scale: 0.97, transition: { duration: 0.2 } },
  };

  return (
    <>
      {/* Google Font */}
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .auth-input:focus { border-color: rgba(99,102,241,0.5) !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.12) !important; }
        .auth-submit:hover:not(:disabled) { opacity:0.9; transform: translateY(-1px); box-shadow: 0 8px 32px rgba(99,102,241,0.45) !important; }
        .auth-submit:active:not(:disabled) { transform: translateY(0); }
        .auth-submit:disabled { opacity:0.55; cursor:not-allowed; }
        .auth-switch:hover { background: rgba(99,102,241,0.12) !important; border-color: rgba(99,102,241,0.35) !important; }
      `}</style>

      <div style={S.page}>
        <div style={S.blob1} />
        <div style={S.blob2} />
        <div style={S.grid} />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}
        >
          <div style={S.card}>
            {/* top sheen line */}
            <div style={S.cardSheen} />

            {/* Logo */}
            <motion.div
              style={S.logo}
              whileHover={{ scale: 1.08 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <ShieldCheck color="#818cf8" size={28} strokeWidth={2} />
            </motion.div>

            {/* Heading */}
            <AnimatePresence mode="wait">
              <motion.div
                key={isLogin ? 'login-head' : 'signup-head'}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
              >
                <h2 style={S.heading}>{isLogin ? 'Welcome back' : 'Create account'}</h2>
                <p style={S.subheading}>
                  {isLogin
                    ? 'Sign in to access your audit reports'
                    : 'Join VeriCheck to audit claims at scale'}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {/* Email */}
              <div style={S.fieldWrap}>
                <label style={S.label}>
                  <Mail size={11} /> Email address
                </label>
                <div style={S.inputWrap}>
                  <Mail size={15} color="#334155" style={S.inputIcon} />
                  <input
                    className="auth-input"
                    type="email" required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={S.input}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={S.fieldWrap}>
                <label style={S.label}>
                  <Lock size={11} /> Password
                </label>
                <div style={S.inputWrap}>
                  <Lock size={15} color="#334155" style={S.inputIcon} />
                  <input
                    className="auth-input"
                    type={showPw ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ ...S.input, paddingRight: '2.75rem' }}
                  />
                  <button type="button" style={S.eyeBtn} onClick={() => setShowPw(!showPw)}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Messages */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    key="err"
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={S.errorBox}
                  >
                    {error}
                  </motion.div>
                )}
                {success && (
                  <motion.div
                    key="suc"
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={S.successBox}
                  >
                    {success}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.button
                type="submit"
                className="auth-submit"
                disabled={loading}
                style={{ ...S.submitBtn, marginTop: '0.4rem' }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <>Processing…</>
                ) : isLogin ? (
                  <><LogIn size={17} /> Sign In</>
                ) : (
                  <><UserPlus size={17} /> Create Account</>
                )}
              </motion.button>
            </form>

            {/* Divider */}
            <div style={S.divider}>
              <div style={S.dividerLine} />
              <span style={S.dividerText}>OR</span>
              <div style={S.dividerLine} />
            </div>

            {/* Switch mode */}
            <button
              className="auth-switch"
              onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }}
              style={S.switchBtn}
            >
              {isLogin ? "Don't have an account? Sign up →" : 'Already have an account? Sign in →'}
            </button>
          </div>

          {/* Below-card note */}
          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.73rem', color: '#334155', letterSpacing: '0.04em' }}>
            ENCRYPTED · SOC 2 COMPLIANT · ZERO DATA RETENTION
          </p>
        </motion.div>
      </div>
    </>
  );
}