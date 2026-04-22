require('dotenv').config();
const axios = require('axios');

async function tryHuggingFaceFallback(parts, modelName) {
  const prompt = typeof parts === 'string' ? parts : JSON.stringify(parts);
  try {
    const response = await axios.post(
      `https://router.huggingface.co/hf-inference/models/${modelName}`,
      { inputs: prompt },
      { headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}` }, timeout: 12000 }
    );
    const data = response.data;
    const text = Array.isArray(data) ? data[0]?.generated_text : data?.generated_text;
    return text || null;
  } catch (e) { 
    console.error(`  [HF-Error] ${modelName}:`, e.response?.data || e.message);
    throw e;
  }
}

async function run() {
  await tryHuggingFaceFallback("Hello, who are you?", "mistralai/Mistral-7B-Instruct-v0.2").catch(() => {});
  await tryHuggingFaceFallback("Hello, who are you?", "google/gemma-1.1-7b-it").catch(() => {});
  console.log("Done");
}
run();
