const axios = require('axios');
async function test() {
  try {
    const res = await axios.get('https://router.huggingface.co/');
    console.log(res.data);
  } catch (e) {
    console.log("Failed:", e.response?.data || e.message);
  }
}
test();
