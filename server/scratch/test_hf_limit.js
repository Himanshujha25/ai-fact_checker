require('dotenv').config();
const { HfInference } = require('@huggingface/inference');

async function testSDK() {
  const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
  try {
    const result = await hf.chatCompletion({
      model: 'meta-llama/Meta-Llama-3-8B-Instruct',
      messages: [{role: "user", content: "Hello"}],
      max_tokens: 1500
    });
    console.log("Success:", result.choices[0].message);
  } catch (e) {
    console.log("Failed SDK:", e.message);
  }
}
testSDK();
