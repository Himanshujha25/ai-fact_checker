require('dotenv').config();
const { HfInference } = require('@huggingface/inference');

async function testSDK() {
  const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
  const prompt = `Extract exactly 2 core factual claims from the following content. Include the "primaryEntity" and whether it "isTimeSensitive". Format as strict JSON array: [{ "claim": "text", "primaryEntity": "text", "isTimeSensitive": boolean }].\n\nContent: Is the earth flat?`;
  try {
    const result = await hf.chatCompletion({
      model: 'meta-llama/Meta-Llama-3-8B-Instruct',
      messages: [{role: "user", content: prompt}],
      max_tokens: 1500
    });
    console.log("Success:", result.choices[0].message);
  } catch (e) {
    console.log("Failed SDK:", e.message, e);
  }
}
testSDK();
