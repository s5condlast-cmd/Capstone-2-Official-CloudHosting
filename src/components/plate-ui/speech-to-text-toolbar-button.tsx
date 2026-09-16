'use client';

import * as React from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useEditorRef } from 'platejs/react';
import { ToolbarButton } from './toolbar';
import { cn } from '@/src/lib/utils';

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
        } catch {
          // non-fatal
        }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleDone = () => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // non-fatal
    }
    setIsListening(false);
  };

  const handleCancel = () => {
    try {
      recognitionRef.current?.abort?.();
    } catch {
      // non-fatal
    }
    setIsListening(false);
  };

  return (
    <>
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

      {/* Floating status pill in the center bottom of screen */}
      {isListening && (
        <div
          className={cn(
            'fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2 rounded-full',
            'bg-zinc-900/95 dark:bg-zinc-100/95 text-white dark:text-zinc-900 shadow-2xl backdrop-blur-md',
            'border border-zinc-700/50 dark:border-zinc-300/50 select-none animate-in fade-in slide-in-from-bottom-4 duration-150'
          )}
        >
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
            <span className="text-xs font-medium">Listening... Speak into your microphone</span>
          </div>
          <div className="flex items-center gap-1.5 ml-2 border-l border-zinc-700 dark:border-zinc-300 pl-3">
            <button
              type="button"
              onClick={handleDone}
              className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors cursor-pointer"
            >
              Done
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-700 dark:bg-zinc-300 text-zinc-200 dark:text-zinc-800 hover:bg-zinc-600 dark:hover:bg-zinc-400 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
