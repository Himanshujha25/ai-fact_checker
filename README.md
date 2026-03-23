
# Truecast AI - Fact & Claim Verification System

Truecast AI is a state-of-the-art AI-driven fact-checking engine that validates text integrity against real-time data using the Google Gemini API.

## Features
- **Claim Extraction**: Decomposes complex input text/URLs into discrete, verifiable statements.
- **Evidence Retrieval**: Automatically formulates search queries and fetches real-world evidence.
- **Verification & Reporting**: Compares claims against retrieved evidence, returning a truth score and detailed justifications.
- **AI Text Detection**: Analyzes input to estimate probability of AI generation.
- **Premium UI**: Modern dark-mode interface with glassmorphism, animations, and interactive reports.

## Tech Stack
- **Frontend**: React, Vite, Framer Motion, Tailwind (via Vanilla CSS tokens).
- **Backend**: Node.js, Express.
- **LLM**: Google Gemini (gemini-1.5-flash).
- **Icons**: Lucide React.

## Getting Started

### 1. Setting Up Environment Variables
Create a `.env` file in the `server` directory with your API keys:
```env
PORT=5000
GEMINI_API_KEY=your_gemini_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here (optional for agentic search)
```

### 2. Install Dependencies
Run in two separate terminals:

**Backend:**
```bash
cd server
npm install
npm start
```

**Frontend:**
```bash
cd client
npm install
npm run dev
```

### 3. Usage
- Paste a news article URL or raw text in the main input.
- Click **Verify Claims**.
- Watch the agentic pipeline process the request in real-time.
- Review the granular Accuracy Report and AI Detection Score.
