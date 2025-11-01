'use client';

import { useEffect } from 'react';

export default function SpeechRecognitionProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Ensure speech recognition is available
    if (typeof window !== 'undefined') {
      // The react-speech-recognition package will handle initialization
    }
  }, []);

  return <>{children}</>;
}

