import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, ChevronRight, Trash2, ShieldAlert,
  Database, Fingerprint, Plus, ArrowUpRight
} from 'lucide-react';
import axios from 'axios';

const API_BASE = '/api';

/* ── score helpers ── */
const scoreColor = s => s > 70 ? '#10b981' : s > 40 ? '#f59e0b' : '#ef4444';
const scoreBg    = s => s > 70 ? 'rgba(16,185,129,0.06)' : s > 40 ? 'rgba(245,158,11,0.06)' : 'rgba(239,68,68,0.06)';
const scoreBorder= s => s > 70 ? 'rgba(16,185,129,0.18)' : s > 40 ? 'rgba(245,158,11,0.18)' : 'rgba(239,68,68,0.18)';
const scoreLabel = s => s > 70 ? 'Verified' : s > 40 ? 'Mixed' : 'False';

/* ── mini bar chart (verdict distribution) ── */
const VerdictBar = ({ claims = [] }) => {
  const total = claims.length || 1;
  const t = claims.filter(c => ['true','accurate','verified'].includes((c.verdict||'').toLowerCase())).length;
  const f = claims.filter(c => ['false','inaccurate'].includes((c.verdict||'').toLowerCase())).length;
  const p = claims.filter(c => ['partially true','mixed'].includes((c.verdict||'').toLowerCase())).length;
  const u = total - t - f - p;
  const segs = [
    { n: t, color: '#10b981' },
    { n: p, color: '#f59e0b' },
    { n: f, color: '#ef4444' },
    { n: u, color: 'rgba(255,255,255,0.1)' },
  ].filter(s => s.n > 0);
  return (
    <div className="flex h-1 w-full rounded-full overflow-hidden gap-px">
      {segs.map((s, i) => (
        <div key={i} style={{ flex: s.n, background: s.color }} />
      ))}
    </div>
  );
};

/* ════════════════════════
   CONFIRM MODAL
════════════════════════ */
const DeleteModal = ({ isOpen, onClose, onConfirm }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 12 }}
          animate={{ scale: 1,    opacity: 1, y: 0  }}
          exit={{    scale: 0.96, opacity: 0, y: 12 }}
          transition={{ duration: 0.2, ease: [0.16,1,0.3,1] }}
          className="relative w-full max-w-sm bg-[#0d0e18] border border-white/[0.08] rounded-2xl p-8 shadow-[0_32px_80px_rgba(0,0,0,0.7)]"
        >
          {/* Icon */}
          <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
            <Trash2 size={18} className="text-red-400" />
          </div>

          <h3 className="text-lg font-black tracking-tight text-white mb-2">Delete all records?</h3>
          <p className="text-sm text-white/35 leading-relaxed mb-7">
            All verification reports will be permanently removed. This cannot be undone.
          </p>

          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-white/[0.04] border border-white/[0.07] text-white/50 text-xs font-bold uppercase tracking-widest hover:bg-white/[0.08] transition-all">
              Cancel
            </button>
            <button onClick={onConfirm}
              className="flex-1 py-3 rounded-xl bg-red-500 text-white text-xs font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-[0_4px_20px_rgba(239,68,68,0.3)]">
              Delete All
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

