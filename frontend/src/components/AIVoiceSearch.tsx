import React, { useState } from 'react';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { moroccanAIApi } from '../api/moroccanAIApi';

const MicIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
    <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
  </svg>
);

const StopIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);

interface AIVoiceSearchProps {
  onTranscript: (text: string) => void;
  language?: string;
  className?: string;
}

export const AIVoiceSearch: React.FC<AIVoiceSearchProps> = ({
  onTranscript,
  language = 'auto',
  className = '',
}) => {
  const { isRecording, audioBlob, startRecording, stopRecording, resetRecording } =
    useVoiceRecorder();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleToggle = async () => {
    if (isRecording) {
      stopRecording();
      // Wait for blob to be set via onstop callback
      setTimeout(async () => {
        // audioBlob will be available in next render, so we check current ref logic
      }, 300);
    } else {
      resetRecording();
      await startRecording();
    }
  };

  // Effect to process when blob is ready
  React.useEffect(() => {
    const processAudio = async () => {
      if (audioBlob && !isRecording && !isProcessing) {
        setIsProcessing(true);
        try {
          const res = await moroccanAIApi.transcribeVoice(audioBlob, language);
          onTranscript(res.data.text);
        } catch (err) {
          if (import.meta.env.DEV) {
            console.error('Transcription failed:', err);
          }
          alert('Erreur transcription / خطأ في التحويل');
        } finally {
          setIsProcessing(false);
          resetRecording();
        }
      }
    };
    processAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioBlob, isRecording]);

  return (
    <button
      onClick={handleToggle}
      disabled={isProcessing}
      className={`relative inline-flex items-center justify-center p-2 rounded-full transition-all ${
        isRecording
          ? 'bg-red-500 text-white animate-pulse'
          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
      } disabled:opacity-50 ${className}`}
      title="Recherche vocale / البحث الصوتي"
    >
      {isProcessing ? (
        <span className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
      ) : isRecording ? (
        <StopIcon />
      ) : (
        <MicIcon />
      )}
      {isRecording && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
      )}
    </button>
  );
};