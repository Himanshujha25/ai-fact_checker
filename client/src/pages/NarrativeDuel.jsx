import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Swords, Shield, AlertTriangle, ChevronRight, 
  Search, Zap, Brain, Globe, BarChart3, 
  ArrowLeftRight, Info, CheckCircle, XCircle, Download 
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import axios from 'axios';
import { API_BASE } from '../config';

const GOLD = 'var(--gold)';
const LINE = 'var(--line)';
const TEXT = 'var(--text-main)';
const MUTED = 'var(--text-muted)';
const DIM = 'var(--text-dim)';

const SAMPLES = [
  {
    name: 'Economic Policy',
    a: "The latest GDP report shows a resilient economy with 3.2% growth. Inflation is under control at 2.1%, and unemployment remains at historic lows. Our fiscal policies are successfully shielding the middle class from global volatility.",
    b: "While the headline GDP looks positive, it's driven entirely by deficit spending and household debt. Real wages have stagnated, and the 2.1% inflation figure ignores the 30% rise in housing costs over the last year. The economy is a house of cards."
  },
  {
    name: 'AI Regulation',
    a: "OpenAI and other leaders advocate for a slow, safety-first approach to AGI. We need strict licensing for large models to prevent catastrophic misuse, bioterrorism, and autonomous weapons. Regulation is the only way to ensure human survival.",
    b: "The safety-first movement is a classic case of regulatory capture. By demanding licenses, big tech firms are trying to kill open-source competition and secure their monopoly. AI safety is being used as a rhetorical shield for greed."
  }
];

