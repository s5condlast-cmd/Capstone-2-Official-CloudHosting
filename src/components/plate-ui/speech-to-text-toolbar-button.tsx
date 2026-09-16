'use client';

import * as React from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useEditorRef } from 'platejs/react';
import { ToolbarButton } from './toolbar';

export function SpeechToTextToolbarButton() {
  const editor = useEditorRef();
  const [isListening, setIsListening] = React.useState(false);
  const recognitionRef = React.useRef<any>(null);

  const toggleListening = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .slice(event.resultIndex)
        .map((res: any) => res[0].transcript)
        .join('');

      if (transcript.trim()) {
        try {
          editor?.tf?.insertText?.(transcript + ' ');
          editor?.tf?.focus?.();
        } catch { /* non-fatal */ }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <ToolbarButton
      active={isListening}
      onClick={toggleListening}
      tooltip={isListening ? 'Stop listening' : 'Speech to text'}
      aria-label="Speech to text"
      className={isListening ? 'text-red-500 bg-red-100 dark:bg-red-950/40 animate-pulse' : ''}
    >
      {isListening ? (
        <MicOff className="w-4 h-4 text-red-500" />
      ) : (
        <Mic className="w-4 h-4 text-zinc-700 dark:text-zinc-200" />
      )}
    </ToolbarButton>
  );
}
