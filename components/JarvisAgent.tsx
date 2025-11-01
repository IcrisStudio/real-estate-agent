'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMic, FiMenu } from 'react-icons/fi';
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
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const [response, setResponse] = useState('');
  const [properties, setProperties] = useState<Property[]>([]);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [isTTSPlaying, setIsTTSPlaying] = useState(false);
  const [showResponseText, setShowResponseText] = useState(false);

  useEffect(() => {
    // Initialize Web Speech API
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      try {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
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
          
          // If result is final, process the query
          if (event.results[event.results.length - 1]?.isFinal && finalTranscript.trim()) {
            setTimeout(() => {
              handleQuery(finalTranscript.trim());
            }, 100);
          }
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
          // Fallback: if no final result but we have transcript, process it
          if (transcript.trim() && !isProcessing) {
            setTimeout(() => {
              handleQuery(transcript.trim());
            }, 200);
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          setIsListening(false);
          // Handle different error types gracefully
          if (event.error === 'network') {
            setStatus('Network error. Please check your connection and try again.');
          } else if (event.error === 'no-speech') {
            setStatus('No speech detected. Please try again.');
          } else if (event.error === 'aborted') {
            // User stopped, don't show error
            setStatus('');
          } else {
            setStatus('Speech recognition error. You can type your query instead.');
          }
          console.error('Speech recognition error:', event.error);
        };
      } catch (error) {
        console.error('Failed to initialize speech recognition:', error);
        setStatus('Speech recognition not available. Please use text input.');
      }
    } else {
      setStatus('Speech recognition not supported in this browser. Please use text input.');
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors on cleanup
        }
      }
    };
  }, []);

  const startListening = () => {
    if (!recognitionRef.current) {
      setStatus('Initializing speech recognition...');
      // Try to reinitialize
      if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
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
          if (event.error !== 'aborted') {
            setStatus('Speech error. Try typing instead.');
          }
        };
      }
    }
    
    if (recognitionRef.current) {
      try {
        setTranscript('');
        setIsListening(true);
        setStatus('Listening... Speak now');
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting recognition:', error);
        setStatus('Unable to start listening. Please use text input.');
        setIsListening(false);
      }
    } else {
      setStatus('Speech recognition not available. Please use text input.');
    }
  };

  const handleQuery = async (query: string) => {
    setIsProcessing(true);
    setResponse('');
    setShowResponseText(false);
    setIsTTSPlaying(false);
    
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f1a] to-[#0a0a0a] text-white relative overflow-hidden">
      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 136, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 136, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }} />
      </div>

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

      {/* Particle effects */}
      {typeof window !== 'undefined' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-[#00ff88] rounded-full"
              initial={{
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
                y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080),
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

        {/* User messages/transcript */}
        {transcript && !showResponseText && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 max-w-lg w-full px-4"
          >
            <p className="text-white/70 text-sm leading-relaxed text-left">
              {transcript}
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
              onClick={startListening}
              disabled={isListening || isProcessing || isTTSPlaying}
              whileHover={{ scale: isListening || isProcessing || isTTSPlaying ? 1 : 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full transition-all ${
                isListening || isProcessing || isTTSPlaying
                  ? 'bg-[#00ff88] text-black shadow-[0_0_30px_rgba(0,255,136,0.8)]'
                  : 'bg-[#00ff88]/20 text-[#00ff88] border-2 border-[#00ff88]/50 hover:bg-[#00ff88]/30 hover:shadow-[0_0_20px_rgba(0,255,136,0.5)]'
              } flex items-center justify-center`}
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

          {/* Hidden text input for typing */}
          <div className="mt-4">
            <input
              type="text"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && transcript.trim()) {
                  handleQuery(transcript);
                  setTranscript('');
                }
              }}
              placeholder="Type your query..."
              className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/40 outline-none focus:border-[#00ff88]/50 transition-colors text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
