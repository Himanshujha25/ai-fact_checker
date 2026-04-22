require('dotenv').config();
const axios = require('axios');

async function test(url) {
  try {
    const response = await axios.post(url, { inputs: "Hello" }, { headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}` } });
    console.log(`Success ${url}`);
  } catch (e) {
    console.log(`Failed ${url}:`, e.response?.data?.error || e.message);
  }
}

async function run() {
  await test('https://router.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2');
  await test('https://router.huggingface.co/mistralai/Mistral-7B-Instruct-v0.2');
  await test('https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2');
}
run();
