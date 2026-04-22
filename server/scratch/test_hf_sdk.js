require('dotenv').config();
const { HfInference } = require('@huggingface/inference');

async function testSDK() {
  try {
    const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
    const result = await hf.textGeneration({
      model: 'mistralai/Mistral-7B-Instruct-v0.2',
      inputs: 'Hello who are you?'
    });
    console.log("Success:", result);
  } catch (e) {
    console.log("Failed SDK:", e.message);
  }
}
testSDK();
