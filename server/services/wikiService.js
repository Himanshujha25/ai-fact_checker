const axios = require('axios');

async function fetchEntityImage(entityName) {
  if (!entityName) return null;
  const userAgent = `VeriCheck-Bot/1.1 (https://vericheck.ai) Google-Gemini-Agentic-Pipeline`;
  console.log(`  [Wiki] Searching for entity: "${entityName}"...`);

  const fetchWithRetry = async (url, retries = 2) => {
    for (let i = 0; i < retries; i++) {
      try {
        return await axios.get(url, {
          timeout: 10000,
          headers: { 'User-Agent': userAgent }
        });
      } catch (err) {
        if (err.response?.status === 429) {
          console.warn(`  [Wiki] Rate limited (429). Retrying after 2s...`);
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
        throw err;
      }
    }
  };

  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(`"${entityName}"`)}&format=json&utf8=1&srlimit=1`;
    const searchRes = await fetchWithRetry(searchUrl);
    const searchResult = searchRes.data?.query?.search?.[0];
    const pageTitle = searchResult?.title;

    if (!pageTitle) {
      console.log(`  [Wiki] No results for "${entityName}"`);
      return null;
    }

    const inputTerms = entityName.toLowerCase().split(' ').filter(t => t.length > 2);
    const resultTitle = pageTitle.toLowerCase();
    const isMatch = inputTerms.every(term => resultTitle.includes(term));

    if (!isMatch) {
      console.log(`  [Wiki] Rejecting mismatch: Search="${entityName}" Result="${pageTitle}"`);
      return { name: entityName, description: "Identified private profile (no Wikipedia match)", isPrivate: true };
    }

    const pageUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle.replace(/ /g, '_'))}`;
    const pageRes = await fetchWithRetry(pageUrl);
    const data = pageRes.data;

    return {
      name: data.title || pageTitle,
      description: data.description || "No description available",
      extract: data.extract?.substring(0, 300) || "No extract available",
      image: data.thumbnail?.source || data.originalimage?.source || null,
      wikipediaUrl: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle.replace(/ /g, '_'))}`
    };

  } catch (err) {
    return { name: entityName, description: "Identified private entity", isPrivate: true };
  }
}

module.exports = { fetchEntityImage };
