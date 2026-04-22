require('dotenv').config();
const { HfInference } = require('@huggingface/inference');

async function testHFDynamic2() {
  const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
  const prompt = `Extract AT MOST 3 verifiable claims and analyze AI detection (0-100) and bias (-100 to 100). Return JSON {claims: [], forensics: {ai: {score, explanation}, bias: {score, leaning, indicators}}}. Text: The earth is flat.`;

  const result = await hf.chatCompletion({
    model: 'meta-llama/Meta-Llama-3-8B-Instruct',
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content: "You are an intelligence analysis API. You only return strictly formatted, parsable JSON without markdown wrapper blocks or conversational chatter."
      },
      { role: "user", content: prompt }
    ]
  });

  console.log(result.choices[0]?.message?.content);
}
testHFDynamic2();
