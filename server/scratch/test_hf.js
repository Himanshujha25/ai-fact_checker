const axios = require('axios');
require('dotenv').config();

async function run() {
  try {
    const res = await axios.post(
      'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2',
      { inputs: "Hello" },
      { headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}` } }
    );
    console.log("SUCCESS:", res.data);
  } catch (e) {
    console.log("FAILED:", e.response?.data || e.message);
  }
}
run();
