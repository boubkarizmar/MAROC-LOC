import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { moroccanAIApi } from '../api/moroccanAIApi';
import { AIChatMessage, AIChatRequest } from '../types/ai';
import { useTranslation } from 'react-i18next';
import { processLocalAIQuery } from '../services/localAIEngine';
import { fixMediaUrl } from '../utils/imageUtils';

const WELCOME_MESSAGES: Record<string, string> = {
  fr: 'Bonjour, je suis votre assistant immobilier MAROC-LOC. Comment puis-je vous aider aujourd\'hui ?',
  en: 'Hello! I am your MAROC-LOC real estate assistant. How can I help you today?',
  ar: 'مرحباً! أنا مساعدك العقاري من MAROC-LOC. كيف يمكنني مساعدتك اليوم؟',
  darija: 'مرحبا! أنا مساعدك العقاري ديال MAROC-LOC. شنو نقدر نساعدك بيه اليوم؟',
};

function detectLanguage(text: string): string {
  if (/[\u0600-\u06FF]/.test(text)) return 'ar';
  if (/[àâçéèêëîïôùûü]/.test(text.toLowerCase())) return 'fr';
  return 'en';
}

function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

export const useAIChat = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const sessionIdRef = useRef<string>('');
  const [detectedRole, setDetectedRole] = useState<string>('guest');
  const messagesRef = useRef<AIChatMessage[]>([]);
  const initializedRef = useRef(false);
  const sessionContextRef = useRef<{ lastCity?: string; lastIntent?: string }>({});

  // Keep sessionId ref in sync for immediate access across renders
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  // Keep ref in sync
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const getUserRole = useCallback((): 'locataire' | 'proprietaire' | 'admin' | null => {
    if (!user) return null;
    const role = user.role || user.userType || '';
    if (role === 'ADMIN') return 'admin';
    if (role === 'PROPRIETAIRE' || role === 'OWNER') return 'proprietaire';
    if (role === 'LOCATAIRE' || role === 'TENANT' || role === 'BUYER') return 'locataire';
    return null;
  }, [user]);

  const buildWelcomeMessage = useCallback((): AIChatMessage => {
    const lang = i18n.language.startsWith('fr') ? 'fr' : i18n.language.startsWith('ar') ? 'ar' : 'en';
    const quickReplies = [
      { label: t('chatbot.quickReplies.search', 'Rechercher un bien'), action: 'search' },
      { label: t('chatbot.quickReplies.mortgage', 'Simuler un credit'), action: 'mortgage' },
      { label: t('chatbot.quickReplies.explore', 'Explorer les biens'), action: 'explore' },
    ];
    return {
      id: generateId(),
      role: 'assistant',
      content: WELCOME_MESSAGES[lang] || WELCOME_MESSAGES.en,
      timestamp: new Date(),
      quickReplies,
    };
  }, [i18n.language, t]);

  // Initialize welcome message only once
  useEffect(() => {
    if (!initializedRef.current && messages.length === 0) {
      initializedRef.current = true;
      setMessages([buildWelcomeMessage()]);
    }
  }, [buildWelcomeMessage, messages.length]);

  const sendMessage = useCallback(async (content: string, language: string = 'auto') => {
    const userMsg: AIChatMessage = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    // ─── LOCAL AI ENGINE (high accuracy, no backend needed) ─────────
    try {
      const localResult = await processLocalAIQuery(content, sessionContextRef.current);
      if (localResult) {
        const assistantMsg: AIChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: localResult.content,
          timestamp: new Date(),
          intent: localResult.intent,
          quickReplies: localResult.quickReplies,
          actions: localResult.actions,
          sources: localResult.sources,
        };
        setMessages(prev => [...prev, assistantMsg]);
        setIsLoading(false);
        return;
      }
    } catch (localErr) {
      // Fallback to backend if local engine fails
      if (import.meta.env.DEV) {
        console.warn('[LocalAI] Failed, falling back to backend:', localErr);
      }
    }

    // ─── BACKEND AI FALLBACK ────────────────────────────────────────
    try {
      const userRole = getUserRole();
      const payload: AIChatRequest = {
        message: content,
        sessionId: sessionIdRef.current || undefined,
        userRole: userRole,
        language: language as AIChatRequest['language'],
      };

      const res = await moroccanAIApi.chat(payload);
      const data = res.data;

      const returnedSessionId = (data as any).session_id || data.sessionId;
      if (returnedSessionId) {
        setSessionId(returnedSessionId);
        sessionIdRef.current = returnedSessionId;
      }
      if (data.role) setDetectedRole(data.role);

      const lang = detectLanguage(data.response);
      const assistantMsg: AIChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        intent: data.intent,
        detectedRole: data.role,
        quickReplies: data.quick_replies?.map((q: { label: string; action: string }) => ({ label: q.label, action: q.action })),
        actions: data.actions?.map((a: { type: string; label: string; action: string; min?: number; max?: number; default?: number }) => ({
          type: a.type as 'button' | 'slider' | 'link',
          label: a.label,
          action: a.action,
          min: a.min,
          max: a.max,
          default: a.default,
        })),
        sources: data.properties?.map((p: { id: string; title: string; city: string; price: number; type: string; imageUrl?: string }) => ({
          id: p.id,
          title: p.title,
          city: p.city,
          price: p.price,
          type: p.type,
          imageUrl: p.imageUrl ? fixMediaUrl(p.imageUrl) : undefined,
          distance: 0,
        })),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg = t('chatbot.unavailable', 'Assistant momentanement indisponible. Reessayez dans quelques instants.');
      setMessages(prev => [
        ...prev,
        {
          id: generateId(),
          role: 'assistant',
          content: errorMsg,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, getUserRole, t]);

  const sendVoiceMessage = useCallback(async (audioBlob: Blob, language: string = 'auto') => {
    setIsLoading(true);
    try {
      const res = await moroccanAIApi.voiceChat(audioBlob, sessionId || undefined, language);
      const data = res.data;

      if (data.sessionId) setSessionId(data.sessionId);
      if (data.role) setDetectedRole(data.role);

      const assistantMsg: AIChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        intent: data.intent,
        detectedRole: data.role,
        quickReplies: data.quick_replies?.map((q: { label: string; action: string }) => ({ label: q.label, action: q.action })),
        sources: data.properties?.map((p: { id: string; title: string; city: string; price: number; type: string; imageUrl?: string }) => ({
          id: p.id,
          title: p.title,
          city: p.city,
          price: p.price,
          type: p.type,
          imageUrl: p.imageUrl ? fixMediaUrl(p.imageUrl) : undefined,
          distance: 0,
        })),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg = t('chatbot.unavailable', 'Assistant momentanement indisponible. Reessayez dans quelques instants.');
      setMessages(prev => [
        ...prev,
        {
          id: generateId(),
          role: 'assistant',
          content: errorMsg,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, t]);

  const speakMessage = useCallback(async (content: string, language: string = 'french') => {
    try {
      const res = await moroccanAIApi.tts(content, language);
      const audioUrl = res.data.audio_url;
      if (audioUrl) {
        const audio = new Audio(audioUrl);
        await audio.play();
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[TTS] Failed to speak message:', err);
      }
    }
  }, []);

  const sendQuickReply = useCallback(async (action: string, label: string) => {
    await sendMessage(label, 'auto');
  }, [sendMessage]);

  const clearChat = useCallback(() => {
    setMessages([buildWelcomeMessage()]);
    setSessionId('');
    setDetectedRole('guest');
    sessionContextRef.current = {};
    if (typeof window !== 'undefined') {
      localStorage.removeItem('aiSessionId');
    }
  }, [buildWelcomeMessage]);

  return {
    messages,
    isLoading,
    sendMessage,
    sendVoiceMessage,
    sendQuickReply,
    speakMessage,
    clearChat,
    detectedRole,
    sessionId,
  };
};
