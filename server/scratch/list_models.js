const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function run() {
  try {
    // In SDK v0.1.3 listModels was on genAI. In newest it might be different.
    // Testing common list endpoint
    const axios = require('axios');
    const res = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    console.log(JSON.stringify(res.data.models.map(m => m.name), null, 2));
  } catch (e) {
    console.log("FAILED:", e.response?.data || e.message);
  }
}
run();
