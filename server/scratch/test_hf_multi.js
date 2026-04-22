require('dotenv').config();
const { HfInference } = require('@huggingface/inference');

async function testSDK() {
  const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
  const models = ['meta-llama/Meta-Llama-3-8B-Instruct', 'google/gemma-1.1-7b-it', 'NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO'];
  for (const m of models) {
    try {
      const result = await hf.chatCompletion({
        model: m,
        messages: [{role: "user", content: "Hello"}]
      });
      console.log(`Success ${m}:`, result.choices[0].message);
      return;
    } catch (e) {
      console.log(`Failed ${m}:`, e.message);
    }
  }
}
testSDK();
