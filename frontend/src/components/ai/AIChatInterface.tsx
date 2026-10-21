import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Sparkles, Send, Mic, Square, X, ChevronDown,
  Bot, Copy, ThumbsUp, ThumbsDown, RotateCcw,
  Home, Search, MapPin, MessageCircle,
  TrendingUp, DollarSign, Users, UserCheck,
  BarChart3, Lightbulb, AlertCircle
} from 'lucide-react';
import { useAIChat } from '../../hooks/useAIChat';
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder';
import { useAuth } from '../../context/AuthContext';
import { AIChatMessage, AIAction } from '../../types/ai';
import { MarkdownText } from './MarkdownText';
import { SafeImage } from '../common/SafeImage';
import { moroccanAIApi } from '../../api/moroccanAIApi';

const LANG_OPTIONS = [
  { value: 'auto', label: 'Auto', flag: '🌐' },
  { value: 'darija', label: 'Darija', flag: '🇲🇦' },
  { value: 'arabic', label: 'العربية', flag: '' },
  { value: 'french', label: 'Français', flag: '' },
  { value: 'english', label: 'English', flag: '' },
];

const ROLE_COLORS: Record<string, string> = {
  guest: 'bg-slate-500',
  buyer: 'bg-teal-600',
  locataire: 'bg-blue-600',
  proprietaire: 'bg-amber-600',
  admin: 'bg-purple-600',
};

const ROLE_ICONS: Record<string, React.ElementType> = {
  guest: Users,
  buyer: Search,
  locataire: Home,
  proprietaire: DollarSign,
  admin: UserCheck,
};

interface AIChatInterfaceProps {
  embedded?: boolean;
  className?: string;
}

