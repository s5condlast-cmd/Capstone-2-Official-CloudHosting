/**
 * Voice Dictation Service using browser native Web Speech API (SpeechRecognition).
 * Works non-destructively in modern browsers with mic permissions.
 */


export interface SpeechRecognitionOptions {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError?: (errorMessage: string) => void;
  onEnd?: () => void;
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
}

class SpeechToTextService {
  private recognition: any | null = null;
  private listening: boolean = false;
  private shouldKeepListening: boolean = false;

  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  public isListening(): boolean {
    return this.listening;
  }

  public startListening(options: SpeechRecognitionOptions): boolean {
    if (!this.isSupported()) {
      options.onError?.('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return false;
    }

    try {
      this.stopListening();
      this.shouldKeepListening = true;

      const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognitionConstructor();
      this.recognition.continuous = options.continuous ?? true;
      this.recognition.interimResults = options.interimResults ?? true;
      this.recognition.lang = options.lang || 'en-US';

      this.recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPiece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPiece;
          } else {
            interimTranscript += transcriptPiece;
          }
        }

        if (finalTranscript) {
          options.onResult(finalTranscript, true);
        }
        if (interimTranscript) {
          options.onResult(interimTranscript, false);
        }
      };

      this.recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') {
          // Normal brief pause, keep listening
          return;
        }
        if (event.error === 'aborted') {
          return;
        }
        let message = `Microphone error: ${event.error}`;
        if (event.error === 'not-allowed') {
          this.shouldKeepListening = false;
          message = 'Microphone access was denied. Please allow microphone permissions in your browser.';
        }
        options.onError?.(message);
      };

      this.recognition.onend = () => {
        if (this.shouldKeepListening) {
          try {
            this.recognition.start();
            return;
          } catch {
            // failed to restart recognizer
          }
        }
        this.listening = false;
        options.onEnd?.();
      };

      this.recognition.start();
      this.listening = true;
      return true;
    } catch (err: any) {
      this.shouldKeepListening = false;
      this.listening = false;
      options.onError?.(err?.message || 'Could not start speech recognition.');
      return false;
    }
  }

  public stopListening(): void {
    this.shouldKeepListening = false;
    this.listening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore if already stopped
      }
      this.recognition = null;
    }
  }
}

/**
 * Optional Gemini AI speech polishing helper using VITE_GEMINI_API_KEY.
 * Formats dictated speech into properly punctuated and capitalized sentences.
 */
export async function polishDictationWithGemini(rawText: string): Promise<string> {
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!geminiKey || geminiKey === 'MY_GEMINI_API_KEY' || !rawText.trim()) {
    return rawText;
  }

  try {
    const prompt = `You are an AI dictation assistant. Format and punctuate the following spoken dictation into natural, well-formatted English text with proper sentence capitalization, punctuation (commas, periods, question marks), and spacing.
Do not alter the user's intent or core wording; only fix casing, punctuation, and transcription spacing.
Return ONLY the formatted text without quotes, markdown, or commentary.

Dictated text:
${rawText}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 500,
          },
        }),
      }
    );

    if (!res.ok) return rawText;
    const data = await res.json();
    const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return candidate || rawText;
  } catch {
    return rawText;
  }
}

export const speechToTextService = new SpeechToTextService();

