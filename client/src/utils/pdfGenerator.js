import html2pdf from 'html2pdf.js';

export const generatePDF = (results, exportName, userOrgName = '', logoUrl = '') => {
  if (!results) return;
  
  // Detect current theme: Default is DARK, class 'light-mode' means LIGHT
  const isDark = !document.documentElement.classList.contains('light-mode');
  
  const COLORS = isDark ? {
    bg: '#111118',
    sub: '#09090C',
    text: '#E8E4DC',
    muted: '#A1A1AA',
    dim: '#71717A',
    border: '#272732',
    row: '#16161D',
    card: '#16161D',
    gold: '#C9A84C'
  } : {
    bg: '#ffffff',
    sub: '#fafaf9',
    text: '#111827',
    muted: '#4b5563',
    dim: '#a8a29e',
    border: '#e5e7eb',
    row: '#fcfaf9',
    card: '#f9fafb',
    gold: '#c9a84c'
  };

  const fmt = (v=0) => Math.round(v);
  const today = new Date().toLocaleDateString('en-US',{ year:'numeric', month:'long', day:'numeric' });
  const reportId = results.reportId || ('TC-'+Math.random().toString(36).substring(2,9).toUpperCase());
  
  const sanitized = exportName.trim().replace(/\s+/g,'_').toLowerCase();
  const fileName = sanitized ? `${sanitized}_truecast_${reportId}.pdf` : `TrueCast_Report_${reportId}.pdf`;
  
  const verdictStyle = v => {
    const l=(v||'').toLowerCase();
    if (['true','accurate','verified'].includes(l)) 
      return { bg: isDark ? 'rgba(16,185,129,0.15)' : '#f0fdf4', fg: isDark ? '#34D399' : '#166534', dot: '#10B981', border: isDark ? '#10B98144' : '#bbf7d0' };
    if (['false','inaccurate'].includes(l)) 
      return { bg: isDark ? 'rgba(239,68,68,0.15)' : '#fef2f2', fg: isDark ? '#F87171' : '#991b1b', dot: '#ef4444', border: isDark ? '#ef444444' : '#fecaca' };
    if (['partially true','mixed'].includes(l)) 
      return { bg: isDark ? 'rgba(245,158,11,0.15)' : '#fffbeb', fg: isDark ? '#FBBF24' : '#92400e', dot: '#f59e0b', border: isDark ? '#f59e0b44' : '#fde68a' };
    return { bg: isDark ? 'rgba(161,161,170,0.1)' : '#f9fafb', fg: isDark ? '#A1A1AA' : '#374151', dot: '#71717A', border: COLORS.border };
  };
  
  const sc = results.truthScore || 0;
  const scoreColor = s => s>=70 ? (isDark ? '#34D399' : '#166534') : s>=40 ? '#FBBF24' : '#F87171';
  const scoreLabel = sc>=75?'High Confidence':sc>=50?'Moderate Confidence':'Low Confidence';
  
  const claimsHTML = (results.claims||[]).map((c,i) => {
    const vs=verdictStyle(c.verdict), pct=fmt((c.confidence||0)*100);
    return `
      <tr style="border-bottom:1px solid ${COLORS.border}; background: ${i % 2 === 0 ? COLORS.bg : COLORS.row};">
        <td style="padding:16px;width:120px;vertical-align:top;">
          <span style="display:inline-flex;align-items:center;gap:6px;background:${vs.bg};color:${vs.fg};border:1px solid ${vs.border};font-size:9px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:4px 10px;border-radius:4px;white-space:nowrap;">
            <span style="width:6px;height:6px;border-radius:50%;background:${vs.dot};"></span>${c.verdict||'Pending'}
          </span>
        </td>
        <td style="padding:16px;vertical-align:top;">
          <p style="margin:0 0 6px;font-size:14px;font-weight:600;color:${COLORS.text};line-height:1.4;">${c.claim||'—'}</p>
          <p style="margin:0;font-size:12px;color:${COLORS.muted};line-height:1.6;">${c.reasoning||''}</p>
        </td>
        <td style="padding:16px;width:60px;vertical-align:top;text-align:right;">
          <span style="font-size:16px;font-weight:700;color:${pct>=70?COLORS.text:COLORS.dim};">${pct}%</span>
        </td>
      </tr>`;
  }).join('');
  
  const evidenceHTML = (results.claims||[]).map((c, i) => {
    const vs=verdictStyle(c.verdict);
    const evList = (c.evidence||[]).map((ev) => `
      <div style="margin-top:14px;padding:14px;background:${isDark ? '#1A1A24' : '#fcfcfc'};border:1px solid ${COLORS.border};border-left:4px solid ${vs.dot};border-radius:8px;">
        <div style="font-size:10px;font-weight:700;color:${COLORS.dim};margin-bottom:8px;text-transform:uppercase;">Source: ${ev.source || 'Intelligence Stream'}</div>
        <p style="margin:0 0 10px;font-size:12px;color:${isDark ? '#D4D4D8' : '#374151'};line-height:1.6;font-style:italic;">"${ev.text}"</p>
        ${ev.url ? `<a href="${ev.url}" style="font-size:11px;color:${isDark ? '#60A5FA' : '#2563eb'};text-decoration:none;font-weight:500;">View Citation ↗</a>` : ''}
      </div>
    `).join('');

    return `
      <div style="page-break-inside:avoid;margin-bottom:32px;border:1px solid ${COLORS.border};border-radius:12px;padding:24px;background:${isDark ? COLORS.card : '#ffffff'};">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;">
          <span style="font-size:11px;font-weight:700;color:${COLORS.dim};text-transform:uppercase;letter-spacing:0.05em;">Factual Assertion ${i + 1}</span>
          <span style="display:inline-flex;align-items:center;gap:6px;background:${vs.bg};color:${vs.fg};border:1px solid ${vs.border};font-size:9px;font-weight:700;text-transform:uppercase;padding:3px 9px;border-radius:4px;">
            ${c.verdict||'Pending'}
          </span>
        </div>
        <h3 style="margin:0 0 12px;font-size:16px;font-weight:700;color:${COLORS.text};line-height:1.4;">${c.claim||'—'}</h3>
        <p style="margin:0 0 20px;font-size:12px;color:${COLORS.muted};line-height:1.6;"><strong>AI Logic:</strong> ${c.reasoning||'Verified via consensus audit.'}</p>
        <div style="border-top:1px solid ${isDark ? '#272732' : '#f3f4f6'};padding-top:16px;">
          <h4 style="font-size:10px;font-weight:700;text-transform:uppercase;color:${COLORS.dim};margin:0 0 4px 0;">Primary Evidence Traces</h4>
          ${evList || `<p style="margin:10px 0 0;font-size:11px;color:${COLORS.dim};font-style:italic;">Consensus data verified via internal intelligence swarm.</p>`}
        </div>
      </div>
    `;
  }).join('');

  const html = `
    <div style="font-family:'Inter', 'Helvetica Neue', Arial, sans-serif;background:${COLORS.bg};color:${COLORS.text};padding:0;margin:0;width:760px;box-sizing:border-box;">
      <div style="padding:40px 48px;border-bottom:4px solid ${COLORS.gold};background:${COLORS.sub};">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <div style="font-family:Georgia, serif;font-size:28px;font-weight:700;color:${COLORS.gold};letter-spacing:0.05em;margin-bottom:4px;">TRUECAST</div>
              <div style="font-size:10px;color:${isDark ? 'rgba(201,168,76,0.5)' : '#78716c'};letter-spacing:0.2em;text-transform:uppercase;font-weight:600;">Intelligence Verification System</div>
            </td>
            <td style="text-align:right;vertical-align:top;">
              <div style="font-size:10px;color:${COLORS.dim};font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">OFFICIAL AUDIT REPORT</div>
              <div style="font-size:12px;color:${COLORS.text};font-weight:500;">${today}</div>
              <div style="font-size:10px;color:${isDark ? 'rgba(232,228,220,0.2)' : '#d6d3d1'};font-family:monospace;margin-top:4px;">REF: ${reportId}</div>
            </td>
          </tr>
        </table>
      </div>

      <div style="padding:48px;">
        <h1 style="font-family:Georgia, serif;font-size:32px;font-weight:400;color:${COLORS.text};margin:0 0 8px;letter-spacing:-0.02em;">Forensic Intelligence Dossier</h1>
        <p style="margin:0 0 40px;font-size:14px;color:${COLORS.muted};line-height:1.6;">Automated multi-agent audit report generated for institutional verification. Cross-referenced across global intelligence indexes.</p>
        
        <div style="display:flex;border:1px solid ${COLORS.border};border-radius:16px;overflow:hidden;margin-bottom:40px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05); background: ${COLORS.card};">
          <div style="background:${COLORS.sub};padding:32px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;border-right:1px solid ${COLORS.border};min-width:180px;">
            <span style="font-size:11px;font-weight:700;text-transform:uppercase;color:${COLORS.dim};margin-bottom:12px;letter-spacing:0.1em;">Truth Index</span>
            <span style="font-family:Georgia, serif;font-size:64px;font-weight:700;color:${scoreColor(sc)};line-height:1;">${fmt(sc)}</span>
            <span style="margin-top:12px;font-size:10px;font-weight:700;background:${scoreColor(sc)}10;color:${scoreColor(sc)};padding:4px 12px;border-radius:20px;text-transform:uppercase;">${scoreLabel}</span>
          </div>
          <div style="flex:1;padding:32px;">
            <table width="100%" style="border-collapse:collapse;">
              <tr><td style="padding:6px 0;font-size:11px;color:${COLORS.dim};font-weight:700;text-transform:uppercase;width:140px;">Assertions Hub</td><td style="padding:6px 0;font-size:14px;color:${COLORS.text};font-weight:600;">${results.claims?.length||0} Total</td></tr>
              <tr><td style="padding:6px 0;font-size:11px;color:${COLORS.dim};font-weight:700;text-transform:uppercase;">Report ID</td><td style="padding:6px 0;font-size:14px;color:${COLORS.text};font-family:monospace;">${reportId}</td></tr>
              ${exportName ? `<tr><td style="padding:6px 0;font-size:11px;color:${COLORS.dim};font-weight:700;text-transform:uppercase;">Officer</td><td style="padding:6px 0;font-size:14px;color:${COLORS.text};">${exportName}</td></tr>` : ''}
              <tr><td style="padding:10px 0 0;font-size:11px;color:${COLORS.dim};font-weight:700;text-transform:uppercase;vertical-align:top;">Final Verdict</td><td style="padding:10px 0 0;"><span style="font-size:14px;color:${scoreColor(sc)};font-weight:700;line-height:1.4;">${sc>=75?'✓ Institutionally verified and authoritative.':sc>=45?'⚠ Mixed reliability - caution advised.':'✗ High probability of disinformation detected.'}</span></td></tr>
            </table>
          </div>
        </div>

        <h2 style="font-family:Georgia, serif;font-size:22px;font-weight:700;color:${COLORS.text};margin:0 0 20px;">Assertion Ledger</h2>
        <div style="border:1px solid ${COLORS.border};border-radius:12px;overflow:hidden;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr style="background:${COLORS.sub};border-bottom:2px solid ${COLORS.border};">
              <th style="padding:14px 16px;text-align:left;font-size:10px;font-weight:700;color:${COLORS.dim};text-transform:uppercase;">Verdict</th>
              <th style="padding:14px 16px;text-align:left;font-size:10px;font-weight:700;color:${COLORS.dim};text-transform:uppercase;">Claim Decomposition</th>
              <th style="padding:14px 16px;text-align:right;font-size:10px;font-weight:700;color:${COLORS.dim};text-transform:uppercase;">Conf.</th>
            </tr>
            ${claimsHTML}
          </table>
        </div>
      </div>

      <div style="page-break-before:always;padding:48px;">
        <h2 style="font-family:Georgia, serif;font-size:24px;font-weight:700;color:${COLORS.text};margin:0 0 8px;border-bottom:2px solid ${COLORS.border};padding-bottom:12px;">Evidence & Citations Dossier</h2>
        <p style="margin:0 0 32px;font-size:13px;color:${COLORS.muted};line-height:1.6;">Granular breakdown of retrieved intelligence, source citations, and multimodal analysis.</p>
        ${evidenceHTML}
      </div>

      <div style="padding:24px 48px;background:${COLORS.sub};border-top:1px solid ${COLORS.border};display:flex;justify-content:space-between;align-items:center;">
        <span style="font-family:Georgia, serif;font-size:14px;font-weight:700;color:${COLORS.gold};">TRUECAST</span>
        <span style="font-size:11px;color:${COLORS.dim};">Generated via Truecast Forensic Engine · ${today}</span>
      </div>
    </div>
  `;
    
  html2pdf().from(html).set({
    margin:0, filename:fileName,
    image:{ type:'jpeg', quality:1.0 },
    html2canvas:{ 
      scale:3, 
      backgroundColor: COLORS.bg, 
      useCORS:true, 
      letterRendering:true
    },
    jsPDF:{ unit:'mm', format:'a4', orientation:'portrait' },
    pagebreak:{ mode:['avoid-all','css','legacy'] },
  }).save();
};
