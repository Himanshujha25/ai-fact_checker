import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, Trash2, ShieldAlert, Plus,
  Layers, History as HistoryIcon, ArrowUpRight, Loader2
} from 'lucide-react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? '/api'
  : 'https://ai-fact-checker-rvih.onrender.com/api';

/* ─── Design tokens ───────────────────────────────────────────── */
const GOLD  = '#C9A84C';
const GOLD2 = 'rgba(201,168,76,0.10)';
const LINE  = 'rgba(255,255,255,0.07)';
const TEXT  = '#E8E4DC';
const MUTED = 'rgba(232,228,220,0.38)';
const DIM   = 'rgba(232,228,220,0.18)';
const SURF  = 'rgba(255,255,255,0.035)';

/* ─── Verdict helpers ─────────────────────────────────────────── */
const verdictMeta = (v) => {
  const l = v?.toLowerCase();
  if (['true', 'accurate', 'verified'].includes(l))
    return { color: '#4ade80', bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.2)' };
  if (['false', 'inaccurate'].includes(l))
    return { color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)' };
  if (['partially true', 'mixed'].includes(l))
    return { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.2)' };
  return { color: DIM, bg: SURF, border: LINE };
};

const VerdictBadge = ({ verdict }) => {
  const m = verdictMeta(verdict);
  return (
    <span style={{
      color: m.color, background: m.bg, border: `1px solid ${m.border}`,
      fontSize: 9, letterSpacing: '0.12em', fontWeight: 700,
      textTransform: 'uppercase', padding: '4px 10px', borderRadius: 4,
      whiteSpace: 'nowrap', fontFamily: "'DM Mono', monospace",
    }}>
      {verdict || 'Processed'}
    </span>
  );
};

