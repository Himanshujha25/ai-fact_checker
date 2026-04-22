const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function run() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    // In older SDK it was listModels(), in newer it might be different but let's try a direct call
    const result = await model.generateContent("hello");
    console.log("SUCCESS");
  } catch (e) {
    console.log("FAILED:", e.message);
  }
}
run();
