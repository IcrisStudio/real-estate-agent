'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface StatusTextProps {
  status: string;
}

export default function StatusText({ status }: StatusTextProps) {
  return (
    <AnimatePresence mode="wait">
      {status && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="mt-8 text-center"
        >
          <motion.p
            key={status}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[#00ff88] text-sm font-light tracking-wide"
            style={{
              fontFamily: 'monospace',
              letterSpacing: '0.1em',
              textShadow: '0 0 10px rgba(0, 255, 136, 0.5)',
            }}
          >
            {status}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
