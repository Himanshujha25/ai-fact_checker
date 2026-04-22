const rawText = `{
  "verification_results": [
    {
      "claim": "The earth is flat",
      "verdict": "FALSE",
      "confidence": 1.0,
      "reasoning": "Contradicts overwhelming scientific evidence."
    }
  ]
}`;

let batchVerifyData = [];
const match = rawText.match(/\[\s*\{[\s\S]*\}\s*\]/);
if (match) {
  console.log("MATCH:", match[0]);
  batchVerifyData = JSON.parse(match[0]);
}

console.log("Parsed:", batchVerifyData);
