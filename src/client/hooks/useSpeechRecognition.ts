import { useState, useRef, useEffect, useCallback } from 'react';

// Add Webkit types
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export const useSpeechRecognition = () => {
  const [isDictating, setIsDictating] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setIsSupported(true);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'fr-FR';

      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        if (text) {
          const capitalized = text.charAt(0).toUpperCase() + text.slice(1);
          setTranscript(capitalized);
        }
        setIsDictating(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsDictating(false);
      };

      recognition.onend = () => {
        setIsDictating(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const startDictation = useCallback(() => {
    if (recognitionRef.current && !isDictating) {
      setTranscript(''); // Clear previous
      recognitionRef.current.start();
      setIsDictating(true);
    }
  }, [isDictating]);

  const stopDictation = useCallback(() => {
    if (recognitionRef.current && isDictating) {
      recognitionRef.current.stop();
      setIsDictating(false);
    }
  }, [isDictating]);

  const toggleDictation = useCallback(() => {
    if (isDictating) stopDictation();
    else startDictation();
  }, [isDictating, startDictation, stopDictation]);

  return {
    isDictating,
    isSupported,
    transcript,
    setTranscript, // Allow manual clearing
    startDictation,
    stopDictation,
    toggleDictation
  };
};
