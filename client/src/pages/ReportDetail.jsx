import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, ChevronDown, ExternalLink, ArrowLeft,
  Download, Loader2, ShieldAlert, Layers, Cpu,
  Search, Zap, Globe, Image as ImageIcon, Filter, BrainCircuit, User
} from 'lucide-react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import VerdictPieChart from '../components/VerdictPieChart';

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? '/api' 
  : 'https://ai-fact-checker-rvih.onrender.com/api';

/* ── helpers ── */
const scoreColor  = s => s > 70 ? '#10b981' : s > 40 ? '#f59e0b' : '#ef4444';
const scoreBorder = s => s > 70 ? 'rgba(16,185,129,0.18)' : s > 40 ? 'rgba(245,158,11,0.18)' : 'rgba(239,68,68,0.18)';
const scoreBg     = s => s > 70 ? 'rgba(16,185,129,0.05)' : s > 40 ? 'rgba(245,158,11,0.05)' : 'rgba(239,68,68,0.05)';
const scoreLabel  = s => s > 70 ? 'Authenticated' : s > 40 ? 'Contested' : 'Deceptive';

const verdictStyle = v => {
  const l = v?.toLowerCase();
  if (l === 'true')           return 'border-emerald-500/30 text-emerald-400 bg-emerald-500/[0.07]';
  if (l === 'false')          return 'border-red-500/30 text-red-400 bg-red-500/[0.07]';
  if (l === 'partially true') return 'border-amber-500/30 text-amber-400 bg-amber-500/[0.07]';
  return 'border-white/10 text-white/35 bg-white/[0.03]';
};

/* ════════════════════════
   LOADING / ERROR STATES
════════════════════════ */
const LoadingState = () => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#07080f]">
    <div className="w-10 h-10 rounded-full border border-primary/20 border-t-primary animate-spin" />
    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Loading report…</p>
  </div>
);

const ErrorState = ({ message }) => (
  <div className="max-w-sm mx-auto mt-32 p-8 rounded-2xl border border-white/[0.07] bg-white/[0.015] text-center">
    <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
      <ShieldAlert size={18} className="text-red-400" />
    </div>
    <h2 className="text-base font-black text-white mb-2">Report not found</h2>
    <p className="text-sm text-white/30 leading-relaxed mb-7">{message}</p>
    <Link to="/history"
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.07] text-white/50 text-xs font-black uppercase tracking-widest hover:bg-white/[0.08] transition-all">
      <ArrowLeft size={13} /> Back to History
    </Link>
  </div>
);

