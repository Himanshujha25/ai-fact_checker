require('dotenv').config();
const { HfInference } = require('@huggingface/inference');

async function testHFDynamic() {
  const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
  const prompt = `Perform a batch verification for the following claims:
  CLAIM 1: "The earth is flat" | OSINT DATA: []
  
  Return a JSON array of verification results: [{verdict, confidence, reasoning}].
  ENSURE ORDER MATCHES THE INPUT CLAIMS.`;

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
testHFDynamic();
