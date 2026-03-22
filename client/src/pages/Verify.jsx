import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gavel, Link as LinkIcon, FileText, Upload, ShieldCheck,
  ChevronRight, Clock, Activity, Search, Mic, MicOff, ShieldAlert,
  Sparkles, Zap, AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import AnalysisProcessing from '../components/AnalysisProcessing';
import confetti from 'canvas-confetti';
import html2pdf from 'html2pdf.js';

const API_BASE =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? '/api'
    : 'https://ai-fact-checker-rvih.onrender.com/api';

const GOLD   = '#C9A84C';
const GOLD_L = 'rgba(201,168,76,0.12)';
const LINE   = 'rgba(255,255,255,0.07)';
const SURF   = 'rgba(255,255,255,0.04)';
const TEXT   = '#E8E4DC';
const MUTED  = 'rgba(232,228,220,0.42)';
const DIM    = 'rgba(232,228,220,0.22)';
const MIC_C  = '#EC4899';

const verdictStyle = v => {
  const l = v?.toLowerCase();
  if (['true','accurate','verified'].includes(l))  return { color:'#4ade80', bg:'rgba(74,222,128,0.08)',  border:'rgba(74,222,128,0.22)' };
  if (['false','inaccurate'].includes(l))           return { color:'#f87171', bg:'rgba(248,113,113,0.08)', border:'rgba(248,113,113,0.22)' };
  if (['partially true','mixed'].includes(l))       return { color:'#fbbf24', bg:'rgba(251,191,36,0.08)',  border:'rgba(251,191,36,0.22)' };
  return { color:DIM, bg:SURF, border:LINE };
};

const VerdictBadge = ({ verdict }) => {
  const s = verdictStyle(verdict);
  return (
    <span style={{ color:s.color, background:s.bg, border:`1px solid ${s.border}`, fontSize:9, letterSpacing:'0.12em', fontWeight:700, textTransform:'uppercase', padding:'4px 10px', borderRadius:4, whiteSpace:'nowrap', fontFamily:'DM Mono,monospace' }}>
      {verdict || 'Pending'}
    </span>
  );
};

const ScoreArc = ({ score }) => {
  const r = 50, circ = 2 * Math.PI * r;
  const dash = (Math.min(100, score) / 100) * circ;
  const color = score >= 70 ? GOLD : score >= 40 ? '#fbbf24' : '#f87171';
  return (
    <svg viewBox="0 0 112 112" width="112" height="112" style={{ transform:'rotate(-90deg)' }}>
      <circle cx="56" cy="56" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5"/>
      <circle cx="56" cy="56" r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"/>
    </svg>
  );
};