/* ════════════════════════
   MAIN COMPONENT
════════════════════════ */
export default function ReportDetail() {
  const { id } = useParams();
  const [data, setData]                     = useState(null);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [expandedClaim, setExpandedClaim]   = useState(null);
  const [confidenceFilter, setConfidence]   = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
    axios.get(`${API_BASE}/history/${id}`)
      .then(res => { setData(res.data); setLoading(false); })
      .catch(err => { setError(err.response?.data?.error || 'Report not found'); setLoading(false); });
  }, [id]);

  const handleExportPDF = () => {
    const el = document.getElementById('report-detail');
    if (!el) return;
    html2pdf().set({
      margin: 0.5, filename: `VeriCheck_${id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    }).from(el).save();
  };

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} />;

  const score           = Math.round(data.truthScore || 0);
  const filteredClaims  = data?.claims?.filter(c => (c.confidence||0)*100 >= confidenceFilter) || [];
  const hasMedia        = data.aiMediaDetection?.results?.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16,1,0.3,1] }}
      className="max-w-3xl mx-auto px-6 pb-24 pt-16"
    >
      {/* ── Back ── */}
      <Link to="/history"
        className="inline-flex items-center gap-2 text-white/25 text-[10px] font-black uppercase tracking-[0.3em] mb-10 hover:text-white/60 transition-colors group">
        <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
        History
      </Link>

      <div id="report-detail" className="space-y-6">

        {/* ── Page header ── */}
        <div className="flex items-start justify-between gap-6 mb-2">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck size={13} className="text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/70">Audit Report</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white mb-1.5">Verification Detail</h1>
            <div className="flex items-center gap-3 text-[10px] text-white/20 font-medium">
              <span>ID: {id}</span>
              <span className="text-white/10">·</span>
              <span>{data.timestamp && new Date(data.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.07] text-white/40 text-[10px] font-black uppercase tracking-widest hover:bg-white/[0.08] hover:text-white/70 transition-all">
              <Download size={13} /> PDF
            </button>
            <button onClick={() => {
              const txt = data.claims?.map(c=>`[${c.verdict}] ${c.claim}`).join('\n')||'';
              navigator.clipboard.writeText(`VeriCheck · ${score}% confidence\n${id}\n\n${txt}`);
            }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/[0.09] border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary/[0.15] transition-all">
              Copy
            </button>
          </div>
        </div>

        {/* ── Score card ── */}
        <div
          className="rounded-2xl border p-8 relative overflow-hidden"
          style={{ borderColor: scoreBorder(score), background: scoreBg(score) }}
        >
          {/* Watermark */}
          <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
            <ShieldCheck size={160} />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
            {/* Left */}
            <div className="flex-1 md:text-left text-center">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 mb-3">Aggregate verdict</p>
              <h2 className="text-4xl font-black tracking-tight leading-none mb-4"
                style={{ color: scoreColor(score) }}>
                {scoreLabel(score)}
              </h2>
              <p className="text-sm text-white/35 leading-relaxed mb-6 max-w-[360px]">
                Forensic confidence across{' '}
                <span className="text-white/65 font-semibold">{data.claims?.length||0} claims</span>
                {' '}— AI content probability{' '}
                <span className="text-white/65 font-semibold">{data.aiTextDetection?.score||0}%</span>.
              </p>

              {/* Meta chips */}
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[9px] font-bold text-white/35 uppercase tracking-widest">
                  <Layers size={11} className="text-primary" /> {data.claims?.length||0} claims
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[9px] font-bold text-white/35 uppercase tracking-widest">
                  <Cpu size={11} className="text-primary" /> {data.aiTextDetection?.score||0}% synthetic
                </div>
              </div>
            </div>

            {/* Right: score + chart */}
            <div className="flex items-center gap-8 flex-shrink-0">
              <div className="text-center">
                <p className="text-6xl font-black tracking-tight leading-none"
                  style={{ color: scoreColor(score) }}>
                  {score}%
                </p>
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/20 mt-2">Confidence</p>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-black/30 p-4">
                <VerdictPieChart claims={data.claims} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Source highlighting ── */}
        {data.originalText && (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-7">
            <div className="flex items-center gap-2 mb-5">
              <BrainCircuit size={14} className="text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">Source Annotations</span>
            </div>
            <div className="relative text-lg leading-[2.4] text-white/70 font-medium italic lowercase tracking-wide first-letter:uppercase">
              {(data.originalText || '').split('. ').map((s, i) => {
                const claim = data.claims?.find(c => c.originalSentence && s.includes(c.originalSentence));
                const clr = claim ? (claim.verdict === 'True' ? 'bg-emerald-500/10 text-emerald-400 border-b-2 border-emerald-500/40 px-1' : claim.verdict === 'False' ? 'bg-red-500/10 text-red-400 border-b-2 border-red-500/40 px-1' : 'bg-amber-500/10 text-amber-400 border-b-2 border-amber-500/40 px-1') : '';
                return (
                  <span key={i} className={`transition-all rounded-sm ${clr}`}>
                    {s}.{' '}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Media forensics ── */}
        {hasMedia && (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-7">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <ImageIcon size={14} className="text-emerald-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">Media Forensics</span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-500/[0.09] border border-emerald-500/20 text-emerald-400">
                {data.aiMediaDetection.verdict}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.aiMediaDetection.results.map((res, i) => (
                <div key={i} className="rounded-xl border border-white/[0.06] bg-black/20 overflow-hidden">
                  <div className="aspect-video relative bg-black/50 flex items-center justify-center">
                    {res.url
                      ? <img src={res.url} alt="media" className="w-full h-full object-cover opacity-70" />
                      : <ImageIcon size={32} className="text-white/10" />
                    }
                    <span className={`absolute top-3 left-3 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest backdrop-blur-md border
                      ${res.isAIGenerated
                        ? 'bg-red-500/20 border-red-500/30 text-red-400'
                        : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'}`}>
                      {res.verdict}
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[9px] font-black uppercase tracking-widest text-white/25">Confidence</span>
                      <span className="text-sm font-black text-white/70">{res.confidence}%</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {res.indicators?.map((ind, ii) => (
                        <span key={ii} className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[9px] font-semibold text-white/35 uppercase tracking-widest">
                          {ind}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Claims list ── */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-7">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <BrainCircuit size={14} className="text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">
                Verified Claims
              </span>
              <span className="ml-1 px-2.5 py-1 rounded-full bg-white/[0.05] text-[9px] font-black text-white/25 uppercase tracking-widest">
                {filteredClaims.length}
              </span>
            </div>

            {/* Confidence filter */}
            <div className="flex items-center gap-4 px-4 py-2.5 rounded-xl bg-black/30 border border-white/[0.06] min-w-[220px]">
              <Filter size={12} className="text-primary flex-shrink-0" />
              <div className="flex-1">
                <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-white/20 mb-1.5">
                  <span>Min confidence</span>
                  <span>{confidenceFilter}%</span>
                </div>
                <input type="range" min="0" max="100"
                  value={confidenceFilter}
                  onChange={e => setConfidence(Number(e.target.value))}
                  className="w-full h-1 accent-primary" />
              </div>
            </div>
          </div>

          {/* Claim rows */}
          <div className="space-y-2">
            {filteredClaims.map((claim, idx) => (
              <div key={idx}
                className="rounded-xl border border-white/[0.05] bg-white/[0.01] hover:border-primary/20 hover:bg-primary/[0.02] transition-all duration-200 cursor-pointer overflow-hidden"
                onClick={() => setExpandedClaim(expandedClaim===idx ? null : idx)}
              >
                {/* Row header */}
                <div className="flex items-center gap-4 p-5">
                  <span className={`text-[9px] font-black uppercase tracking-widest py-1 px-4 rounded-full border flex-shrink-0 ${verdictStyle(claim.verdict)}`}>
                    {claim.verdict||'?'}
                  </span>
                  <p className="flex-1 text-sm font-semibold text-white/70 leading-snug line-clamp-2">{claim.claim}</p>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-[10px] font-bold text-white/20 hidden sm:block">
                      {Math.round((claim.confidence||0)*100)}%
                    </span>
                    <div className={`w-6 h-6 flex items-center justify-center rounded-lg transition-all duration-200
                      ${expandedClaim===idx ? 'bg-primary/20 text-primary rotate-180' : 'text-white/20'}`}>
                      <ChevronDown size={14} />
                    </div>
                  </div>
                </div>

                {/* Expanded */}
                <AnimatePresence>
                  {expandedClaim===idx && (
                    <motion.div
                      initial={{ height:0, opacity:0 }}
                      animate={{ height:'auto', opacity:1 }}
                      exit={{ height:0, opacity:0 }}
                      transition={{ duration:0.22, ease:'easeInOut' }}
                      className="overflow-hidden border-t border-white/[0.05]"
                    >
                      <div className="p-6 space-y-6">
                        {/* Reasoning */}
                        <p className="text-sm text-white/35 leading-relaxed border-l-2 border-primary/30 pl-4 italic">
                          "{claim.reasoning}"
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Evidence */}
                          <div>
                            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400/60 mb-4 pb-3 border-b border-emerald-500/10">
                              <Globe size={11}/> Evidence
                            </div>

                            {claim.entityMetadata && (
                              <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] flex items-center gap-4 mb-6 group/entity relative overflow-hidden">
                                {claim.entityMetadata.image ? (
                                  <div className="w-14 h-14 rounded-lg overflow-hidden border border-white/10 flex-shrink-0 bg-black/40">
                                     <img src={claim.entityMetadata.image} alt={claim.entityMetadata.name} className="w-full h-full object-cover group-hover/entity:scale-110 transition-transform duration-700" />
                                  </div>
                                ) : (
                                  <div className="w-14 h-14 rounded-lg bg-white/[0.03] border border-white/10 flex items-center justify-center flex-shrink-0">
                                     <User size={18} className="text-white/10" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-xs font-black text-white italic truncate">{claim.entityMetadata.name}</h4>
                                  <p className="text-[8px] text-white/40 uppercase tracking-widest font-black mb-1 line-clamp-1">{claim.entityMetadata.description}</p>
                                  {claim.entityMetadata.wikipediaUrl && (
                                    <a href={claim.entityMetadata.wikipediaUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 mt-1.5 text-[8px] font-black uppercase tracking-[0.2em] text-primary/60 hover:text-primary transition-colors">
                                      Wiki Archive <ExternalLink size={8} />
                                    </a>
                                  )}
                                </div>
                              </div>
                            )}
                            <div className="space-y-4">
                              {claim.evidence?.map((ev, i) => (
                                <div key={i} className="flex gap-3">
                                  <div className="w-1 h-1 rounded-full bg-emerald-400/50 mt-2 flex-shrink-0" />
                                  <div>
                                    <p className="text-[12px] text-white/50 leading-relaxed">{typeof ev==='string' ? ev : ev.text}</p>
                                    {ev.url && (
                                      <a href={ev.url} target="_blank" rel="noreferrer"
                                        className="inline-flex items-center gap-1 mt-1.5 text-[9px] text-emerald-400/70 hover:text-emerald-400 font-black uppercase tracking-widest transition-colors">
                                        {ev.source||'Source'} <ExternalLink size={9}/>
                                      </a>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Search queries */}
                          <div>
                            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-primary/60 mb-4 pb-3 border-b border-primary/10">
                              <Search size={11}/> Queries
                            </div>
                            <div className="flex flex-wrap gap-2 mb-5">
                              {claim.searchQueriesUsed?.map((q, i) => (
                                <span key={i} className="px-3 py-1.5 rounded-lg bg-primary/[0.06] border border-primary/[0.12] text-[9px] font-semibold text-primary/60 tracking-wide">
                                  {q}
                                </span>
                              ))}
                            </div>
                            <button
                              onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(`[${claim.verdict}] ${claim.claim}\n\n${claim.reasoning}`); }}
                              className="text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-white/50 transition-colors">
                              Copy chunk ↗
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}