const axios = require('axios');

async function performTavilySearch(query, depth = 'basic') {
  const apiKey = (process.env.TAVILY_API_KEY || '').replace(/['"]/g, '').trim();
  if (!apiKey) {
    console.warn('  ⚠ TAVILY_API_KEY missing — skipping live web search');
    return null;
  }

  try {
    let cleanQuery = typeof query === 'string' ? query : 'General research query';
    // Remove local/internal terms that Tavily hates (localhost, 127.0.0.1, etc)
    cleanQuery = cleanQuery.replace(/localhost|127\.0\.0\.1/gi, 'internet').replace(/["']/g, '');
    cleanQuery = cleanQuery.substring(0, 300).trim();
    
    if (cleanQuery.length < 5) cleanQuery = "Current events fact check";

    console.log(`  [Tavily] Researching query: "${cleanQuery}" (depth: ${depth})...`);
    const response = await axios.post('https://api.tavily.com/search', {
      api_key: apiKey,
      query: cleanQuery,
      search_depth: depth,
      include_answer: true,
      include_images: true,
      max_results: depth === 'advanced' ? 8 : 4
    }, { timeout: 15000 });

    const results = response.data;
    console.log(`  [Tavily] Found ${results.results?.length || 0} sources and ${results.images?.length || 0} images.`);

    return {
      answer: results.answer,
      images: results.images || [],
      sources: (results.results || []).map(r => ({
        title: r.title,
        url: r.url,
        snippet: r.content,
        score: r.score
      }))
    };
  } catch (err) {
    console.error('  ✗ Tavily Search Error:', err.message);
    
    // Fallback to Gemini Grounding Search if Tavily fails
    try {
      const { geminiWithRetry } = require('./geminiService');
      console.log('  [Fallback] Engaging Gemini Search Grounding...');
      const fallbackRes = await geminiWithRetry('gemini-2.5-flash', `Search the web and provide a detailed fact-check for: ${query}. Return sources if possible.`);
      const text = fallbackRes.response.text();
      
      return {
        answer: text,
        images: [],
        sources: [{ title: 'Gemini Search Intelligence', url: '#', snippet: text, score: 0.9 }]
      };
    } catch (gErr) {
      console.error('  ✗ Fallback also failed:', gErr.message);
      return null;
    }
  }
}

module.exports = { performTavilySearch };
