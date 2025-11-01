'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface CircularAnimationProps {
  isActive: boolean;
  isTTSPlaying?: boolean;
  size?: number;
}

export default function CircularAnimation({ isActive, isTTSPlaying = false, size = 200 }: CircularAnimationProps) {
  const [rotation, setRotation] = useState(0);
  const [displaySize, setDisplaySize] = useState(size);

  useEffect(() => {
    // Handle responsive size on client
    if (typeof window !== 'undefined') {
      const updateSize = () => {
        setDisplaySize(window.innerWidth < 640 ? 180 : size);
      };
      updateSize();
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }
  }, [size]);

  useEffect(() => {
    if (!isActive) {
      setRotation(0);
      return;
    }
    
    const interval = setInterval(() => {
      setRotation(prev => (prev + 2) % 360);
    }, 16);

    return () => clearInterval(interval);
  }, [isActive]);

  const actualSize = typeof window !== 'undefined' && window.innerWidth < 640 ? 180 : size;

  // Jelly/slime animation values when TTS is playing
  const jellyVariants = {
    playing: {
      scaleX: [1, 1.18, 0.92, 1.12, 0.96, 1.08, 1.02, 1],
      scaleY: [1, 0.88, 1.15, 0.92, 1.1, 0.94, 1.05, 1],
      rotate: [0, 8, -6, 7, -5, 6, -4, 0],
      transition: {
        duration: 1.8,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    normal: {
      scale: isActive ? [1, 1.05, 1] : 1,
      opacity: isActive ? 1 : 0.3,
      rotate: 0,
      transition: {
        scale: {
          duration: 2,
          repeat: isActive ? Infinity : 0,
          ease: "easeInOut"
        }
      }
    }
  };

  return (
    <motion.div
      className="flex items-center justify-center relative overflow-visible"
      style={{ 
        width: actualSize, 
        height: actualSize,
        filter: isTTSPlaying ? 'blur(0.5px)' : 'none'
      }}
      animate={isTTSPlaying ? jellyVariants.playing : jellyVariants.normal}
    >
      <motion.svg 
        width={actualSize} 
        height={actualSize} 
        className="absolute"
        animate={isTTSPlaying ? {
          scaleX: [1, 1.1, 0.95, 1.05, 0.98, 1.02, 1],
          scaleY: [1, 0.95, 1.08, 0.97, 1.03, 0.99, 1],
        } : {}}
        transition={isTTSPlaying ? {
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        } : {}}
      >
        <defs>
          <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00ff88" stopOpacity="1" />
            <stop offset="50%" stopColor="#00d4ff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#00ff88" stopOpacity="1" />
          </linearGradient>
          <filter id="glow-filter">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Outer ring */}
          <circle
            cx={actualSize / 2}
            cy={actualSize / 2}
            r={actualSize / 2 - 10}
          fill="none"
          stroke="url(#glow)"
          strokeWidth="2"
          opacity="0.3"
          filter="url(#glow-filter)"
        />
        
        {/* Middle ring */}
        <motion.circle
          cx={actualSize / 2}
          cy={actualSize / 2}
          r={actualSize / 2 - 30}
          fill="none"
          stroke="url(#glow)"
          strokeWidth="1.5"
          opacity="0.5"
          filter="url(#glow-filter)"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Inner core */}
        <motion.circle
          cx={actualSize / 2}
          cy={actualSize / 2}
          r={actualSize / 2 - 50}
          fill="url(#glow)"
          opacity="0.6"
          filter="url(#glow-filter)"
          animate={{
            scale: [0.8, 1, 0.8],
            opacity: [0.6, 1, 0.6]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.svg>
      
      {/* Radial lines */}
      <motion.svg
        width={actualSize}
        height={actualSize}
        style={{ position: 'absolute' }}
        animate={{ rotate: rotation }}
        transition={{ duration: 0, repeat: Infinity }}
      >
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i * 360) / 24;
          const center = actualSize / 2;
          const x1 = center;
          const y1 = center;
          const x2 = center + Math.cos((angle * Math.PI) / 180) * (actualSize / 2 - 20);
          const y2 = center + Math.sin((angle * Math.PI) / 180) * (actualSize / 2 - 20);
          
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="url(#glow)"
              strokeWidth="1"
              opacity={i % 2 === 0 ? 0.6 : 0.3}
              filter="url(#glow-filter)"
            />
          );
        })}
      </motion.svg>
      
      {/* DNA helix pattern */}
      <motion.svg width={actualSize} height={actualSize} style={{ position: 'absolute' }}>
        <motion.path
          d={`M ${actualSize / 2} ${actualSize / 2 - 60} Q ${actualSize / 2 + 30} ${actualSize / 2 - 30} ${actualSize / 2} ${actualSize / 2} T ${actualSize / 2} ${actualSize / 2 + 60}`}
          fill="none"
          stroke="url(#glow)"
          strokeWidth="2"
          opacity="0.7"
          filter="url(#glow-filter)"
          animate={{
            pathLength: [0, 1, 0],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.path
          d={`M ${actualSize / 2} ${actualSize / 2 - 60} Q ${actualSize / 2 - 30} ${actualSize / 2 - 30} ${actualSize / 2} ${actualSize / 2} T ${actualSize / 2} ${actualSize / 2 + 60}`}
          fill="none"
          stroke="url(#glow)"
          strokeWidth="2"
          opacity="0.7"
          filter="url(#glow-filter)"
          animate={{
            pathLength: [0, 1, 0],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.5
          }}
        />
      </motion.svg>
      
      {/* Pulsing center dot when active */}
      {isActive && (
        <motion.div
          className="absolute top-1/2 left-1/2 w-3 h-3 bg-[#00ff88] rounded-full"
          style={{ transform: 'translate(-50%, -50%)' }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [1, 0.5, 1],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
    </motion.div>
  );
}
