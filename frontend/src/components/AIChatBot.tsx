import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useReducedMotion } from 'framer-motion';
import { useAIChat } from '../hooks/useAIChat';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { AIChatMessage } from '../types/ai';
import { LiveRegion } from './ux/AccessibilityUtils';

const RobotIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <rect x="3" y="11" width="18" height="10" rx="2" />
    <circle cx="12" cy="5" r="2" />
    <path d="M12 7v4M8 15h8M8 18h8" />
  </svg>
);

const SendIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
);

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

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const SpeakerIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path d="M11 5L6 9H2v6h4l5 4V5z" />
    <path d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14" />
  </svg>
);

const LANG_OPTIONS = [
  { value: 'auto', label: 'Auto 🌐' },
  { value: 'darija', label: 'Darija 🇲🇦' },
  { value: 'arabic', label: 'العربية' },
  { value: 'french', label: 'Français' },
  { value: 'english', label: 'English' },
];

export const AIChatBot: React.FC = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [lang, setLang] = useState('auto');
  const { messages, isLoading, sendMessage, sendVoiceMessage, speakMessage, clearChat } = useAIChat();
  const { isRecording, audioBlob, startRecording, stopRecording, resetRecording } =
    useVoiceRecorder();
  const scrollRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim(), lang);
    setInput('');
  };

  const handleVoice = async () => {
    if (isRecording) {
      stopRecording();
      return;
    }
    resetRecording();
    await startRecording();
  };

  useEffect(() => {
    if (audioBlob && !isRecording) {
      sendVoiceMessage(audioBlob, lang);
      resetRecording();
    }
  }, [audioBlob, isRecording, lang, resetRecording, sendVoiceMessage]);

  const isRTL = lang === 'arabic' || lang === 'darija';

  return (
    <>
      <LiveRegion message={isLoading ? t('chatbot.typing') : ''} />

      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-110"
        aria-label={open ? t('chatbot.close') : t('chatbot.open')}
      >
        {open ? <CloseIcon /> : <RobotIcon />}
      </button>

      {/* Chat Window */}
      {open && (
        <div
          className={`fixed bottom-24 right-6 z-50 w-[400px] max-w-[95vw] h-[560px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden ${
            isRTL ? 'rtl' : 'ltr'
          }`}
        >
          {/* Header */}
          <div className="bg-emerald-600 text-white px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <RobotIcon />
              <span className="font-semibold">{t('chatbot.title')}</span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                aria-label={t('chatbot.selectLanguage', 'Langue')}
                className="bg-emerald-700 text-white text-xs rounded px-2 py-1 border-none outline-none"
              >
                {LANG_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <button onClick={clearChat} className="text-xs hover:underline">
                {t('chatbot.clear')}
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50"
          >
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isRTL={isRTL}
                onSpeak={speakMessage}
              />
            ))}
            {isLoading && (
              <div className="flex gap-1 items-center text-gray-400 text-sm" aria-live="polite" aria-busy="true">
                <span className={prefersReducedMotion ? '' : 'animate-bounce'}>●</span>
                <span className={prefersReducedMotion ? '' : 'animate-bounce delay-100'}>●</span>
                <span className={prefersReducedMotion ? '' : 'animate-bounce delay-200'}>●</span>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-3 border-t bg-white flex gap-2 shrink-0">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                lang === 'darija'
                  ? t('chatbot.placeholderDarija')
                  : lang === 'arabic'
                  ? t('chatbot.placeholderArabic')
                  : lang === 'french'
                  ? t('chatbot.placeholderFrench', t('chatbot.placeholder'))
                  : t('chatbot.placeholder')
              }
              className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              dir={isRTL ? 'rtl' : 'ltr'}
            />
            <button
              type="button"
              onClick={handleVoice}
              disabled={isLoading}
              aria-label={isRecording ? t('chatbot.stopRecording', 'Arrêter l\'enregistrement') : t('chatbot.voiceSearch')}
              className={`p-2 rounded-lg disabled:opacity-50 ${
                isRecording
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isRecording ? <StopIcon /> : <MicIcon />}
            </button>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              aria-label={t('chatbot.send')}
              className="bg-emerald-600 text-white p-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              <SendIcon />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

const MessageBubble: React.FC<{
  message: AIChatMessage;
  isRTL: boolean;
  onSpeak?: (content: string, language: string) => void;
}> = ({ message, isRTL, onSpeak }) => {
  const { t } = useTranslation();
  const isUser = message.role === 'user';

  const handleSpeak = () => {
    if (onSpeak && message.content) {
      const lang =
        message.detectedRole === 'french' || message.intent?.includes('fr')
          ? 'french'
          : message.detectedRole === 'arabic'
          ? 'arabic'
          : message.detectedRole === 'darija'
          ? 'darija'
          : 'french';
      onSpeak(message.content, lang);
    }
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[90%] rounded-2xl px-4 py-2 text-sm ${
          isUser
            ? 'bg-emerald-600 text-white rounded-br-none'
            : 'bg-white text-gray-800 border rounded-bl-none shadow-sm'
        }`}
        dir={isRTL && !isUser ? 'rtl' : 'ltr'}
      >
        <div className="flex items-start gap-2">
          <p className="whitespace-pre-wrap flex-1">{message.content}</p>
          {!isUser && onSpeak && (
            <button
              onClick={handleSpeak}
              aria-label={t('chatbot.readAloud')}
              className="mt-1 p-1 rounded-full hover:bg-gray-100 text-gray-500 transition-colors shrink-0"
            >
              <SpeakerIcon />
            </button>
          )}
        </div>

        {/* Property Cards */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.sources.map((src) => (
              <a
                key={src.id}
                href={src.url || `/property/${src.propertyId || src.id}`}
                className="block bg-gray-50 hover:bg-emerald-50 rounded-lg p-2 text-xs transition-colors border border-gray-100"
              >
                {src.imageUrl && (
                  <img
                    src={src.imageUrl}
                    alt={src.title}
                    className="w-full h-24 object-cover rounded-md mb-2"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
                <div className="font-semibold text-emerald-700 truncate">{src.title}</div>
                <div className="text-gray-600 flex items-center gap-1 flex-wrap">
                  <span>📍 {src.city}</span>
                  <span>•</span>
                  <span>{src.type}</span>
                  <span>•</span>
                  <span className="font-semibold text-emerald-600">
                    {t('chatbot.price', { price: src.price?.toLocaleString?.() })}
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* Quick Replies */}
        {message.quickReplies && message.quickReplies.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {message.quickReplies.map((qr, idx) => (
              <button
                key={idx}
                onClick={() => {
                  // In a real app, this would trigger the action
                  if (import.meta.env.DEV) {
                    console.log('Quick reply:', qr.action, qr.label);
                  }
                }}
                className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs hover:bg-emerald-100 transition-colors"
              >
                {qr.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