export const AIChatInterface: React.FC<AIChatInterfaceProps> = ({
  embedded = false,
  className = '',
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(embedded);
  const [input, setInput] = useState('');
  const [lang, setLang] = useState('auto');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, 'up' | 'down'>>({});
  const { user } = useAuth();
  const {
    messages, isLoading, sendMessage, sendVoiceMessage, sendQuickReply, clearChat,
    detectedRole, sessionId,
  } = useAIChat();
  const { isRecording, audioBlob, error: voiceError, startRecording, stopRecording, resetRecording } = useVoiceRecorder();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const voiceHandledRef = useRef(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Wire voice recording to actually send to API
  useEffect(() => {
    if (audioBlob && !isRecording && !voiceHandledRef.current) {
      voiceHandledRef.current = true;
      sendVoiceMessage(audioBlob, lang).finally(() => {
        resetRecording();
        voiceHandledRef.current = false;
      });
    }
  }, [audioBlob, isRecording, lang, sendVoiceMessage, resetRecording]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim(), lang);
    setInput('');
  };

  const handleVoice = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      resetRecording();
      voiceHandledRef.current = false;
      await startRecording();
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedback = async (msgId: string, type: 'up' | 'down') => {
    setFeedbackMap(prev => ({ ...prev, [msgId]: type }));
    if (!sessionId) return;
    try {
      await moroccanAIApi.sendFeedback(sessionId, type === 'up', user?.id);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[ChatFeedback] Failed to send feedback:', err);
      }
    }
  };

  const isRTL = lang === 'arabic' || lang === 'darija';
  const roleColor = ROLE_COLORS[detectedRole] || ROLE_COLORS.guest;
  const RoleIcon = ROLE_ICONS[detectedRole] || ROLE_ICONS.guest;

  const quickPrompts = [
    { icon: Search, text: t('chatbot.quickPrompts.search', 'Find an apartment in Casablanca') },
    { icon: Home, text: t('chatbot.quickPrompts.price', 'What is the average price in Marrakech?') },
    { icon: MapPin, text: t('chatbot.quickPrompts.neighborhood', 'Best neighborhoods in Rabat') },
    { icon: MessageCircle, text: t('chatbot.quickPrompts.contact', 'How to contact an owner?') },
  ];

  const placeholderText = lang === 'darija'
    ? t('chatbot.placeholderDarija', 'Type something...')
    : lang === 'arabic'
    ? t('chatbot.placeholderArabic', 'Type your message...')
    : t('chatbot.placeholder', 'Type a message...');

  if (!embedded && !open) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-teal-600 to-teal-700 text-white shadow-lg hover:shadow-xl transition-shadow"
        aria-label={t('chatbot.open')}
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        >
          <Sparkles size={24} />
        </motion.div>
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400">
          <Sparkles size={10} className="text-slate-900" />
        </span>
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={embedded ? {} : { opacity: 0, y: 20, scale: 0.95 }}
      animate={embedded ? {} : { opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className={`${
        embedded
          ? 'h-full flex flex-col'
          : 'fixed bottom-6 right-6 z-50 w-[420px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-6rem)]'
      } rounded-3xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col ${className}`}
    >
      {/* Header */}
      <div className="relative bg-gradient-to-r from-teal-600 to-teal-700 px-5 py-4 flex items-center justify-between shrink-0">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/5" />
          <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-white/5" />
        </div>
        <div className="relative flex items-center gap-3">
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
              <Bot size={20} className="text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-teal-600" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">{t('chatbot.title')}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium text-white ${roleColor}`}>
                <RoleIcon size={10} />
                {t(`chatbot.role.${detectedRole}`, detectedRole)}
              </span>
            </div>
          </div>
        </div>
        <div className="relative flex items-center gap-1">
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1 rounded-lg bg-white/15 px-2.5 py-1.5 text-xs text-white hover:bg-white/25 transition"
            >
              {LANG_OPTIONS.find((l) => l.value === lang)?.flag}{' '}
              {LANG_OPTIONS.find((l) => l.value === lang)?.label}
              <ChevronDown size={12} />
            </button>
            <AnimatePresence>
              {showLangMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute right-0 top-full mt-1 w-36 rounded-xl bg-white dark:bg-slate-800 shadow-xl border border-slate-100 dark:border-slate-600 py-1 z-10"
                >
                  {LANG_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      onClick={() => { setLang(o.value); setShowLangMenu(false); }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-2 ${
                        lang === o.value ? 'text-teal-600 font-medium' : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      <span>{o.flag}</span> {o.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button
            onClick={clearChat}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition"
            title={t('chatbot.newConversation')}
          >
            <RotateCcw size={16} />
          </button>
          {!embedded && (
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition"
              aria-label={t('chatbot.close')}
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/50"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {messages.length <= 1 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-600/10 dark:bg-teal-500/10 mb-4"
            >
              <Sparkles size={28} className="text-amber-500" />
            </motion.div>
            <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-2">
              {t('chatbot.welcomeTitle', 'How can I help you?')}
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-xs">
              {t('chatbot.welcomeSubtitle', 'I speak French, Arabic and Darija. Ask me your questions about real estate in Morocco.')}
            </p>
            <div className="w-full space-y-2">
              {quickPrompts.map((prompt, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => {
                    setInput(prompt.text);
                    inputRef.current?.focus();
                  }}
                  className="w-full flex items-center gap-3 rounded-xl bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 px-4 py-3 text-sm text-left hover:border-teal-500/30 hover:shadow-sm transition"
                >
                  <prompt.icon size={16} className="text-teal-600 shrink-0" />
                  <span className="text-slate-600 dark:text-slate-300">{prompt.text}</span>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isRTL={isRTL}
              onCopy={(text) => handleCopy(text, msg.id)}
              copied={copiedId === msg.id}
              onQuickReply={sendQuickReply}
              feedback={feedbackMap[msg.id]}
              onFeedback={(type) => handleFeedback(msg.id, type)}
              onNavigate={(path) => navigate(path)}
            />
          ))}
        </AnimatePresence>

        {isLoading && (
          <div className={`flex ${isRTL ? 'justify-end' : 'justify-start'}`}>
            <ChatLoadingSkeleton isRTL={isRTL} />
          </div>
        )}
      </div>

      {/* Voice Error */}
      {voiceError && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-100 dark:border-red-800 flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
          <AlertCircle size={14} />
          <span>
            {voiceError === 'microphone_denied' && t('chatbot.microphoneDenied', 'Please allow microphone access')}
            {voiceError === 'microphone_not_found' && t('chatbot.microphoneNotFound', 'No microphone detected')}
            {voiceError === 'recording_failed' && t('chatbot.recordingFailed', 'Recording error')}
          </span>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={placeholderText}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 pr-10 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 transition"
              dir={isRTL ? 'rtl' : 'ltr'}
            />
            {input.length > 0 && (
              <button
                type="button"
                onClick={() => setInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleVoice}
            disabled={isLoading}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
              isRecording
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
            title={t('chatbot.voiceSearch')}
          >
            {isRecording ? <Square size={16} /> : <Mic size={18} />}
          </button>
          <motion.button
            type="submit"
            disabled={isLoading || !input.trim()}
            whileTap={{ scale: 0.9 }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white hover:bg-teal-600/90 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <Send size={18} />
          </motion.button>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-1.5">
          {t('chatbot.disclaimer', 'AI can sometimes make mistakes. Verify important information.')}
        </p>
      </form>
    </motion.div>
  );
};

// ─── Message Bubble ─────────────────────────────────────────────────
const MessageBubble: React.FC<{
  message: AIChatMessage;
  isRTL: boolean;
  onCopy: (text: string) => void;
  copied: boolean;
  onQuickReply?: (action: string, label: string) => void;
  feedback?: 'up' | 'down';
  onFeedback?: (type: 'up' | 'down') => void;
  onNavigate?: (path: string) => void;
}> = ({ message, isRTL, onCopy, copied, onQuickReply, feedback, onFeedback, onNavigate }) => {
  const { t } = useTranslation();
  const isUser = message.role === 'user';
  const [showActions, setShowActions] = useState(false);

  const intentIcon = (intent?: string) => {
    switch (intent) {
      case 'BUY': return <Search size={10} />;
      case 'SELL': return <DollarSign size={10} />;
      case 'RENT': return <Home size={10} />;
      case 'PRICE_CHECK': return <TrendingUp size={10} />;
      case 'EXPLORE': return <MapPin size={10} />;
      case 'SUPPORT': return <MessageCircle size={10} />;
      default: return <Lightbulb size={10} />;
    }
  };

  const propertyCountLabel = message.sources?.length
    ? message.sources.length > 1
      ? t('chatbot.propertiesFound', { count: message.sources.length, defaultValue: `${message.sources.length} properties found` })
      : t('chatbot.propertyFound', { count: message.sources.length, defaultValue: `${message.sources.length} property found` })
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`group relative max-w-[90%] ${isUser ? 'order-2' : 'order-1'}`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Avatar + Intent badge */}
        {!isUser && (
          <div className="flex items-center gap-1.5 mb-1">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-600/10 dark:bg-teal-500/10">
              <Bot size={14} className="text-teal-600 dark:text-teal-400" />
            </div>
            {message.intent && (
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 text-[10px] font-medium text-teal-700 dark:text-teal-300 border border-teal-100 dark:border-teal-800">
                {intentIcon(message.intent)}
                {message.intent}
              </span>
            )}
          </div>
        )}

        <div
          className={`relative rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? 'bg-teal-600 text-white rounded-br-md'
              : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-100 dark:border-slate-600 rounded-bl-md shadow-sm'
          }`}
          dir={isRTL && !isUser ? 'rtl' : 'ltr'}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <MarkdownText content={message.content} isRTL={isRTL} />
          )}

          {/* Property cards */}
          {message.sources && message.sources.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mb-1">
                {propertyCountLabel}
              </p>
              {message.sources.map((src) => (
                <button
                  key={src.id}
                  onClick={() => onNavigate?.(`/property/${src.id}`)}
                  className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-600/50 hover:bg-slate-100 dark:hover:bg-slate-600 p-2.5 transition group/source text-left"
                >
                  <div className="h-12 w-12 rounded-lg bg-slate-200 dark:bg-slate-600 shrink-0 overflow-hidden">
                    {src.imageUrl ? (
                      <SafeImage src={src.imageUrl} alt={src.title} className="h-full w-full object-cover" />
                    ) : (
                      <Home size={20} className="m-2.5 text-slate-400 dark:text-slate-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900 dark:text-slate-100 text-xs truncate group-hover/source:text-teal-600 dark:group-hover/source:text-teal-400 transition">
                      {src.title}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {src.city} · {src.type} · {src.price?.toLocaleString()} MAD
                    </p>
                  </div>
                  <ChevronDown size={14} className="text-slate-400 dark:text-slate-500 -rotate-90 shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* Quick Reply Buttons */}
          {message.quickReplies && message.quickReplies.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {message.quickReplies.map((qr, i) => (
                <button
                  key={i}
                  onClick={() => onQuickReply?.(qr.action, qr.label)}
                  className="inline-flex items-center gap-1 rounded-full bg-teal-50 dark:bg-teal-900/30 px-3 py-1.5 text-xs font-medium text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/50 border border-teal-100 dark:border-teal-800 transition"
                >
                  {qr.label}
                </button>
              ))}
            </div>
          )}

          {/* Interactive Actions */}
          {message.actions && message.actions.length > 0 && (
            <div className="mt-3 space-y-2">
              {message.actions.map((action: AIAction, i: number) => (
                <ActionRenderer key={i} action={action} onNavigate={onNavigate} />
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <AnimatePresence>
          {!isUser && showActions && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex items-center gap-1 mt-1"
            >
              <button
                onClick={() => onCopy(message.content)}
                className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
                title={t('chatbot.copy', 'Copy')}
              >
                {copied ? <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">{t('chatbot.copied', 'Copied!')}</span> : <Copy size={12} />}
              </button>
              <button
                onClick={() => onFeedback?.('up')}
                className={`p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition ${
                  feedback === 'up' ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
                title={t('chatbot.useful', 'Useful')}
              >
                <ThumbsUp size={12} />
              </button>
              <button
                onClick={() => onFeedback?.('down')}
                className={`p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition ${
                  feedback === 'down' ? 'text-red-500 dark:text-red-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
                title={t('chatbot.notUseful', 'Not useful')}
              >
                <ThumbsDown size={12} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// ─── Chat Loading Skeleton ──────────────────────────────────────────
const ChatLoadingSkeleton: React.FC<{ isRTL?: boolean }> = ({ isRTL = false }) => (
  <motion.div
    initial={{ opacity: 0, y: 8, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    className="flex items-end gap-2 max-w-[85%]"
    dir={isRTL ? 'rtl' : 'ltr'}
  >
    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-600/10 dark:bg-teal-500/10 shrink-0">
      <Bot size={14} className="text-teal-600 dark:text-teal-400" />
    </div>
    <div className="rounded-2xl rounded-bl-md bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 px-4 py-3 shadow-sm">
      <div className="flex items-center gap-1.5">
        <motion.span
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
          className="h-2 w-2 rounded-full bg-teal-600"
        />
        <motion.span
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
          className="h-2 w-2 rounded-full bg-teal-600"
        />
        <motion.span
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
          className="h-2 w-2 rounded-full bg-teal-600"
        />
      </div>
    </div>
  </motion.div>
);

// ─── Action Renderer ────────────────────────────────────────────────
const ActionRenderer: React.FC<{ action: AIAction; onNavigate?: (path: string) => void }> = ({ action, onNavigate }) => {
  const { t } = useTranslation();

  if (action.type === 'slider') {
    const [value, setValue] = useState(action.default || action.min || 0);
    return (
      <div className="rounded-xl bg-slate-50 dark:bg-slate-600/30 border border-slate-100 dark:border-slate-600 p-3">
        <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-2">{action.label}</label>
        <input
          type="range"
          min={action.min}
          max={action.max}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="w-full accent-teal-600"
        />
        <div className="text-right text-xs text-slate-500 dark:text-slate-400 mt-1">{t('chatbot.price', { price: value.toLocaleString() })}</div>
      </div>
    );
  }

  if (action.type === 'link') {
    return (
      <button
        onClick={() => {
          if (action.action.startsWith('/')) {
            onNavigate?.(action.action);
          } else {
            window.open(action.action, '_blank', 'noopener,noreferrer');
          }
        }}
        className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-4 py-2 text-xs font-medium text-white hover:bg-teal-700 transition"
      >
        {action.label}
      </button>
    );
  }

  // Default button action with navigation support
  const handleButtonAction = () => {
    const act = action.action.toLowerCase();
    if (act.startsWith('/property/')) {
      onNavigate?.(action.action);
    } else if (act.includes('search')) {
      onNavigate?.('/search');
    } else if (act.includes('explore') || act.includes('browse')) {
      onNavigate?.('/home');
    } else if (act.includes('contact')) {
      onNavigate?.('/contact');
    } else if (act.startsWith('http')) {
      window.open(action.action, '_blank', 'noopener,noreferrer');
    } else {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.log('Unhandled action:', action.action);
      }
    }
  };

  return (
    <button
      onClick={handleButtonAction}
      className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-900/30 px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-100 dark:border-amber-800 transition"
    >
      <BarChart3 size={12} />
      {action.label}
    </button>
  );
};

export default AIChatInterface;