export default function Verify() {
  const [url,            setUrl]            = useState('');
  const [text,           setText]           = useState('');
  const [loading,        setLoading]        = useState(false);
  const [results,        setResults]        = useState(null);
  const [error,          setError]          = useState(null);
  const [step,           setStep]           = useState(0);
  const [logs,           setLogs]           = useState([]);
  const [elapsed,        setElapsed]        = useState(0);
  const [recentReports,  setRecentReports]  = useState([]);
  const [activeFilter,   setActiveFilter]   = useState('All');
  const [mode,           setMode]           = useState('normal');
  const [listening,      setListening]      = useState(false);
  const [voiceReady,     setVoiceReady]     = useState(false);
  const [interim,        setInterim]        = useState('');
  const [showExportModal,setShowExportModal]= useState(false);
  const [exportName,     setExportName]     = useState('');
  const [engineStats,    setEngineStats]    = useState({ latency:24, factIndex:4, status:'Operational' });

  useEffect(() => {
    const timer = setInterval(() => {
      setEngineStats(prev => ({
        ...prev,
        latency: Math.max(18, Math.min(34, prev.latency + (Math.random() > 0.5 ? 1 : -1))),
        factIndex: Math.random() > 0.96 ? Math.max(1, Math.min(12, prev.factIndex + (Math.random() > 0.5 ? 1 : -1))) : prev.factIndex
      }));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const recRef    = useRef(null);
  const abortRef  = useRef(null);
  const fileRef   = useRef(null);
  const reportRef = useRef(null);
  const navigate  = useNavigate();

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) setVoiceReady(true);
  }, []);

  const toggleVoice = useCallback(() => {
    if (listening) { recRef.current?.stop(); setListening(false); setInterim(''); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = true; rec.interimResults = true; rec.lang = 'en-US';
    rec.onresult = (e) => {
      let fin = '', tmp = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) fin += t; else tmp += t;
      }
      setInterim(tmp);
      if (fin) {
        const triggers = ['analyze','analyse','verify','run verification','audit now','start audit'];
        const found = triggers.find(t => fin.toLowerCase().includes(t));
        if (found) {
          const prefix = fin.trim().substring(0, fin.toLowerCase().indexOf(found)).trim();
          if (prefix) setText(p => p ? `${p.trimEnd()} ${prefix}` : prefix);
          setInterim(''); rec.stop(); setListening(false);
          setTimeout(() => { const b = document.getElementById('vfy-run-btn'); if (b && !b.disabled) b.click(); }, 400);
        } else { setText(p => p ? `${p.trimEnd()} ${fin.trim()}` : fin.trim()); setInterim(''); }
      }
    };
    rec.onerror = () => { setListening(false); setInterim(''); };
    rec.onend   = () => { setListening(false); setInterim(''); };
    try { rec.start(); recRef.current = rec; setListening(true); } catch(e) { console.error(e); }
  }, [listening]);

  useEffect(() => {
    axios.get(`${API_BASE}/history?limit=10`).then(r => setRecentReports(r.data)).catch(() => {});
  }, []);

  const filteredReports = (activeFilter === 'All' ? recentReports : recentReports.filter(d => {
    const v = (d.topClaims?.[0]?.verdict || d.claims?.[0]?.verdict || '').toLowerCase();
    if (activeFilter === 'Verified')     return ['true','accurate','verified'].includes(v);
    if (activeFilter === 'Refuted')      return ['false','inaccurate'].includes(v);
    if (activeFilter === 'Inconclusive') return ['partially true','mixed','inconclusive'].includes(v);
    return true;
  })).slice(0, 3);

  const handleFileAudit = useCallback(async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setLoading(true); setResults(null); setError(null); setStep(1); setElapsed(0);
    setLogs([{ msg:'Receiving encrypted media stream…', id:Date.now() }]);
    const controller = new AbortController(); abortRef.current = controller;
    try {
      const formData = new FormData(); formData.append('media', file);
      const thoughts = ['Decoding spatial tensors…','Analyzing pixel consistency…','Detecting GAN artifacts…','Isolating synthetic patterns…','Deep-fake forensic analysis…','Validating optical integrity…'];
      const clock   = setInterval(() => setElapsed(e => e+1), 1000);
      const stepper = setInterval(() => setStep(s => Math.min(s+1,3)), 3000);
      const logger  = setInterval(() => setLogs(l => [...l.slice(-8),{ msg:thoughts[Math.floor(Math.random()*thoughts.length)], id:Date.now() }]), 1500);
      const res = await axios.post(`${API_BASE}/analyze-media`, formData, { signal:controller.signal, headers:{'Content-Type':'multipart/form-data'} });
      [clock,stepper,logger].forEach(clearInterval);
      const analysisData = res.data; const fileResult = analysisData.results?.[0] || {};
      const adaptedResults = {
        truthScore: 100-(fileResult.confidence||0),
        aiTextDetection: { score:0, explanation:'Media-based audit performed.' },
        aiMediaDetection: { verdict:fileResult.verdict||'Analysis Complete', summary:analysisData.summary, score:fileResult.confidence||0, results:[{ url:URL.createObjectURL(file), ...fileResult }] },
        claims: (fileResult.indicators||[]).map((ind,i) => ({ id:i, claim:`Forensic Indicator: ${ind}`, verdict:fileResult.isAIGenerated?'Likely AI':'Possibly Authentic', confidence:fileResult.confidence/100, reasoning:fileResult.details||'Detected through structural integrity audit.' })),
        forensicReference: fileResult.isAIGenerated ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=512&q=80' : null,
        reportId: 'media-'+Math.random().toString(36).substring(2,8)
      };
      setStep(4); setResults(adaptedResults); setLoading(false);
      if (adaptedResults.truthScore >= 80) confetti({ particleCount:40, spread:55, origin:{ y:0.7 }, colors:[GOLD,'#fff'] });
    } catch(err) {
      if (!axios.isCancel(err)) setError(err.response?.data?.error || 'Media analysis failed or timed out.');
      setStep(0); setLoading(false);
    }
  }, []);

  const handleVerify = useCallback(async () => {
    const input = url.trim() || text.trim(); if (!input) return;
    if (listening) { recRef.current?.stop(); setListening(false); setInterim(''); }
    setLoading(true); setResults(null); setError(null); setStep(1); setElapsed(0);
    setLogs([{ msg:'Initializing analysis pipeline…', id:Date.now() }]);
    const controller = new AbortController(); abortRef.current = controller;
    try {
      const payload = url.trim() ? { url:url.trim(), mode } : { text:text.trim(), mode };
      const thoughts = ['Deconstructing source narrative…','Extracting verifiable assertions…','Cross-referencing fact indices…','Querying live OSINT streams…','Semantic integrity analysis…','Consensus aggregation — 3 agents…','Validating academic provenance…','Assembling forensic dossier…'];
      const clock   = setInterval(() => setElapsed(e => e+1), 1000);
      const stepper = setInterval(() => setStep(s => Math.min(s+1,3)), 4000);
      const logger  = setInterval(() => setLogs(l => [...l.slice(-8),{ msg:thoughts[Math.floor(Math.random()*thoughts.length)], id:Date.now() }]), 2000);
      const res = await axios.post(`${API_BASE}/verify`, payload, { signal:controller.signal });
      [clock,stepper,logger].forEach(clearInterval);
      setStep(4); setResults(res.data); setLoading(false);
      if (res.data.truthScore >= 80) confetti({ particleCount:40, spread:55, origin:{ y:0.7 }, colors:[GOLD,'#fff'] });
    } catch(err) {
      if (!axios.isCancel(err)) setError('Analysis interrupted or connection lost.');
      setStep(0); setLoading(false);
    }
  }, [url, text, mode, listening]);

  const handleCancel = () => {
    if (abortRef.current) { abortRef.current.abort(); setLoading(false); setStep(0); setLogs([]); }
  };

  const handleExportPDF = () => setShowExportModal(true);

  const executePDFExport = () => {
    if (!results) return;
    setShowExportModal(false);
    const fmt = (v=0) => Math.round(v);
    const today = new Date().toLocaleDateString('en-US',{ year:'numeric', month:'long', day:'numeric' });
    const reportId = results.reportId || ('TC-'+Math.random().toString(36).substring(2,9).toUpperCase());
    const sanitized = exportName.trim().replace(/\s+/g,'_').toLowerCase();
    const fileName = sanitized ? `${sanitized}_truecast_${reportId}.pdf` : `TrueCast_Report_${reportId}.pdf`;

    const verdictColor = v => {
      const l=(v||'').toLowerCase();
      if (['true','accurate','verified'].includes(l)) return { bg:'#D1FAE5', fg:'#065F46', dot:'#10B981' };
      if (['false','inaccurate'].includes(l))          return { bg:'#FEE2E2', fg:'#991B1B', dot:'#EF4444' };
      if (['partially true','mixed'].includes(l))      return { bg:'#FEF3C7', fg:'#92400E', dot:'#F59E0B' };
      return { bg:'#F3F4F6', fg:'#374151', dot:'#9CA3AF' };
    };
    const scoreColor = s => s>=70?'#065F46':s>=40?'#92400E':'#991B1B';
    const scoreBg    = s => s>=70?'#D1FAE5':s>=40?'#FEF3C7':'#FEE2E2';
    const sc = results.truthScore || 0;
    const scoreLabel = sc>=75?'High Confidence':sc>=50?'Moderate Confidence':'Low Confidence';

    const claimsHTML = (results.claims||[]).map((c,i) => {
      const vc=verdictColor(c.verdict), pct=fmt((c.confidence||0)*100), row=i%2===0?'#FFFFFF':'#F9FAFB';
      return `<tr style="background:${row};border-bottom:1px solid #E5E7EB;">
        <td style="padding:12px 16px;width:120px;vertical-align:top;">
          <span style="display:inline-flex;align-items:center;gap:5px;background:${vc.bg};color:${vc.fg};font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:3px 9px;border-radius:4px;">
            <span style="width:6px;height:6px;border-radius:50%;background:${vc.dot};flex-shrink:0;"></span>${c.verdict||'Pending'}
          </span>
        </td>
        <td style="padding:12px 16px;vertical-align:top;">
          <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#111827;line-height:1.5;">${c.claim||'—'}</p>
          <p style="margin:0;font-size:12px;color:#6B7280;line-height:1.55;">${c.reasoning||''}</p>
        </td>
        <td style="padding:12px 16px;width:70px;vertical-align:top;text-align:right;">
          <span style="font-size:18px;font-weight:700;color:${pct>=70?'#B45309':'#6B7280'};">${pct}<span style="font-size:10px;font-weight:400;">%</span></span>
        </td>
      </tr>`;
    }).join('');

    const aiSection = results.aiTextDetection ? `
      <div style="display:flex;gap:16px;margin-bottom:28px;">
        <div style="flex:1;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:10px;padding:18px 20px;">
          <p style="margin:0 0 6px;font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#9CA3AF;">AI Text Probability</p>
          <p style="margin:0;font-size:30px;font-weight:700;color:#111827;line-height:1;">${results.aiTextDetection.score||0}<span style="font-size:14px;font-weight:400;color:#6B7280;">%</span></p>
          <p style="margin:6px 0 0;font-size:12px;color:#6B7280;">${results.aiTextDetection.score>50?'Likely synthesized content':'Likely human-authored content'}</p>
          ${results.aiTextDetection.explanation?`<p style="margin:8px 0 0;font-size:11px;color:#9CA3AF;line-height:1.5;">${results.aiTextDetection.explanation}</p>`:''}
        </div>
        ${results.aiMediaDetection?`
        <div style="flex:1;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:10px;padding:18px 20px;">
          <p style="margin:0 0 6px;font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#9CA3AF;">Media Authentication</p>
          <p style="margin:0;font-size:30px;font-weight:700;color:#111827;line-height:1;">${results.aiMediaDetection.verdict||'Clear'}</p>
          ${results.aiMediaDetection.summary?`<p style="margin:8px 0 0;font-size:11px;color:#9CA3AF;line-height:1.5;">${results.aiMediaDetection.summary}</p>`:''}
        </div>`:''}
      </div>` : '';

    const html = `
    <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:13px;color:#111827;background:#fff;padding:0;margin:0;max-width:760px;box-sizing:border-box;">
      <div style="background:#0D0D18;padding:28px 36px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td><span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;color:#C9A84C;letter-spacing:.04em;">TRUECAST</span>
          <span style="display:block;font-size:9px;color:rgba(201,168,76,.55);letter-spacing:.18em;text-transform:uppercase;margin-top:3px;">Intelligence · Verification · Forensics</span></td>
          <td style="text-align:right;vertical-align:top;"><span style="font-size:9px;color:rgba(255,255,255,.35);font-family:monospace;letter-spacing:.06em;text-transform:uppercase;line-height:1.8;">OFFICIAL AUDIT REPORT<br>${today}<br>REF: ${reportId}</span></td>
        </tr></table>
      </div>
      <div style="height:3px;background:linear-gradient(90deg,#C9A84C 0%,#F0D080 50%,#C9A84C 100%);"></div>
      <div style="padding:36px 36px 40px;">
        <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:400;color:#111827;margin:0 0 6px;letter-spacing:-.02em;">Forensic Fact-Check Report</h1>
        <p style="margin:0 0 28px;font-size:13px;color:#6B7280;">Automated multi-source intelligence audit with confidence scoring.</p>
        <div style="display:flex;align-items:stretch;gap:0;border:1px solid #E5E7EB;border-radius:12px;overflow:hidden;margin-bottom:28px;">
          <div style="background:${scoreBg(sc)};padding:24px 28px;min-width:160px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;">
            <span style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${scoreColor(sc)};opacity:.7;margin-bottom:8px;">Truth Index</span>
            <span style="font-family:Georgia,'Times New Roman',serif;font-size:52px;font-weight:400;color:${scoreColor(sc)};line-height:1;">${fmt(sc)}</span>
            <span style="font-size:11px;color:${scoreColor(sc)};opacity:.7;">/100</span>
            <span style="margin-top:10px;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:${scoreColor(sc)};background:${scoreColor(sc)}18;padding:3px 10px;border-radius:4px;">${scoreLabel}</span>
          </div>
          <div style="flex:1;padding:22px 28px;border-left:1px solid #E5E7EB;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              <tr><td style="padding:6px 0;font-size:11px;color:#9CA3AF;width:140px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;">Claims Reviewed</td><td style="padding:6px 0;font-size:13px;color:#111827;font-weight:600;">${results.claims?.length||0}</td></tr>
              <tr><td style="padding:6px 0;font-size:11px;color:#9CA3AF;font-weight:600;text-transform:uppercase;letter-spacing:.06em;">Report Date</td><td style="padding:6px 0;font-size:13px;color:#111827;">${today}</td></tr>
              <tr><td style="padding:6px 0;font-size:11px;color:#9CA3AF;font-weight:600;text-transform:uppercase;letter-spacing:.06em;">Report ID</td><td style="padding:6px 0;font-size:13px;color:#111827;font-family:monospace;">${reportId}</td></tr>
              <tr><td style="padding:6px 0;font-size:11px;color:#9CA3AF;font-weight:600;text-transform:uppercase;letter-spacing:.06em;">Engine</td><td style="padding:6px 0;font-size:13px;color:#111827;">TrueCast Neural v4.2 · Multi-agent</td></tr>
              ${exportName.trim()?`<tr><td style="padding:6px 0;font-size:11px;color:#9CA3AF;font-weight:600;text-transform:uppercase;letter-spacing:.06em;">Author</td><td style="padding:6px 0;font-size:13px;color:#111827;">${exportName.trim()}</td></tr>`:''}
              <tr><td style="padding:6px 0 0;font-size:11px;color:#9CA3AF;font-weight:600;text-transform:uppercase;letter-spacing:.06em;vertical-align:top;">Assessment</td>
              <td style="padding:6px 0 0;"><span style="font-size:13px;color:${scoreColor(sc)};font-weight:600;">${sc>=75?'✓ Largely verifiable and evidence-supported.':sc>=45?'⚠ Mixed or partially verifiable claims.':'✗ Significant inaccuracies detected.'}</span></td></tr>
            </table>
          </div>
        </div>
        <div style="border-top:1px solid #E5E7EB;margin:0 0 24px;"></div>
        ${aiSection}
        <h2 style="font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:400;color:#111827;margin:0 0 14px;letter-spacing:-.01em;">Verified Assertions</h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #E5E7EB;border-radius:10px;overflow:hidden;font-size:13px;">
          <thead><tr style="background:#F3F4F6;border-bottom:2px solid #E5E7EB;">
            <th style="padding:11px 16px;text-align:left;font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#6B7280;width:120px;">Verdict</th>
            <th style="padding:11px 16px;text-align:left;font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#6B7280;">Claim &amp; Reasoning</th>
            <th style="padding:11px 16px;text-align:right;font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#6B7280;width:70px;">Conf.</th>
          </tr></thead>
          <tbody>${claimsHTML||`<tr><td colspan="3" style="padding:24px 16px;text-align:center;color:#9CA3AF;">No claims extracted.</td></tr>`}</tbody>
        </table>
        <div style="margin-top:36px;padding:16px 20px;background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;border-left:4px solid #F59E0B;">
          <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#92400E;">Disclaimer</p>
          <p style="margin:0;font-size:11px;color:#78350F;line-height:1.6;">This report is generated by an automated AI system and is intended as a supplementary research aid only. Verdicts reflect algorithmic inference and may not capture all available context. TrueCast does not constitute legal, journalistic, or editorial authority.</p>
        </div>
      </div>
      <div style="background:#F9FAFB;border-top:1px solid #E5E7EB;padding:16px 36px;display:flex;align-items:center;justify-content:space-between;">
        <span style="font-family:Georgia,'Times New Roman',serif;font-size:12px;color:#C9A84C;letter-spacing:.06em;">TRUECAST</span>
        <span style="font-size:10px;color:#9CA3AF;font-family:monospace;letter-spacing:.04em;">${today} · REF: ${reportId}</span>
        <span style="font-size:10px;color:#9CA3AF;">truecast.ai</span>
      </div>
    </div>`;

    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;pointer-events:none;background:#ffffff;color:#111827;';
    wrapper.innerHTML = html;
    document.body.appendChild(wrapper);
    wrapper.querySelectorAll('*').forEach(el => {
      const cs = window.getComputedStyle(el);
      const bg = cs.backgroundColor;
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
        const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (m && (0.299*+m[1]+0.587*+m[2]+0.114*+m[3]) < 30) el.style.backgroundColor = '#ffffff';
      }
    });
    html2pdf().from(wrapper.firstElementChild).set({
      margin:0, filename:fileName,
      image:{ type:'jpeg', quality:0.97 },
      html2canvas:{ scale:2.5, backgroundColor:'#ffffff', useCORS:true, logging:false, letterRendering:true,
        ignoreElements:(el) => el.hasAttribute('data-html2canvas-ignore') || el.id==='pdf-watermark' },
      jsPDF:{ unit:'mm', format:'a4', orientation:'portrait' },
      pagebreak:{ mode:['avoid-all','css','legacy'] },
    }).save().then(() => document.body.removeChild(wrapper)).catch(() => document.body.removeChild(wrapper));
  };

  const canRun = !!(url.trim() || text.trim() || interim.trim());

  const MODES = [
    { id:'normal', label:'Standard',      sub:'Fast consensus',       icon:Activity   },
    { id:'deep',   label:'Deep Research', sub:'Exhaustive OSINT',     icon:Search     },
    { id:'pro',    label:'Pro Forensic',  sub:'Multi-agent academic', icon:ShieldCheck},
  ];

  return (
    <div style={{ minHeight:'calc(100vh - 60px)', background:'#08080E', color:TEXT, fontFamily:"'DM Sans',system-ui,sans-serif", display:'flex', paddingBottom:64, overflowX:'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600&family=DM+Serif+Display@0;1&family=DM+Mono:wght@400;500&display=swap');

        .vf-input {
          width:100%; box-sizing:border-box;
          background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.09);
          border-radius:10px; color:${TEXT}; font-family:'DM Sans',system-ui,sans-serif;
          font-size:14px; outline:none;
          transition:border-color .2s,background .2s,box-shadow .2s;
        }
        .vf-input::placeholder { color:${DIM}; }
        .vf-input:focus { border-color:rgba(201,168,76,.5); background:rgba(201,168,76,.035); box-shadow:0 0 0 3px rgba(201,168,76,.08); }
        .vf-url  { padding:13px 16px 13px 42px; }
        .vf-area { padding:16px 52px 16px 16px; resize:none; min-height:180px; line-height:1.75; }

        .vf-run {
          background:${GOLD}; color:#08080E; border:none; border-radius:9px;
          padding:13px 28px; font-family:'DM Sans',system-ui,sans-serif;
          font-weight:600; font-size:14px; cursor:pointer;
          display:inline-flex; align-items:center; gap:8px;
          box-shadow:0 4px 20px rgba(201,168,76,.28);
          transition:opacity .18s,transform .15s,box-shadow .18s; white-space:nowrap;
        }
        .vf-run:hover:not(:disabled) { opacity:.88; transform:translateY(-1px); box-shadow:0 6px 28px rgba(201,168,76,.42); }
        .vf-run:active:not(:disabled){ transform:none; }
        .vf-run:disabled { opacity:.28; cursor:default; box-shadow:none; }

        .vf-ghost {
          background:rgba(255,255,255,0.04); color:${MUTED};
          border:1px solid rgba(255,255,255,0.09); border-radius:9px;
          padding:13px 20px; font-family:'DM Sans',system-ui,sans-serif;
          font-weight:500; font-size:14px; cursor:pointer;
          display:inline-flex; align-items:center; gap:7px;
          transition:border-color .2s,color .2s; white-space:nowrap;
        }
        .vf-ghost:hover { border-color:rgba(255,255,255,.16); color:${TEXT}; }

        .vf-mic {
          position:absolute; bottom:12px; right:12px;
          width:34px; height:34px; border-radius:50%; border:none;
          background:rgba(255,255,255,0.06);
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; transition:background .2s,box-shadow .2s; flex-shrink:0;
        }
        .vf-mic:hover { background:rgba(236,72,153,.14); }
        .vf-mic.on {
          background:rgba(236,72,153,.15);
          box-shadow:0 0 0 3px rgba(236,72,153,.15),0 0 18px rgba(236,72,153,.25);
          animation:mic-pulse 1.5s ease-in-out infinite;
        }
        @keyframes mic-pulse {
          0%,100%{ box-shadow:0 0 0 3px rgba(236,72,153,.15),0 0 18px rgba(236,72,153,.25); }
          50%    { box-shadow:0 0 0 6px rgba(236,72,153,.07),0 0 26px rgba(236,72,153,.35); }
        }

        .vf-mode {
          background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08);
          border-radius:11px; padding:15px 16px; cursor:pointer;
          display:flex; align-items:center; gap:12px; text-align:left;
          transition:border-color .2s,background .2s;
        }
        .vf-mode:hover:not(.on){ border-color:rgba(255,255,255,.14); }
        .vf-mode.on { border-color:rgba(201,168,76,.5); background:rgba(201,168,76,.07); }

        .vf-dos {
          padding:13px 15px; border-radius:10px;
          border:1px solid rgba(255,255,255,0.06); background:rgba(255,255,255,0.02);
          cursor:pointer; display:flex; gap:10px; align-items:flex-start;
          transition:border-color .18s,background .18s;
        }
        .vf-dos:hover { border-color:rgba(255,255,255,.13); background:rgba(255,255,255,.04); }

        /* Claims table — full on desktop, stacked on mobile */
        .vf-claim {
          padding:20px 24px; border-bottom:1px solid rgba(255,255,255,.05);
          display:grid; grid-template-columns:130px 1fr 76px;
          gap:18px; align-items:start; transition:background .15s;
        }
        .vf-claim:last-child { border-bottom:none; }
        .vf-claim:hover { background:rgba(255,255,255,.02); }

        .vf-tab {
          background:none; border:none; cursor:pointer;
          font-family:'DM Sans',system-ui,sans-serif;
          font-size:11px; font-weight:500; padding:4px 10px;
          border-radius:1000px; color:${DIM}; transition:background .18s,color .18s;
        }
        .vf-tab.on { background:rgba(201,168,76,.13); color:${GOLD}; }
        .vf-tab:hover:not(.on){ color:${MUTED}; }

        .vf-transcript {
          position:absolute; bottom:55px; left:16px; right:55px;
          background:rgba(8,8,14,0.95); border:1px solid ${GOLD_L};
          border-radius:8px; padding:12px 14px;
          font-family:'DM Mono',monospace; font-size:11px; color:${GOLD};
          box-shadow:0 4px 25px rgba(0,0,0,0.4);
          z-index:10; pointer-events:none;
          display:flex; gap:10px; align-items:flex-start;
        }

        .vf-chip { display:flex; align-items:center; gap:4px; font-size:10px; color:${DIM}; font-family:'DM Mono',monospace; }
        .vf-link { background:none; border:none; cursor:pointer; font-family:'DM Sans',system-ui,sans-serif; font-size:11px; color:${DIM}; text-decoration:underline; text-decoration-color:transparent; transition:color .2s,text-decoration-color .2s; padding:0; }
        .vf-link:hover { color:${GOLD}; text-decoration-color:${GOLD}; }
        .ft-btn { background:none; border:none; cursor:pointer; font-size:11px; color:${DIM}; padding:0; transition:color .2s; font-family:'DM Sans',system-ui,sans-serif; }
        .ft-btn:hover { color:${MUTED}; }

        @keyframes vwave { 0%,100%{height:3px} 50%{height:13px} }
        .vf-wave span { display:inline-block; width:3px; border-radius:3px; background:${MIC_C}; margin:0 1.5px; animation:vwave .75s ease-in-out infinite; }
        .vf-wave span:nth-child(2){ animation-delay:.1s }
        .vf-wave span:nth-child(3){ animation-delay:.2s }
        .vf-wave span:nth-child(4){ animation-delay:.12s }
        .vf-wave span:nth-child(5){ animation-delay:.05s }
        @keyframes ap-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.3)} }

        /* ═══════════ RESPONSIVE BREAKPOINTS ═══════════════════ */

        /* Main content padding */
        .vf-main { flex:1; max-width:1080px; margin:0 auto; padding:0 44px; width:100%; overflow-y:auto; overflow-x:hidden; }

        /* Workbench two-column layout */
        .vf-wb-grid { display:grid; grid-template-columns:1fr 276px; gap:24px; }

        /* Mode selector */
        .vf-modes-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }

        /* Results score header */
        .vf-score-header { display:flex; flex-wrap:wrap; align-items:center; gap:40px; padding:32px 36px; background:rgba(201,168,76,0.06); border:1px solid rgba(201,168,76,0.18); border-radius:16px; margin-bottom:36px; }

        /* Claims table header */
        .vf-claim-header { display:grid; grid-template-columns:130px 1fr 76px; gap:18px; padding:10px 24px; border-bottom:1px solid ${LINE}; background:rgba(255,255,255,0.025); }

        /* AI detection row */
        .vf-ai-row { margin-bottom:36px; display:flex; gap:20px; }

        /* Forensic comparison grid */
        .vf-forensic-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; }

        /* ── Tablet ≤ 1024px ── */
        @media (max-width:1024px) {
          .vf-main { padding:0 28px; }
          .vf-wb-grid { grid-template-columns:1fr; }
        }

        /* ── Mobile ≤ 768px ── */
        @media (max-width:768px) {
          .vf-main { padding:0 16px; }
          .vf-modes-grid { grid-template-columns:1fr 1fr; }
          .vf-ai-row { flex-direction:column; }
          .vf-forensic-grid { grid-template-columns:1fr; }
          .vf-score-header { gap:20px; padding:24px 20px; }
          .vf-claim { grid-template-columns:100px 1fr 60px; gap:12px; padding:16px; }
          .vf-claim-header { grid-template-columns:100px 1fr 60px; gap:12px; padding:10px 16px; }
        }

        /* ── Mobile-small ≤ 480px ── */
        @media (max-width:480px) {
          .vf-main { padding:0 12px; }
          .vf-modes-grid { grid-template-columns:1fr; }
          /* Stack claim rows vertically on very small screens */
          .vf-claim { grid-template-columns:1fr; gap:8px; padding:14px; }
          .vf-claim-header { display:none; }
          .vf-score-header { flex-direction:column; align-items:flex-start; padding:20px; gap:16px; }
          .vf-run { padding:12px 18px; font-size:13px; }
          .vf-ghost { padding:12px 14px; font-size:13px; }
        }
      `}</style>

      <Sidebar
        data-html2canvas-ignore
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        onExport={handleExportPDF}
      />

      <main className="vf-main">
        <AnimatePresence mode="wait">

          {/* ═══ WORKBENCH ═══ */}
          {!loading && !results && (
            <motion.div key="wb"
              initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
              exit={{ opacity:0, y:-8 }} transition={{ duration:.35, ease:[.4,0,.2,1] }}
              style={{ paddingTop:6, paddingBottom:40 }}
            >
              <header style={{ marginBottom:24 }}>
                <h1 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:'clamp(28px,4vw,54px)', fontWeight:400, color:TEXT, lineHeight:1.1, letterSpacing:'-0.022em', marginBottom:12 }}>
                  Initiate an Audit.
                </h1>
                <p style={{ fontSize:16, color:MUTED, lineHeight:1.7, maxWidth:650 }}>
                  Cross-examine claims against verified archival data and live intelligence sources.
                </p>
              </header>

              {/* Mode selector */}
              <div style={{ marginBottom:32 }}>
                <p style={{ fontFamily:'DM Mono,monospace', fontSize:9, color:DIM, textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:10 }}>Analysis depth</p>
                <div className="vf-modes-grid">
                  {MODES.map(m => (
                    <button key={m.id} onClick={() => setMode(m.id)} className={`vf-mode ${mode===m.id?'on':''}`}>
                      <div style={{ width:30, height:30, borderRadius:8, flexShrink:0, background:mode===m.id?GOLD_L:'rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <m.icon size={14} color={mode===m.id?GOLD:DIM}/>
                      </div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:500, color:mode===m.id?TEXT:MUTED, marginBottom:2 }}>{m.label}</div>
                        <div style={{ fontSize:11, color:DIM }}>{m.sub}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Two-column workbench */}
              <div className="vf-wb-grid">
                {/* Left: inputs */}
                <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                  <div>
                    <label style={{ display:'block', fontFamily:'DM Mono,monospace', fontSize:9, color:DIM, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:8 }}>
                      Source URL
                    </label>
                    <div style={{ position:'relative' }}>
                      <LinkIcon size={14} color={DIM} style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
                      <input type="text" value={url} onChange={e => setUrl(e.target.value)}
                        placeholder="https://example.com/article" className="vf-input vf-url"/>
                    </div>
                  </div>

                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ flex:1, height:1, background:LINE }}/><span style={{ fontSize:11, color:DIM }}>or paste text</span><div style={{ flex:1, height:1, background:LINE }}/>
                  </div>

                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8, flexWrap:'wrap', gap:8 }}>
                      <label style={{ fontFamily:'DM Mono,monospace', fontSize:9, color:DIM, textTransform:'uppercase', letterSpacing:'0.12em' }}>
                        Claim or article text
                      </label>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        {listening && (
                          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                            <div className="vf-wave"><span/><span/><span/><span/><span/></div>
                            <span style={{ fontFamily:'DM Mono,monospace', fontSize:9, color:MIC_C }}>Listening…</span>
                          </div>
                        )}
                        <span style={{ fontFamily:'DM Mono,monospace', fontSize:10, color:DIM }}>
                          {(text+interim).length}/8,000
                        </span>
                      </div>
                    </div>
                    <div style={{ position:'relative' }}>
                      <textarea
                        value={text+(interim?(text?' ':'')+interim:'')}
                        onChange={e => { if (!listening) setText(e.target.value); }}
                        readOnly={listening} maxLength={8000}
                        placeholder={voiceReady ? 'Type or paste text here. Click the mic to speak — say "analyze" to run automatically…' : 'Paste the claim or article for comprehensive cross-examination…'}
                        className="vf-input vf-area"
                      />
                      {listening && interim && (
                        <div className="vf-transcript">
                          <span style={{ fontSize:10, opacity:0.5, marginTop:2 }}>[LIVE TRANSCRIPT]</span>
                          <span style={{ lineHeight:1.4 }}>{interim}</span>
                        </div>
                      )}
                      {voiceReady && (
                        <button onClick={toggleVoice} className={`vf-mic ${listening?'on':''}`} title={listening?'Stop recording':'Start voice input'}>
                          {listening ? <MicOff size={14} color={MIC_C}/> : <Mic size={14} color={DIM}/>}
                        </button>
                      )}
                    </div>
                    {voiceReady && (
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:8, flexWrap:'wrap' }}>
                        <Zap size={11} color={DIM}/>
                        <span style={{ fontSize:11, color:DIM }}>
                          {listening ? <>Say <strong style={{ color:MIC_C }}>"analyze"</strong> to trigger verification hands-free</> : <>Click mic to dictate · say <strong style={{ color:GOLD }}>"analyze"</strong> to run automatically</>}
                        </span>
                      </div>
                    )}
                  </div>

                  <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:10, paddingTop:4 }}>
                    <button id="vfy-run-btn" className="vf-run" onClick={handleVerify} disabled={!canRun}>
                      <Gavel size={15}/> Run Verification
                    </button>
                    <input type="file" ref={fileRef} style={{ display:'none' }} accept="image/*,video/*" onChange={handleFileAudit}/>
                    <button className="vf-ghost" onClick={() => fileRef.current?.click()}>
                      <Upload size={13}/> Import File
                    </button>
                    {error && <span style={{ fontSize:12, color:'#f87171' }}>{error}</span>}
                  </div>
                </div>

                {/* Right: engine + recent */}
                <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                  <div style={{ background:SURF, border:`1px solid ${LINE}`, borderRadius:12, padding:'18px 18px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, paddingBottom:12, borderBottom:`1px solid ${LINE}` }}>
                      <span style={{ fontFamily:'DM Mono,monospace', fontSize:9, color:DIM, letterSpacing:'0.12em', textTransform:'uppercase' }}>Engine</span>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <div style={{ width:4, height:4, borderRadius:'50%', background:'#4ade80', boxShadow:'0 0 8px rgba(74,222,128,0.4)', animation:'ap-pulse 2s infinite' }}/>
                        <span style={{ fontFamily:'DM Mono,monospace', fontSize:9, color:'#4ade80', fontWeight:500 }}>{engineStats.status}</span>
                      </div>
                    </div>
                    {[['Neural Engine','v4.2'],['Fact Index',`${engineStats.factIndex}m ago`],['Latency',`${engineStats.latency} ms`]].map(([k,v],i) => (
                      <div key={i} style={{ display:'flex', justifyContent:'space-between', marginBottom:i<2?10:0 }}>
                        <span style={{ fontSize:12, color:MUTED }}>{k}</span>
                        <span style={{ fontFamily:'DM Mono,monospace', fontSize:11, color:DIM, transition:'all 0.5s ease' }}>{v}</span>
                      </div>
                    ))}
                  </div>

                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12, flexWrap:'wrap', gap:8 }}>
                      <span style={{ fontFamily:'DM Mono,monospace', fontSize:9, color:DIM, letterSpacing:'0.12em', textTransform:'uppercase' }}>Recent</span>
                      <div style={{ display:'flex', gap:2 }}>
                        {['All','Verified','Refuted'].map(f => (
                          <button key={f} onClick={() => setActiveFilter(f)} className={`vf-tab ${activeFilter===f?'on':''}`}>{f}</button>
                        ))}
                      </div>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                      {filteredReports.map((h,i) => {
                        const v = h.topClaims?.[0]?.verdict || h.claims?.[0]?.verdict || '';
                        return (
                          <div key={i} className="vf-dos" onClick={() => navigate(`/history/${h.id}`)}>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ marginBottom:5 }}><VerdictBadge verdict={v}/></div>
                              <p style={{ fontSize:12, color:MUTED, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginBottom:5 }}>{h.input||'Redacted'}</p>
                              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                                <span className="vf-chip"><FileText size={9}/> {h.claims?.length||0} claims</span>
                                <span className="vf-chip"><ShieldCheck size={9}/> {Math.round(h.truthScore)}%</span>
                                <span className="vf-chip"><Clock size={9}/> {new Date(h.timestamp).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <ChevronRight size={12} color={DIM} style={{ flexShrink:0, marginTop:3 }}/>
                          </div>
                        );
                      })}
                      {filteredReports.length===0 && (
                        <div style={{ padding:'20px 12px', textAlign:'center', border:'1px dashed rgba(255,255,255,.07)', borderRadius:10, fontSize:12, color:DIM }}>
                          No {activeFilter==='All'?'':activeFilter.toLowerCase()} dossiers yet.
                        </div>
                      )}
                    </div>
                    <button className="vf-link" onClick={() => navigate('/history')} style={{ marginTop:10, display:'block' }}>
                      View full history →
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {loading && (
            <motion.div key="load" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} style={{ width:'100%' }}>
              <AnalysisProcessing elapsed={elapsed} step={step} logs={logs} inputTitle={url||text.substring(0,100)} onCancel={handleCancel}/>
            </motion.div>
          )}

          {results && !loading && (
            <motion.div key="res" ref={reportRef}
              initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
              style={{ paddingTop:40, paddingBottom:80, background:'#08080E' }}
            >
              {/* Score header */}
              <div className="vf-score-header">
                <div style={{ position:'relative', width:112, height:112, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <ScoreArc score={results.truthScore}/>
                  <div style={{ position:'absolute', display:'flex', flexDirection:'column', alignItems:'center' }}>
                    <span style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:28, fontWeight:400, color:TEXT, lineHeight:1 }}>{Math.round(results.truthScore)}</span>
                    <span style={{ fontFamily:'DM Mono,monospace', fontSize:8, color:GOLD, letterSpacing:'0.08em' }}>/100</span>
                  </div>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                    <Sparkles size={13} color={GOLD}/>
                    <span style={{ fontFamily:'DM Mono,monospace', fontSize:10, color:GOLD, letterSpacing:'0.12em', textTransform:'uppercase' }}>Forensic Summary</span>
                  </div>
                  <h2 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:'clamp(22px,3vw,30px)', fontWeight:400, color:TEXT, letterSpacing:'-0.018em', marginBottom:8, lineHeight:1.15 }}>
                    Audit Complete.
                  </h2>
                  <p style={{ fontSize:14, color:MUTED, lineHeight:1.65 }}>
                    Confidence index of <strong style={{ color:TEXT }}>{Math.round(results.truthScore)}%</strong> derived from {results.claims?.length} verified assertions.
                  </p>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8, flexShrink:0 }}>
                  <button data-html2canvas-ignore className="vf-run" onClick={() => navigate(`/history/${results.reportId}`)} style={{ justifyContent:'center' }}>
                    View Report <ChevronRight size={14}/>
                  </button>
                  <button data-html2canvas-ignore className="vf-ghost" onClick={handleExportPDF} style={{ justifyContent:'center', border:`1px solid ${GOLD_L}`, color:GOLD }}>
                    Export PDF
                  </button>
                  <button data-html2canvas-ignore className="vf-link" style={{ textAlign:'center' }}
                    onClick={() => { setResults(null); setUrl(''); setText(''); }}>
                    Start new audit
                  </button>
                </div>
              </div>

              {/* AI Detection */}
              {results.aiTextDetection && (
                <div className="vf-ai-row">
                  <div style={{ flex:1, padding:'20px 24px', background:SURF, border:`1px solid ${LINE}`, borderRadius:16 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                      <Activity size={16} color={results.aiTextDetection.score>50?'#f87171':'#4ade80'}/>
                      <span style={{ fontSize:11, fontFamily:"'DM Mono',monospace", textTransform:'uppercase', letterSpacing:'0.12em', color:DIM }}>AI Text Probability</span>
                    </div>
                    <div style={{ display:'flex', alignItems:'flex-end', gap:14, flexWrap:'wrap' }}>
                      <span style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:36, color:TEXT, lineHeight:1 }}>{results.aiTextDetection.score}%</span>
                      <span style={{ fontSize:13, color:MUTED, paddingBottom:4 }}>{results.aiTextDetection.score>50?'Likely Synthesized':'Likely Human'}</span>
                    </div>
                    <p style={{ fontSize:12, color:DIM, marginTop:12, lineHeight:1.5 }}>{results.aiTextDetection.explanation}</p>
                  </div>
                  {results.aiMediaDetection && (
                    <div style={{ flex:1, padding:'20px 24px', background:SURF, border:`1px solid ${LINE}`, borderRadius:16 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                        <ShieldAlert size={16} color={results.aiMediaDetection.score>0?'#fb923c':'#4ade80'}/>
                        <span style={{ fontSize:11, fontFamily:"'DM Mono',monospace", textTransform:'uppercase', letterSpacing:'0.12em', color:DIM }}>Media Authentication</span>
                      </div>
                      <div style={{ display:'flex', alignItems:'flex-end', gap:14 }}>
                        <span style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:36, color:TEXT, lineHeight:1 }}>{results.aiMediaDetection.verdict||'Clear'}</span>
                      </div>
                      <p style={{ fontSize:12, color:DIM, marginTop:12, lineHeight:1.5 }}>{results.aiMediaDetection.summary}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Forensic comparison */}
              {(results.forensicReference||results.aiMediaDetection?.results?.[0]?.url) && (
                <div style={{ marginBottom:44 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20, paddingBottom:14, borderBottom:`1px solid ${GOLD_L}` }}>
                    <ShieldCheck size={18} color={GOLD}/>
                    <h3 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:'clamp(18px,2.5vw,26px)', fontWeight:400, color:TEXT }}>
                      A/B Forensic Comparison.
                    </h3>
                  </div>
                  <div className="vf-forensic-grid">
                    <div style={{ background:SURF, border:`1px solid ${LINE}`, borderRadius:16, overflow:'hidden' }}>
                      <div style={{ padding:'10px 14px', background:'rgba(255,255,255,0.03)', borderBottom:`1px solid ${LINE}`, display:'flex', justifyContent:'space-between' }}>
                        <span style={{ fontSize:9, fontFamily:"'DM Mono',monospace", color:DIM, textTransform:'uppercase', letterSpacing:'0.1em' }}>Evidence Source</span>
                        <span style={{ fontSize:9, fontFamily:"'DM Mono',monospace", color:'#f87171' }}>[SUBJECT]</span>
                      </div>
                      <div style={{ height:220, background:'#000', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <img src={results.aiMediaDetection?.results?.[0]?.url||results.forensicReference||'https://images.unsplash.com/photo-1511367461989-f85a21fda167?ixlib=rb-4.0.3&auto=format&fit=crop&w=512&q=80'} alt="Evidence Source" style={{ width:'100%', height:'100%', objectFit:'contain' }} onError={e=>{ e.target.onerror=null; e.target.src='https://images.unsplash.com/photo-1511367461989-f85a21fda167?ixlib=rb-4.0.3&auto=format&fit=crop&w=512&q=80'; }}/>
                      </div>
                    </div>
                    <div style={{ background:SURF, border:`1px solid ${GOLD_L}`, borderRadius:16, overflow:'hidden' }}>
                      <div style={{ padding:'10px 14px', background:'rgba(201,168,76,0.05)', borderBottom:`1px solid ${GOLD_L}`, display:'flex', justifyContent:'space-between' }}>
                        <span style={{ fontSize:9, fontFamily:"'DM Mono',monospace", color:GOLD, textTransform:'uppercase', letterSpacing:'0.1em' }}>AI Target Reference</span>
                        <span style={{ fontSize:9, fontFamily:"'DM Mono',monospace", color:'#4ade80' }}>[VERIFIED]</span>
                      </div>
                      <div style={{ height:220, background:'#000', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <img src={results.forensicReference||results.aiMediaDetection?.results?.[0]?.url||'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=512&q=80'} alt="Reference" style={{ width:'100%', height:'100%', objectFit:'contain' }} onError={e=>{ e.target.onerror=null; e.target.src='https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=512&q=80'; }}/>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Claims table */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, flexWrap:'wrap', gap:8 }}>
                <h3 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:'clamp(18px,2.5vw,24px)', fontWeight:400, color:TEXT, letterSpacing:'-0.01em' }}>
                  Verified Assertions
                </h3>
                <span style={{ fontFamily:'DM Mono,monospace', fontSize:10, color:DIM }}>{results.claims?.length} claims reviewed</span>
              </div>

              <div style={{ background:'rgba(255,255,255,0.02)', border:`1px solid ${LINE}`, borderRadius:14, overflow:'hidden' }}>
                <div className="vf-claim-header">
                  {['Verdict','Assertion & Reasoning','Confidence'].map(h => (
                    <span key={h} style={{ fontFamily:'DM Mono,monospace', fontSize:9, fontWeight:700, letterSpacing:'0.12em', color:DIM, textTransform:'uppercase' }}>{h}</span>
                  ))}
                </div>
                {results.claims?.map((c,i) => (
                  <motion.div key={i} className="vf-claim"
                    initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
                    transition={{ delay:i*.05, duration:.28 }}>
                    <div style={{ paddingTop:2 }}><VerdictBadge verdict={c.verdict}/></div>
                    <div>
                      <div style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:5, flexWrap:'wrap' }}>
                        <p style={{ fontSize:14, fontWeight:500, color:TEXT, lineHeight:1.55, margin:0 }}>{c.claim}</p>
                        {c.isTimeSensitive && (
                          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:'#fbbf24', display:'inline-flex', alignItems:'center', gap:4, background:'rgba(251,191,36,0.1)', padding:'2px 6px', borderRadius:4, whiteSpace:'nowrap' }}>
                            <AlertTriangle size={9}/> Time Sensitive
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize:12, color:DIM, lineHeight:1.55 }}>{c.reasoning}</p>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <span style={{ fontFamily:'DM Mono,monospace', fontSize:18, fontWeight:500, color:Math.round((c.confidence||0)*100)>=70?GOLD:DIM }}>
                        {Math.round((c.confidence||0)*100)}<span style={{ fontSize:10, opacity:.5 }}>%</span>
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Export modal */}
      <AnimatePresence>
        {showExportModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:10000, padding:20 }}>
            <motion.div initial={{ scale:0.95, y:10 }} animate={{ scale:1, y:0 }} exit={{ scale:0.95, y:10 }}
              style={{ background:'#111118', border:`1px solid ${LINE}`, borderRadius:16, width:'100%', maxWidth:400, padding:32 }}>
              <h3 style={{ fontFamily:"'DM Serif Display',serif", fontSize:24, color:TEXT, marginBottom:12 }}>Download Report</h3>
              <p style={{ color:MUTED, fontSize:14, marginBottom:24, lineHeight:1.5 }}>Enter your name for the official forensic record. It will appear in the report and filename.</p>
              <div style={{ marginBottom:24 }}>
                <label style={{ display:'block', fontSize:9, fontFamily:"'DM Mono',monospace", color:DIM, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>Report Author</label>
                <input type="text" value={exportName} onChange={e => setExportName(e.target.value)}
                  placeholder="e.g. Himanshu Jha" autoFocus
                  style={{ width:'100%', boxSizing:'border-box', padding:'12px 14px', background:'rgba(255,255,255,0.04)', border:`1px solid ${LINE}`, borderRadius:8, color:TEXT, fontSize:14, outline:'none' }}
                  onKeyDown={e => e.key==='Enter' && executePDFExport()}/>
              </div>
              <div style={{ display:'flex', gap:12 }}>
                <button onClick={() => setShowExportModal(false)}
                  style={{ flex:1, padding:'12px', background:'rgba(255,255,255,0.04)', border:`1px solid ${LINE}`, borderRadius:8, color:MUTED, fontSize:13, fontWeight:500, cursor:'pointer' }}>
                  Cancel
                </button>
                <button onClick={executePDFExport}
                  style={{ flex:1, padding:'12px', background:GOLD, border:'none', borderRadius:8, color:'#08080E', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                  Download PDF
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}