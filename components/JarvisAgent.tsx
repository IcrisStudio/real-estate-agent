'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend } from 'react-icons/fi';
import SlimeSphere from './SlimeSphere';
import StatusText from './StatusText';
import { speakText } from '@/lib/utils';

interface Property {
  title: string;
  price: string;
  address: string;
  url: string;
  calculatedProfit?: number;
  arv?: number;
  repairs?: number;
  mov?: number;
}

export default function JarvisAgent() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const [response, setResponse] = useState('');
  const [properties, setProperties] = useState<Property[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [isTTSPlaying, setIsTTSPlaying] = useState(false);
  const [showResponseText, setShowResponseText] = useState(false);
  const [inputText, setInputText] = useState('');
  const [hasStarted, setHasStarted] = useState(false);

  // Speech recognition state
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [browserSupportsSpeechRecognition, setBrowserSupportsSpeechRecognition] = useState(false);
  const recognitionRef = useRef<any>(null);
  const sessionIdRef = useRef<string>('');

  // Initialize speech recognition on client
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initSpeechRecognition = async () => {
      try {
        // Generate or restore a session id (kept across refreshes for continuity)
        try {
          const existing = window.localStorage.getItem('jarvis_session_id');
          if (existing) {
            sessionIdRef.current = existing;
          } else {
            // Prefer crypto.randomUUID when available
            const sid = (window.crypto && 'randomUUID' in window.crypto)
              ? (window.crypto as any).randomUUID()
              : `sess_${Date.now()}_${Math.random().toString(36).slice(2,10)}`;
            sessionIdRef.current = sid;
            window.localStorage.setItem('jarvis_session_id', sid);
          }
        } catch (_) {
          // Fallback: ephemeral session if localStorage unavailable
          sessionIdRef.current = `sess_${Date.now()}_${Math.random().toString(36).slice(2,10)}`;
        }

        // Check if browser supports speech recognition
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        
        if (SpeechRecognition) {
          setBrowserSupportsSpeechRecognition(true);
          recognitionRef.current = new SpeechRecognition();
          recognitionRef.current.continuous = false;
          recognitionRef.current.interimResults = true;
          recognitionRef.current.lang = 'en-US';

          recognitionRef.current.onresult = (event: any) => {
            let finalTranscript = '';
            Array.from(event.results).forEach((result: any) => {
              finalTranscript += result[0].transcript;
            });
            setTranscript(finalTranscript);
          };

          recognitionRef.current.onend = () => {
            setIsListening(false);
          };

          recognitionRef.current.onerror = (event: any) => {
            setIsListening(false);
            // Handle all common errors silently - these are often false positives
            // Network errors can occur even with good connection due to API quirks
            const silentErrors = ['aborted', 'no-speech', 'network', 'not-allowed'];
            
            // Don't log any of these common, harmless errors
            if (!silentErrors.includes(event.error)) {
              // Only log unexpected errors
              console.error('Speech recognition error:', event.error);
            }
            
            // Silently reset status for all common errors - user can retry
            if (silentErrors.includes(event.error)) {
              setStatus('');
              // Don't even log to console for these
              return;
            }
          };
        }
      } catch (error) {
        console.error('Failed to initialize speech recognition:', error);
      }
    };

    initSpeechRecognition();

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, []);

  const resetTranscript = () => {
    setTranscript('');
  };

  const handleStartListening = useCallback(() => {
    if (!browserSupportsSpeechRecognition || !recognitionRef.current) {
      setStatus('');
      return;
    }
    try {
      resetTranscript();
      setInputText('');
      setStatus('Listening...');
      setIsListening(true);
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting recognition:', error);
      setStatus('');
      setIsListening(false);
    }
  }, [browserSupportsSpeechRecognition]);

  const handleQuery = useCallback(async (query: string) => {
    if (!query.trim()) return;
    
    setIsProcessing(true);
    setResponse('');
    setShowResponseText(false);
    setIsTTSPlaying(false);
    setInputText('');
    resetTranscript();
    
    try {
      const baseUrl = 'https://scott-realstate-project.app.n8n.cloud/webhook/52c7625a-d53b-4895-a584-0951d5dc1ad0';
      const url = `${baseUrl}?${new URLSearchParams({ query, sessionId: sessionIdRef.current })}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'x-session-id': sessionIdRef.current,
          'x-client': 'jarvis-ui',
          'x-timestamp': new Date().toISOString(),
        },
      });

      if (!res.ok) {
        throw new Error('Failed to process query');
      }

      // Parse webhook response and extract output text robustly
      let outputText = '';
      const contentType = res.headers.get('content-type') || '';
      let parsed: any;
      if (contentType.includes('application/json')) {
        parsed = await res.json().catch(() => undefined);
      } else {
        const txt = await res.text();
        try { parsed = JSON.parse(txt); } catch { parsed = txt; }
      }

      if (Array.isArray(parsed) && parsed.length && typeof parsed[0]?.output === 'string') {
        outputText = parsed[0].output;
      } else if (parsed && Array.isArray(parsed.item) && parsed.item.length && typeof parsed.item[0]?.output === 'string') {
        outputText = parsed.item[0].output;
      } else if (parsed && typeof parsed.output === 'string') {
        outputText = parsed.output;
      } else if (typeof parsed === 'string' && parsed.trim()) {
        outputText = parsed.trim();
      } else {
        outputText = 'Got it. What would you like to do next?';
      }

      setStatus('Speaking...');
      setResponse(outputText);

      // Speak the response and show text DURING TTS
      if (outputText) {
        setIsTTSPlaying(true);
        setIsProcessing(true);
        setShowResponseText(true); // Show text while TTS is playing
        
        try {
          const { promise } = await speakText(outputText, 'Justin');
          
          // Wait for audio to finish
          await promise;
          
          // TTS finished, hide the text and go back to listening
          setIsTTSPlaying(false);
          setShowResponseText(false);
          setResponse('');
          setStatus('Listening...');
          handleStartListening();
        } catch (error) {
          console.error('TTS error:', error);
          setIsTTSPlaying(false);
          setShowResponseText(false);
          setResponse('');
          setStatus('Listening...');
          handleStartListening();
        }
      } else {
        setResponse('');
        setShowResponseText(false);
      }

      setTimeout(() => {
        setIsProcessing(false);
      }, 300);
    } catch (error) {
      setStatus('Error processing request');
      setIsProcessing(false);
      console.error('Error:', error);
    }
  }, [resetTranscript, handleStartListening]);


  // Process transcript when it changes and is final
  useEffect(() => {
    if (transcript && !isListening && transcript.trim() && !isProcessing) {
      // Small delay to ensure transcript is complete
      const timer = setTimeout(() => {
        if (transcript.trim()) {
          handleQuery(transcript.trim());
          resetTranscript();
        }
      }, 500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript, isListening, isProcessing]);

  

  const handleStopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
      setIsListening(false);
      setStatus('');
    } catch (error) {
      console.error('Error stopping recognition:', error);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f1a] to-[#0a0a0a] text-white relative overflow-hidden">
      {/* Animated grid background - simplified for mobile */}
      {typeof window !== 'undefined' && window.innerWidth > 640 && (
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(0, 255, 136, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 255, 136, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }} />
        </div>
      )}

      {/* Enhanced background gradient effects with animation */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-0 left-1/2 w-[500px] h-[500px] bg-[#00ff88] rounded-full blur-3xl"
          animate={{
            x: ['-50%', '-48%', '-50%'],
            y: [0, 20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ opacity: 0.15 }}
        />
        <motion.div
          className="absolute bottom-0 left-1/2 w-[500px] h-[500px] bg-[#00d4ff] rounded-full blur-3xl"
          animate={{
            x: ['-50%', '-52%', '-50%'],
            y: [0, -20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ opacity: 0.15 }}
        />
      </div>

      {/* Particle effects - reduced for mobile performance */}
      {typeof window !== 'undefined' && window.innerWidth > 640 && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 10 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-[#00ff88] rounded-full"
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                opacity: 0,
              }}
              animate={{
                y: [null, -100],
                opacity: [0, 0.5, 0],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      )}

      {/* Start screen */}
      {!hasStarted && (
        <div className="relative z-10 flex flex-col items-center justify-center min-h-[60vh] px-4">
          <motion.h1 initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="text-white/90 text-lg mb-6">Ready to start a conversation?</motion.h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setHasStarted(true); handleStartListening(); }}
            className="px-5 py-3 rounded-full border border-[#00ff88]/50 text-[#00ff88] text-sm hover:bg-[#00ff88]/10 transition-all backdrop-blur-sm"
          >
            Start Conversation
          </motion.button>
        </div>
      )}

      {/* Conversation content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-140px)] px-4 pb-32 sm:pb-24">
        {/* Slime Sphere in center */}
        {hasStarted && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-[200px] h-[200px] sm:w-[280px] sm:h-[280px] my-6"
        >
          <SlimeSphere 
            isActive={isListening || isProcessing || isTTSPlaying} 
            isTTSPlaying={isTTSPlaying}
            size={280}
          />
        </motion.div>
        )}

        {/* Status centered below the slime */}
        {hasStarted && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-white/80 text-sm mt-2 text-center"
          >
            {isTTSPlaying ? 'Speaking...' : (isListening ? 'Listening...' : (status || ''))}
          </motion.p>
        )}

        {/* User messages/transcript - show while listening or after */}
        {hasStarted && (isListening || (transcript && !showResponseText)) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 max-w-lg w-full px-4"
          >
            <p className="text-white/70 text-sm leading-relaxed text-left">
              {isListening ? (transcript || 'Listening...') : transcript}
            </p>
          </motion.div>
        )}

        {/* Status Text */}
        <StatusText status={status} />

        {/* Properties list with enhanced animations */}
        <AnimatePresence>
          {properties.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 sm:mt-8 max-w-2xl w-full px-4 space-y-3 sm:space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar"
            >
              {properties.map((prop, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -30, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  whileHover={{ scale: 1.02, x: 5 }}
                  transition={{ 
                    delay: idx * 0.1,
                    type: "spring",
                    stiffness: 100
                  }}
                  className="group relative border border-[#00ff88]/30 rounded-lg p-3 sm:p-4 bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-md hover:border-[#00ff88]/70 hover:shadow-[0_0_20px_rgba(0,255,136,0.3)] transition-all duration-300 overflow-hidden"
                >
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#00ff88]/0 via-[#00ff88]/10 to-[#00ff88]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative z-10">
                    <h3 className="text-[#00ff88] font-semibold mb-2 text-xs sm:text-sm font-mono">
                      {prop.title}
                    </h3>
                    <div className="space-y-1 text-xs">
                      <p className="text-white/80 font-medium">Price: <span className="text-white">${prop.price}</span></p>
                      {prop.arv && (
                        <p className="text-white/60">ARV: <span className="text-white/80">${prop.arv.toLocaleString()}</span></p>
                      )}
                      {prop.repairs && (
                        <p className="text-white/60">Repairs: <span className="text-white/80">${prop.repairs.toLocaleString()}</span></p>
                      )}
                      {prop.mov && (
                        <p className="text-white/60">MOV: <span className="text-white/80">${prop.mov.toLocaleString()}</span></p>
                      )}
                      {prop.calculatedProfit !== undefined && (
                        <motion.p
                          className="text-[#00ff88] font-bold mt-2 text-sm"
                          initial={{ scale: 0.9 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: idx * 0.1 + 0.3 }}
                        >
                          Estimated Profit: ${prop.calculatedProfit.toLocaleString()}
                        </motion.p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* No bottom controls in conversation mode */}
    </div>
  );
}
