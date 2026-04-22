import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, Search, AlertCircle, Info, Activity, ShieldAlert, Zap, Globe } from 'lucide-react';
import axios from 'axios';

const GOLD = 'var(--gold)';
const LINE = 'var(--line)';
const TEXT = 'var(--text-main)';
const MUTED = 'var(--text-muted)';
const DIM = 'var(--text-dim)';

export default function NarrativeMap() {
  const [text, setText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [intel, setIntel] = useState(null);

  const analyzeNarrative = async () => {
    if (!text) return;
    setAnalyzing(true);
    setIntel(null);

    try {
      const response = await axios.post('http://localhost:5000/api/intelligence/narratives', { text });
      setIntel(response.data);
    } catch (err) {
      console.error('Narrative analysis failed', err);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg-main)', color: TEXT, minHeight: '100vh', padding: '100px 40px', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        
        <header style={{ marginBottom: 48, display: 'flex', gap: 32, alignItems: 'center' }}>
          <div style={{ padding: 20, borderRadius: 20, background: 'rgba(201,168,76,0.05)', border: `1px solid ${LINE}`, display: 'flex' }}>
             <Network size={40} color={GOLD} />
          </div>
          <div>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 44, color: TEXT, marginBottom: 8 }}>
              Narrative Intel Map
            </h1>
            <p style={{ fontSize: 16, color: MUTED, maxWidth: 700 }}>
              Audit content for latent propaganda archetypes. Our engine performs semantic cross-checks against known coordinated disinformation patterns like "The Great Reset" or "Medical Fear-Mongering".
            </p>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 40 }}>
            {/* Input Node */}
            <div style={{ background: 'rgba(var(--overlay-rgb), 0.02)', border: `1px solid ${LINE}`, borderRadius: 28, padding: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                     <h3 style={{ fontSize: 13, fontFamily: "'DM Mono', monospace", color: DIM, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Signal Intake</h3>
                     <Globe size={16} color={DIM} />
                </div>

                <textarea 
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Paste report text or viral claim for narrative analysis..."
                    style={{ 
                        width: '100%', 
                        height: 300, 
                        background: 'rgba(var(--overlay-rgb), 0.03)', 
                        border: `1px solid ${LINE}`, 
                        borderRadius: 16, 
                        padding: 24, 
                        color: TEXT, 
                        fontSize: 15, 
                        lineHeight: 1.6, 
                        resize: 'none', 
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        marginBottom: 24
                    }}
                />

                <button 
                    onClick={analyzeNarrative}
                    disabled={analyzing || !text}
                    style={{ 
                        width: '100%',
                        padding: '18px', 
                        background: analyzing ? 'transparent' : GOLD, 
                        border: analyzing ? `1px solid ${GOLD}` : 'none', 
                        color: analyzing ? GOLD : 'var(--bg-main)', 
                        borderRadius: 12, 
                        cursor: analyzing ? 'not-allowed' : 'pointer', 
                        fontWeight: 700,
                        fontSize: 16,
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 12,
                        justifyContent: 'center'
                    }}
                >
                    {analyzing ? <Activity className="animate-spin" size={20} /> : <Zap size={20} />}
                    {analyzing ? 'Deconstructing Narrative...' : 'Analyze Semantic Pattern'}
                </button>
            </div>

            {/* Intel Node */}
            <div style={{ background: 'rgba(var(--overlay-rgb), 0.02)', border: `1px solid ${LINE}`, borderRadius: 28, padding: 32, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: 13, fontFamily: "'DM Mono', monospace", color: DIM, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 32 }}>Intelligence Output</h3>

                <AnimatePresence mode="wait">
                    {!intel && !analyzing && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', opacity: 0.5 }}>
                            <Network size={56} color={DIM} strokeWidth={1} style={{ marginBottom: 24 }} />
                            <p style={{ fontSize: 14, color: MUTED, maxWidth: 300 }}>
                                Provide a signal payload to begin narrative archetype extraction.
                            </p>
                        </motion.div>
                    )}

                    {analyzing && (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
                            {[1, 2, 3].map(i => (
                                <div key={i} style={{ height: 60, borderRadius: 12, background: 'linear-gradient(90deg, transparent, rgba(var(--overlay-rgb), 0.05), transparent)', backgroundSize: '200% 100%', animation: 'shimmer 2s infinite' }} />
                            ))}
                            <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>
                        </div>
                    )}

                    {intel && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ flex: 1 }}>
                            <div style={{ padding: 24, borderRadius: 20, background: intel.riskLevel === 'High' ? 'rgba(244,63,94,0.05)' : 'rgba(74,222,128,0.05)', border: `1px solid ${intel.riskLevel === 'High' ? 'rgba(244,63,94,0.3)' : 'rgba(74,222,128,0.3)'}`, marginBottom: 32 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: intel.riskLevel === 'High' ? '#f43f5e' : '#4ade80', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Archetype Matched</span>
                                    {intel.riskLevel === 'High' ? <ShieldAlert size={20} color="#f43f5e" /> : <Activity size={20} color="#4ade80" />}
                                </div>
                                <h4 style={{ fontSize: 24, fontWeight: 700, color: TEXT, marginBottom: 4 }}>{intel.archetype || 'Custom Signal'}</h4>
                                <p style={{ fontSize: 13, color: MUTED }}>Pattern Stability: {intel.matchesNarrative ? 'Strong Match' : 'Weak Correlation'}</p>
                            </div>

                            <div style={{ marginBottom: 32 }}>
                                <h5 style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: DIM, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Detailed Analysis</h5>
                                <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.7 }}>
                                    {intel.analysis}
                                </p>
                            </div>

                            {intel.relatedNarratives?.length > 0 && (
                                <div>
                                    <h5 style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: DIM, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Coordinated Clusters</h5>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                        {intel.relatedNarratives.map((n, i) => (
                                            <div key={i} style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(var(--overlay-rgb), 0.03)', border: `1px solid ${LINE}`, fontSize: 12, color: TEXT }}>
                                                {n}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
      </div>
    </div>
  );
}
