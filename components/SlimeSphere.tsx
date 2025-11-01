'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface SlimeSphereProps {
  isActive: boolean;
  isTTSPlaying?: boolean;
  size?: number;
}

export default function SlimeSphere({ isActive, isTTSPlaying = false, size = 250 }: SlimeSphereProps) {
  const [bounceKey, setBounceKey] = useState(0);

  useEffect(() => {
    if (isTTSPlaying) {
      const interval = setInterval(() => {
        setBounceKey(prev => prev + 1);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isTTSPlaying]);

  const actualSize = typeof window !== 'undefined' && window.innerWidth < 640 ? 180 : size;

  // Smooth bounce animation
  const bounceAnimation = {
    y: [0, -15, 0],
    scale: [1, 1.08, 1],
    transition: {
      duration: 0.6,
      ease: [0.34, 1.56, 0.64, 1], // Custom bounce easing
      repeat: isTTSPlaying ? Infinity : 0,
    }
  };

  // Organic morphing when TTS is playing
  const morphAnimation = isTTSPlaying ? {
    scaleX: [1, 1.12, 0.94, 1.08, 0.97, 1.05, 1],
    scaleY: [1, 0.92, 1.14, 0.95, 1.1, 0.98, 1.04, 1],
    rotate: [0, 6, -4, 5, -3, 4, 0],
    transition: {
      duration: 2.5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  } : {};

  return (
    <motion.div
      className="flex items-center justify-center relative"
      style={{ width: actualSize, height: actualSize }}
      animate={isTTSPlaying ? { 
        ...bounceAnimation, 
        ...morphAnimation,
        rotate: [0, 360]
      } : { 
        scale: isActive ? 1 : 0.8, 
        opacity: isActive ? 1 : 0.5,
        rotate: 0
      }}
      transition={isTTSPlaying ? {
        rotate: {
          duration: 8,
          repeat: Infinity,
          ease: "linear"
        },
        ...bounceAnimation.transition,
        ...morphAnimation.transition
      } : {}}
    >
      {/* Web/wave patterns overlay */}
      {isTTSPlaying && (
        <svg width={actualSize} height={actualSize} className="absolute" style={{ zIndex: 1 }}>
          <defs>
            <radialGradient id="waveGradient">
              <stop offset="0%" stopColor="#00ff88" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#00d4ff" stopOpacity="0.2" />
            </radialGradient>
          </defs>
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 360) / 12;
            const radius = actualSize / 2;
            return (
              <motion.path
                key={`wave-${i}`}
                d={`M ${actualSize / 2} ${actualSize / 2} L ${
                  actualSize / 2 + Math.cos((angle * Math.PI) / 180) * radius
                } ${
                  actualSize / 2 + Math.sin((angle * Math.PI) / 180) * radius
                }`}
                stroke="url(#waveGradient)"
                strokeWidth="2"
                opacity="0.4"
                animate={{
                  pathLength: [0, 1, 0],
                  opacity: [0.2, 0.6, 0.2],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.15
                }}
              />
            );
          })}
        </svg>
      )}

      {/* Main organic slime sphere */}
      <motion.svg 
        width={actualSize} 
        height={actualSize} 
        className="absolute" 
        style={{ filter: 'drop-shadow(0 0 40px rgba(0, 255, 136, 0.6))' }}
        animate={isTTSPlaying ? {
          rotate: [-360],
        } : {}}
        transition={isTTSPlaying ? {
          rotate: {
            duration: 10,
            repeat: Infinity,
            ease: "linear"
          }
        } : {}}
      >
        <defs>
          {/* Outer glow gradient */}
          <radialGradient id="slimeOuter" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#00ff88" stopOpacity="0.8" />
            <stop offset="40%" stopColor="#00ff88" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#00d4ff" stopOpacity="0.1" />
          </radialGradient>
          
          {/* Inner core gradient */}
          <radialGradient id="slimeInner" cx="45%" cy="45%">
            <stop offset="0%" stopColor="#00ff88" stopOpacity="1" />
            <stop offset="50%" stopColor="#00d4ff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#00ff88" stopOpacity="0.7" />
          </radialGradient>

          {/* Organic pattern gradient */}
          <radialGradient id="slimePattern1" cx="30%" cy="30%">
            <stop offset="0%" stopColor="#00ff88" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#00d4ff" stopOpacity="0.3" />
          </radialGradient>

          <radialGradient id="slimePattern2" cx="70%" cy="60%">
            <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#00ff88" stopOpacity="0.4" />
          </radialGradient>

          <radialGradient id="slimePattern3" cx="55%" cy="75%">
            <stop offset="0%" stopColor="#00ff88" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#00d4ff" stopOpacity="0.2" />
          </radialGradient>

          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Outer glow ring */}
        <motion.circle
          cx={actualSize / 2}
          cy={actualSize / 2}
          r={actualSize / 2 - 5}
          fill="url(#slimeOuter)"
          filter="url(#glow)"
          animate={isTTSPlaying ? {
            opacity: [0.6, 1, 0.6],
            scale: [1, 1.05, 1]
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* Main sphere base with wave pattern */}
        <motion.ellipse
          cx={actualSize / 2}
          cy={actualSize / 2}
          rx={actualSize / 2 - 15}
          ry={actualSize / 2 - 15}
          fill="url(#slimeInner)"
          filter="url(#glow)"
          animate={isTTSPlaying ? {
            rx: [actualSize / 2 - 15, actualSize / 2 - 12, actualSize / 2 - 15],
            ry: [actualSize / 2 - 15, actualSize / 2 - 18, actualSize / 2 - 15],
          } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Rotating wave circles */}
        {isTTSPlaying && Array.from({ length: 6 }).map((_, i) => (
          <motion.circle
            key={`wave-circle-${i}`}
            cx={actualSize / 2}
            cy={actualSize / 2}
            r={actualSize / 2 - 20 - i * 8}
            fill="none"
            stroke="#00ff88"
            strokeWidth="1.5"
            opacity="0.3"
            strokeDasharray={`${Math.PI * (actualSize / 2 - 20 - i * 8) * 0.3} ${Math.PI * (actualSize / 2 - 20 - i * 8) * 0.7}`}
            animate={{
              rotate: [0, 360],
              opacity: [0.2, 0.5, 0.2],
              scale: [1, 1.05, 1]
            }}
            transition={{
              rotate: {
                duration: 3 + i * 0.5,
                repeat: Infinity,
                ease: "linear"
              },
              opacity: {
                duration: 1.5 + i * 0.2,
                repeat: Infinity,
                ease: "easeInOut"
              },
              scale: {
                duration: 2 + i * 0.3,
                repeat: Infinity,
                ease: "easeInOut"
              },
              delay: i * 0.2
            }}
            style={{ transformOrigin: `${actualSize / 2}px ${actualSize / 2}px` }}
          />
        ))}

        {/* Organic internal structures - Pattern 1 with rotation */}
        <motion.g
          animate={isTTSPlaying ? {
            x: [0, actualSize * 0.03, 0],
            y: [0, -actualSize * 0.03, 0],
            rotate: [0, 180, 360],
          } : {}}
          transition={{ 
            duration: 2.5, 
            repeat: Infinity, 
            ease: "easeInOut",
            rotate: {
              duration: 4,
              repeat: Infinity,
              ease: "linear"
            }
          }}
          style={{ transformOrigin: `${actualSize * 0.35}px ${actualSize * 0.35}px` }}
        >
          <ellipse
            cx={actualSize * 0.35}
            cy={actualSize * 0.35}
            rx={actualSize * 0.2}
            ry={actualSize * 0.25}
            fill="url(#slimePattern1)"
            opacity="0.8"
          />
        </motion.g>

        {/* Organic internal structures - Pattern 2 with rotation */}
        <motion.g
          animate={isTTSPlaying ? {
            x: [0, actualSize * 0.02, 0],
            y: [0, -actualSize * 0.02, 0],
            rotate: [0, -180, -360],
          } : {}}
          transition={{ 
            duration: 2.2, 
            repeat: Infinity, 
            ease: "easeInOut", 
            delay: 0.3,
            rotate: {
              duration: 5,
              repeat: Infinity,
              ease: "linear"
            }
          }}
          style={{ transformOrigin: `${actualSize * 0.7}px ${actualSize * 0.6}px` }}
        >
          <ellipse
            cx={actualSize * 0.7}
            cy={actualSize * 0.6}
            rx={actualSize * 0.18}
            ry={actualSize * 0.22}
            fill="url(#slimePattern2)"
            opacity="0.7"
          />
        </motion.g>

        {/* Organic internal structures - Pattern 3 with rotation */}
        <motion.g
          animate={isTTSPlaying ? {
            x: [0, -actualSize * 0.02, 0],
            y: [0, actualSize * 0.02, 0],
            rotate: [0, 360],
          } : {}}
          transition={{ 
            duration: 2.8, 
            repeat: Infinity, 
            ease: "easeInOut", 
            delay: 0.6,
            rotate: {
              duration: 6,
              repeat: Infinity,
              ease: "linear"
            }
          }}
          style={{ transformOrigin: `${actualSize * 0.55}px ${actualSize * 0.75}px` }}
        >
          <ellipse
            cx={actualSize * 0.55}
            cy={actualSize * 0.75}
            rx={actualSize * 0.15}
            ry={actualSize * 0.18}
            fill="url(#slimePattern3)"
            opacity="0.6"
          />
        </motion.g>

        {/* Center bright core with rotation */}
        <motion.g
          animate={isTTSPlaying ? {
            rotate: [0, 360]
          } : {}}
          transition={{
            rotate: {
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }
          }}
          style={{ transformOrigin: `${actualSize / 2}px ${actualSize / 2}px` }}
        >
          <motion.circle
            cx={actualSize / 2}
            cy={actualSize / 2}
            r={actualSize * 0.15}
            fill="#00ff88"
            opacity="0.9"
            filter="url(#glow)"
            animate={isTTSPlaying ? {
              scale: [1, 1.3, 1],
              opacity: [0.9, 1, 0.9]
            } : {
              opacity: isActive ? 0.7 : 0.3
            }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.g>

        {/* Additional organic particles with rotation */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i * 360) / 8;
          const radius = actualSize * 0.35;
          const x = actualSize / 2 + Math.cos((angle * Math.PI) / 180) * radius;
          const y = actualSize / 2 + Math.sin((angle * Math.PI) / 180) * radius;
          
          return (
            <motion.g
              key={i}
              animate={isTTSPlaying ? {
                x: [0, Math.cos((angle * Math.PI) / 180) * 5, 0],
                y: [0, Math.sin((angle * Math.PI) / 180) * 5, 0],
                rotate: [0, 360]
              } : {}}
              transition={{
                duration: 1.5 + i * 0.2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.1,
                rotate: {
                  duration: 4 + i * 0.3,
                  repeat: Infinity,
                  ease: "linear"
                }
              }}
              style={{ transformOrigin: `${x}px ${y}px` }}
            >
              <motion.circle
                cx={x}
                cy={y}
                r={actualSize * 0.04}
                fill="#00ff88"
                opacity="0.6"
                animate={isTTSPlaying ? {
                  r: [actualSize * 0.04, actualSize * 0.06, actualSize * 0.04],
                  opacity: [0.6, 0.9, 0.6],
                } : {}}
                transition={{
                  duration: 1.5 + i * 0.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.1
                }}
              />
            </motion.g>
          );
        })}

        {/* Wave rings that expand and rotate */}
        {isTTSPlaying && Array.from({ length: 4 }).map((_, i) => (
          <motion.circle
            key={`expanding-wave-${i}`}
            cx={actualSize / 2}
            cy={actualSize / 2}
            r={actualSize * 0.1}
            fill="none"
            stroke="#00ff88"
            strokeWidth="2"
            opacity="0"
            animate={{
              r: [actualSize * 0.1, actualSize / 2, actualSize / 2 + 10],
              opacity: [0.8, 0.4, 0],
              scale: [1, 1, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeOut",
              delay: i * 0.5
            }}
          />
        ))}
      </motion.svg>
    </motion.div>
  );
}

