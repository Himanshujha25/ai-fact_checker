import React, { useState, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, ShieldAlert, FileText, Search, Loader2, ExternalLink,
  BrainCircuit, Zap, ChevronRight, ChevronDown, Download,
  Image, Film, X, Globe, Layers, Cpu, FileSearch, Sparkles, Plus, User
} from 'lucide-react';
import confetti from 'canvas-confetti';
import html2pdf from 'html2pdf.js';
import VerdictPieChart from '../components/VerdictPieChart';

const API_BASE = '/api';

/* ── tiny helpers ── */
const scoreColor  = s => s > 70 ? 'text-emerald-400' : s > 40 ? 'text-amber-400' : 'text-red-400';
const scoreBorder = s => s > 70 ? 'border-emerald-500/20' : s > 40 ? 'border-amber-500/20' : 'border-red-500/20';
const scoreBg     = s => s > 70 ? 'bg-emerald-500/[0.04]' : s > 40 ? 'bg-amber-500/[0.04]' : 'bg-red-500/[0.04]';
const scoreGlow   = s => s > 70
  ? '0 0 80px rgba(16,185,129,0.15)'
  : s > 40
  ? '0 0 80px rgba(245,158,11,0.15)'
  : '0 0 80px rgba(239,68,68,0.15)';
const scoreLabel  = s => s > 80 ? 'AUTHENTICATED' : s > 60 ? 'LIKELY VALID' : s > 40 ? 'CONTESTED' : 'DECEPTIVE';

const verdictPill = v => {
  const l = v?.toLowerCase();
  if (l === 'true')           return 'border-emerald-500/40 text-emerald-400 bg-emerald-500/[0.07]';
  if (l === 'false')          return 'border-red-500/40 text-red-400 bg-red-500/[0.07]';
  if (l === 'partially true') return 'border-amber-500/40 text-amber-400 bg-amber-500/[0.07]';
  return 'border-white/10 text-white/40 bg-white/[0.03]';
};

const BLANK_TAB = () => ({
  id: Date.now(),
  title: 'New Audit',
  input: '', results: null, mode: 'normal',
  step: 0, logs: [], elapsed: 0,
  mediaFiles: [], mediaResults: null, error: null,
  expandedClaim: null, confidenceFilter: 0,
  loading: false, mediaLoading: false,
});

