
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BrainCircuit, ShieldCheck, ChevronRight, ChevronDown, ExternalLink,
  ArrowLeft, Download, Filter, Loader2
} from 'lucide-react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import VerdictPieChart from '../components/VerdictPieChart';

const API_BASE = '/api';

const ReportDetail = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedClaim, setExpandedClaim] = useState(null);
  const [confidenceFilter, setConfidenceFilter] = useState(0);

  useEffect(() => {
    axios.get(`${API_BASE}/history/${id}`)
      .then(res => { setData(res.data); setLoading(false); })
      .catch(err => { setError(err.response?.data?.error || 'Report not found'); setLoading(false); });
  }, [id]);

  const handleExportPDF = () => {
    const el = document.getElementById('report-detail');
    if (!el) return;
    html2pdf().set({
      margin: 0.5, filename: `VeriCheck_Report_${id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    }).from(el).save();
  };

  const getVerdictClass = (v) => {
    const verdict = v?.toLowerCase();
    if (verdict === 'true') return 'verdict-true';
    if (verdict === 'false') return 'verdict-false';
    if (verdict === 'partially true') return 'verdict-partial';
    return '';
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Loader2 size={40} className="animate-spin" color="#6366f1" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1rem', color: '#ef4444' }}>Report Not Found</h2>
        <p style={{ opacity: 0.6, marginBottom: '2rem' }}>This report may have expired or the server was restarted.</p>
        <Link to="/history" className="btn-primary" style={{ maxWidth: '200px', margin: '0 auto', textDecoration: 'none' }}>
          <ArrowLeft size={18} /> Back to History
        </Link>
      </div>
    );
  }

  const filteredClaims = data?.claims?.filter(c => (c.confidence || 0) * 100 >= confidenceFilter) || [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Back navigation */}
      <Link to="/history" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#6366f1', textDecoration: 'none', fontWeight: 600, marginBottom: '2rem', fontSize: '0.9rem' }}>
        <ArrowLeft size={16} /> Back to History
      </Link>

      <div id="report-detail">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 className="section-title" style={{ margin: 0 }}><ShieldCheck /> Verification Report</h2>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
              Report ID: <code>{id}</code> · {data?.timestamp && new Date(data.timestamp).toLocaleString()}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-sm" onClick={handleExportPDF}><Download size={14} /> Export PDF</button>
            <button className="btn-sm" onClick={() => {
              const txt = data.claims.map(c => `[${c.verdict}] ${c.claim}`).join('\n');
              navigator.clipboard.writeText(`VeriCheck Report ${id} | Score: ${Math.round(data.truthScore)}%\n\n${txt}`);
              alert('Copied!');
            }}>Copy Summary</button>
          </div>
        </div>

        {/* Pie Chart + Stats */}
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '2rem' }}>
          <VerdictPieChart claims={data.claims} />
          <div className="stats-grid" style={{ flex: 1, margin: 0 }}>
            <div className="glass-card stat-card">
              <div className="stat-label">Accuracy Score</div>
              <div className="stat-value" style={{ color: data.truthScore > 70 ? '#10b981' : '#ef4444' }}>{Math.round(data.truthScore)}%</div>
            </div>
            <div className="glass-card stat-card">
              <div className="stat-label">AI Generation Prob.</div>
              <div className="stat-value">{data.aiTextDetection?.score || 0}%</div>
              <p className="stat-explanation">{data.aiTextDetection?.explanation}</p>
            </div>
            <div className="glass-card stat-card">
              <div className="stat-label">Media Authenticity</div>
              <div className="stat-value" style={{ fontSize: '1.5rem' }}>{data.aiMediaDetection?.verdict || 'N/A'}</div>
            </div>
          </div>
        </div>

        {/* Source Highlighting */}
        <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '0.8rem', color: '#6366f1', marginBottom: '1rem', letterSpacing: '0.1em' }}>PRECISION SOURCE HIGHLIGHTING</h3>
          <div style={{ lineHeight: '2', color: '#cbd5e1' }}>
            {data.originalText.split('. ').map((s, i) => {
              const claim = data.claims.find(c => c.originalSentence && s.includes(c.originalSentence));
              const color = claim ? (claim.verdict === 'True' ? '#10b981' : claim.verdict === 'False' ? '#ef4444' : '#f59e0b') : 'transparent';
              return <span key={i} style={{ borderBottom: `2px solid ${color}`, padding: '0 2px' }}>{s}. </span>;
            })}
          </div>
        </div>

        {/* Confidence Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <Filter size={16} color="#6366f1" />
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Confidence Filter: ≥ {confidenceFilter}%</span>
          <input type="range" min="0" max="100" value={confidenceFilter} onChange={e => setConfidenceFilter(Number(e.target.value))} style={{ flex: 1 }} />
        </div>

        {/* Claims */}
        <h2 className="section-title" style={{ marginTop: '1.5rem' }}><BrainCircuit /> Claims ({filteredClaims.length})</h2>
        <div className="claims-list">
          {filteredClaims.map((claim, idx) => (
            <div key={idx} className="claim-card">
              <div className="claim-header" onClick={() => setExpandedClaim(expandedClaim === idx ? null : idx)}>
                <div className={`verdict-badge ${getVerdictClass(claim.verdict)}`}>{claim.verdict || '?'}</div>
                <div style={{ flex: 1, marginLeft: '1rem' }}>
                  <p style={{ fontWeight: 600 }}>{claim.claim}</p>
                  {claim.confidence != null && <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 4 }}>Confidence: {Math.round(claim.confidence * 100)}%</p>}
                </div>
                {expandedClaim === idx ? <ChevronDown /> : <ChevronRight />}
              </div>
              <AnimatePresence>
                {expandedClaim === idx && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="claim-content">
                    <div className="reasoning-box">{claim.reasoning}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                      <div>
                        <p style={{ fontSize: '0.7rem', fontWeight: 800, color: '#475569', marginBottom: 8 }}>EVIDENCE</p>
                        {claim.evidence?.map((e, i) => (
                          <div key={i} style={{ fontSize: '0.8rem', display: 'flex', gap: 6, marginBottom: 6 }}>
                            <ExternalLink size={12} color="#10b981" />
                            <span>{typeof e === 'string' ? e : e.text}</span>
                            {e.credibility != null && <span style={{ color: '#6366f1', fontSize: '0.7rem' }}>({e.credibility}%)</span>}
                          </div>
                        ))}
                      </div>
                      <div>
                        <p style={{ fontSize: '0.7rem', fontWeight: 800, color: '#475569', marginBottom: 8 }}>SEARCH QUERIES</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {claim.searchQueriesUsed?.map((q, i) => (
                            <span key={i} style={{ padding: '3px 8px', background: 'rgba(99,102,241,0.1)', color: '#818cf8', borderRadius: 4, fontSize: '0.7rem' }}>{q}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button className="btn-sm" style={{ marginTop: '1rem' }} onClick={() => {
                      navigator.clipboard.writeText(`[${claim.verdict}] ${claim.claim}\nReasoning: ${claim.reasoning}`);
                      alert('Copied!');
                    }}>Copy This Claim</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default ReportDetail;