/* ═══════════════════════════════════════════════════════════════ */
export default function History() {
  const [history, setHistory]             = useState([]);
  const [loading, setLoading]             = useState(true);
  const [showDeleteModal, setShowDelete]  = useState(false);
  const [activeFilter, setActiveFilter]   = useState('All');
  const [activeTab, setActiveTab]         = useState('All Records');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q')?.toLowerCase() || '';

  useEffect(() => {
    axios.get(`${API_BASE}/history`)
      .then(res => { setHistory(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filteredHistory = history.filter(h => {
    // 1. Verdict Filter
    const v = (h.topClaims?.[0]?.verdict || h.claims?.[0]?.verdict || '').toLowerCase();
    let verdictMatch = true;
    if (activeFilter === 'Verified') verdictMatch = ['true', 'accurate', 'verified'].includes(v);
    else if (activeFilter === 'Refuted') verdictMatch = ['false', 'inaccurate'].includes(v);
    else if (activeFilter === 'Inconclusive') verdictMatch = ['partially true', 'mixed', 'inconclusive'].includes(v);

    if (!verdictMatch) return false;

    // 2. Search Keyword Filter
    if (query) {
      const matchText = (
        (h.input || '') + 
        (h.title || '') + 
        (h.topClaims?.[0]?.claim || '')
      ).toLowerCase();
      if (!matchText.includes(query)) return false;
    }

    return true;
  });

  const handleDeleteAll = async () => {
    try {
      await axios.delete(`${API_BASE}/history`);
      setHistory([]); setShowDelete(false);
    } catch (err) {
      alert('Failed to clear history: ' + err.message);
    }
  };

  const avg = history.length
    ? Math.round(history.reduce((a, h) => a + (h.truthScore || 0), 0) / history.length)
    : 0;

  const tabs = ['All Records', 'Priority', 'Redundant'];

  return (
    <div style={{ background: '#08080E', minHeight: 'calc(100vh - 64px)', color: TEXT, fontFamily: "'DM Sans', system-ui, sans-serif", display: 'flex' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600&family=DM+Serif+Display@0;1&family=DM+Mono:wght@400;500&display=swap');

        .hy-row {
          display: grid;
          grid-template-columns: 72px 1fr 140px 120px;
          gap: 24px; align-items: center;
          padding: 18px 24px;
          border-bottom: 1px solid ${LINE};
          text-decoration: none; color: inherit;
          transition: background 0.18s;
        }
        .hy-row:last-child { border-bottom: none; }
        .hy-row:hover { background: rgba(255,255,255,0.03); }
        .hy-row:hover .hy-arrow { color: ${GOLD}; transform: translate(2px, -2px); }

        .hy-arrow {
          display: flex; align-items: center; gap: 5px;
          font-family: 'DM Mono', monospace;
          font-size: 10px; color: ${DIM};
          transition: color 0.2s, transform 0.2s;
          justify-content: flex-end;
        }

        .hy-tab {
          background: none; border: none; cursor: pointer; padding: 0 0 10px;
          font-family: 'DM Mono', monospace;
          font-size: 10px; font-weight: 500; letter-spacing: '0.08em';
          color: ${DIM}; transition: color 0.2s; text-transform: uppercase;
          letter-spacing: 0.08em;
          border-bottom: 1.5px solid transparent;
        }
        .hy-tab.active { color: ${TEXT}; border-bottom-color: ${GOLD}; }
        .hy-tab:hover:not(.active) { color: ${MUTED}; }

        .hy-btn-danger {
          background: rgba(248,113,113,0.07);
          border: 1px solid rgba(248,113,113,0.18);
          border-radius: 8px; padding: 9px 16px;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 12px; font-weight: 500; color: #f87171;
          cursor: pointer; display: inline-flex; align-items: center; gap: 6px;
          transition: background 0.2s;
        }
        .hy-btn-danger:hover { background: rgba(248,113,113,0.12); }

        .hy-btn-gold {
          background: ${GOLD}; color: #08080E; border: none; border-radius: 9px;
          padding: 12px 22px; cursor: pointer;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-weight: 600; font-size: 13px;
          display: inline-flex; align-items: center; gap: 7px;
          transition: opacity 0.2s;
        }
        .hy-btn-gold:hover { opacity: 0.85; }
      `}</style>

      <Sidebar id="sidebar-container" activeFilter={activeFilter} onFilterChange={setActiveFilter} />

      <main style={{ flex: 1, maxWidth: 1240, margin: '0 auto', padding: '4px 48px 80px', overflowY: 'auto', width: '100%' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, marginBottom: 48, paddingBottom: 32, borderBottom: `1px solid ${LINE}` }}>
          <div>
            {/* <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 20, height: 1, background: GOLD, opacity: 0.55 }} />
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 500, color: GOLD, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                Audit Repository
              </span>
            </div> */}
            <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(34px, 4vw, 54px)', fontWeight: 400, color: TEXT, letterSpacing: '-0.02em', marginBottom: 12 }}>
              History.
            </h1>
            <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6, maxWidth: 480 }}>
              A historical registry of all forensic investigations, verified by the Digital Jurist Protocol.
            </p>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexShrink: 0, paddingBottom: 8 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 40, fontWeight: 400, color: TEXT, lineHeight: 1 }}>
                {filteredHistory.length}
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: DIM, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>
                Total Reports
              </div>
            </div>
            <div style={{ width: 1, height: 36, background: LINE }} />
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 40, fontWeight: 400, color: GOLD, lineHeight: 1 }}>
                {avg}%
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: DIM, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>
                Avg Veracity
              </div>
            </div>
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 28 }}>
            {tabs.map(t => (
              <button
                key={t}
                className={`hy-tab ${activeTab === t ? 'active' : ''}`}
                onClick={() => setActiveTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {history.length > 0 && (
              <button className="hy-btn-danger" onClick={() => setShowDelete(true)}>
                <Trash2 size={12} /> Purge records
              </button>
            )}
          </div>
        </div>

        {/* ── Table ── */}
        <div style={{
          background: SURF,
          border: `1px solid ${LINE}`,
          borderRadius: 14,
          overflow: 'hidden',
        }}>
          {/* Column headers */}
          <div style={{
            display: 'grid', gridTemplateColumns: '72px 1fr 140px 120px',
            gap: 24, padding: '11px 24px',
            borderBottom: `1px solid ${LINE}`,
            background: 'rgba(255,255,255,0.02)',
          }}>
            {['Score', 'Assertion', 'Date', ''].map(h => (
              <span key={h} style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: DIM, textTransform: 'uppercase' }}>
                {h}
              </span>
            ))}
          </div>

          {loading ? (
            <div style={{ padding: 80, textAlign: 'center' }}>
              <Loader2 size={28} color={DIM} style={{ animation: 'rd-spin 0.85s linear infinite', margin: '0 auto' }} />
              <style>{`@keyframes rd-spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div style={{ padding: '80px 40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 11, background: SURF, border: `1px solid ${LINE}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HistoryIcon size={20} color={DIM} />
              </div>
              <p style={{ fontSize: 15, color: MUTED, fontWeight: 500 }}>
                {query 
                  ? `No matches found for "${query}"` 
                  : `No ${activeFilter === 'All' ? '' : activeFilter.toLowerCase()} reports found.`}
              </p>
              <p style={{ fontSize: 12, color: DIM }}>
                {query 
                  ? 'Try refining your investigation keywords or clearing the search.' 
                  : 'Audit logs matching this filter will appear here.'}
              </p>
              <button className="hy-btn-gold" onClick={() => navigate('/verify')} style={{ marginTop: 8 }}>
                <Plus size={14} /> Initiate Audit
              </button>
            </div>
          ) : (
            filteredHistory.map((h, i) => {
              const verdict = h.topClaims?.[0]?.verdict || h.claims?.[0]?.verdict || '';
              return (
                <motion.div
                  key={h.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link to={`/history/${h.id}`} className="hy-row">
                    {/* Score */}
                    <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 22, fontWeight: 400, color: TEXT }}>
                      {Math.round(h.truthScore)}
                      <span style={{ fontSize: 12, opacity: 0.3 }}>%</span>
                    </div>

                    {/* Title + badge */}
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                      {/* Thumbnail */}
                      <div style={{
                        width: 72, height: 44, borderRadius: 8, overflow: 'hidden',
                        background: 'rgba(255,255,255,0.03)', border: `1px solid ${LINE}`,
                        flexShrink: 0, position: 'relative'
                      }}>
                        {h.thumbnail ? (
                          <img src={h.thumbnail} alt="Ref" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Layers size={14} color={DIM} />
                          </div>
                        )}
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(rgba(0,0,0,0), rgba(0,0,0,0.4))', opacity: h.thumbnail ? 0 : 1 }} />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: TEXT, marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {h.input || 'Session Redacted'}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <VerdictBadge verdict={verdict} />
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: DIM, display: 'flex', alignItems: 'center', gap: 4, opacity: 0.6 }}>
                            <Layers size={9} /> {h.claimsCount || 0} claims
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Date */}
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: DIM }}>
                      {new Date(h.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>

                    {/* Arrow */}
                    <div className="hy-arrow">
                      Open <ArrowUpRight size={12} />
                    </div>
                  </Link>
                </motion.div>
              );
            })
          )}
        </div>
      </main>

      {/* ── Delete modal ── */}
      <AnimatePresence>
        {showDeleteModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowDelete(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            />
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              style={{
                position: 'relative',
                background: 'rgba(14,14,22,0.98)',
                border: `1px solid rgba(255,255,255,0.1)`,
                borderRadius: 18, padding: '40px',
                maxWidth: 400, width: '100%',
                boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <Trash2 size={18} color="#f87171" />
              </div>
              <h3 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 24, fontWeight: 400, color: TEXT, marginBottom: 10 }}>
                Purge Registry?
              </h3>
              <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6, marginBottom: 28 }}>
                This will permanently delete all stored forensic reports and audit trails. This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setShowDelete(false)}
                  style={{
                    flex: 1, padding: '12px', background: SURF,
                    border: `1px solid ${LINE}`, borderRadius: 9,
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    fontSize: 13, fontWeight: 500, color: MUTED, cursor: 'pointer',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
                  onMouseOut={e => e.currentTarget.style.borderColor = LINE}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAll}
                  style={{
                    flex: 1, padding: '12px',
                    background: '#f87171', border: 'none', borderRadius: 9,
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    fontSize: 13, fontWeight: 600, color: '#08080E', cursor: 'pointer',
                    transition: 'opacity 0.2s',
                  }}
                  onMouseOver={e => e.currentTarget.style.opacity = '0.85'}
                  onMouseOut={e => e.currentTarget.style.opacity = '1'}
                >
                  Confirm Purge
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}