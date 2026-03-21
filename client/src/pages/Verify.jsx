
import React, { useState, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, ShieldAlert, FileText, Search, Loader2, ExternalLink,
  BrainCircuit, Zap, Check, ChevronRight, ChevronDown, Download, Filter,
  Upload, Image, Film, X, User
} from 'lucide-react';
import confetti from 'canvas-confetti';
import html2pdf from 'html2pdf.js';
import VerdictPieChart from '../components/VerdictPieChart';

const API_BASE = '/api';

const Verify = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [expandedClaim, setExpandedClaim] = useState(null);
  const [logs, setLogs] = useState([]);
  const [confidenceFilter, setConfidenceFilter] = useState(0);
  const [hoveredClaim, setHoveredClaim] = useState(null);
  const [elapsed, setElapsed] = useState(0);

  // Media upload state
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaResults, setMediaResults] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const addLog = (msg) => setLogs(prev => [...prev.slice(-4), { msg, id: Date.now() }]);

  const pipeline = [
    { title: 'Preprocessing', icon: <FileText size={18} />, desc: 'Parsing input text and URL content' },
    { title: 'Claim Extraction', icon: <BrainCircuit size={18} />, desc: 'Identifying atomic verifiable facts' },
    { title: 'Evidence & CoT', icon: <Search size={18} />, desc: '7-step Chain-of-Thought verification' },
    { title: 'Self-Reflection', icon: <ShieldCheck size={18} />, desc: 'Bias check, confidence calibration' }
  ];

  const handleVerify = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResults(null);
    setError(null);
    setStep(1);
    setLogs([{ msg: 'Initializing Fact-Check Pipeline...', id: Date.now() }]);

    try {
      const isUrl = input.match(/^https?:\/\/[^\s$.?#].[^\s]*$/gm);
      const payload = isUrl ? { url: input } : { text: input };

      setElapsed(0);
      const clock = setInterval(() => setElapsed(p => p + 1), 1000);
      const timer = setInterval(() => setStep(prev => prev < 4 ? prev + 1 : prev), 5000);
      const logInterval = setInterval(() => {
        const thoughts = [
          'Analyzing semantic structure of text...',
          'Extracting verifiable atomic claims...',
          'Prioritizing claims by potential impact...',
          'Formulating targeted search queries...',
          'Cross-referencing evidence from reliable sources...',
          'Applying self-reflection to resolve data conflicts...'
        ];
        addLog(thoughts[Math.floor(Math.random() * thoughts.length)]);
      }, 2500);

      const response = await axios.post(`${API_BASE}/verify`, payload);
      clearInterval(timer);
      clearInterval(logInterval);
      clearInterval(clock);
      setStep(4);
      setResults(response.data);
      addLog('Verification complete.');
      if (response.data.truthScore >= 80) confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed.');
      setStep(0);
    } finally {
      setLoading(false);
    }
  };

  // Media upload handlers
  const handleFileSelect = (files) => {
    const validFiles = Array.from(files).filter(f =>
      f.type.startsWith('image/') || f.type.startsWith('video/')
    ).slice(0, 5);
    setMediaFiles(prev => [...prev, ...validFiles].slice(0, 5));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeFile = (idx) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== idx));
    setMediaResults(null);
  };

  const handleAnalyzeMedia = async () => {
    if (mediaFiles.length === 0) return;
    setMediaLoading(true);
    setMediaResults(null);
    try {
      const formData = new FormData();
      mediaFiles.forEach(f => formData.append('media', f));
      const response = await axios.post(`${API_BASE}/analyze-media`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMediaResults(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Media analysis failed.');
    } finally {
      setMediaLoading(false);
    }
  };

  const handleExportPDF = () => {
    const el = document.getElementById('report-section');
    if (!el) return;
    html2pdf().set({
      margin: 0.5, filename: 'VeriCheck_Report.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    }).from(el).save();
  };

  const getVerdictClass = (v) => {
    const verdict = v?.toLowerCase();
    if (verdict === 'true') return 'verdict-true';
    if (verdict === 'false') return 'verdict-false';
    if (verdict === 'partially true') return 'verdict-partial';
    return '';
  };

  const filteredClaims = results?.claims?.filter(c => (c.confidence || 0) * 100 >= confidenceFilter) || [];

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Input Card */}
      <main className="glass-card">
        <div className="input-group">
          <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste URL or Text Snippet..." className="text-area" />
          <button onClick={handleVerify} disabled={loading || !input.trim()} className="btn-primary">
            {loading ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
            <span>Verify Claims</span>
          </button>
        </div>

        {/* Media Upload Zone */}
        <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', color: '#6366f1', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.1em' }}>
            <Upload size={14} /> MEDIA DEEPFAKE SCANNER
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? '#6366f1' : 'var(--border-light)'}`,
              borderRadius: '12px',
              padding: '2rem',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragOver ? 'rgba(99,102,241,0.05)' : 'transparent',
              transition: 'all 0.2s'
            }}
          >
            <input ref={fileInputRef} type="file" multiple accept="image/*,video/*" style={{ display: 'none' }}
              onChange={(e) => handleFileSelect(e.target.files)} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', opacity: 0.6 }}>
              <Image size={20} />
              <Film size={20} />
            </div>
            <p style={{ marginTop: '8px', fontSize: '0.85rem', opacity: 0.6 }}>
              Drag & drop images or videos here, or click to browse
            </p>
            <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>
              Supports: JPG, PNG, GIF, WebP, MP4, WebM, MOV · Max 20MB per file · Up to 5 files
            </p>
          </div>

          {/* File Preview */}
          {mediaFiles.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '1rem' }}>
                {mediaFiles.map((f, i) => (
                  <div key={i} style={{ position: 'relative', padding: '8px 12px', background: 'rgba(99,102,241,0.08)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                    {f.type.startsWith('image/') ? <Image size={14} color="#6366f1" /> : <Film size={14} color="#f59e0b" />}
                    <span>{f.name.substring(0, 20)}{f.name.length > 20 ? '...' : ''}</span>
                    <span style={{ fontSize: '0.65rem', color: '#64748b' }}>{formatFileSize(f.size)}</span>
                    <button onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                      <X size={14} color="#ef4444" />
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={handleAnalyzeMedia} disabled={mediaLoading} className="btn-primary" style={{ maxWidth: '280px' }}>
                {mediaLoading ? <Loader2 className="animate-spin" size={18} /> : <ShieldAlert size={18} />}
                <span>{mediaLoading ? 'Analyzing...' : `Scan ${mediaFiles.length} File${mediaFiles.length > 1 ? 's' : ''} for Deepfakes`}</span>
              </button>
            </div>
          )}

          {/* Media Results */}
          {mediaResults && (
            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{mediaResults.summary}</span>
                <span style={{
                  padding: '4px 14px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800,
                  background: mediaResults.verdict === 'Authentic' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  color: mediaResults.verdict === 'Authentic' ? '#10b981' : '#ef4444',
                }}>
                  {mediaResults.verdict}
                </span>
              </div>

              {mediaResults.results.map((r, i) => (
                <div key={i} style={{ padding: '1rem', marginBottom: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: `1px solid ${r.isAIGenerated ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.2)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {r.mimeType?.startsWith('video') ? <Film size={16} color="#f59e0b" /> : <Image size={16} color="#6366f1" />}
                      <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{r.filename}</span>
                      <span style={{ fontSize: '0.65rem', color: '#64748b' }}>{formatFileSize(r.size)}</span>
                    </div>
                    <span style={{
                      padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800,
                      background: r.isAIGenerated ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                      color: r.isAIGenerated ? '#ef4444' : '#10b981',
                    }}>
                      {r.verdict}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.7rem', color: '#64748b', minWidth: '70px' }}>Confidence</span>
                    <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${r.confidence || 0}%`, height: '100%', background: r.isAIGenerated ? '#ef4444' : '#10b981', borderRadius: '3px' }} />
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{r.confidence || 0}%</span>
                  </div>

                  {r.details && <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>{r.details}</p>}

                  {r.indicators?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {r.indicators.map((ind, j) => (
                        <span key={j} style={{ padding: '2px 7px', background: 'rgba(239,68,68,0.08)', color: '#f87171', borderRadius: '4px', fontSize: '0.6rem' }}>
                          {ind}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Thinking Logs */}
        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0 }} style={{ marginTop: '2rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', color: '#6366f1', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.1em' }}>
                <Zap size={14} /> AGENT REASONING ENGINE
              </div>
              <div className="terminal-logs">
                {logs.map((log) => (
                  <div key={log.id} className="log-entry">
                    <span style={{ color: '#475569', marginRight: 10 }}>[{new Date(log.id).toLocaleTimeString()}]</span>
                    <span style={{ color: '#10b981' }}>SYSTEM:</span> {log.msg}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Pipeline Visualizer */}
      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#6366f1', fontWeight: 700 }}>AGENTIC PIPELINE IN PROGRESS</span>
              <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{elapsed}s elapsed</span>
            </div>
            <div className="pipeline-container">
              {pipeline.map((p, i) => (
                <div key={i} className={`pipeline-step ${step === i + 1 ? 'active' : ''}`} style={{ borderColor: step > i + 1 ? 'rgba(16,185,129,0.3)' : undefined }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b' }}>
                    <span>PHASE {i + 1}</span>
                    {step > i + 1 ? <span style={{ color: '#10b981', fontWeight: 700 }}>✓ DONE</span> : step === i + 1 ? <span style={{ color: '#f59e0b' }}>RUNNING...</span> : <span>PENDING</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>{p.icon}<span>{p.title}</span></div>
                  <p style={{ fontSize: '0.7rem', color: '#64748b', margin: 0 }}>{p.desc}</p>
                  <div className="progress-bar-bg">
                    <motion.div className="progress-bar-fill" initial={{ width: 0 }} animate={{ width: step > i + 1 ? '100%' : step === i + 1 ? '60%' : '0%' }} transition={{ duration: 0.5 }} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', color: '#f87171', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldAlert size={20} /> {error}
        </div>
      )}

      {/* Results */}
      {results && !loading && (
        <div id="report-section" className="claims-section">

          {/* Executive Summary for non-technical users */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: '2.5rem', marginBottom: '2rem', background: results.truthScore > 70 ? 'rgba(16,185,129,0.05)' : results.truthScore > 40 ? 'rgba(245,158,11,0.05)' : 'rgba(239,68,68,0.05)', border: `1px solid ${results.truthScore > 70 ? 'rgba(16,185,129,0.2)' : results.truthScore > 40 ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem' }}>
              <div>
                <p style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.15em', color: '#64748b', marginBottom: '0.5rem' }}>VERIFICATION SUMMARY</p>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                  {results.truthScore > 70 ? '✅ Mostly Accurate' : results.truthScore > 40 ? '⚠️ Mixed Accuracy' : '❌ Mostly Inaccurate'}
                </h2>
                <p style={{ fontSize: '0.95rem', color: '#94a3b8', maxWidth: '500px' }}>
                  We analyzed <strong>{results.claims?.length || 0} claims</strong> from the input.
                  {results.claims?.filter(c => c.verdict === 'True').length > 0 && ` ${results.claims.filter(c => c.verdict === 'True').length} were verified as true.`}
                  {results.claims?.filter(c => c.verdict === 'False').length > 0 && ` ${results.claims.filter(c => c.verdict === 'False').length} were identified as false.`}
                  {results.pipelineMeta?.temporalClaims > 0 && ` ${results.pipelineMeta.temporalClaims} claims are time-sensitive and may change.`}
                </p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3.5rem', fontWeight: 900, color: results.truthScore > 70 ? '#10b981' : results.truthScore > 40 ? '#f59e0b' : '#ef4444', lineHeight: 1 }}>{Math.round(results.truthScore)}%</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>ACCURACY SCORE</div>
              </div>
            </div>
          </motion.div>

          {/* Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <VerdictPieChart claims={results.claims} />
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {results.cached && <span className="badge" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>⚡ CACHED</span>}
              <button className="btn-sm" onClick={handleExportPDF}><Download size={14} /> Export PDF</button>
              <button className="btn-sm" onClick={() => {
                const txt = results.claims.map(c => `[${c.verdict}] ${c.claim}`).join('\n');
                navigator.clipboard.writeText(`VeriCheck Report | Score: ${Math.round(results.truthScore)}%\n\n${txt}`);
                alert('Copied to clipboard!');
              }}>Copy Summary</button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="glass-card stat-card">
              <div className="stat-label">Accuracy Score</div>
              <div className="stat-value" style={{ color: results.truthScore > 70 ? '#10b981' : '#ef4444' }}>{Math.round(results.truthScore)}%</div>
            </div>
            <div className="glass-card stat-card">
              <div className="stat-label">AI Generation Prob.</div>
              <div className="stat-value">{results.aiTextDetection?.score || 0}%</div>
              <p className="stat-explanation">{results.aiTextDetection?.explanation}</p>
            </div>
            <div className="glass-card stat-card">
              <div className="stat-label">Media Authenticity</div>
              <div className="stat-value" style={{ fontSize: '1.5rem', color: results.aiMediaDetection?.verdict === 'Authentic' || results.aiMediaDetection?.verdict === 'Clear' ? '#10b981' : '#ef4444' }}>
                {results.aiMediaDetection?.verdict || 'N/A'}
              </div>
              <p className="stat-explanation">{results.aiMediaDetection?.summary || 'No media analyzed'}</p>
            </div>
          </div>

          {/* Detailed Media Analysis */}
          {results.aiMediaDetection?.results && results.aiMediaDetection.results.length > 0 && (
            <div className="glass-card" style={{ marginTop: '2rem', padding: '2rem' }}>
              <h3 style={{ fontSize: '0.8rem', color: '#ef4444', marginBottom: '1.5rem', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={16} /> DEEPFAKE / AI-MEDIA SCANNER — {results.aiMediaDetection.imagesFound} images found, {results.aiMediaDetection.imagesAnalyzed} analyzed
              </h3>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {results.aiMediaDetection.results.map((img, i) => (
                  <div key={i} style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: `1px solid ${img.isAIGenerated ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.2)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.8rem', fontWeight: 600, wordBreak: 'break-all' }}>{img.url?.substring(0, 80)}...</p>
                      </div>
                      <span style={{
                        padding: '4px 12px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800,
                        background: img.isAIGenerated ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                        color: img.isAIGenerated ? '#ef4444' : '#10b981',
                        border: `1px solid ${img.isAIGenerated ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`
                      }}>
                        {img.verdict}
                      </span>
                    </div>
                    {/* Confidence Bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.7rem', color: '#64748b', minWidth: '80px' }}>Confidence</span>
                      <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${img.confidence || 0}%`, height: '100%', background: img.isAIGenerated ? '#ef4444' : '#10b981', borderRadius: '3px', transition: 'width 0.5s' }} />
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{img.confidence || 0}%</span>
                    </div>
                    {/* Indicators */}
                    {img.indicators && img.indicators.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '0.5rem' }}>
                        {img.indicators.map((ind, j) => (
                          <span key={j} style={{ padding: '2px 8px', background: 'rgba(239,68,68,0.08)', color: '#f87171', borderRadius: '4px', fontSize: '0.65rem' }}>
                            {ind}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Source Highlighting */}
          <div className="glass-card" style={{ marginTop: '2rem', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '0.8rem', color: '#6366f1', letterSpacing: '0.1em' }}>INTERACTIVE SOURCE MAPPING</h3>
              <div style={{ display: 'flex', gap: '12px', fontSize: '0.65rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 3, background: '#10b981', display: 'inline-block', borderRadius: 2 }} /> True</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 3, background: '#ef4444', display: 'inline-block', borderRadius: 2 }} /> False</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 3, background: '#f59e0b', display: 'inline-block', borderRadius: 2 }} /> Partial</span>
              </div>
            </div>
            <p style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '1rem' }}>Hover over highlighted text to see the matched claim and verdict.</p>
            <div style={{ lineHeight: '2.2', color: '#cbd5e1', fontSize: '0.95rem' }}>
              {results.originalText.split('. ').map((s, i) => {
                const claim = results.claims.find(c => c.originalSentence && s.includes(c.originalSentence));
                const claimIdx = claim ? results.claims.indexOf(claim) : -1;
                const color = claim ? (claim.verdict === 'True' ? '#10b981' : claim.verdict === 'False' ? '#ef4444' : '#f59e0b') : 'transparent';
                const isHovered = hoveredClaim === claimIdx && claimIdx !== -1;
                return (
                  <span key={i}
                    onMouseEnter={() => claimIdx >= 0 && setHoveredClaim(claimIdx)}
                    onMouseLeave={() => setHoveredClaim(null)}
                    onClick={() => claimIdx >= 0 && setExpandedClaim(claimIdx)}
                    title={claim ? `[${claim.verdict}] ${claim.claim}` : ''}
                    style={{
                      borderBottom: `3px solid ${color}`,
                      padding: '2px 3px',
                      borderRadius: '2px',
                      cursor: claim ? 'pointer' : 'default',
                      background: isHovered ? `${color}22` : 'transparent',
                      transition: 'background 0.15s'
                    }}>
                    {s}.{' '}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Confidence Filter */}
          <div style={{ marginTop: '3rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Filter size={16} color="#6366f1" />
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Confidence Filter: ≥ {confidenceFilter}%</span>
            <input type="range" min="0" max="100" value={confidenceFilter} onChange={e => setConfidenceFilter(Number(e.target.value))} style={{ flex: 1 }} />
          </div>

          {/* Pipeline Health */}
          {results.pipelineMeta && (
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '2rem', marginBottom: '1rem' }}>
              <span style={{ padding: '3px 10px', background: 'rgba(99,102,241,0.08)', color: '#818cf8', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700 }}>
                {results.pipelineMeta.totalClaims} extracted
              </span>
              <span style={{ padding: '3px 10px', background: 'rgba(16,185,129,0.08)', color: '#10b981', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700 }}>
                {results.pipelineMeta.verifiedClaims} verified
              </span>
              {results.pipelineMeta.failedClaims > 0 && (
                <span style={{ padding: '3px 10px', background: 'rgba(239,68,68,0.08)', color: '#ef4444', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700 }}>
                  {results.pipelineMeta.failedClaims} recovered failures
                </span>
              )}
              {results.pipelineMeta.temporalClaims > 0 && (
                <span style={{ padding: '3px 10px', background: 'rgba(245,158,11,0.08)', color: '#f59e0b', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700 }}>
                  ⏳ {results.pipelineMeta.temporalClaims} time-sensitive
                </span>
              )}
              {results.pipelineMeta.conflictingClaims > 0 && (
                <span style={{ padding: '3px 10px', background: 'rgba(239,68,68,0.08)', color: '#f87171', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700 }}>
                  ⚡ {results.pipelineMeta.conflictingClaims} source conflicts
                </span>
              )}
              {results.pipelineMeta.ambiguousClaims > 0 && (
                <span style={{ padding: '3px 10px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700 }}>
                  ⚠ {results.pipelineMeta.ambiguousClaims} ambiguous entities
                </span>
              )}
            </div>
          )}

          {/* Claims */}
          <h2 className="section-title" style={{ marginTop: '1rem' }}><BrainCircuit /> Audit Report ({filteredClaims.length} claims)</h2>
          <div className="claims-list">
            {filteredClaims.map((claim, idx) => (
              <div key={idx} className="claim-card" style={{ borderColor: hoveredClaim === idx ? '#6366f1' : undefined, boxShadow: hoveredClaim === idx ? '0 0 15px rgba(99,102,241,0.2)' : undefined, transition: 'all 0.2s' }}
                onMouseEnter={() => setHoveredClaim(idx)} onMouseLeave={() => setHoveredClaim(null)}>
                <div className="claim-header" onClick={() => setExpandedClaim(expandedClaim === idx ? null : idx)}>
                  <div className={`verdict-badge ${getVerdictClass(claim.verdict)}`}>{claim.verdict || '?'}</div>
                  <div style={{ flex: 1, marginLeft: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <p style={{ fontWeight: 600 }}>{claim.claim}</p>
                      {claim.isTemporalSensitive && <span style={{ padding: '1px 6px', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', borderRadius: 4, fontSize: '0.6rem', fontWeight: 700 }}>⏳ TEMPORAL</span>}
                      {claim.importance === 'high' && <span style={{ padding: '1px 6px', background: 'rgba(239,68,68,0.1)', color: '#f87171', borderRadius: 4, fontSize: '0.6rem', fontWeight: 700 }}>HIGH</span>}
                      {claim.entityClarity === 'LOW' && <span style={{ padding: '1px 6px', background: 'rgba(239,68,68,0.12)', color: '#ef4444', borderRadius: 4, fontSize: '0.6rem', fontWeight: 700 }}>⚠ AMBIGUOUS ENTITY</span>}
                      {claim.entityClarity === 'HIGH' && <span style={{ padding: '1px 6px', background: 'rgba(16,185,129,0.1)', color: '#10b981', borderRadius: 4, fontSize: '0.6rem', fontWeight: 700 }}>✓ VERIFIED ENTITY</span>}
                    </div>
                    {claim.confidence != null && <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 4 }}>Confidence: {Math.round(claim.confidence * 100)}%</p>}
                  </div>
                  {expandedClaim === idx ? <ChevronDown /> : <ChevronRight />}
                </div>
                <AnimatePresence>
                  {expandedClaim === idx && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="claim-content">
                      {/* Entity Clarity Warning */}
                      {claim.entityClarity === 'LOW' && (
                        <div style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, marginBottom: '0.75rem', fontSize: '0.8rem', color: '#ef4444' }}>
                          ⚠️ <strong>Ambiguous Entity:</strong> {claim.entityClarityReason || 'The subject of this claim could not be clearly identified. This significantly reduces verification reliability.'}
                        </div>
                      )}

                      {/* Entity Profile Card */}
                      {claim.entityMetadata && (
                        <div style={{ background: 'rgba(99,102,241,0.03)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 16, padding: '1.25rem', marginBottom: '1.25rem', position: 'relative', overflow: 'hidden' }}>
                          <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--primary)' }} />
                          <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#6366f1', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>ENTITY PROFILE</div>
                          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                            {claim.entityMetadata.image && (
                              <img src={claim.entityMetadata.image} alt={claim.entityMetadata.name} style={{ width: 90, height: 90, borderRadius: 12, objectFit: 'cover', border: '2px solid rgba(99,102,241,0.3)', flexShrink: 0 }} />
                            )}
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                <User size={14} color="#6366f1" />
                                <strong style={{ fontSize: '1rem', color: '#f8fafc' }}>{claim.entityMetadata.name}</strong>
                                <a href={claim.entityMetadata.wikipediaUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: 6, textDecoration: 'none', color: '#818cf8', fontSize: '0.65rem', fontWeight: 600 }}>Wiki <ExternalLink size={10} /></a>
                              </div>
                              <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.5, margin: 0 }}>{claim.entityMetadata.description || claim.entityMetadata.extract}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Temporal Warning */}
                      {claim.temporalWarning && (
                        <div style={{ padding: '8px 12px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, marginBottom: '0.75rem', fontSize: '0.8rem', color: '#f59e0b' }}>
                          ⏳ <strong>Temporal Warning:</strong> {claim.temporalWarning}
                        </div>
                      )}

                      {/* Source Conflicts */}
                      {claim.sourceConflicts && (
                        <div style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, marginBottom: '0.75rem', fontSize: '0.8rem', color: '#f87171' }}>
                          ⚡ <strong>Source Conflict:</strong> {claim.sourceConflicts}
                        </div>
                      )}

                      <div className="reasoning-box">{claim.reasoning}</div>

                      {/* Chain of Thought */}
                      {claim.chainOfThought && claim.chainOfThought.length > 0 && (
                        <div style={{ marginTop: '1rem' }}>
                          <p style={{ fontSize: '0.7rem', fontWeight: 800, color: '#6366f1', marginBottom: 8, letterSpacing: '0.05em' }}>CHAIN OF THOUGHT</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {claim.chainOfThought.map((step, si) => (
                              <div key={si} style={{ fontSize: '0.75rem', padding: '6px 10px', background: 'rgba(99,102,241,0.04)', borderLeft: '2px solid rgba(99,102,241,0.3)', borderRadius: '0 4px 4px 0', color: '#94a3b8' }}>
                                {step}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                        <div>
                          <p style={{ fontSize: '0.7rem', fontWeight: 800, color: '#475569', marginBottom: 8 }}>EVIDENCE</p>
                          {claim.evidence?.map((e, i) => (
                            <div key={i} style={{ fontSize: '0.8rem', display: 'flex', gap: 6, marginBottom: 6 }}>
                              <ExternalLink size={12} color="#10b981" />
                              <span>{typeof e === 'string' ? e : e.text}</span>
                              {e.source && <span style={{ color: '#818cf8', fontSize: '0.65rem' }}>— {e.source}</span>}
                              {e.credibility != null && <span style={{ color: '#6366f1', fontSize: '0.7rem' }}>({e.credibility}%)</span>}
                            </div>
                          ))}
                        </div>
                        <div>
                          <p style={{ fontSize: '0.7rem', fontWeight: 800, color: '#475569', marginBottom: 8 }}>SEARCH QUERIES</p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {claim.searchQueriesUsed?.map((q, i) => (
                              <span key={i} style={{ padding: '3px 8px', background: 'rgba(99,102,241,0.1)', color: '#818cf8', borderRadius: 4, fontSize: '0.7rem' }}>{q}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <button className="btn-sm" style={{ marginTop: '1rem' }} onClick={() => {
                        navigator.clipboard.writeText(`[${claim.verdict}] ${claim.claim}\nReasoning: ${claim.reasoning}`);
                        alert('Claim copied!');
                      }}>Copy This Claim</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Verify;
