import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const VoiceContext = createContext();

export const VoiceProvider = ({ children }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastSpeech, setLastSpeech] = useState('');

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const speak = useCallback((text, options = {}) => {
    if (!text || !('speechSynthesis' in window)) return;

    // Stop current
    stop();

    // Clean text (remove markdown for better speech)
    const cleanText = text.replace(/[*#_`]/g, '').replace(/\[.*?\]/g, '').trim();
    setLastSpeech(cleanText);

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = options.rate || 1.0;
    utterance.pitch = options.pitch || 0.95;
    
    // Auto-select best voice
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.name.includes('Google') || v.name.includes('Neural')) || voices[0];
    if (voice) utterance.voice = voice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [stop]);

  // Handle initial voice loading (some browsers delay this)
  useEffect(() => {
    const handleVoices = () => window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener('voiceschanged', handleVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', handleVoices);
  }, []);

  return (
    <VoiceContext.Provider value={{ speak, stop, isSpeaking, lastSpeech }}>
      {children}
    </VoiceContext.Provider>
  );
};

export const useVoice = () => {
  const context = useContext(VoiceContext);
  if (context === undefined) {
    // Return a dummy object to prevent destructuring errors
    return { speak: () => {}, stop: () => {}, isSpeaking: false, lastSpeech: "" };
  }
  return context;
};
