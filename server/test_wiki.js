const axios = require('axios');
(async () => {
  try {
    const res = await axios.get('https://en.wikipedia.org/api/rest_v1/page/summary/Honey_Singh', { headers: { 'User-Agent': 'Test' } });
    console.log('Result:', JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.error('Error:', e.message);
  }
})();
