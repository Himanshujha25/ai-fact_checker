
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChevronRight, CheckCircle2, XCircle, AlertCircle, HelpCircle } from 'lucide-react';
import axios from 'axios';

const API_BASE = '/api';

const VerdictDot = ({ verdict }) => {
  const colors = {
    'True': '#10b981',
    'False': '#ef4444',
    'Partially True': '#f59e0b',
  };
  return (
    <span style={{
      display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
      background: colors[verdict] || '#475569', marginRight: 4
    }} />
  );
};

const ConfirmationModal = ({ isOpen, onClose, onConfirm }) => (
  <AnimatePresence>
    {isOpen && (
      <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }} />
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
          style={{ position: 'relative', width: '100%', maxWidth: '400px', background: '#1c1e26', border: '1px solid var(--border-light)', borderRadius: '20px', padding: '2rem', textAlign: 'center', margin: '0 auto' }}
        >
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <AlertCircle size={30} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem' }}>Wipe all history?</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: 1.5 }}>
            This will permanently delete all your verification reports from our servers. This action cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={onClose} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)', color: 'white', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            <button onClick={onConfirm} style={{ flex: 1, padding: '12px', background: '#ef4444', border: 'none', color: 'white', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)' }}>Delete All</button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const History = () => {
  const [history, setHistory] = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    axios.get(`${API_BASE}/history`).then(res => setHistory(res.data)).catch(() => {});
  }, []);

  const handleDeleteAll = async () => {
    try {
      await axios.delete(`${API_BASE}/history`);
      setHistory([]);
      setIsDeleteModalOpen(false);
    } catch (err) {
      alert('Failed to clear history: ' + err.message);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <ConfirmationModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        onConfirm={handleDeleteAll} 
      />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
        <div>
          <h2 className="section-title" style={{ marginBottom: '0.5rem' }}><Clock /> Verification History</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
            Click any report to view the full claim breakdown and evidence.
          </p>
        </div>
        {history.length > 0 && (
          <button 
            onClick={() => setIsDeleteModalOpen(true)}
            style={{ 
              padding: '8px 16px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', 
              border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600, 
              cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
          >
            Clear All History
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', opacity: 0.5 }}>
          No verifications yet. Go to <Link to="/verify" style={{ color: '#6366f1' }}>Verify</Link> to check some claims!
        </div>
      ) : (
        <div className="claims-list">
          {history.map((h, i) => (
            <Link key={i} to={`/history/${h.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <motion.div
                className="claim-card"
                style={{ padding: '1.5rem', cursor: 'pointer' }}
                whileHover={{ scale: 1.01, borderColor: '#6366f1' }}
                transition={{ duration: 0.15 }}
              >
                {/* Top Row: Input + Score */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '4px' }}>{h.input}...</p>
                    <p style={{ fontSize: '0.75rem', color: '#64748b' }}>{new Date(h.timestamp).toLocaleString()}</p>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: '80px' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: h.truthScore > 70 ? '#10b981' : h.truthScore > 40 ? '#f59e0b' : '#ef4444', lineHeight: 1 }}>
                      {Math.round(h.truthScore)}%
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 4 }}>Accuracy</div>
                  </div>
                </div>

                {/* Verdict Pills */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  {h.verdicts?.true > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px', background: 'rgba(16,185,129,0.1)', color: '#10b981', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700 }}>
                      <CheckCircle2 size={12} /> {h.verdicts.true} True
                    </span>
                  )}
                  {h.verdicts?.false > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700 }}>
                      <XCircle size={12} /> {h.verdicts.false} False
                    </span>
                  )}
                  {h.verdicts?.partial > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700 }}>
                      <AlertCircle size={12} /> {h.verdicts.partial} Partial
                    </span>
                  )}
                  {h.verdicts?.unverifiable > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px', background: 'rgba(71,85,105,0.1)', color: '#64748b', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700 }}>
                      <HelpCircle size={12} /> {h.verdicts.unverifiable} Unknown
                    </span>
                  )}
                  <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#64748b' }}>{h.claimsCount} total claims</span>
                </div>

                {/* Top Claims Preview */}
                {h.topClaims && h.topClaims.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem' }}>
                    {h.topClaims.map((tc, j) => (
                      <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', marginBottom: '4px', opacity: 0.8 }}>
                        <VerdictDot verdict={tc.verdict} />
                        <span style={{ flex: 1 }}>{tc.claim}...</span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: tc.verdict === 'True' ? '#10b981' : tc.verdict === 'False' ? '#ef4444' : '#f59e0b' }}>
                          {tc.verdict}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Click hint */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
                  <span style={{ fontSize: '0.7rem', color: '#6366f1', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                    View Full Report <ChevronRight size={14} />
                  </span>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default History;
