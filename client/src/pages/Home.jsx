import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, ChevronRight, BrainCircuit, ShieldCheck, Search, Database, Globe, Layers } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5 }}
      style={{ maxWidth: '1000px', margin: '0 auto' }}
    >
      {/* Hero Section */}
      <section style={{ marginBottom: '6rem', paddingTop: '2rem' }}>
        <div className="badge" style={{ marginBottom: '2rem' }}>
          <Zap size={14} fill="#6366f1" /> <span>Agentic Fact-Checking Engine v2.0</span>
        </div>
        
        <h1 style={{ 
          fontSize: 'clamp(3rem, 7vw, 5.5rem)', 
          fontWeight: 900, 
          letterSpacing: '-0.04em', 
          lineHeight: 0.9,
          marginBottom: '2rem',
          background: 'linear-gradient(to bottom, #fff 40%, rgba(255,255,255,0.4))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Automate the <br /> 
          <span style={{ color: '#6366f1' }}>Truth.</span>
        </h1>
        
        <p style={{ fontSize: '1.25rem', color: '#94a3b8', maxWidth: '600px', lineHeight: 1.6, marginBottom: '3rem' }}>
          VeriCheck is the world's first sovereign fact-checking engine that leverages <strong>Gemini 2.5 Pro Agentic Reasoning</strong> to audit complex data, URLs, and media in seconds.
        </p>

        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '4rem' }}>
          <button onClick={() => navigate('/verify')} className="btn-primary" style={{ width: 'auto', padding: '1rem 2.5rem' }}>
            Open Workspace <ChevronRight size={18} />
          </button>
          <button onClick={() => navigate('/architecture')} className="btn-secondary" style={{ padding: '1rem 2.5rem' }}>
            How it works
          </button>
        </div>

        {/* System Overview Card */}
        <div className="glass-card" style={{ 
          padding: '2.5rem', 
          border: '1px solid rgba(99,102,241,0.2)',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.03), transparent)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '2.5rem'
        }}>
          <div>
            <div style={{ color: '#6366f1', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em', marginBottom: '1.25rem' }}>ENGINE CORE</div>
            <div style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.6 }}>
              Multi-Agent pipeline that decomposes context, retrieves evidence from global indices, and reflects on contradictions.
            </div>
          </div>
          <div>
            <div style={{ color: '#6366f1', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em', marginBottom: '1.25rem' }}>MEDIA RADAR</div>
            <div style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.6 }}>
              In-built deepfake detection engine that scans uploaded photos and videos for synthetic artifacts and AI generation.
            </div>
          </div>
          <div>
            <div style={{ color: '#10b981', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em', marginBottom: '1.25rem' }}>PERSISTENCE</div>
            <div style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.6 }}>
              Automated PostgreSQL persistence for every report, creating a permanent audit trail for enterprise compliance.
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section style={{ marginBottom: '4rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2.5rem', textAlign: 'center' }}>Enterprise Capabilities</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {[
            { icon: <Globe size={24} color="#6366f1" />, title: 'Real-time Web Retrieval', desc: 'Queries massive web indices to find verified evidence from primary sources like Wikipedia, News, and Official Databases.' },
            { icon: <Layers size={24} color="#10b981" />, title: 'Contextual Extraction', desc: 'Automatically segments long-form text into atomic, verifiable facts without losing original context.' },
            { icon: <Database size={24} color="#f59e0b" />, title: 'Analytical Storage', desc: 'Securely stores every verification with a full audit log including thinking chains and search history.' },
          ].map((feature, i) => (
            <div key={i} className="glass-card" style={{ padding: '2rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>{feature.icon}</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>{feature.title}</h3>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.6 }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
};

export default Home;
