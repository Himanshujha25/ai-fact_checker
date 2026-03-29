import html2pdf from 'html2pdf.js';

export const generatePDF = (results, exportName, userOrgName = '', logoUrl = '') => {
  if (!results) return;
  
  const fmt = (v=0) => Math.round(v);
  const today = new Date().toLocaleDateString('en-US',{ year:'numeric', month:'long', day:'numeric' });
  const reportId = results.reportId || ('TC-'+Math.random().toString(36).substring(2,9).toUpperCase());
  
  const sanitized = exportName.trim().replace(/\s+/g,'_').toLowerCase();
  const fileName = sanitized ? `${sanitized}_truecast_${reportId}.pdf` : `TrueCast_Report_${reportId}.pdf`;
  
  const verdictColor = v => {
    const l=(v||'').toLowerCase();
    if (['true','accurate','verified'].includes(l)) return { bg:'rgba(16,185,129,0.15)', fg:'#34D399', dot:'#10B981' };
    if (['false','inaccurate'].includes(l))         return { bg:'rgba(239,68,68,0.15)', fg:'#F87171', dot:'#EF4444' };
    if (['partially true','mixed'].includes(l))     return { bg:'rgba(245,158,11,0.15)', fg:'#FBBF24', dot:'#F59E0B' };
    return { bg:'rgba(255,255,255,0.05)', fg:'#A1A1AA', dot:'#71717A' };
  };
  
  const scoreColor = s => s>=70?'#34D399':s>=40?'#FBBF24':'#F87171';
  const scoreBg    = s => s>=70?'rgba(16,185,129,0.08)':s>=40?'rgba(245,158,11,0.08)':'rgba(239,68,68,0.08)';
  const sc = results.truthScore || 0;
  const scoreLabel = sc>=75?'High Confidence':sc>=50?'Moderate Confidence':'Low Confidence';
  
  const claimsHTML = (results.claims||[]).map((c,i) => {
    const vc=verdictColor(c.verdict), pct=fmt((c.confidence||0)*100), row=i%2===0?'#111118':'#16161D';
    return `<tr style="background:${row};border-bottom:1px solid #272732;">
      <td style="padding:12px 16px;width:120px;vertical-align:top;">
        <span style="display:inline-flex;align-items:center;gap:5px;background:${vc.bg};color:${vc.fg};font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:3px 9px;border-radius:4px;">
          <span style="width:6px;height:6px;border-radius:50%;background:${vc.dot};flex-shrink:0;"></span>${c.verdict||'Pending'}
        </span>
      </td>
      <td style="padding:12px 16px;vertical-align:top;">
        <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#E8E4DC;line-height:1.5;">${c.claim||'—'}</p>
        <p style="margin:0;font-size:12px;color:#A1A1AA;line-height:1.55;">${c.reasoning||''}</p>
      </td>
      <td style="padding:12px 16px;width:70px;vertical-align:top;text-align:right;">
        <span style="font-size:18px;font-weight:700;color:${pct>=70?'#FBBF24':'#71717A'};">${pct}<span style="font-size:10px;font-weight:400;">%</span></span>
      </td>
    </tr>`;
  }).join('');
  
  const aiSection = results.aiTextDetection ? `<div style="display:flex;gap:16px;margin-bottom:28px;">
    <div style="flex:1;background:#16161D;border:1px solid #272732;border-radius:10px;padding:18px 20px;">
      <p style="margin:0 0 6px;font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#71717A;">AI Text Probability</p>
      <p style="margin:0;font-size:30px;font-weight:700;color:#E8E4DC;line-height:1;">${results.aiTextDetection.score||0}<span style="font-size:14px;font-weight:400;color:#A1A1AA;">%</span></p>
      <p style="margin:6px 0 0;font-size:12px;color:#A1A1AA;">${results.aiTextDetection.score>50?'Likely synthesized content':'Likely human-authored content'}</p>
      ${results.aiTextDetection.explanation?`<p style="margin:8px 0 0;font-size:11px;color:#71717A;line-height:1.5;">${results.aiTextDetection.explanation}</p>`:''}
    </div>
    ${results.aiMediaDetection?`<div style="flex:1;background:#16161D;border:1px solid #272732;border-radius:10px;padding:18px 20px;">
      <p style="margin:0 0 6px;font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#71717A;">Media Authentication</p>
      <p style="margin:0;font-size:30px;font-weight:700;color:#E8E4DC;line-height:1;">${results.aiMediaDetection.verdict||'Clear'}</p>
      ${results.aiMediaDetection.summary?`<p style="margin:8px 0 0;font-size:11px;color:#71717A;line-height:1.5;">${results.aiMediaDetection.summary}</p>`:''}
    </div>`:''}
  </div>` : '';
  
  const headerLogoHtml = logoUrl 
    ? `<img src="${logoUrl}" alt="Org Logo" style="height:32px;margin-right:12px;vertical-align:middle;"/>` 
    : '';
  
  const authorRow = exportName.trim() ? `<tr><td style="padding:6px 0;font-size:11px;color:#71717A;font-weight:600;text-transform:uppercase;letter-spacing:.06em;">Author</td><td style="padding:6px 0;font-size:13px;color:#E8E4DC;">${exportName.trim()}</td></tr>` : '';
  const orgRow = userOrgName ? `<tr><td style="padding:6px 0;font-size:11px;color:#71717A;font-weight:600;text-transform:uppercase;letter-spacing:.06em;">Organization</td><td style="padding:6px 0;font-size:13px;color:#E8E4DC;">${userOrgName}</td></tr>` : '';

  const evidenceHTML = (results.claims||[]).map((c, i) => {
    const vc=verdictColor(c.verdict);
    const evList = (c.evidence||[]).map((ev, j) => `
      <div style="margin-top:12px;padding:12px;background:#1A1A24;border:1px solid #272732;border-left:3px solid ${vc.dot};border-radius:6px;">
        <div style="font-size:10px;font-weight:700;color:#71717A;margin-bottom:6px;text-transform:uppercase;">Source: ${ev.source || 'Intelligence Stream'}</div>
        <p style="margin:0 0 8px;font-size:12px;color:#D4D4D8;line-height:1.5;">"${ev.text}"</p>
        ${ev.url ? `<a href="${ev.url}" target="_blank" style="font-size:11px;color:#60A5FA;text-decoration:none;">🔗 View Original Citation</a>` : ''}
      </div>
    `).join('');

    return `
      <div style="display:block;page-break-inside:avoid;margin-bottom:24px;">
        <div style="background:#16161D;border:1px solid #272732;border-radius:10px;padding:20px;">
          <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;">
            <span style="display:inline-flex;align-items:center;gap:5px;background:${vc.bg};color:${vc.fg};font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:3px 9px;border-radius:4px;">
              <span style="width:6px;height:6px;border-radius:50%;background:${vc.dot};flex-shrink:0;"></span>${c.verdict||'Pending'}
            </span>
            <span style="font-size:13px;font-weight:600;color:#E8E4DC;line-height:1.5;">Claim ${i + 1}</span>
          </div>
          <p style="margin:0 0 16px;font-size:14px;font-weight:600;color:#E8E4DC;line-height:1.5;">${c.claim||'—'}</p>
          <div style="font-size:12px;color:#A1A1AA;margin-bottom:16px;"><strong>AI Analysis:</strong> ${c.reasoning||'No granular AI analysis provided.'}</div>
          <h4 style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#71717A;margin:0 0 8px 0;">Retrieved Evidence</h4>
          ${evList || '<p style="margin:0;font-size:11px;color:#71717A;font-style:italic;">No discrete citations extracted. Consensus verified internally.</p>'}
        </div>
      </div>
    `;
  }).join('');

  const fullEvidenceSection = results.claims?.length > 0 ? `
    <div style="page-break-before:always;padding:36px 36px 40px;">
      <h2 style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;color:#E8E4DC;margin:0 0 6px;letter-spacing:-.01em;">Source Explorer Dossier</h2>
      <p style="margin:0 0 24px;font-size:13px;color:#A1A1AA;">Granular evidence, citations, and AI analysis for each verified assertion.</p>
      ${evidenceHTML}
    </div>
  ` : '';

  const html = `
    <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:13px;color:#E8E4DC;background:#111118;padding:0;margin:0;max-width:760px;box-sizing:border-box;">
      <div style="background:#09090C;padding:28px 36px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              ${headerLogoHtml}
              <span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;color:#C9A84C;letter-spacing:.04em;vertical-align:middle;">TRUECAST</span>
              <span style="display:block;font-size:9px;color:rgba(201,168,76,.55);letter-spacing:.18em;text-transform:uppercase;margin-top:3px;">Intelligence · Verification · Forensics</span>
            </td>
            <td style="text-align:right;vertical-align:top;">
              <span style="font-size:9px;color:rgba(255,255,255,.35);font-family:monospace;letter-spacing:.06em;text-transform:uppercase;line-height:1.8;">OFFICIAL AUDIT REPORT<br>${today}<br>REF: ${reportId}</span>
            </td>
          </tr>
        </table>
      </div>
      <div style="height:3px;background:linear-gradient(90deg,#C9A84C 0%,#F0D080 50%,#C9A84C 100%);"></div>
      
      <div style="padding:36px 36px 40px;">
        <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:400;color:#E8E4DC;margin:0 0 6px;letter-spacing:-.02em;">Forensic Fact-Check Report</h1>
        <p style="margin:0 0 28px;font-size:13px;color:#A1A1AA;">Automated multi-source intelligence audit with confidence scoring.</p>
        
        <div style="display:flex;align-items:stretch;gap:0;border:1px solid #272732;border-radius:12px;overflow:hidden;margin-bottom:28px;">
          <div style="background:${scoreBg};padding:24px 28px;min-width:160px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;">
            <span style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${scoreColor(sc)};opacity:.7;margin-bottom:8px;">Truth Index</span>
            <span style="font-family:Georgia,'Times New Roman',serif;font-size:52px;font-weight:400;color:${scoreColor(sc)};line-height:1;">${fmt(sc)}</span>
            <span style="margin-top:10px;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:${scoreColor(sc)};background:${scoreColor(sc)}18;padding:3px 10px;border-radius:4px;">${scoreLabel}</span>
          </div>
          <div style="flex:1;padding:22px 28px;border-left:1px solid #272732;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              <tr><td style="padding:6px 0;font-size:11px;color:#71717A;width:140px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;">Claims Reviewed</td><td style="padding:6px 0;font-size:13px;color:#E8E4DC;font-weight:600;">${results.claims?.length||0}</td></tr>
              <tr><td style="padding:6px 0;font-size:11px;color:#71717A;font-weight:600;text-transform:uppercase;letter-spacing:.06em;">Report ID</td><td style="padding:6px 0;font-size:13px;color:#E8E4DC;font-family:monospace;">${reportId}</td></tr>
              ${authorRow}
              ${orgRow}
              <tr><td style="padding:6px 0 0;font-size:11px;color:#71717A;font-weight:600;text-transform:uppercase;letter-spacing:.06em;vertical-align:top;">Assessment</td><td style="padding:6px 0 0;"><span style="font-size:13px;color:${scoreColor(sc)};font-weight:600;">${sc>=75?'✓ Largely verifiable and evidence-supported.':sc>=45?'⚠ Mixed or partially verifiable claims.':'✗ Significant inaccuracies detected.'}</span></td></tr>
            </table>
          </div>
        </div>
        
        ${aiSection}
        
        <h2 style="font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:400;color:#E8E4DC;margin:0 0 14px;letter-spacing:-.01em;">Verified Assertions</h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #272732;border-radius:10px;overflow:hidden;font-size:13px;">
          <thead>
            <tr style="background:#16161D;border-bottom:2px solid #272732;">
              <th style="padding:11px 16px;text-align:left;font-size:9px;font-weight:700;color:#71717A;width:120px;">VERDICT</th>
              <th style="padding:11px 16px;text-align:left;font-size:9px;font-weight:700;color:#71717A;">CLAIM & REASONING</th>
              <th style="padding:11px 16px;text-align:right;font-size:9px;font-weight:700;color:#71717A;width:70px;">CONF.</th>
            </tr>
          </thead>
          <tbody>
            ${claimsHTML||`<tr><td colspan="3" style="padding:24px 16px;text-align:center;color:#71717A;">No claims extracted.</td></tr>`}
          </tbody>
        </table>
        
        <div style="margin-top:36px;padding:16px 20px;background:rgba(245,158,11,0.05);border:1px solid rgba(245,158,11,0.2);border-radius:8px;border-left:4px solid #FBBF24;">
          <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#FBBF24;">Disclaimer</p>
          <p style="margin:0;font-size:11px;color:#D4D4D8;line-height:1.6;">This report is generated by an automated AI system and is intended as a supplementary research aid only.</p>
        </div>
      </div>
      
      ${fullEvidenceSection}
      
      <div style="background:#16161D;border-top:1px solid #272732;padding:16px 36px;display:flex;align-items:center;justify-content:space-between;">
        <span style="font-family:Georgia,'Times New Roman',serif;font-size:12px;color:#C9A84C;letter-spacing:.06em;">TRUECAST</span>
        <span style="font-size:10px;color:#A1A1AA;font-family:monospace;letter-spacing:.04em;">${today} · REF: ${reportId}</span>
        <span style="font-size:10px;color:#A1A1AA;">truecast.ai</span>
      </div>
    </div>`;
    
  html2pdf().from(html).set({
    margin:0, filename:fileName,
    image:{ type:'jpeg', quality:0.97 },
    html2canvas:{ 
      scale:2.5, 
      backgroundColor:'#111118', 
      useCORS:true, 
      logging:false, 
      letterRendering:true,
      ignoreElements: (el) => el.tagName === 'STYLE' || el.tagName === 'LINK' || el.tagName === 'META' || el.tagName === 'SCRIPT' || el.hasAttribute('data-html2canvas-ignore')
    },
    jsPDF:{ unit:'mm', format:'a4', orientation:'portrait' },
    pagebreak:{ mode:['avoid-all','css','legacy'] },
  }).save();
};
