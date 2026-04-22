import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Code, Terminal, Key, Copy, CheckCircle2, Zap } from 'lucide-react';

const GOLD = 'var(--gold)';
const LINE = 'var(--line)';
const TEXT = 'var(--text-main)';
const MUTED = 'var(--text-muted)';
const DIM = 'var(--text-dim)';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Developers() {
  const [copied, setCopied] = useState(false);
  const [apiKey, setApiKey] = useState('tc_live_...');
  const [usageCount, setUsageCount] = useState(0);
  const [usageLimit, setUsageLimit] = useState(1000);

  const generateKey = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/developers/key`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      const data = await res.json();
      if (data.apiKey) {
        setApiKey(data.apiKey);
        setUsageCount(data.requests_count || 0);
        setUsageLimit(data.requests_limit || 1000);
      } else {
        setApiKey(`tc_live_${Math.random().toString(36).substring(2, 15)}`);
      }
    } catch (err) {
      setApiKey(`tc_live_${Math.random().toString(36).substring(2, 15)}`);
    }
  };

  useEffect(() => {
    generateKey();
  }, []);

  const codeSnippet = `curl -X POST https://api.truecast.ai/v1/adjudicate \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "claim": "Central Bank announces 5% rate hike secretly.",
    "mode": "adversarial"
  }'`;

  const copyCode = () => {
    navigator.clipboard.writeText(codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ background: 'var(--bg-main)', color: TEXT, minHeight: '100vh', padding: '80px 40px', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        
        <header style={{ marginBottom: 56, textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
            <Code size={20} color={GOLD} />
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              Truecast Developer Platform
            </span>
          </div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(32px, 4vw, 48px)', color: TEXT, marginBottom: 16 }}>
            Automate the Truth.
          </h1>
          <p style={{ fontSize: 16, color: MUTED, maxWidth: 640, margin: '0 auto', lineHeight: 1.6 }}>
            Integrate the rigorous Digital Jurist Protocol directly into your newsroom CMS, moderation bot, or app via our high-speed JSON APIs.
          </p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 32, alignItems: 'start' }}>
          
          {/* Main API Info */}
          <div>
            <div style={{ background: 'rgba(var(--overlay-rgb), 0.02)', border: `1px solid ${LINE}`, borderRadius: 20, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${LINE}`, background: 'rgba(var(--overlay-rgb), 0.01)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Terminal size={14} color={DIM} />
                  <span style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: DIM }}>POST /v1/adjudicate</span>
                </div>
                <button onClick={copyCode} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: copied ? '#4ade80' : MUTED }}>
                  {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                  <span style={{ fontSize: 11, fontWeight: 600 }}>{copied ? 'COPIED' : 'COPY'}</span>
                </button>
              </div>
              <div style={{ padding: 24, overflowX: 'auto' }}>
                <pre style={{ margin: 0, fontFamily: "'DM Mono', monospace", fontSize: 13, color: '#C9A84C', lineHeight: 1.6 }}>
                  {codeSnippet}
                </pre>
              </div>
            </div>

            <div style={{ marginTop: 40 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>API Capabilities</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { title: "Standard Verification", desc: "Instantly score textual claims against 12k+ OSINT sources." },
                  { title: "Media Forensics", desc: "Submit image/video URLs for frame-by-frame deepfake detection." },
                  { title: "Narrative Framing", desc: "Extract underlying biases and framing metrics from submitted articles." }
                ].map((cap, i) => (
                  <div key={i} style={{ display: 'flex', gap: 16, padding: '20px', border: `1px solid ${LINE}`, borderRadius: 16 }}>
                    <Zap size={20} color={GOLD} style={{ flexShrink: 0 }} />
                    <div>
                      <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{cap.title}</h4>
                      <p style={{ fontSize: 14, color: MUTED }}>{cap.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ background: 'rgba(var(--overlay-rgb), 0.02)', border: `1px solid ${LINE}`, borderRadius: 20, padding: 24, textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(201,168,76,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Key size={24} color={GOLD} />
              </div>
              <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>API Keys</h4>
              <p style={{ fontSize: 13, color: DIM, marginBottom: 20 }}>Generate production keys for your secure integration.</p>
              <button 
                onClick={generateKey}
                style={{ width: '100%', padding: '12px', background: GOLD, color: 'var(--bg-main)', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
              >
                Generate New Key
              </button>
            </div>

            <div style={{ padding: 24, borderRadius: 20, border: `1px dashed ${LINE}` }}>
              <h4 style={{ fontSize: 12, color: DIM, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Usage Limits</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: MUTED }}>Free Tier (Requests)</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{usageCount} / {usageLimit}</span>
              </div>
              <div style={{ height: 4, background: 'rgba(var(--overlay-rgb), 0.05)', borderRadius: 2 }}>
                <div style={{ height: '100%', width: `${Math.min(100, Math.max(0, (usageCount/usageLimit)*100))}%`, background: GOLD, borderRadius: 2 }} />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
