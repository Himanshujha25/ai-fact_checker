import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, ChevronRight, ShieldCheck, Globe, Layers, UserCheck, ShieldAlert, Cpu, FileSearch, Fingerprint, Lock, Sparkles } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto px-8 pb-32"
    >
      {/* 2-Column Hero Section */}
      <section className="flex items-center gap-16 mb-40 pt-24 flex-wrap">
        <div className="flex-[1.3] text-left min-w-[400px]">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="mb-12 inline-flex items-center gap-3 px-7 py-2.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-sm backdrop-blur-md"
          >
            <div className="bg-primary p-0.5 rounded flex items-center justify-center">
              <Zap size={14} className="text-white fill-white" />
            </div>
            <span className="tracking-wide">Agentic Fact-Checking Engine v2.0</span>
          </motion.div>
          
          <h1 className="text-[clamp(4.5rem,12vw,8rem)] font-extrabold tracking-[-0.07em] leading-[0.88] mb-16 text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 max-w-[1000px]">
            Automate <br /> the Truth.
          </h1>
          
          <p className="text-xl text-text-muted max-w-[600px] mb-14 leading-relaxed">
            The world's first <strong className="text-white font-bold">Agentic OSINT Engine</strong>. VeriCheck uses <strong className="text-white font-bold">Gemini 2.5 architecture</strong> to audit complex claims, resolve identities, and catch deepfakes with forensic-grade certainty.
          </p>

          <div className="flex gap-6 mb-16">
            <button 
              onClick={() => navigate('/verify')} 
              className="btn-elite px-14 py-5 text-base"
            >
              Launch Workspace <ChevronRight size={20} />
            </button>
            <button 
              onClick={() => navigate('/architecture')} 
              className="px-14 py-5 rounded-full bg-white/[0.03] border border-glass-border text-white text-base hover:bg-white/[0.08] transition-all"
            >
              System Architecture
            </button>
          </div>
        </div>

        {/* Hero Visual Column */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex-1 h-[480px] rounded-3xl overflow-hidden relative border border-glass-border shadow-[0_40px_100px_-20px_rgba(139,92,246,0.2)] min-w-[400px]"
        >
          <img 
            src="https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=1200" 
            alt="AI Intelligence" 
            className="w-full h-full object-cover brightness-[0.4]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-bg-deep" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4">
            <Sparkles size={48} className="text-primary animate-pulse" />
            <div className="text-[10px] font-black tracking-[0.2em] text-white/60 uppercase">NEURAL SCANNING ACTIVE</div>
          </div>
        </motion.div>
      </section>

      {/* Intelligence Layers Section */}
      <section className="mb-40">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(350px,1fr))] gap-8 text-left">
          <div className="p-10 rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/[0.02] to-transparent backdrop-blur-sm group hover:border-primary/20 transition-all">
            <div className="text-primary mb-6 group-hover:scale-110 transition-transform"><Fingerprint size={32} /></div>
            <h3 className="text-xl font-bold mb-4">Identity Forensics</h3>
            <p className="text-sm text-text-muted leading-relaxed">
              Maps social graphs and cross-references professional history across global databases to resolve personas and verify credentials.
            </p>
          </div>
          <div className="p-10 rounded-3xl border border-accent/10 bg-gradient-to-br from-accent/[0.02] to-transparent backdrop-blur-sm group hover:border-accent/20 transition-all">
            <div className="text-accent mb-6 group-hover:scale-110 transition-transform"><ShieldAlert size={32} /></div>
            <h3 className="text-xl font-bold mb-4">Multimodal Radar</h3>
            <p className="text-sm text-text-muted leading-relaxed">
              AI artifacts detection identifies synthetic noise and GAN-generated textures in viral media before dissemination.
            </p>
          </div>
          <div className="p-10 rounded-3xl border border-warning/10 bg-gradient-to-br from-warning/[0.02] to-transparent backdrop-blur-sm group hover:border-warning/20 transition-all">
            <div className="text-warning mb-6 group-hover:scale-110 transition-transform"><Globe size={32} /></div>
            <h3 className="text-xl font-bold mb-4">Global Retrieval</h3>
            <p className="text-sm text-text-muted leading-relaxed">
              Fetches primary sources from Tavily and Google World News to back every single verified insight with live academic records.
            </p>
          </div>
        </div>
      </section>

      {/* Deep Intelligence Section */}
      <section className="mb-40 py-24 border-y border-glass-border text-left">
        <h2 className="text-4xl font-black mb-6">Agentic Reasoning, <span className="text-primary">Not Just Search.</span></h2>
        <p className="text-lg text-text-muted leading-relaxed mb-16 max-w-[800px]">
          Traditional search engines give you links. VeriCheck gives you certainty. Our multi-agent pipeline reflects on conflicting evidence until it arrives at a high-confidence verdict.
        </p>
        
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-12">
          <div className="group">
            <div className="flex items-center gap-3 mb-5 group-hover:translate-x-1 transition-transform">
              <Cpu size={20} className="text-primary" />
              <h4 className="font-extrabold uppercase text-xs tracking-widest text-white/90">Semantic Extraction</h4>
            </div>
            <p className="text-[13px] text-text-muted leading-relaxed">Identifying the atomic claims buried in long-form reports or URL content for individual verification.</p>
          </div>
          <div className="group">
            <div className="flex items-center gap-3 mb-5 group-hover:translate-x-1 transition-transform">
              <FileSearch size={20} className="text-primary" />
              <h4 className="font-extrabold uppercase text-xs tracking-widest text-white/90">Source Synthesis</h4>
            </div>
            <p className="text-[13px] text-text-muted leading-relaxed">Cross-referencing multiple news outlets, social platforms, and official records to identify conflicts.</p>
          </div>
          <div className="group">
            <div className="flex items-center gap-3 mb-5 group-hover:translate-x-1 transition-transform">
              <ShieldCheck size={20} className="text-primary" />
              <h4 className="font-extrabold uppercase text-xs tracking-widest text-white/90">Probabilistic Verity</h4>
            </div>
            <p className="text-[13px] text-text-muted leading-relaxed">Assigning accuracy scores based on source authority, temporal relevance, and corroboration depth.</p>
          </div>
          <div className="group">
            <div className="flex items-center gap-3 mb-5 group-hover:translate-x-1 transition-transform">
              <Lock size={20} className="text-primary" />
              <h4 className="font-extrabold uppercase text-xs tracking-widest text-white/90">Secure Persistence</h4>
            </div>
            <p className="text-[13px] text-text-muted leading-relaxed">Every research session is private and persisted in your personal history for professional use.</p>
          </div>
        </div>
      </section>

      {/* Atmospheric Final CTA */}
      <section className="relative px-16 py-32 rounded-[40px] overflow-hidden bg-primary/[0.02] border border-primary/10 text-left mt-16">
        {/* Background Atmosphere Elements */}
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--color-primary) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="relative z-10">
          <div className="flex items-center gap-2 text-primary mb-6 font-black text-xs tracking-[0.3em] uppercase">
            <Sparkles size={16} /> ELITE INTELLIGENCE
          </div>
          
          <h2 className="text-[clamp(2.5rem,6vw,4.5rem)] font-black mb-10 tracking-[-0.03em] max-w-[900px] leading-[1.1] text-white">
            Secure the Intelligence <span className="text-primary">Edge.</span>
          </h2>

          <div className="flex gap-8 flex-wrap items-center">
            <button 
              onClick={() => navigate('/verify')} 
              className="btn-elite px-20 py-5 text-lg shadow-[0_0_60px_rgba(139,92,246,0.4)]"
            >
              Launch Pro Workspace
            </button>
            
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <ShieldCheck size={20} className="text-accent" /> AES-256 Encrypted
              </div>
              <p className="text-text-muted text-sm font-medium">
                Enterprise Trial · No Credit Card Required
              </p>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
};

export default Home;