/* ════════════════════════
   HISTORY ROW
════════════════════════ */
const HistoryRow = ({ h, index }) => {
  const score  = Math.round(h.truthScore || 0);
  const date   = new Date(h.timestamp);
  const claims = h.claims || h.topClaims || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: [0.16,1,0.3,1] }}
    >
      <Link to={`/history/${h.id}`}
        className="group flex items-center gap-6 px-6 py-5 rounded-xl border border-white/[0.05] bg-white/[0.015]
          hover:border-white/[0.1] hover:bg-white/[0.03] transition-all duration-200 relative overflow-hidden"
      >
        {/* Score pill & Thumbnail */}
        <div className="relative flex-shrink-0 group-hover:scale-[1.02] transition-transform duration-500">
          <div
            className="w-16 h-16 rounded-xl flex flex-col items-center justify-center gap-0.5 relative z-10 overflow-hidden"
            style={{ background: scoreBg(score), border: `1px solid ${scoreBorder(score)}` }}
          >
            {h.thumbnail && (
              <img src={h.thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover opacity-[0.08] mix-blend-overlay group-hover:opacity-[0.15] transition-opacity" />
            )}
            <span className="text-xl font-black leading-none tracking-tight" style={{ color: scoreColor(score) }}>
              {score}%
            </span>
            <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: scoreColor(score), opacity: 0.6 }}>
              {scoreLabel(score)}
            </span>
          </div>
          {/* Subtle glow for Verified */}
          {score > 70 && (
             <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors truncate mb-2">
            {h.input || 'Untitled Report'}
          </p>

          {/* Verdict bar */}
          {claims.length > 0 && (
            <div className="mb-2.5">
              <VerdictBar claims={claims} />
            </div>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-white/20 font-medium">
              {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="text-white/10">·</span>
            <span className="text-[10px] text-white/20 font-medium">
              {claims.length} claim{claims.length !== 1 ? 's' : ''}
            </span>
            {h.mode && (
              <>
                <span className="text-white/10">·</span>
                <span className="text-[10px] text-white/20 font-medium capitalize">{h.mode} mode</span>
              </>
            )}
          </div>
        </div>

        {/* Arrow */}
        <ArrowUpRight
          size={16}
          className="flex-shrink-0 text-white/15 group-hover:text-white/50 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200"
        />
      </Link>
    </motion.div>
  );
};

/* ════════════════════════
   MAIN COMPONENT
════════════════════════ */
export default function History() {
  const [history, setHistory]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showDeleteModal, setShowDelete] = useState(false);

  useEffect(() => {
    axios.get(`${API_BASE}/history`)
      .then(res => { setHistory(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleDeleteAll = async () => {
    try {
      await axios.delete(`${API_BASE}/history`);
      setHistory([]);
      setShowDelete(false);
    } catch (err) {
      alert('Failed to clear history: ' + err.message);
    }
  };

  /* aggregate stats */
  const avg     = history.length ? Math.round(history.reduce((a,h)=>a+(h.truthScore||0),0)/history.length) : 0;
  const highest = history.length ? Math.round(Math.max(...history.map(h=>h.truthScore||0))) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16,1,0.3,1] }}
      className="max-w-3xl mx-auto px-6 pb-24 pt-16"
    >
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDeleteAll}
      />

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Database size={13} className="text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/70">Audit History</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">
            Reports
          </h1>
          <p className="text-sm text-white/30 mt-1.5">
            {history.length > 0
              ? `${history.length} verification record${history.length !== 1 ? 's' : ''} stored`
              : 'No records yet'}
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={() => setShowDelete(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/30 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/[0.07] hover:border-red-500/20 hover:text-red-400 transition-all"
          >
            <Trash2 size={12} /> Clear all
          </button>
        )}
      </div>

      {/* ── Stats strip (only when there's data) ── */}
      {history.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Total Audits',   value: history.length },
            { label: 'Avg. Score',     value: `${avg}%`      },
            { label: 'Top Score',      value: `${highest}%`  },
          ].map((s,i) => (
            <div key={i} className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-5 py-4">
              <p className="text-xl font-black tracking-tight text-white/80 mb-0.5">{s.value}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-white/25">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        /* Loading skeleton */
        <div className="space-y-3">
          {[...Array(4)].map((_,i) => (
            <div key={i} className="h-[88px] rounded-xl border border-white/[0.04] bg-white/[0.01] animate-pulse" />
          ))}
        </div>

      ) : history.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mb-6 opacity-30">
            <Fingerprint size={26} />
          </div>
          <p className="text-base font-bold text-white/40 mb-1">No reports found</p>
          <p className="text-sm text-white/20 mb-8">Start an audit to generate your first report.</p>
          <Link to="/verify"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest shadow-glow hover:-translate-y-0.5 transition-all">
            <Plus size={14} /> New Audit
          </Link>
        </div>

      ) : (
        /* Report list */
        <div className="space-y-2">
          {history.map((h, i) => (
            <HistoryRow key={h.id} h={h} index={i} />
          ))}
        </div>
      )}
    </motion.div>
  );
}