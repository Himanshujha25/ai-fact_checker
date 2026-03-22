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

export default function Signin() {
  // ── Pre-filled with demo credentials ──
  const [email,        setEmail]        = useState('himanhu@gmail.com');
  const [password,     setPassword]     = useState('password123');
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
          .si-card    { padding:28px 20px !important; border-radius:14px !important; }
          .si-main    { padding:12px 16px 60px !important; }
        }
      `}</style>

      {/* ── Nav ── */}
      <header className="si-header">
        <Link to="/" style={{ textDecoration:'none' }}>
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

      {/* ── Main ── */}
      <main className="si-main" style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'12px 24px 80px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle,rgba(201,168,76,0.05) 0%,transparent 70%)', pointerEvents:'none' }}/>

        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, ease:[0.4,0,0.2,1] }}
          style={{ width:'100%', maxWidth:420, position:'relative', zIndex:1 }}>

          {/* Card */}
          <div className="si-card" style={{ background:'rgba(12,12,20,0.95)', border:`1px solid rgba(255,255,255,0.09)`, borderRadius:18, padding:'40px 40px', boxShadow:'0 40px 80px rgba(0,0,0,0.5)' }}>

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
              <button className="si-oauth">
                <img alt="Google" style={{ width:15, height:15, opacity:0.6 }} src="https://lh3.googleusercontent.com/aida-public/AB6AXuD1t0EeMQwi9cqqW9ISSZfIRISsnoo6vyJ7T6706zNymeYABiESU9xCarQGrSXwQnyRLGrzR1iSN2b0CM8D_sggMrIFKzyD9TKUHsZTVo34YR3AG29ZaeXkDdBDuu_qbnbEtLUdlBRaWn5OjJd57yWXXomAJFJNVhmGigmWoQRw0kXdLLgR4epBM_yxVZyPrM0fIqeQsnR_S-VgWPL2nBOtvW3snuhJblUnTL5jlW0JLSjr-hQMegJK6SdvHK7UX4hdixtId5OwnGs"/>
                Google
              </button>
              <button className="si-oauth">
                <img alt="Microsoft" style={{ width:15, height:15, opacity:0.6 }} src="https://lh3.googleusercontent.com/aida-public/AB6AXuAeOFJTtcbKtUDEI-LbEGkraJHn-JwAJz9TRgeM8pp_uBtEg0bzrSfjj2ZC-V9lrI9vJKOL6WauOmz1CdveM09xq6W9mYHmoeWj6Qh-V-m8e6H8JqfdqJl4NyMkBFUC3-GpKS6WP78cgVN5fzqfBocN3sWz4LgJqjx1xVSo4JK5-5MNvlcdonPB3CtdSZPafj7ue9-NMOiMlLJoVXNDv6uZWrdPc3U5UwAZInbXem-4RSgDpEPY7GGA5NfFBJ0TifCW_cxjzWrORvs"/>
                Microsoft
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