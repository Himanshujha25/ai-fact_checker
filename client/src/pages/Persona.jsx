import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCheck, Shield, AlertTriangle, CloudRain, Fingerprint, Search, Info, Bot, Activity, User } from 'lucide-react';
import axios from 'axios';

const GOLD = 'var(--gold)';
const LINE = 'var(--line)';
const TEXT = 'var(--text-main)';
const MUTED = 'var(--text-muted)';
const DIM = 'var(--text-dim)';

export default function PersonaAuditor() {
  const [handle, setHandle] = useState('');
  const [platform, setPlatform] = useState('X / Twitter');
  const [auditing, setAuditing] = useState(false);
  const [report, setReport] = useState(null);

  const performAudit = async () => {
    if (!handle) return;
    setAuditing(true);
    setReport(null);

    try {
      const response = await axios.post('http://localhost:5000/api/persona/audit', {
        handle,
        platform
      });
      setReport(response.data);
    } catch (err) {
      console.error('Audit failed', err);
    } finally {
      setAuditing(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg-main)', color: TEXT, minHeight: '100vh', padding: '100px 40px', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        
        <header style={{ marginBottom: 48, textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', padding: 16, borderRadius: '50%', background: 'rgba(201,168,76,0.1)', border: `1px solid ${GOLD}`, marginBottom: 24 }}>
             <UserCheck size={32} color={GOLD} />
          </div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 48, color: TEXT, marginBottom: 12 }}>
            Persona Audit Lab
          </h1>
          <p style={{ fontSize: 18, color: MUTED, maxWidth: 600, margin: '0 auto' }}>
            Unmask coordinated inauthentic behavior. Audit social media handles for bot signals, narrative bias, and historical credibility.
          </p>
        </header>

        {/* Audit Intake */}
        <div style={{ background: 'rgba(var(--overlay-rgb), 0.02)', border: `1px solid ${LINE}`, borderRadius: 24, padding: 40, marginBottom: 40, display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ flex: 1, minWidth: 300 }}>
            <label style={{ display: 'block', fontSize: 11, fontFamily: "'DM Mono', monospace", color: DIM, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Target Handle / Username</label>
            <div style={{ position: 'relative' }}>
               <Search size={18} color={DIM} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
               <input 
                type="text" 
                placeholder="@username" 
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                style={{ width: '100%', background: 'rgba(var(--overlay-rgb), 0.03)', border: `1px solid ${LINE}`, borderRadius: 12, padding: '16px 16px 16px 48px', color: TEXT, fontSize: 16, outline: 'none', transition: 'border-color 0.2s' }} 
               />
            </div>
          </div>

          <div style={{ width: 220 }}>
            <label style={{ display: 'block', fontSize: 11, fontFamily: "'DM Mono', monospace", color: DIM, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Platform Node</label>
            <select 
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                style={{ width: '100%', background: 'rgba(var(--overlay-rgb), 0.03)', border: `1px solid ${LINE}`, borderRadius: 12, padding: '16px', color: TEXT, fontSize: 14, outline: 'none' }}
            >
              <option>X / Twitter</option>
              <option>Reddit</option>
              <option>YouTube</option>
              <option>LinkedIn</option>
              <option>Global Web</option>
            </select>
          </div>

          <button 
            onClick={performAudit}
            disabled={auditing || !handle}
            style={{ 
              padding: '16px 32px', 
              background: auditing ? 'transparent' : GOLD, 
              border: auditing ? `1px solid ${GOLD}` : 'none', 
              color: auditing ? GOLD : 'var(--bg-main)', 
              borderRadius: 12, 
              cursor: auditing ? 'not-allowed' : 'pointer', 
              fontWeight: 700,
              fontSize: 15,
              display: 'flex', 
              alignItems: 'center', 
              gap: 12,
              minWidth: 180,
              justifyContent: 'center'
            }}
          >
            {auditing ? <Activity className="animate-spin" size={20} /> : <Fingerprint size={20} />}
            {auditing ? 'Auditing Footprint...' : 'Initiate Audit'}
          </button>
        </div>

        {/* Results */}
        <AnimatePresence>
          {report && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)', gap: 32 }}
            >
              {/* Score Sidebar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ background: 'rgba(var(--overlay-rgb), 0.02)', border: `1px solid ${LINE}`, borderRadius: 24, padding: 32, textAlign: 'center' }}>
                  <h4 style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: DIM, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>Credibility Score</h4>
                  <div style={{ fontSize: 64, fontWeight: 800, color: report.credibilityScore > 70 ? '#4ade80' : report.credibilityScore > 40 ? '#fbbf24' : '#f87171', fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>
                    {report.credibilityScore}
                  </div>
                  <div style={{ marginTop: 16, display: 'inline-flex', padding: '6px 16px', borderRadius: 100, background: 'rgba(var(--overlay-rgb), 0.05)', border: `1px solid ${LINE}`, fontSize: 12, fontWeight: 700, color: GOLD }}>
                    {report.trustLevel?.toUpperCase() || 'UNKNOWN'}
                  </div>
                </div>

                <div style={{ background: 'rgba(var(--overlay-rgb), 0.02)', border: `1px solid ${LINE}`, borderRadius: 24, padding: 32 }}>
                  <h4 style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: DIM, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>Bot Signals</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                    <Bot size={24} color={report.isLikelyBot ? '#f87171' : '#4ade80'} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{report.isLikelyBot ? 'Suspected Automation' : 'Human Profile'}</div>
                      <div style={{ fontSize: 12, color: MUTED }}>Verification based on posting patterns</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Intel */}
              <div style={{ background: 'rgba(var(--overlay-rgb), 0.02)', border: `1px solid ${LINE}`, borderRadius: 24, padding: 40 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
                   <div>
                    <h3 style={{ fontSize: 24, fontWeight: 700, color: TEXT, marginBottom: 4 }}>{report.handle}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: DIM, fontSize: 13 }}>
                      <Activity size={14} /> Latent Bias: {report.bias}
                    </div>
                   </div>
                   <Shield size={32} color={GOLD} opacity={0.5} />
                </div>

                <div style={{ marginBottom: 32 }}>
                  <h5 style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: DIM, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Forensic Summary</h5>
                  <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.7 }}>
                    {report.forensicSummary}
                  </p>
                </div>

                <div>
                  <h5 style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: DIM, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Risk Flags</h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {(report.flags || []).map((flag, i) => (
                      <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 16px', borderRadius: 12, background: 'rgba(248,113,113,0.03)', border: '1px solid rgba(248,113,113,0.1)' }}>
                        <AlertTriangle size={16} color="#f87171" />
                        <span style={{ fontSize: 13, color: '#f87171' }}>{flag}</span>
                      </div>
                    ))}
                    {(!report.flags || report.flags.length === 0) && (
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 16px', borderRadius: 12, background: 'rgba(74,222,128,0.03)', border: '1px solid rgba(74,222,128,0.1)' }}>
                        <UserCheck size={16} color="#4ade80" />
                        <span style={{ fontSize: 13, color: '#4ade80' }}>No anomalous behavior detected.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {auditing && (
            <div style={{ textAlign: 'center', marginTop: 80 }}>
                <motion.div 
                    animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }} 
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ fontSize: 14, fontFamily: "'DM Mono', monospace", color: GOLD, textTransform: 'uppercase', letterSpacing: '0.2em' }}
                >
                    Sifting through petabytes of metadata...
                </motion.div>
                <div style={{ width: 300, height: 2, background: LINE, margin: '24px auto', overflow: 'hidden', position: 'relative', borderRadius: 2 }}>
                    <motion.div 
                        animate={{ left: ['-100%', '100%'] }} 
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        style={{ position: 'absolute', width: '60%', height: '100%', background: GOLD }} 
                    />
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
