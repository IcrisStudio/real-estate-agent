'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMic, FiMenu, FiSend } from 'react-icons/fi';
import SlimeSphere from './SlimeSphere';
import StatusText from './StatusText';
import { speakText } from '@/lib/utils';
import { useSpeechRecognition } from 'react-speech-recognition';
import SpeechRecognition from 'react-speech-recognition';

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

  // Use react-speech-recognition for better mobile support
  const {
    transcript,
    listening: isListening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  // Store handleQuery in ref to avoid dependency issues
  const handleQueryRef = useRef<((query: string) => Promise<void>) | undefined>(undefined);
  
  const handleQuery = useCallback(async (query: string) => {
    if (!query.trim()) return;
    
    setIsProcessing(true);
    setResponse('');
    setShowResponseText(false);
    setIsTTSPlaying(false);
    setInputText('');
    resetTranscript();
    
    // Check if user wants to open links
    const openLinksIntent = /yes|open|show|view|sure|go ahead|ok|okay/i.test(query);
    if (openLinksIntent && properties.length > 0) {
      properties.forEach((prop: Property) => {
        window.open(prop.url, '_blank');
      });
      setStatus('Opening property links...');
      setTimeout(() => {
        setStatus('');
        setIsProcessing(false);
      }, 1000);
      return;
    }
    
    const statuses = [
      'Analyzing query...',
      'Crafting search queries...',
      'Searching for properties...',
      'Scraping websites...',
      'Analyzing property data...',
      'Calculating profits...',
      'Finalizing results...'
    ];

    let statusIndex = 0;
    const statusInterval = setInterval(() => {
      if (statusIndex < statuses.length) {
        setStatus(statuses[statusIndex]);
        statusIndex++;
      }
    }, 2000);

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      clearInterval(statusInterval);

      if (!res.ok) {
        throw new Error('Failed to process query');
      }

      const data = await res.json();
      
      setStatus('Completed');
      setProperties(data.properties || []);
      setResponse(data.response || '');

      // Speak the response and show text DURING TTS
      if (data.response) {
        setIsTTSPlaying(true);
        setIsProcessing(true);
        setShowResponseText(true); // Show text while TTS is playing
        
        try {
          const { promise } = await speakText(data.response);
          
          // Wait for audio to finish
          await promise;
          
          // TTS finished, hide the text
          setIsTTSPlaying(false);
          setShowResponseText(false);
          setResponse('');
        } catch (error) {
          console.error('TTS error:', error);
          setIsTTSPlaying(false);
          setShowResponseText(false);
          setResponse('');
        }
      } else {
        setResponse('');
        setShowResponseText(false);
      }

      setTimeout(() => {
        setStatus('');
        setIsProcessing(false);
      }, 500);
    } catch (error) {
      clearInterval(statusInterval);
      setStatus('Error processing request');
      setIsProcessing(false);
      console.error('Error:', error);
    }
  }, [properties, resetTranscript]);

  // Update ref when handleQuery changes
  useEffect(() => {
    handleQueryRef.current = handleQuery;
  }, [handleQuery]);

  // Process transcript when it changes and is final
  useEffect(() => {
    if (transcript && !isListening && transcript.trim() && !isProcessing) {
      // Small delay to ensure transcript is complete
      const timer = setTimeout(() => {
        if (transcript.trim() && handleQueryRef.current) {
          handleQueryRef.current(transcript.trim());
          resetTranscript();
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [transcript, isListening, isProcessing, resetTranscript]);

  const handleStartListening = useCallback(() => {
    if (!browserSupportsSpeechRecognition) {
      setStatus('');
      return;
    }
    
    try {
      resetTranscript();
      setInputText('');
      setStatus('Listening...');
      SpeechRecognition.startListening({ continuous: false, interimResults: true });
    } catch (error) {
      console.error('Error starting recognition:', error);
      setStatus('');
    }
  }, [browserSupportsSpeechRecognition, resetTranscript]);

  const handleStopListening = useCallback(() => {
    try {
      SpeechRecognition.stopListening();
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

      {/* Top bar */}
      <div className="relative z-10 flex justify-between items-center p-4 sm:p-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-4 py-2 rounded-full border border-[#00ff88]/30 text-[#00ff88] text-xs sm:text-sm hover:bg-[#00ff88]/10 transition-all backdrop-blur-sm"
        >
          Done
        </motion.button>
        <motion.button
          onClick={() => setShowMenu(!showMenu)}
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          className="text-white/80 hover:text-[#00ff88] transition-colors p-2"
        >
          <FiMenu size={20} className="sm:w-6 sm:h-6" />
        </motion.button>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-140px)] px-4 pb-32 sm:pb-24">
        {/* Listening prompt above sphere */}
        {(isListening || isTTSPlaying) && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-white/80 text-sm mb-6 text-center"
          >
            {isListening ? "Listening..." : "Speaking..."}
          </motion.p>
        )}

        {/* Slime Sphere in center */}
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

        {/* User messages/transcript - show while listening or after */}
        {(isListening || (transcript && !showResponseText)) && (
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

      {/* Bottom control bar - like in the image */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-6 sm:pb-8 z-10">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-center">
            {/* Microphone button - large and prominent */}
            <motion.button
              onClick={isListening ? handleStopListening : handleStartListening}
              disabled={isProcessing || isTTSPlaying}
              whileHover={{ scale: (isListening || isProcessing || isTTSPlaying) ? 1 : 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full transition-all ${
                isListening || isProcessing || isTTSPlaying
                  ? 'bg-[#00ff88] text-black shadow-[0_0_30px_rgba(0,255,136,0.8)]'
                  : 'bg-[#00ff88]/20 text-[#00ff88] border-2 border-[#00ff88]/50 hover:bg-[#00ff88]/30 hover:shadow-[0_0_20px_rgba(0,255,136,0.5)]'
              } flex items-center justify-center touch-manipulation`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <FiMic size={24} className="sm:w-7 sm:h-7" />
              {(isListening || isProcessing || isTTSPlaying) && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-[#00ff88]"
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
            </motion.button>
          </div>

          {/* Text input with send button */}
          <div className="mt-4 relative">
            <div className="relative flex items-center">
              <input
                type="text"
                value={inputText || transcript}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && (inputText.trim() || transcript.trim())) {
                    const query = inputText.trim() || transcript.trim();
                    handleQuery(query);
                    setInputText('');
                    resetTranscript();
                  }
                }}
                placeholder="Type or speak your query..."
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 pr-12 py-2.5 sm:py-3 text-white placeholder-white/40 outline-none focus:border-[#00ff88]/50 transition-colors text-sm"
              />
              <motion.button
                onClick={() => {
                  const query = inputText.trim() || transcript.trim();
                  if (query) {
                    handleQuery(query);
                    setInputText('');
                    resetTranscript();
                  }
                }}
                disabled={!inputText.trim() && !transcript.trim()}
                whileTap={{ scale: 0.9 }}
                className={`absolute right-2 p-2 rounded-lg transition-all ${
                  (inputText.trim() || transcript.trim())
                    ? 'bg-[#00ff88] text-black hover:bg-[#00ff88]/90'
                    : 'bg-white/10 text-white/30 cursor-not-allowed'
                }`}
              >
                <FiSend size={18} />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