export default function Verify() {
  const [tabs, setTabs]           = useState([BLANK_TAB()]);
  const [activeTabIdx, setActive] = useState(0);
  const [dragOver, setDragOver]   = useState(false);
  const fileInputRef              = useRef(null);

  const activeTab = tabs[activeTabIdx];
  const update    = (patch) => setTabs(p => p.map((t,i) => i === activeTabIdx ? { ...t, ...patch } : t));

  /* ── tab management ── */
  const addTab = () => { setTabs(p => [...p, BLANK_TAB()]); setActive(tabs.length); };
  const closeTab = (e, idx) => {
    e.stopPropagation();
    if (tabs.length === 1) { update(BLANK_TAB()); return; }
    setTabs(p => p.filter((_,i) => i !== idx));
    setActive(Math.max(0, idx - 1));
  };

  const modes = [
    { id: 'normal', label: 'Express',    icon: <Zap size={13} />,         desc: '~1 min' },
    { id: 'deep',   label: 'Deep',       icon: <Search size={13} />,       desc: '~2 min' },
    { id: 'pro',    label: 'Pro Agent',  icon: <BrainCircuit size={13} />, desc: '~3 min' },
  ];

  const pipeline = [
    { title: 'Extract',  icon: <FileText size={16} /> },
    { title: 'Research', icon: <Search size={16} />   },
    { title: 'Audit',    icon: <BrainCircuit size={16} /> },
    { title: 'Report',   icon: <ShieldCheck size={16} /> },
  ];

  /* ── verify ── */
  const handleVerify = async () => {
    if (!activeTab.input.trim()) return;
    update({
      loading: true, results: null, error: null, step: 1, elapsed: 0,
      logs: [{ msg: `Initializing ${activeTab.mode.toUpperCase()} pipeline…`, id: Date.now() }],
      title: activeTab.input.slice(0, 18) + (activeTab.input.length > 18 ? '…' : ''),
    });
    try {
      const isUrl    = /^https?:\/\/[^\s$.?#].[^\s]*$/gm.test(activeTab.input);
      const payload  = isUrl ? { url: activeTab.input, mode: activeTab.mode } : { text: activeTab.input, mode: activeTab.mode };
      const thoughts = [
        'Decomposing semantic structure…',
        'Extracting atomic factual claims…',
        'Ranking claims by verifiability…',
        'Generating targeted search queries…',
        'Cross-referencing primary sources…',
        'Resolving conflicting evidence…',
        'Applying Chain-of-Thought verification…',
      ];
      const clock   = setInterval(() => setTabs(p => p.map((t,i) => i===activeTabIdx ? {...t,elapsed:(t.elapsed||0)+1} : t)), 1000);
      const stepper = setInterval(() => setTabs(p => p.map((t,i) => i===activeTabIdx ? {...t,step:Math.min(t.step+1,4)} : t)), 5000);
      const logger  = setInterval(() => setTabs(p => p.map((t,i) => i===activeTabIdx ? {...t,logs:[...(t.logs||[]).slice(-5),{msg:thoughts[Math.floor(Math.random()*thoughts.length)],id:Date.now()}]} : t)), 2500);

      const res = await axios.post(`${API_BASE}/verify`, payload);
      [clock, stepper, logger].forEach(clearInterval);

      const emoji = res.data.truthScore >= 80 ? '✓ ' : res.data.truthScore > 40 ? '~ ' : '✗ ';
      update({ step:4, results:res.data, loading:false,
        logs:[...(activeTab.logs||[]),{msg:'Verification complete.',id:Date.now()}],
        title: emoji + activeTab.title });
      if (res.data.truthScore >= 80) confetti({ particleCount:120, spread:70, origin:{y:0.6} });
    } catch (err) {
      update({ error: err.response?.data?.error || 'Verification failed.', step:0, loading:false });
    }
  };

  const handleReset = () => update({ ...BLANK_TAB(), id: activeTab.id });

  const handleFileSelect = (files) => {
    const valid = Array.from(files).filter(f => f.type.startsWith('image/') || f.type.startsWith('video/')).slice(0,5);
    update({ mediaFiles: [...(activeTab.mediaFiles||[]), ...valid].slice(0,5) });
  };
  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files); };
  const removeFile = (idx) => update({ mediaFiles: activeTab.mediaFiles.filter((_,i)=>i!==idx), mediaResults:null });

  const handleAnalyzeMedia = async () => {
    if (!activeTab.mediaFiles.length) return;
    update({ mediaResults:null, mediaLoading:true });
    try {
      const fd = new FormData();
      activeTab.mediaFiles.forEach(f => fd.append('media', f));
      const res = await axios.post(`${API_BASE}/analyze-media`, fd, { headers:{'Content-Type':'multipart/form-data'} });
      update({ mediaResults:res.data, mediaLoading:false });
    } catch(err) { update({ error:err.response?.data?.error||'Media analysis failed.', mediaLoading:false }); }
  };

  const handleExportPDF = () => {
    const el = document.getElementById('report-section');
    if (!el) return;
    html2pdf().set({ margin:0.5, filename:'VeriCheck_Report.pdf', image:{type:'jpeg',quality:0.98},
      html2canvas:{scale:2}, jsPDF:{unit:'in',format:'a4',orientation:'portrait'} }).from(el).save();
  };

  /* ════════════════════════════════
     RENDER
  ════════════════════════════════ */
  return (
    <motion.div
      initial={{ opacity:0 }} animate={{ opacity:1 }}
      className="flex flex-col min-h-screen bg-[#07080f] select-none"
    >
      {/* ── Tab Bar ── */}
      <div className="flex items-end gap-0.5 px-6 border-b border-white/[0.06] bg-black/60 backdrop-blur-xl pt-20 overflow-x-auto no-scrollbar">
        {tabs.map((t,i) => (
          <div key={t.id} onClick={() => setActive(i)}
            className={`group flex items-center gap-2.5 px-5 py-3 cursor-pointer min-w-[130px] max-w-[190px] rounded-t-lg border-t border-x transition-all duration-200
              ${i===activeTabIdx
                ? 'bg-white/[0.05] border-white/[0.08] text-white'
                : 'bg-transparent border-transparent text-white/30 hover:text-white/60 hover:bg-white/[0.02]'}`}
          >
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${i===activeTabIdx ? 'bg-primary' : 'bg-white/20'}`} />
            <span className="text-[10px] font-bold uppercase tracking-widest truncate flex-1">{t.title}</span>
            <button onClick={(e)=>closeTab(e,i)}
              className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center rounded hover:bg-red-500/20 hover:text-red-400 transition-all flex-shrink-0">
              <X size={9} />
            </button>
          </div>
        ))}
        <button onClick={addTab}
          className="flex items-center gap-1.5 px-4 py-3 mb-0 text-white/30 hover:text-primary transition-all rounded-t-lg hover:bg-primary/10 text-[10px] font-bold uppercase tracking-widest flex-shrink-0">
          <Plus size={12} /> New
        </button>
      </div>

      {/* ── Main ── */}
      <main className="max-w-3xl mx-auto px-6 py-16 w-full flex-1 flex flex-col">

        {/* ════ IDLE STATE ════ */}
        <AnimatePresence mode="wait">
        {!activeTab.results && !activeTab.loading && (
          <motion.div key="idle"
            initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
            className="flex flex-col flex-1 justify-center gap-10"
          >
            {/* Wordmark */}
            <div className="text-center">
              <div className="inline-flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <FileSearch size={18} className="text-primary" />
                </div>
                <span className="text-sm font-black uppercase tracking-[0.25em] text-white/80">VeriCheck</span>
              </div>
              <p className="text-white/25 text-xs font-medium tracking-widest uppercase">Forensic Intelligence Engine</p>
            </div>

            {/* Command Box */}
            <div className="relative group">
              {/* glow halo */}
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-primary/30 via-transparent to-primary/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-700 blur-sm" />

              <div className="relative rounded-2xl border border-white/[0.07] bg-[#0d0e18] overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.6)] group-focus-within:border-primary/30 transition-colors duration-300">
                {/* textarea */}
                <textarea
                  value={activeTab.input}
                  onChange={e => update({ input:e.target.value })}
                  onKeyDown={e => { if(e.key==='Enter' && e.metaKey) handleVerify(); }}
                  placeholder="Paste a claim, article URL, or narrative to audit…"
                  className="w-full bg-transparent px-7 pt-7 pb-20 text-[15px] text-white/90 outline-none placeholder:text-white/15 resize-none min-h-[200px] leading-[1.75] font-medium"
                />

                {/* bottom toolbar */}
                <div className="absolute bottom-0 inset-x-0 flex items-center justify-between px-4 py-3 border-t border-white/[0.05] bg-black/30 backdrop-blur-md">
                  {/* mode pills */}
                  <div className="flex items-center gap-1">
                    {modes.map(m => (
                      <button key={m.id} onClick={() => update({ mode:m.id })}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300
                          ${activeTab.mode===m.id
                            ? 'bg-primary/20 text-primary border border-primary/30'
                            : 'text-white/30 hover:text-white/60 hover:bg-white/[0.04] border border-transparent'}`}>
                        {React.cloneElement(m.icon,{size:11})}
                        <span className="hidden sm:inline">{m.label}</span>
                        <span className="text-[9px] opacity-50 hidden md:inline">{m.desc}</span>
                      </button>
                    ))}
                  </div>

                  {/* Analyze button */}
                  <button onClick={handleVerify}
                    disabled={!activeTab.input.trim()}
                    className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-primary-hover disabled:opacity-20 disabled:pointer-events-none text-white text-[11px] font-black uppercase tracking-[0.18em] rounded-lg border border-white/10 shadow-glow transition-all active:scale-95">
                    Analyze <ChevronRight size={13} className="opacity-70"/>
                  </button>
                </div>
              </div>
            </div>

            {/* Feature hints */}
            <div className="flex items-center justify-center gap-8 flex-wrap">
              {[
                { icon:<Globe size={12}/>,  label:'Live Web Research'  },
                { icon:<Layers size={12}/>, label:'Multi-Source Audit'  },
                { icon:<Cpu size={12}/>,    label:'Bias Synthesis'      },
              ].map((f,i) => (
                <div key={i} className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-white/20">
                  <span className="text-primary/40">{f.icon}</span>{f.label}
                </div>
              ))}
            </div>

            {/* Error banner */}
            {activeTab.error && (
              <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl bg-red-500/[0.08] border border-red-500/20 text-red-400 text-sm font-semibold">
                <ShieldAlert size={16} className="flex-shrink-0" />
                {activeTab.error}
              </div>
            )}

            {/* ── Media Upload ── */}
            <div className="pt-10 border-t border-white/[0.05]">
              <div className="flex items-center gap-2.5 mb-6">
                <Sparkles size={12} className="text-emerald-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400/70">Neural Forensics Engine</span>
              </div>

              <div
                onDragOver={e=>{e.preventDefault();setDragOver(true)}}
                onDragLeave={()=>setDragOver(false)}
                onDrop={handleDrop}
                onClick={()=>fileInputRef.current?.click()}
                className={`relative rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-500
                  ${dragOver
                    ? 'border-emerald-500/50 bg-emerald-500/[0.04]'
                    : 'border-white/[0.06] hover:border-white/[0.12] bg-white/[0.01] hover:bg-white/[0.02]'}`}>
                <input ref={fileInputRef} type="file" multiple accept="image/*,video/*" className="hidden"
                  onChange={e=>handleFileSelect(e.target.files)} />
                <div className="flex items-center justify-center gap-8 mb-5 opacity-25 hover:opacity-60 transition-opacity">
                  <Image size={28} className="text-emerald-400" />
                  <Film  size={28} className="text-emerald-400" />
                </div>
                <p className="text-sm font-bold text-white/50 mb-1">Drop media files to scan for deepfakes</p>
                <p className="text-[10px] uppercase tracking-widest text-white/20 font-semibold">Images & Video · Up to 5 files</p>
              </div>

              {/* File chips */}
              {activeTab.mediaFiles?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {activeTab.mediaFiles.map((f,i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-[11px] font-semibold text-white/60">
                      {f.type.startsWith('image/') ? <Image size={12}/> : <Film size={12}/>}
                      <span className="max-w-[120px] truncate">{f.name}</span>
                      <button onClick={()=>removeFile(i)} className="text-white/30 hover:text-red-400 transition-colors"><X size={10}/></button>
                    </div>
                  ))}
                  <button onClick={handleAnalyzeMedia}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[11px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all">
                    <Sparkles size={11}/> Scan Media
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ════ LOADING STATE ════ */}
        {activeTab.loading && (
          <motion.div key="loading"
            initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="flex flex-col items-center justify-center flex-1 py-16 gap-12"
          >
            {/* Spinner */}
            <div className="relative">
              <div className="w-20 h-20 rounded-full border border-primary/15 border-t-primary animate-spin" />
              <div className="w-20 h-20 rounded-full border border-primary/5 border-b-primary/40 animate-spin absolute inset-0" style={{animationDuration:'3s',animationDirection:'reverse'}} />
              <div className="absolute inset-0 flex items-center justify-center text-primary">
                <BrainCircuit size={28} className="animate-pulse" />
              </div>
            </div>

            <div className="text-center">
              <p className="text-2xl font-black tracking-tight text-white mb-1">Reasoning Grid Active</p>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">{activeTab.elapsed||0}s elapsed</p>
            </div>

            {/* Pipeline steps */}
            <div className="w-full grid grid-cols-4 gap-3">
              {pipeline.map((p,i) => {
                const state = activeTab.step === i+1 ? 'active' : activeTab.step > i+1 ? 'done' : 'idle';
                return (
                  <div key={i}
                    className={`p-5 rounded-xl border transition-all duration-500
                      ${state==='active' ? 'border-primary/40 bg-primary/[0.06] shadow-glow'
                      : state==='done'   ? 'border-white/[0.08] bg-white/[0.02] opacity-60'
                      :                    'border-white/[0.04] opacity-20'}`}>
                    <div className={`mb-3 ${state==='active'?'text-primary':state==='done'?'text-white/50':'text-white/20'}`}>{p.icon}</div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-white/50 mb-2">{p.title}</div>
                    <div className="h-0.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
                      <motion.div className="h-full bg-primary rounded-full"
                        initial={{width:0}}
                        animate={{width: state==='done'?'100%' : state==='active'?'65%' : '0%'}}
                        transition={{duration:0.6,ease:'easeOut'}} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Log terminal */}
            <div className="w-full rounded-xl border border-white/[0.05] bg-black/50 p-5 font-mono text-[11px] h-[160px] overflow-hidden space-y-1.5">
              <AnimatePresence>
                {activeTab.logs.slice(-6).map(log => (
                  <motion.div key={log.id}
                    initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} exit={{opacity:0}}
                    className="flex gap-3 items-start">
                    <span className="text-white/15 flex-shrink-0">{new Date(log.id).toLocaleTimeString()}</span>
                    <span className="text-primary/70 font-black uppercase text-[9px] tracking-widest flex-shrink-0 pt-0.5">SYS</span>
                    <span className="text-white/50">{log.msg}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* ════ RESULTS STATE ════ */}
        {activeTab.results && !activeTab.loading && (
          <motion.div key="results" id="report-section"
            initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
            className="mt-8 space-y-6"
          >
            {/* ── Hero Score Card ── */}
            <div
              className={`relative rounded-2xl border p-8 ${scoreBorder(activeTab.results.truthScore)} ${scoreBg(activeTab.results.truthScore)}`}
              style={{boxShadow: scoreGlow(activeTab.results.truthScore)}}
            >
              {/* Watermark — clipped inside its own contained div, not the card */}
              <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                <ShieldCheck
                  size={220}
                  className="absolute right-[-20px] top-1/2 -translate-y-1/2 opacity-[0.035]"
                  style={{ color: scoreColor(activeTab.results.truthScore) }}
                />
              </div>

              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-8">

                {/* ── Score tile — fixed size, always visible ── */}
                <div
                  className="flex-shrink-0 w-32 h-32 rounded-2xl flex flex-col items-center justify-center gap-1.5"
                  style={{
                    background: scoreBg(activeTab.results.truthScore),
                    border: `1.5px solid ${scoreBorder(activeTab.results.truthScore)}`,
                    boxShadow: scoreGlow(activeTab.results.truthScore),
                  }}
                >
                  <span
                    className="font-black leading-none tabular-nums"
                    style={{
                      color: scoreColor(activeTab.results.truthScore),
                      fontSize: Math.round(activeTab.results.truthScore) === 100 ? '1.85rem' : '2.4rem',
                      letterSpacing: '-0.04em',
                    }}
                  >
                    {Math.round(activeTab.results.truthScore)}%
                  </span>
                  <span className="text-[8px] font-black uppercase tracking-[0.22em] text-white/30">Confidence</span>
                </div>

                {/* ── Verdict + meta — fills remaining space ── */}
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 mb-2">Verdict</p>
                  <h2
                    className="font-black tracking-tight leading-none mb-4"
                    style={{ color: scoreColor(activeTab.results.truthScore), fontSize: 'clamp(1.6rem, 4vw, 2.5rem)' }}
                  >
                    {scoreLabel(activeTab.results.truthScore)}
                  </h2>
                  <p className="text-sm text-white/40 leading-relaxed mb-6">
                    <span className="text-white/65 font-semibold">{activeTab.results.claims?.length||0} claims</span>
                    {' '}audited ·{' '}
                    <span className="text-white/65 font-semibold">{Math.round(activeTab.results.truthScore)}% confidence</span>
                    {' '}across primary sources.
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <button onClick={handleExportPDF}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white/50 text-[10px] font-black uppercase tracking-widest hover:bg-white/[0.09] hover:text-white/80 transition-all">
                      <Download size={12}/> PDF
                    </button>
                    <button onClick={handleReset}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/[0.07] border border-red-500/20 text-red-400/80 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/[0.12] transition-all">
                      <Zap size={12}/> New Audit
                    </button>
                    <button onClick={() => {
                      const txt = activeTab.results.claims?.map(c=>`[${c.verdict}] ${c.claim}`).join('\n')||'';
                      navigator.clipboard.writeText(`VeriCheck · ${Math.round(activeTab.results.truthScore)}% confidence\n\n${txt}`);
                    }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/[0.08] border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary/[0.14] transition-all">
                      Copy Summary
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Stats row ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Verdict Distribution — left, full height, chart + breakdown */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 hover:border-white/[0.08] transition-colors flex flex-col gap-5">
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/25">Verdict Distribution</p>

                {/* Chart centred with good breathing room */}
                <div className="flex justify-center py-3">
                  <VerdictPieChart claims={activeTab.results.claims} />
                </div>

                {/* Verdict count chips */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/[0.05]">
                  {[
                    { label: 'Verified',  key: ['true','accurate','verified'],        color: '#10b981', bg: 'rgba(16,185,129,0.07)',   border: 'rgba(16,185,129,0.2)'  },
                    { label: 'False',     key: ['false','inaccurate'],                color: '#ef4444', bg: 'rgba(239,68,68,0.07)',    border: 'rgba(239,68,68,0.2)'   },
                    { label: 'Partial',   key: ['partially true','mixed'],            color: '#f59e0b', bg: 'rgba(245,158,11,0.07)',   border: 'rgba(245,158,11,0.2)'  },
                    { label: 'Unknown',   key: [],                                    color: '#64748b', bg: 'rgba(100,116,139,0.07)',  border: 'rgba(100,116,139,0.2)' },
                  ].map((v,i) => {
                    const claims = activeTab.results.claims || [];
                    const n = i < 3
                      ? claims.filter(c => v.key.includes((c.verdict||'').toLowerCase())).length
                      : claims.filter(c => !['true','accurate','verified','false','inaccurate','partially true','mixed'].includes((c.verdict||'').toLowerCase())).length;
                    return (
                      <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg"
                        style={{ background: v.bg, border: `1px solid ${v.border}` }}>
                        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: v.color }}>{v.label}</span>
                        <span className="text-sm font-black" style={{ color: v.color }}>{n}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Detection — right, compact, no overflow */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 hover:border-white/[0.08] transition-colors flex flex-col gap-5">
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/25">AI-Generated Probability</p>

                {/* Big number */}
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-black tracking-tight text-white/85 leading-none tabular-nums">
                    {activeTab.results.aiTextDetection?.score||0}
                  </span>
                  <span className="text-xl font-black text-white/30 mb-1">%</span>
                </div>

                {/* Visual bar */}
                <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${activeTab.results.aiTextDetection?.score||0}%`,
                      background: (activeTab.results.aiTextDetection?.score||0) > 60
                        ? '#ef4444'
                        : (activeTab.results.aiTextDetection?.score||0) > 30
                        ? '#f59e0b'
                        : '#10b981',
                    }}
                  />
                </div>

                {/* Status label */}
                <div className="flex items-center gap-2">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: (activeTab.results.aiTextDetection?.score||0) > 60 ? '#ef4444'
                        : (activeTab.results.aiTextDetection?.score||0) > 30 ? '#f59e0b' : '#10b981'
                    }}
                  />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/35">
                    {(activeTab.results.aiTextDetection?.score||0) > 60 ? 'Likely AI-generated'
                      : (activeTab.results.aiTextDetection?.score||0) > 30 ? 'Possibly AI-generated'
                      : 'Likely human-written'}
                  </span>
                </div>

                {/* Explanation — capped height, no overflow */}
                <div className="rounded-lg bg-black/25 border border-white/[0.05] p-4 flex-1">
                  <p className="text-[11px] text-white/35 leading-relaxed line-clamp-[8]">
                    {activeTab.results.aiTextDetection?.explanation || 'No synthetic patterns detected in the submitted text.'}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Claims ── */}
            <div>
              <div className="flex items-center gap-3 mb-5 pt-2">
                <BrainCircuit size={18} className="text-primary" />
                <h3 className="text-base font-black uppercase tracking-widest text-white/70">
                  Verified Claims <span className="text-white/25 font-semibold ml-1">({activeTab.results.claims?.length||0})</span>
                </h3>
              </div>

              <div className="space-y-3">
                {activeTab.results.claims?.map((c,i) => (
                  <div key={i}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.015] hover:border-primary/25 hover:bg-primary/[0.02] transition-all duration-300 cursor-pointer overflow-hidden"
                    onClick={() => update({ expandedClaim: activeTab.expandedClaim===i ? null : i })}>

                    {/* Claim row */}
                    <div className="flex items-center gap-5 p-5">
                      <span className={`text-[9px] font-black uppercase tracking-widest py-1 px-4 rounded-full border flex-shrink-0 ${verdictPill(c.verdict)}`}>
                        {c.verdict||'?'}
                      </span>
                      <p className="flex-1 text-sm font-semibold text-white/75 leading-snug">{c.claim}</p>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <span className="text-[10px] font-bold text-white/20 hidden md:block">
                          {Math.round((c.confidence||0)*100)}%
                        </span>
                        <div className={`w-5 h-5 flex items-center justify-center rounded-md transition-all ${activeTab.expandedClaim===i ? 'bg-primary/20 text-primary' : 'text-white/20'}`}>
                          {activeTab.expandedClaim===i ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                        </div>
                      </div>
                    </div>

                    {/* Expanded detail */}
                    <AnimatePresence>
                      {activeTab.expandedClaim===i && (
                        <motion.div
                          initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}
                          transition={{duration:0.25,ease:'easeInOut'}}
                          className="overflow-hidden border-t border-white/[0.05]">
                          <div className="p-6 space-y-6">
                            {/* Reasoning */}
                            <p className="text-sm text-white/40 leading-relaxed italic border-l-2 border-primary/30 pl-4">
                              "{c.reasoning}"
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Evidence */}
                              <div>
                                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400/60 mb-4 pb-3 border-b border-emerald-500/10">
                                  <ExternalLink size={12}/> Evidence
                                </div>

                                {/* ── Entity / person card ── */}
                                {c.entityMetadata && (
                                  <div className="flex items-center gap-4 p-4 rounded-xl border border-white/[0.07] bg-white/[0.03] mb-4 group/ent">
                                    {c.entityMetadata.image ? (
                                      <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/10 flex-shrink-0 bg-black/40">
                                        <img
                                          src={c.entityMetadata.image}
                                          alt={c.entityMetadata.name}
                                          className="w-full h-full object-cover group-hover/ent:scale-110 transition-transform duration-500"
                                        />
                                      </div>
                                    ) : (
                                      <div className="w-14 h-14 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center flex-shrink-0">
                                        <User size={20} className="text-white/20" />
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-black text-white/80 truncate leading-tight">{c.entityMetadata.name}</p>
                                      <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mt-0.5 mb-1">{c.entityMetadata.description}</p>
                                      <p className="text-[11px] text-white/25 line-clamp-2 leading-relaxed">{c.entityMetadata.extract}</p>
                                      {c.entityMetadata.wikipediaUrl && (
                                        <a href={c.entityMetadata.wikipediaUrl} target="_blank" rel="noreferrer"
                                          className="inline-flex items-center gap-1 mt-1.5 text-[9px] font-black uppercase tracking-widest text-primary/50 hover:text-primary transition-colors">
                                          Wikipedia <ExternalLink size={8}/>
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                )}
                                <div className="space-y-3">
                                  {c.evidence?.map((ev,ei) => (
                                    <div key={ei} className="flex gap-3">
                                      <div className="w-1 h-1 rounded-full bg-emerald-400/60 mt-2 flex-shrink-0" />
                                      <div>
                                        <p className="text-[12px] text-white/55 leading-relaxed">{ev.text||ev}</p>
                                        {ev.url && (
                                          <a href={ev.url} target="_blank" rel="noreferrer"
                                            className="inline-flex items-center gap-1 mt-1 text-[9px] text-emerald-400/70 hover:text-emerald-400 font-black uppercase tracking-widest transition-colors">
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
                                  <Search size={12}/> Queries Used
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {c.searchQueriesUsed?.map((q,qi) => (
                                    <span key={qi}
                                      className="px-3 py-1 rounded-lg bg-primary/[0.07] border border-primary/[0.12] text-[10px] font-semibold text-primary/70 tracking-wide">
                                      {q}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(`[${c.verdict}] ${c.claim}\n\n${c.reasoning}`); }}
                              className="text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-white/50 transition-colors">
                              Copy chunk ↗
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </main>
    </motion.div>
  );
}