import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, ShieldCheck, RefreshCw, Clock, AlertTriangle, Layers, ChevronRight, Cpu, FileSearch, Lock } from 'lucide-react';

const Architecture = () => {
  const flowSteps = [
    { label: 'USER INPUT', sub: 'Text / URL', border: 'border-accent/40', bg: 'bg-accent/5' },
    null,
    { label: 'PHASE 1: CLAIM EXTRACTION', sub: 'Temporal-aware decomposition · Importance ranking', border: 'border-primary/40', bg: 'bg-primary/5' },
    null,
    { label: 'PHASE 2: CoT VERIFICATION', sub: '7-step Chain-of-Thought + Self-Reflection per claim', border: 'border-primary/40', bg: 'bg-primary/5' },
    null,
    { label: 'RETRY ENGINE', sub: 'Exponential backoff · 429 rate-limit recovery', border: 'border-warning/40', bg: 'bg-warning/5' },
    null,
    { label: 'PHASE 3: AI TEXT DETECTION', sub: 'Sentence uniformity · Hedging patterns · Vocabulary diversity', border: 'border-danger/40', bg: 'bg-danger/5' },
    null,
    { label: 'PHASE 4: MEDIA DEEPFAKE SCAN', sub: 'Gemini Vision · GAN artifact detection', border: 'border-danger/40', bg: 'bg-danger/5' },
    null,
    { label: 'AGGREGATE & SCORE', sub: 'Weighted truth score · Pipeline metadata', border: 'border-accent/40', bg: 'bg-accent/5' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="max-w-7xl mx-auto px-8 pb-32 pt-24"
    >
      {/* Header */}
      <div className="mb-20 text-center">
        <div className="inline-flex items-center gap-2 mb-6 text-primary text-[10px] font-black uppercase tracking-[0.3em]">
          <Layers size={14} /> SYSTEM BLUEPRINTS
        </div>
        <h1 className="text-6xl font-black tracking-tighter mb-6">Agentic Pipeline Architecture.</h1>
        <p className="text-xl text-text-muted max-w-3xl mx-auto leading-relaxed">
          VeriCheck Pro utilizes a multi-agent orchestration layer powered by <span className="text-white font-bold italic">Gemini 2.5 architecture</span> for high-confidence OSINT automation.
        </p>
      </div>

      {/* Main Flow Visualizer */}
      <section className="mb-24 p-12 rounded-[40px] border border-glass-border bg-white/[0.012] backdrop-blur-3xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)]">
        <h2 className="text-2xl font-black mb-12 tracking-tight flex items-center gap-3">
          <BrainCircuit className="text-primary" /> Logic Engine Flow
        </h2>
        
        <div className="relative flex flex-col items-center gap-4">
          {flowSteps.map((item, i) =>
            item === null
              ? <div key={i} className="text-primary/40 py-2 animate-bounce"><ChevronRight className="rotate-90" /></div>
              : (
                <div key={i} className={`p-6 rounded-2xl border ${item.border} ${item.bg} text-center w-full max-w-[500px] hover:scale-[1.02] transition-transform duration-500`}>
                  <div className="text-[10px] font-black uppercase tracking-widest mb-1">{item.label}</div>
                  <div className="text-xs text-text-muted font-medium">{item.sub}</div>
                </div>
              )
          )}
        </div>
      </section>

      {/* Deep Dive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* 1. Pipeline Robustness */}
        <div className="p-10 rounded-[32px] border border-accent/10 bg-accent/[0.01] hover:bg-accent/[0.03] transition-colors group">
          <h3 className="text-2xl font-black mb-8 flex items-center gap-3 group-hover:text-accent transition-colors">
            <RefreshCw size={24} className="text-accent" /> Fault Tolerance
          </h3>
          <div className="space-y-8">
            <div className="space-y-3">
              <h4 className="text-sm font-black uppercase tracking-widest text-white/80">Exponential Backoff</h4>
              <p className="text-sm text-text-muted leading-relaxed">Every API call utilizes <code className="bg-white/5 px-2 py-0.5 rounded text-accent">retryWithBackoff</code>. Rate limits trigger jittered retries to ensure high pipeline availability.</p>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-black uppercase tracking-widest text-white/80">Graceful Degradation</h4>
              <p className="text-sm text-text-muted leading-relaxed">Failed individual claims are isolated. The system marks them as "Unverifiable" and continues the broader audit rather than aborting the session.</p>
            </div>
          </div>
        </div>

        {/* 2. Handling Ambiguity */}
        <div className="p-10 rounded-[32px] border border-warning/10 bg-warning/[0.01] hover:bg-warning/[0.03] transition-colors group">
          <h3 className="text-2xl font-black mb-8 flex items-center gap-3 group-hover:text-warning transition-colors">
            <AlertTriangle size={24} className="text-warning" /> Logical Guardrails
          </h3>
          <div className="space-y-8">
            <div className="space-y-3">
              <h4 className="text-sm font-black uppercase tracking-widest text-white/80">Temporal Sensitivity</h4>
              <p className="text-sm text-text-muted leading-relaxed">Claims are scanned for date dependencies. Prompt engineering forces models to distinguish between historical facts and current active records.</p>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-black uppercase tracking-widest text-white/80">Credibility Hierarchy</h4>
              <p className="text-sm text-text-muted leading-relaxed">Conflicts are resolved using a weighted source system: Academic &amp; Govt {'>'} News {'>'} Blogs {'>'} Social Media.</p>
            </div>
          </div>
        </div>

        {/* 3. Prompt Engineering */}
        <div className="p-10 rounded-[32px] border border-primary/10 bg-primary/[0.01] hover:bg-primary/[0.03] transition-colors md:col-span-2 group">
          <h3 className="text-2xl font-black mb-8 flex items-center gap-3 group-hover:text-primary transition-colors">
            <Layers size={24} className="text-primary" /> Multi-Agent Reasoning
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-3">
              <h4 className="text-sm font-black uppercase tracking-widest text-white/80">7-Step Chain-of-Thought</h4>
              <p className="text-sm text-text-muted leading-relaxed">Each claim is meticulously processed through 7 distinct reasoning phases including semantic decomposition and logical consistency checks.</p>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-black uppercase tracking-widest text-white/80">System Personas</h4>
              <p className="text-sm text-text-muted leading-relaxed">Role-based prompting primes specialists for extraction, search synthesis, and forensic analysis, reducing hallucination by pinning objective domains.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tech Stack Overlay */}
      <div className="mt-24 pt-12 border-t border-glass-border">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted mb-8 text-center opacity-40">Integrated Technologies</h3>
        <div className="flex flex-wrap justify-center gap-3">
          {['React 18', 'Tailwind 4', 'Gemini 2.5 Pro', 'Gemini Vision', 'Framer Motion', 'Node.js', 'PostgreSQL', 'Tavily Research', 'html2pdf.js'].map(t => (
            <span key={t} className="px-5 py-2 rounded-full bg-white/[0.03] border border-white/5 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-white hover:border-primary/40 transition-all cursor-default">{t}</span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default Architecture;
