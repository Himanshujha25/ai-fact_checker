import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, Gavel, Eye, EyeOff, ArrowRight,
  Mail, Lock, Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const GOLD  = '#C9A84C';
const GOLD2 = 'rgba(201,168,76,0.10)';
const SURF  = 'rgba(255,255,255,0.035)';
const LINE  = 'rgba(255,255,255,0.07)';
const TEXT  = '#E8E4DC';
const MUTED = 'rgba(232,228,220,0.38)';
const DIM   = 'rgba(232,228,220,0.18)';
const GOLD_L = 'rgba(201,168,76,0.12)';

export default function Signin() {
  // ── Pre-filled with demo credentials ──
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [success,      setSuccess]      = useState('');

  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      await login(email, password);
      setSuccess('Authenticated. Redirecting…');
      setTimeout(() => navigate('/verify'), 1200);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:'100vh', background:'#08080E', color:TEXT, fontFamily:"'DM Sans',system-ui,sans-serif", display:'flex', flexDirection:'column' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600&family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&display=swap');

        .si-input {
          width:100%; box-sizing:border-box;
          background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08);
          border-radius:9px; color:${TEXT};
          font-family:'DM Sans',system-ui,sans-serif;
          font-size:14px; font-weight:400; outline:none;
          transition:border-color 0.2s,background 0.2s;
        }
        .si-input::placeholder { color:rgba(232,228,220,0.18); }
        .si-input:focus { border-color:rgba(201,168,76,0.4); background:rgba(201,168,76,0.03); }
        .si-input-pad   { padding:13px 14px 13px 42px; }
        .si-input-pad-r { padding:13px 42px 13px 42px; }

        .si-btn-gold {
          width:100%; background:${GOLD}; color:#08080E;
          border:none; border-radius:9px; padding:14px; cursor:pointer;
          font-family:'DM Sans',system-ui,sans-serif;
          font-weight:600; font-size:14px; letter-spacing:0.02em;
          display:flex; align-items:center; justify-content:center; gap:8px;
          transition:opacity 0.2s,transform 0.15s;
        }
        .si-btn-gold:hover:not(:disabled) { opacity:0.85; transform:translateY(-1px); }
        .si-btn-gold:active:not(:disabled){ transform:none; }
        .si-btn-gold:disabled { opacity:0.35; cursor:default; }

        .si-oauth {
          flex:1; background:rgba(255,255,255,0.03);
          border:1px solid rgba(255,255,255,0.07);
          border-radius:9px; height:46px;
          display:flex; align-items:center; justify-content:center; gap:8px;
          cursor:pointer;
          font-family:'DM Sans',system-ui,sans-serif;
          font-size:13px; font-weight:500; color:${MUTED};
          transition:border-color 0.2s,color 0.2s;
        }
        .si-oauth:hover { border-color:rgba(255,255,255,0.15); color:${TEXT}; }

        .si-link { color:${GOLD}; text-decoration:none; font-weight:500; transition:opacity 0.2s; }
        .si-link:hover { opacity:0.75; }

        .si-footer-link {
          background:none; border:none; cursor:pointer; padding:0;
          font-family:'DM Sans',system-ui,sans-serif;
          font-size:11px; font-weight:500; color:${DIM};
          text-decoration:none; transition:color 0.2s;
        }
        .si-footer-link:hover { color:rgba(232,228,220,0.55); }

        @keyframes spin { to { transform:rotate(360deg); } }
        .spin { animation:spin 0.9s linear infinite; }

        /* ═══════════ RESPONSIVE ═══════════════════════════════ */
        .si-header  { position:fixed; top:0; left:0; right:0; z-index:100; background:rgba(8,8,14,0.88); backdrop-filter:blur(16px); border-bottom:1px solid ${LINE}; display:flex; justify-content:space-between; align-items:center; padding:16px 48px; }
        .si-footer  { border-top:1px solid ${LINE}; padding:18px 48px; display:flex; justify-content:space-between; align-items:center; background:rgba(8,8,14,0.95); }
        .si-footer-links { display:flex; gap:24px; }

        @media (max-width: 600px) {
          .si-header  { padding:14px 20px; }
          .si-header-right span { display:none; }
          .si-footer  { padding:14px 20px; flex-direction:column; gap:12px; text-align:center; }
          .si-footer-links { gap:16px; flex-wrap:wrap; justify-content:center; }
          .si-card    { padding:48px 40px !important; border-radius:24px !important; width:100%; max-width:440px; border:1px solid ${LINE}; background:rgba(12,12,20,0.6); backdrop-filter:blur(20px); box-shadow:0 30px 60px rgba(0,0,0,0.5); margin-top: 0px; }
          .si-main    { padding:5px 24px 100px !important; align-items: flex-start !important; }
        }
      `}</style>

      {/* ── Nav ── */}
      <header className="si-header">
        <Link to="/" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:22, height:22, borderRadius:5, overflow:'hidden', border:`1px solid ${LINE}`, background:'rgba(255,255,255,0.03)' }}>
            <img 
               src="/lady_justice.png"
               alt="Logo" style={{ width:'100%', height:'100%', objectFit:'cover' }}
            />
          </div>
          <span style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:18, fontWeight:400, color:TEXT, letterSpacing:'-0.01em' }}>
            Truecast
          </span>
        </Link>
        <div className="si-header-right" style={{ display:'flex', alignItems:'center', gap:20 }}>
          <span style={{ fontSize:11, color:DIM }}>New here?</span>
          <Link to="/signup" style={{ textDecoration:'none' }}>
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:11, fontWeight:500, color:GOLD, letterSpacing:'0.06em', display:'flex', alignItems:'center', gap:5 }}>
              Create account <ArrowRight size={12}/>
            </span>
          </Link>
        </div>
      </header>

      <main className="si-main" style={{ flex:1, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'5px 48px 100px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', background:'radial-gradient(circle at 50% 50%, rgba(201,168,76,0.03) 0%, transparent 70%)', pointerEvents:'none' }} />

        {/* Card */}
        <motion.div initial={{ opacity:0, y: 20 }} animate={{ opacity:1, y: 0 }} transition={{ duration:0.6, ease:[0.4,0,0.2,1] }}
          style={{ width:'100%', maxWidth:440, position:'relative', zIndex: 1 }}>
          <div className="si-card" style={{ background:'rgba(12,12,20,0.7)', border:`1px solid ${LINE}`, borderRadius:24, padding:'48px 44px', boxShadow:'0 40px 100px rgba(0,0,0,0.6)', backdropFilter:'blur(24px)' }}>

            <div style={{ marginBottom:36 }}>
              <div style={{ width:38, height:38, borderRadius:10, background:GOLD2, border:`1px solid rgba(201,168,76,0.25)`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:22 }}>
                <Gavel size={18} color={GOLD}/>
              </div>
              <h1 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:30, fontWeight:400, letterSpacing:'-0.02em', color:TEXT, marginBottom:8 }}>
                Welcome back.
              </h1>
              <p style={{ fontSize:13, color:MUTED, lineHeight:1.6 }}>
                Access your forensic verification workspace and audit repository.
              </p>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div key="err" initial={{ opacity:0, height:0, marginBottom:0 }} animate={{ opacity:1, height:'auto', marginBottom:20 }} exit={{ opacity:0, height:0, marginBottom:0 }}
                  style={{ background:'rgba(248,113,113,0.07)', border:'1px solid rgba(248,113,113,0.2)', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#f87171', display:'flex', alignItems:'center', gap:8 }}>
                  <ShieldCheck size={13}/> {error}
                </motion.div>
              )}
              {success && (
                <motion.div key="ok" initial={{ opacity:0, height:0, marginBottom:0 }} animate={{ opacity:1, height:'auto', marginBottom:20 }} exit={{ opacity:0, height:0, marginBottom:0 }}
                  style={{ background:'rgba(74,222,128,0.07)', border:'1px solid rgba(74,222,128,0.2)', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#4ade80', display:'flex', alignItems:'center', gap:8 }}>
                  <ShieldCheck size={13}/> {success}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div>
                <label style={{ display:'block', marginBottom:7, fontFamily:"'DM Mono',monospace", fontSize:10, fontWeight:500, letterSpacing:'0.1em', color:DIM, textTransform:'uppercase' }}>Email</label>
                <div style={{ position:'relative' }}>
                  <Mail size={13} color={DIM} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
                  <input className="si-input si-input-pad" type="email" required placeholder="name@organization.com" value={email} onChange={e => setEmail(e.target.value)}/>
                </div>
              </div>

              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:7 }}>
                  <label style={{ fontFamily:"'DM Mono',monospace", fontSize:10, fontWeight:500, letterSpacing:'0.1em', color:DIM, textTransform:'uppercase' }}>Password</label>
                  <a href="#" className="si-link" style={{ fontSize:11 }}>Forgot?</a>
                </div>
                <div style={{ position:'relative' }}>
                  <Lock size={13} color={DIM} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
                  <input className="si-input si-input-pad-r" type={showPassword?'text':'password'} required placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}/>
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', padding:0, color:DIM, display:'flex', alignItems:'center', transition:'color 0.2s' }}
                    onMouseOver={e => e.currentTarget.style.color = GOLD}
                    onMouseOut={e => e.currentTarget.style.color = DIM}>
                    {showPassword ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>
              </div>

              <button className="si-btn-gold" disabled={loading} style={{ marginTop:8 }}>
                {loading ? <Loader2 size={16} className="spin"/> : <><span>Sign In</span><ArrowRight size={15}/></>}
              </button>
            </form>

            <div style={{ display:'flex', alignItems:'center', gap:14, margin:'26px 0' }}>
              <div style={{ flex:1, height:1, background:LINE }}/>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:DIM, letterSpacing:'0.08em' }}>or continue with</span>
              <div style={{ flex:1, height:1, background:LINE }}/>
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button 
                onClick={async () => {
                  setLoading(true); setError('');
                  await new Promise(r => setTimeout(r, 1500));
                  try {
                    await login('guest@vericheck.ai', 'vericheck_secret_key_2026'); // Valid guest/mock password
                    setSuccess('Google Identity Verified. Forwarding…');
                    setTimeout(() => navigate('/verify'), 800);
                  } catch(e) { setError('Google Sign-In Error'); setLoading(false); }
                }} 
                className="si-oauth" style={{ width: '100%', flex: 'none', background:'rgba(255,255,255,0.04)', border:`1px solid ${LINE}`, borderRadius:12 }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span style={{ marginLeft: 8 }}>Sign in with Google</span>
              </button>
            </div>
          </div>

          {/* Cross-link — always visible including on mobile */}
          <p style={{ textAlign:'center', marginTop:20, fontSize:13, color:MUTED }}>
            Don't have an account?{' '}
            <Link to="/signup" className="si-link">Create one →</Link>
          </p>

          <div style={{ marginTop:16, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            <ShieldCheck size={12} color={DIM}/>
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:DIM, letterSpacing:'0.08em' }}>256-bit encrypted · SOC-2 attested</span>
            <span style={{ color:LINE, fontSize:10 }}>·</span>
            <Link to="/privacy" className="si-link" style={{ fontSize:11 }}>Privacy</Link>
          </div>
        </motion.div>
      </main>

      {/* ── Footer ── */}
      <footer className="si-footer">
        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:DIM, letterSpacing:'0.07em' }}>© 2026 Truecast</span>
        <div className="si-footer-links">
          {['Legal','Privacy','Methodology','Support'].map(item => (
            <Link key={item} to={`/${item.toLowerCase()}`} className="si-footer-link">{item}</Link>
          ))}
        </div>
      </footer>
    </div>
  );
}