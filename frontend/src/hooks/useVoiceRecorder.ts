import { useState, useRef, useCallback } from 'react';

const MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/mpeg',
];

function getSupportedMimeType(): string {
  for (const type of MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return '';
}

export interface VoiceRecorderState {
  isRecording: boolean;
  audioBlob: Blob | null;
  audioUrl: string | null;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  resetRecording: () => void;
}

export const useVoiceRecorder = (): VoiceRecorderState => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedMimeType();

      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blobType = mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: blobType });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.onerror = () => {
        setError('recording_failed');
        stream.getTracks().forEach((t) => t.stop());
        setIsRecording(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Microphone access denied:', err);
      }
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError('microphone_denied');
      } else if (err instanceof DOMException && err.name === 'NotFoundError') {
        setError('microphone_not_found');
      } else {
        setError('recording_failed');
      }
    }
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }, []);

  const resetRecording = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setError(null);
    chunksRef.current = [];
  }, [audioUrl]);

  return {
    isRecording,
    audioBlob,
    audioUrl,
    error,
    startRecording,
    stopRecording,
    resetRecording,
  };
};
