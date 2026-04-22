import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, Target, AlertTriangle, Briefcase, Zap, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GOLD = 'var(--gold)';
const LINE = 'var(--line)';
const TEXT = 'var(--text-main)';
const MUTED = 'var(--text-muted)';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Defense() {
  const [data, setData] = useState(null);
  const [brand, setBrand] = useState('Acme Corp');
  const [queryBrand, setQueryBrand] = useState('Acme Corp');

  useEffect(() => {
    fetchData();
  }, [queryBrand]);

  const fetchData = () => {
    setData(null);
    axios.get(`${API_BASE}/defense?brand=${encodeURIComponent(queryBrand)}`)
      .then(res => setData(res.data));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setQueryBrand(brand);
  };

  return (
    <div className="bg-bg-main text-text-main min-h-screen px-4 py-24 md:px-10 font-sans">
      <div className="max-w-[1200px] mx-auto">
        
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <Shield size={20} className="text-gold" />
              <span className="font-mono text-[13px] font-bold text-gold tracking-[0.15em] uppercase">
                Enterprise Protection Tier
              </span>
            </div>
            <h1 className="font-serif text-[32px] md:text-[42px] text-text-main mb-2 leading-[1.1]">
              Brand Defense System
            </h1>
            <p className="text-base text-text-muted max-w-[600px]">
              Active scanning for executive impersonation, deepfaked brand messaging, and coordinated corporate smear campaigns.
            </p>
          </div>
          
          <form onSubmit={handleSearch} className="flex gap-3 w-full md:w-auto">
            <input 
              type="text" 
              value={brand} 
              onChange={e => setBrand(e.target.value)}
              placeholder="Track Entity (e.g. OpenAI)..."
              className="px-5 py-3.5 bg-[rgba(var(--overlay-rgb),0.02)] border border-line rounded-lg text-text-main text-[15px] outline-none w-full md:w-[280px]"
            />
            <button type="submit" className="px-6 py-3 bg-gold rounded-lg text-bg-main font-semibold transition-all hover:brightness-110 active:scale-95 whitespace-nowrap">
              Scan Network
            </button>
          </form>
        </header>

        {!data ? (
          <div className="h-[400px] flex items-center justify-center rounded-3xl border border-dashed border-line">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
              <Zap size={32} className="text-gold" />
            </motion.div>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-8 rounded-3xl bg-[rgba(var(--overlay-rgb),0.02)] border border-line relative overflow-hidden">
                <div className={`absolute top-0 left-0 right-0 h-1 ${data.threatLevel === 'High' ? 'bg-red-400' : 'bg-gold'}`} />
                <h3 className="text-sm text-text-muted uppercase mb-2">Global Threat Level</h3>
                <span className={`text-[42px] font-serif ${data.threatLevel === 'High' ? 'text-red-400' : 'text-text-main'}`}>{data.threatLevel}</span>
              </div>
              <div className="p-8 rounded-3xl bg-[rgba(var(--overlay-rgb),0.02)] border border-line">
                <h3 className="text-sm text-text-muted uppercase mb-2">Active Incidents</h3>
                <span className="text-[42px] font-serif text-text-main">{data.activeIncidents}</span>
              </div>
              <div className="p-8 rounded-3xl bg-[rgba(var(--overlay-rgb),0.02)] border border-line">
                <h3 className="text-sm text-text-muted uppercase mb-2">Network Mentions (24h)</h3>
                <span className="text-[42px] font-serif text-text-main">{data.trackedMentions.toLocaleString()}</span>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-text-main mb-6">Identified Threat Vectors</h2>
              <div className="flex flex-col gap-4">
                {data.alerts.map((alert, i) => (
                  <motion.div key={alert.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    className="p-6 rounded-2xl border border-line bg-[rgba(var(--overlay-rgb),0.01)] flex flex-col md:flex-row items-start md:items-center gap-6"
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${alert.urgency === 'Critical' ? 'bg-red-400/10' : 'bg-gold/10'}`}>
                      {alert.urgency === 'Critical' ? <AlertTriangle size={24} className="text-red-400" /> : <Target size={24} className="text-gold" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1.5">
                        <span className="text-base font-bold text-text-main">{alert.type}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${alert.urgency === 'Critical' ? 'bg-red-400 text-bg-main' : 'bg-gold text-bg-main'}`}>
                          {alert.urgency}
                        </span>
                      </div>
                      <p className="text-[15px] text-text-muted">{alert.desc}</p>
                    </div>
                    <div className="w-full md:w-auto">
                      <button className="w-full md:w-auto px-5 py-2.5 bg-transparent border border-line text-text-main rounded-lg transition-all hover:bg-[rgba(var(--overlay-rgb),0.05)] text-sm">
                        Generate Remediation Response
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
