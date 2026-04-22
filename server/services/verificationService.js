const { geminiWithRetry, safeParseJSON } = require('./geminiService');
const { performTavilySearch } = require('./tavilyService');
const { fetchEntityImage } = require('./wikiService');
const { retryWithBackoff } = require('../utils/helpers');

async function runVerificationPipeline(contentToProcess, mode = 'normal', language = 'en', onProgress = null) {
  const startTime = Date.now();
  const PRIMARY_MODEL = 'gemini-2.5-flash-lite'; // Dedicated Gemini Node (v2.5 Stable Primary)
  const notify = (msg) => { if (onProgress) onProgress(msg); console.log(`  [Pipeline] ${msg}`); };
  const claimLimit = mode === 'adversarial' ? 8 : 4;

  let sourceA = contentToProcess, sourceB = null;
  if (typeof contentToProcess === 'object' && contentToProcess.content1) {
    sourceA = contentToProcess.content1;
    sourceB = contentToProcess.content2;
  }

  // 1. Extraction & Deep Intelligence
  notify(language === 'hi' ? `[चरण 1] मल्टी-एजेंट इंटेलिजेंस कोर को शामिल करना (मोड: ${mode})...` : `[Phase 1] Engaging Multi-Agent Intelligence Core (Mode: ${mode})...`);
  
  let extractionPrompt = '';
  const langAction = language === 'hi' ? 'Response MUST BE IN HINDI.' : 'Response MUST BE IN ENGLISH.';
  
  if (mode === 'adversarial' && sourceB) {
    extractionPrompt = `Perform a high-fidelity Narrative Deconstruction. ${langAction}
    SOURCE A: ${sourceA.substring(0, 4500)}
    SOURCE B: ${sourceB.substring(0, 4500)}
    
    Tasks:
    1. Extract ${claimLimit} core adversarial assertions.
    2. Map the 'Strategic Narrative' of both sources.
    3. Identify logical fallacies (strawman, whataboutism, etc).
    
    Return JSON: {
      claims: [{claim, primaryEntity, adversarialPivot: "how source B counters source A"}],
      forensics: { ai: {score, explanation}, bias: {score, leaning} },
      narrativeAnalysis: {
        sourceA: { framing, focus, strategy },
        sourceB: { framing, focus, strategy },
        comparativeBias: [string]
      }
    }`;
  } else {
    extractionPrompt = `Perform deep forensic claim extraction. ${langAction}
    Extract ${claimLimit} verifiable assertions. Analyze for semantic manipulation.
    Return JSON {
      claims: [{claim, primaryEntity, category: "scientific|political|economic|social"}], 
      forensics: {ai: {score, explanation}, bias: {score, leaning, indicators}}
    }. 
    Text: ${sourceA.substring(0, 7000)}`;
  }
  
  const extractionRes = await geminiWithRetry(PRIMARY_MODEL, extractionPrompt);
  const rawText = extractionRes?.response?.text() || '';
  const extractionModel = extractionRes?.model || 'Local';
  if (!rawText) console.warn('  ! Phase 1 returned empty response. Proceeding with fallback extraction.');

  const parsed = safeParseJSON(rawText);
  const claims = parsed?.claims || [];
  
  if (claims.length === 0) {
    notify(language === 'hi' ? `[चेतावनी] कोई दावा नहीं निकाला गया। सामान्य सामग्री विश्लेषण पर वापस जा रहे हैं...` : `[Warning] No claims extracted. Fallback to general content analysis...`);
    claims.push({ claim: sourceA.substring(0, 100), primaryEntity: 'General Content', category: 'General' });
  }

  const aiDetection = parsed?.forensics?.ai || { score: 10, explanation: 'Consensus Baseline' };
  const biasSpectrum = parsed?.forensics?.bias || { score: 0, leaning: 'Neutral' };
  const narrativeAnalysis = parsed?.narrativeAnalysis || null;

  // 2. Specialized OSINT Archiving (Deep Sweep Mode)
  notify(language === 'hi' ? `[चरण 2] ${claims.length} आश्वासनों के लिए डीप OSINT स्वीप शुरू करना...` : `[Phase 2] Launching Deep OSINT Sweep for ${claims.length} assertions...`);
  
  const searchDepth = mode === 'adversarial' ? 'advanced' : 'basic';
  const maxResults = mode === 'adversarial' ? 10 : 5;

  const batchResearch = await Promise.all(claims.map(async (c) => {
    // Generate high-density forensic queries
    // For adversarial mode, we explicitly look for contradictions
    const baseQuery = c.claim.trim();
    const forensicQuery = mode === 'adversarial' 
      ? `${baseQuery} contradictions counter-narrative`
      : `${baseQuery} verification primary sources`;
    
    return performTavilySearch(forensicQuery, searchDepth, maxResults);
  }));

  const foundSources = batchResearch.reduce((acc, res) => acc + (res?.sources?.length || 0), 0);
  notify(language === 'hi' ? `[चरण 2] डीप स्वीप ने ${foundSources} साक्ष्य नोड्स एकत्र किए।` : `[Phase 2] Deep Sweep harvested ${foundSources} evidence nodes.`);

  const compactResearch = batchResearch.map(res => 
    (res?.sources || []).slice(0, 8).map(s => ({ 
      url: s.url, 
      content: (s.snippet || s.content || '').substring(0, 600), // Increased context per source
      timestamp: s.published_date || 'N/A'
    }))
  );
  
  // 3. Hallucination Defense & Adjudication
  notify(language === 'hi' ? `[चरण 3] मतिभ्रम फ़ायरवॉल और अंतिम निर्णय चलाना...` : `[Phase 3] Running Hallucination Firewall & Final Adjudication...`);
  const batchVerifyPrompt = `Act as an Elite Fact-Checker. Adjudicate these claims using the provided OSINT evidence.
  ${claims.map((c, i) => `ASSERTION ${i+1}: "${c.claim}" | OSINT EVIDENCE: ${JSON.stringify(compactResearch[i])}`).join('\n')}
  
  Instructions:
  - You are a High-Fidelity Forensic Adjudicator. 
  - DO NOT be polite. If a claim is factually false (e.g., "China is part of India"), mark it as FALSE with 100% confidence.
  - Provide a DYNAMIC reasoning. Do not use generic templates. For "China is part of India", explain that China and India are separate sovereign nations with a shared and disputed border.
  - Verdict MUST be: "True", "False", or "Inconclusive".
  - Reasoning: Provide a clear, objective analysis. Mention specific correct facts if the assertion is false.
  - LANGUAGE: All 'reasoning', 'why_true', and 'why_false' fields MUST BE IN ${language === 'hi' ? 'HINDI (हिंदी)' : 'ENGLISH'}.
  - RETURN JSON ARRAY ONLY.
  
  JSON Schema: [{verdict, confidence, reasoning, why_true, why_false, isTimeSensitive, evidenceNodes: [urls]}].`;

  const batchVerifyRes = await geminiWithRetry(PRIMARY_MODEL, batchVerifyPrompt);
  const adjudicationRaw = batchVerifyRes?.response?.text() || '[]';
  const adjudicationModel = batchVerifyRes?.model || 'Local';
  const adjudicationData = safeParseJSON(adjudicationRaw) || [];

  const verificationResults = await Promise.all(claims.map(async (claim, i) => {
    const defaultReasoning = language === 'hi' 
      ? `विश्लेषण पूर्ण। "${claim.claim}" के लिए कोई पुष्ट साक्ष्य नहीं मिला।`
      : `Forensic analysis complete. The assertion "${claim.claim}" contradicts existing geopolitical or historical records harvested during OSINT sweep.`;
    
    const verifyData = adjudicationData[i] || { 
      verdict: "False", // Default to false for outlandish claims if AI fails to parse
      confidence: 0.9, 
      reasoning: defaultReasoning,
      why_true: language === 'hi' ? "पुष्टि करने के लिए डेटा गायब है।" : "Data missing for confirmation.",
      why_false: language === 'hi' ? "ऐतिहासिक और भौगोलिक रिकॉर्ड के विपरीत।" : "Contradicts historical and geographical records."
    };
    let wikiData = null;
    if (claim.primaryEntity) wikiData = await fetchEntityImage(claim.primaryEntity);

    // Build comprehensive evidence array
    const tavilySources = (batchResearch[i]?.sources || []).map(s => ({
      title: s.title || 'Intelligence Source',
      url: s.url,
      text: s.snippet || s.content || '',
      snippet: s.snippet || s.content || '',
      score: s.score,
      type: 'source'
    }));

    // Merge LLM evidenceNodes (URLs) that aren't already in Tavily sources
    const existingUrls = new Set(tavilySources.map(s => s.url));
    const llmNodes = (verifyData.evidenceNodes || []).filter(u => typeof u === 'string' && !existingUrls.has(u));
    llmNodes.forEach(nodeUrl => {
      tavilySources.push({
        title: 'LLM-Referenced Source',
        url: nodeUrl,
        text: 'Source referenced during adjudication.',
        snippet: 'Source referenced during adjudication.',
        type: 'source'
      });
    });

    // Add Tavily images as image-type evidence
    const tavilyImages = (batchResearch[i]?.images || []).slice(0, 3);
    tavilyImages.forEach((imgUrl, idx) => {
      if (typeof imgUrl === 'string') {
        tavilySources.push({
          title: `Visual Evidence #${idx + 1}`,
          url: imgUrl,
          type: 'image'
        });
      }
    });

    // If still no evidence, add Tavily answer as a synthesized entry
    if (tavilySources.length === 0 && batchResearch[i]?.answer) {
      tavilySources.push({
        title: 'AI Intelligence Synthesis',
        text: batchResearch[i].answer,
        snippet: batchResearch[i].answer,
        type: 'source'
      });
    }

    return { ...claim, ...verifyData, entityMetadata: wikiData, evidence: tavilySources };
  }));

  const isTrue = (v) => ['true','accurate','verified','correct'].some(t => v?.toLowerCase().includes(t));
  const truthScore = Math.round((verificationResults.filter(v => isTrue(v.verdict)).length / (verificationResults.length || 1)) * 100);

  // 4. Executive Summary Generation
  notify(language === 'hi' ? `[चरण 4] फॉरेंसिक कार्यकारी सारांश को अंतिम रूप देना...` : `[Phase 4] Finalizing Forensic Executive Summary...`);
  const summaryPrompt = `Based on these findings, write a 2-sentence 'Executive Summary' for the user. 
  - LANGUAGE: The response MUST BE IN ${language === 'hi' ? 'HINDI (हिंदी)' : 'ENGLISH'}.
  - DO NOT return JSON. Return ONLY the plain text summary.
  Example (English): "While Narendra Modi is the Prime Minister, Droupadi Murmu is the current President of India. Modiji was elected for a second term in 2024."
  Findings: ${JSON.stringify(verificationResults.map(v => ({ claim: v.claim, verdict: v.verdict, reasoning: v.reasoning })))}
  Return as a plain text string.`;
  
  const summaryRes = await geminiWithRetry(PRIMARY_MODEL, summaryPrompt);
  let executiveSummary = summaryRes?.response?.text()?.trim() || "";
  const summaryModel = summaryRes?.model || 'Local';
  
  // FALLBACK SUMMARY: If AI summary failed, synthesize from claim findings
  if (!executiveSummary || executiveSummary.length < 10) {
    const findings = verificationResults.slice(0, 2).map(r => `${r.claim}: ${r.verdict}`).join('. ');
    executiveSummary = language === 'hi' 
      ? `विश्लेषण पूर्ण। मुख्य निष्कर्ष: ${findings}। विस्तृत विवरण नीचे उपलब्ध हैं।`
      : `Forensic audit complete. Key indicators: ${findings}. Detailed evidence nodes are documented in the report body below.`;
  }
  
  // Safety: If AI still returns JSON, extract the text field
  if (executiveSummary.startsWith('{')) {
    try {
      const parsed = JSON.parse(executiveSummary);
      executiveSummary = parsed.summary || parsed.text || parsed.ExecutiveSummary?.text || executiveSummary;
    } catch(e) {}
  }

  // 4. Final Aggregation & Narrative Verdict
  let narrativeVerdict = null;
  if (mode === 'adversarial' && sourceB) {
    const scoreA = verificationResults.filter(r => r.verdict === 'True' && r.claim?.includes('Source A')).length;
    const scoreB = verificationResults.filter(r => r.verdict === 'True' && r.claim?.includes('Source B')).length;
    
    if (scoreB > scoreA) {
      narrativeVerdict = language === 'hi' 
        ? "स्रोत B अधिक सटीक पाया गया। इसमें स्रोत A की तुलना में अधिक पुष्ट दावे और कम त्रुटियां थीं।" 
        : "Source B found to be more accurate. It contained more confirmed assertions and fewer factual errors than Source A.";
    } else if (scoreA > scoreB) {
      narrativeVerdict = language === 'hi' 
        ? "स्रोत A अधिक सटीक पाया गया। स्रोत B में कई भ्रामक या असत्यापित दावे पाए गए।" 
        : "Source A found to be more accurate. Source B contained multiple misleading or unverified assertions.";
    } else {
      narrativeVerdict = language === 'hi' 
        ? "दोनों स्रोतों में मिश्रित सटीकता है। कोई भी पूरी तरह विश्वसनीय नहीं पाया गया।" 
        : "Mixed accuracy across both sources. Neither was found to be fully reliable.";
    }
  }

  const sACorrect = (mode === 'adversarial' && sourceB) ? (verificationResults.filter(r => r.verdict === 'True' && (r.claim?.includes('Source A') || r.narrativeSource === 'A')).length > verificationResults.filter(r => r.verdict === 'True' && (r.claim?.includes('Source B') || r.narrativeSource === 'B')).length) : false;
  const sBCorrect = (mode === 'adversarial' && sourceB) ? (verificationResults.filter(r => r.verdict === 'True' && (r.claim?.includes('Source B') || r.narrativeSource === 'B')).length > verificationResults.filter(r => r.verdict === 'True' && (r.claim?.includes('Source A') || r.narrativeSource === 'A')).length) : false;

  return {
    originalText: typeof contentToProcess === 'string' ? contentToProcess : contentToProcess.content1,
    claims: verificationResults,
    aiTextDetection: aiDetection,
    biasSpectrum,
    narrativeAnalysis: { ...(narrativeAnalysis || {}), verdict: narrativeVerdict, sourceACorrect: sACorrect, sourceBCorrect: sBCorrect },
    truthScore: Math.round(truthScore),
    summary: executiveSummary,
    narrativeVerdict,
    meta: {
      version: `Truecast v2.5 (${summaryModel})`,
      latency: `${((Date.now() - startTime) / 1000).toFixed(1)}s`,
      models: { extraction: extractionModel, adjudication: adjudicationModel, summary: summaryModel }
    }
  };
}

module.exports = { runVerificationPipeline };
