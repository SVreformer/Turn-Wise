import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

export type SupportedLanguage = 'en' | 'kn' | 'hi';

class VoiceService {
  private isEnabled: boolean = true;
  private currentLanguage: SupportedLanguage = 'en';
  private recognitionInstance: any = null;
  private isListeningState: boolean = false;

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (!enabled) {
      Speech.stop();
      this.stopListening();
    }
  }

  public get enabled(): boolean {
    return this.isEnabled;
  }

  public setLanguage(lang: SupportedLanguage) {
    this.currentLanguage = lang;
  }

  public get language(): SupportedLanguage {
    return this.currentLanguage;
  }

  public getLanguageCode(lang?: SupportedLanguage): string {
    const l = lang || this.currentLanguage;
    switch (l) {
      case 'kn':
        return 'kn-IN';
      case 'hi':
        return 'hi-IN';
      case 'en':
      default:
        return 'en-IN';
    }
  }

  public async speak(
    text: string,
    options?: { pitch?: number; rate?: number; language?: SupportedLanguage; onDone?: () => void }
  ) {
    if (!this.isEnabled || !text) return;
    try {
      await Speech.stop();
      const code = this.getLanguageCode(options?.language || this.currentLanguage);
      Speech.speak(text, {
        language: code,
        pitch: options?.pitch ?? 1.0,
        rate: options?.rate ?? 0.92,
        onDone: options?.onDone
      });
    } catch (err) {
      console.warn('Speech synthesis error:', err);
    }
  }

  public async stop() {
    try {
      await Speech.stop();
    } catch {}
    this.stopListening();
  }

  public isListening(): boolean {
    return this.isListeningState;
  }

  /**
   * SPECIFICATION 5: Web Speech API Multilingual Speech Recognition
   * Supports Kannada (kn-IN), Hindi (hi-IN), and English (en-IN).
   */
  public startListening(
    onResult: (transcript: string) => void,
    onError?: (error: string) => void,
    language?: SupportedLanguage
  ): boolean {
    if (Platform.OS !== 'web' && typeof window === 'undefined') {
      onError?.('Speech recognition is supported in web and modern mobile browsers.');
      return false;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      onError?.('Web Speech API is not supported in this browser. Please type your query.');
      return false;
    }

    try {
      if (this.recognitionInstance) {
        this.recognitionInstance.abort();
      }

      const recognition = new SpeechRecognition();
      const langCode = this.getLanguageCode(language || this.currentLanguage);
      recognition.lang = langCode;
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        this.isListeningState = true;
      };

      recognition.onresult = (event: any) => {
        this.isListeningState = false;
        if (event.results && event.results.length > 0) {
          const text = event.results[0][0].transcript;
          onResult(text);
        }
      };

      recognition.onerror = (event: any) => {
        this.isListeningState = false;
        onError?.(event.error || 'Speech recognition failed');
      };

      recognition.onend = () => {
        this.isListeningState = false;
      };

      this.recognitionInstance = recognition;
      recognition.start();
      return true;
    } catch (err: any) {
      this.isListeningState = false;
      onError?.(err.message || 'Speech recognition error');
      return false;
    }
  }

  public stopListening() {
    if (this.recognitionInstance) {
      try {
        this.recognitionInstance.stop();
      } catch {}
      this.recognitionInstance = null;
    }
    this.isListeningState = false;
  }
}

export const voiceService = new VoiceService();
