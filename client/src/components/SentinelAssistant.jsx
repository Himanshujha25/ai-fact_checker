import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVoice } from '../context/VoiceContext';
import { Mic2, Volume2, Square, Radio, Activity } from 'lucide-react';

const GOLD = 'var(--gold)';

export default function SentinelAssistant() {
  const { isSpeaking, stop, lastSpeech } = useVoice();

  return (
    <div style={{ position: 'fixed', bottom: 80, right: 30, zIndex: 1000, pointerEvents: 'none' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
        
        {/* Captions / Visualizer */}
        <AnimatePresence>
          {isSpeaking && (
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              style={{ 
                background: 'rgba(5,5,8,0.95)', 
                border: `1px solid ${GOLD}40`, 
                padding: '12px 16px', 
                borderRadius: '12px',
                maxWidth: 280,
                backdropFilter: 'blur(10px)',
                pointerEvents: 'auto',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
              }}
            >
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                 <div style={{ width:6, height:6, borderRadius:'50%', background:GOLD }} />
                 <span style={{ fontSize:9, fontFamily:"'DM Mono',monospace", color:GOLD, textTransform:'uppercase', letterSpacing:'.1em' }}>SENTINEL_TRANSCRIPT</span>
              </div>
              <p style={{ fontSize:11, lineHeight:1.5, color: 'var(--text-main)', margin:0 }}>
                {lastSpeech.length > 100 ? lastSpeech.substring(0, 100) + '...' : lastSpeech}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Control Orb */}
        <motion.div
          onClick={() => isSpeaking && stop()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{ 
            pointerEvents: 'auto',
            width: 52, height: 52, borderRadius: '50%',
            background: isSpeaking ? 'rgba(201,168,76,0.1)' : 'rgba(5,5,8,0.8)',
            border: `1px solid ${isSpeaking ? GOLD : 'var(--line)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', position: 'relative',
            backdropFilter: 'blur(8px)',
            boxShadow: isSpeaking ? `0 0 20px ${GOLD}20` : 'none'
          }}
        >
          <AnimatePresence>
            {isSpeaking && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: `1px solid ${GOLD}20` }}
              />
            )}
          </AnimatePresence>
          
          {isSpeaking ? (
            <Square size={20} fill={GOLD} color={GOLD} />
          ) : (
            <Radio size={22} color="var(--text-dim)" style={{ opacity: 0.6 }} />
          )}
        </motion.div>
      </div>
    </div>
  );
}
