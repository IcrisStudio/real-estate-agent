'use client';

import { useEffect } from 'react';

export default function SpeechRecognitionProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Ensure speech recognition is available
    if (typeof window !== 'undefined') {
      // The react-speech-recognition package will handle initialization
      // No provider needed for react-speech-recognition v3+
    }
  }, []);

  return <>{children}</>;
}

