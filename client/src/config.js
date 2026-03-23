
// Central configuration for the client API connection
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const API_BASE = import.meta.env.VITE_API_URL 
  || (isLocal ? 'http://localhost:5000/api' : 'https://ai-fact-checker-rvih.onrender.com/api');

// Fallback for vercel routing when running on deployed environment without env vars
export const SHARED_URL_BASE = window.location.origin;