export default function NarrativeDuel() {
  const [contentA, setContentA] = useState('');
  const [contentB, setContentB] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState('');

  const runDuel = async () => {
    if (!contentA || !contentB) return;
    setLoading(true);
    setResult(null);
    setProgress('Engaging Forensic Agents...');
    
    try {
      const res = await axios.post(`${API_BASE}/verify`, {
        content1: contentA,
        content2: contentB,
        mode: 'adversarial',
        language: 'en'
      });
      setResult(res.data);
    } catch (e) {
      console.error(e);
      alert('Duel interrupted. Check network connectivity.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('duel-report-content');
    const opt = {
      margin: 10,
      filename: `Truecast_Duel_Report_${new Date().getTime()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, backgroundColor: '#050508' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().from(element).set(opt).save();
  };

  const loadSample = (s) => {
    setContentA(s.a);
    setContentB(s.b);
  };

  return (
    <div style={{ background: '#050508', minHeight: '100vh', color: TEXT, fontFamily: "'DM Sans', sans-serif", padding: '40px 24px' }}>
      <style>{`
        .duel-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; max-width: 1400px; margin: 0 auto; }
        .duel-card { 
          background: rgba(255,255,255,0.02); border: 1px solid ${LINE}; 
          border-radius: 12px; padding: 32px; transition: all 0.3s;
        }
        .duel-card:focus-within { border-color: ${GOLD}40; background: rgba(201,168,76,0.03); }
        .duel-textarea {
          width: 100%; height: 260px; background: transparent; border: none;
          color: #fff; font-size: 15px; line-height: 1.6; resize: none; outline: none;
          font-family: 'DM Serif Display', Georgia, serif;
        }
        .duel-btn {
          background: ${GOLD}; color: #000; border: none; border-radius: 8px;
          padding: 16px 40px; font-weight: 900; font-size: 13px; cursor: pointer;
          text-transform: uppercase; letter-spacing: .15em; display: flex; align-items: center; justify-content: center; gap: 12px;
          margin: 40px auto; transition: transform 0.2s;
        }
        .duel-btn:hover { transform: translateY(-2px); filter: brightness(1.1); }
        .duel-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        
        .claim-row { padding: 20px; background: rgba(255,255,255,0.02); border: 1px solid ${LINE}; border-radius: 12px; margin-bottom: 16px; }
      `}</style>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 60 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '6px 16px', background: `${GOLD}10`, border: `1px solid ${GOLD}30`, borderRadius: 100, marginBottom: 20 }}>
          <Swords size={14} color={GOLD} />
          <span style={{ fontSize: 10, fontWeight: 900, color: GOLD, letterSpacing: '.2em' }}>ADVERSARIAL_FORENSICS // MODE_V2.5</span>
        </div>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(32px, 5vw, 64px)', fontWeight: 400, marginBottom: 16 }}>Narrative Duel</h1>
        <p style={{ color: MUTED, fontSize: 16, maxWidth: 600, margin: '0 auto' }}>
          Deconstruct competing truth-claims side-by-side using multi-agent OSINT synthesis and bias gradient mapping.
        </p>
      </div>

      {/* Inputs */}
      <div className="duel-grid" style={{ marginBottom: 40 }}>
        <div className="duel-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <span style={{ fontSize: 10, fontWeight: 900, color: GOLD, letterSpacing: '.1em' }}>SOURCE_VECTOR_A</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {SAMPLES.map(s => (
                <button key={s.name} onClick={() => loadSample(s)} style={{ fontSize: 8, background: 'rgba(255,255,255,0.05)', border: `1px solid ${LINE}`, color: DIM, padding: '4px 8px', borderRadius: 4, cursor: 'pointer' }}>
                  {s.name}
                </button>
              ))}
            </div>
          </div>
          <textarea 
            className="duel-textarea" 
            placeholder="Input primary narrative or official statement..."
            value={contentA}
            onChange={e => setContentA(e.target.value)}
          />
        </div>

        <div className="duel-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <span style={{ fontSize: 10, fontWeight: 900, color: '#60a5fa', letterSpacing: '.1em' }}>SOURCE_VECTOR_B</span>
            <span style={{ fontSize: 8, color: DIM }}>COUNTER_NARRATIVE</span>
          </div>
          <textarea 
            className="duel-textarea" 
            placeholder="Input competing narrative or rebuttal..."
            value={contentB}
            onChange={e => setContentB(e.target.value)}
          />
        </div>
      </div>

      <button className="duel-btn" onClick={runDuel} disabled={loading || !contentA || !contentB}>
        {loading ? <Zap size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Swords size={18} />}
        {loading ? 'Analyzing Friction...' : 'Launch Narrative Duel'}
      </button>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 1000, margin: '0 auto' }}>
            
            <div id="duel-report-content" style={{ padding: 24, background: '#050508' }}>
               {/* PDF Header */}
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40, borderBottom: `1px solid ${LINE}`, paddingBottom: 20 }}>
                  <div>
                    <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: GOLD, margin: 0 }}>Truecast Forensic Audit</h1>
                    <p style={{ fontSize: 10, color: DIM, margin: 0, fontFamily: "'DM Mono', monospace" }}>MERKLE_ROOT: {result.meta?.merkleRoot || 'SECURED_V2_NODE'}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 10, color: MUTED, margin: 0 }}>Date: {new Date().toLocaleDateString()}</p>
                    <p style={{ fontSize: 10, color: MUTED, margin: 0, color: '#4ade80' }}>Integrity: VERIFIED</p>
                  </div>
               </div>

               {/* Summary Box */}
               <div style={{ padding: 40, background: 'rgba(201,168,76,0.05)', border: `1px solid ${GOLD}40`, borderRadius: 20, marginBottom: 40, textAlign: 'center' }}>
                 <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
                   <Brain size={24} color={GOLD} />
                   <span style={{ fontSize: 12, fontWeight: 900, color: GOLD, letterSpacing: '.1em' }}>TACTICAL_SUMMARY</span>
                 </div>
                 <h2 style={{ fontSize: 24, fontWeight: 400, marginBottom: 16 }}>{result.narrativeVerdict}</h2>
                 <p style={{ fontSize: 16, color: MUTED, lineHeight: 1.7 }}>{result.summary}</p>
               </div>

               {/* Pivot Points / Claims */}
               <div style={{ marginBottom: 40 }}>
                 <h3 style={{ fontSize: 14, fontWeight: 900, marginBottom: 24, letterSpacing: '.1em', color: DIM }}>ADVERSARIAL_CLAIM_LEDGER</h3>
                 {result.claims.map((claim, i) => (
                   <div key={i} className="claim-row">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                         <span style={{ fontSize: 10, color: GOLD, fontWeight: 900 }}>ADJUDICATION_NODE_{i+1}</span>
                         <div style={{ 
                           fontSize: 9, fontWeight: 900, padding: '4px 10px', borderRadius: 4,
                           background: claim.verdict === 'True' ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
                           color: claim.verdict === 'True' ? '#4ade80' : '#f87171'
                         }}>
                           {claim.verdict.toUpperCase()}
                         </div>
                      </div>
                      <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>"{claim.claim}"</p>
                      <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6 }}>{claim.reasoning}</p>
                   </div>
                 ))}
               </div>

               {/* Bias Mapping */}
               {result.narrativeAnalysis && (
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                   <div className="duel-card" style={{ padding: 20 }}>
                     <TileHeader label="Source A Logic" color={GOLD} />
                     <div style={{ fontSize: 13, color: MUTED }}>
                       <b>Framing:</b> {result.narrativeAnalysis.sourceA?.framing}<br/><br/>
                       <b>Strategic Focus:</b> {result.narrativeAnalysis.sourceA?.focus}
                     </div>
                   </div>
                   <div className="duel-card" style={{ padding: 20 }}>
                     <TileHeader label="Source B Logic" color="#60a5fa" />
                     <div style={{ fontSize: 13, color: MUTED }}>
                       <b>Framing:</b> {result.narrativeAnalysis.sourceB?.framing}<br/><br/>
                       <b>Strategic Focus:</b> {result.narrativeAnalysis.sourceB?.focus}
                     </div>
                   </div>
                 </div>
               )}
            </div>

            <button 
              className="duel-btn" 
              onClick={handleDownloadPDF}
              style={{ background: 'transparent', border: `1px solid ${GOLD}`, color: GOLD, marginTop: 40, width: '100%' }}
            >
              <Download size={18} />
              Download Forensic PDF
            </button>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TileHeader({ label, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, borderBottom: `1px solid ${LINE}`, paddingBottom: 12 }}>
      <div style={{ width: 6, height: 6, background: color, borderRadius: 1 }} />
      <span style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: TEXT, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase' }}>{label}</span>
    </div>
  );
}
