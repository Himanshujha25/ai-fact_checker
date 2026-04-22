require('dotenv').config();
const axios = require('axios');

async function testV1() {
  try {
    const response = await axios.post(
      'https://router.huggingface.co/hf-inference/v1/chat/completions',
      { model: "mistralai/Mistral-7B-Instruct-v0.2", messages: [{role: "user", content: "Hello"}] },
      { headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}` } }
    );
    console.log(`Success v1:`, response.data.choices[0].message);
  } catch (e) {
    console.log(`Failed v1:`, e.response?.data || e.message);
  }
}
testV1();
