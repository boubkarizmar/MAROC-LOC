import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useMessaging } from '../hooks/useMessaging';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft, Send, User, CheckCheck, Circle,
  MessageCircle, Trash2, Search, RefreshCw,
  Wifi, WifiOff, Calendar
} from 'lucide-react';
import { EmptyState, MessagesEmptyState } from '../components/ux/EmptyState';
import { ScrollReveal } from '../components/ux/EmotionalDesign';
import { ChatTypingIndicator } from '../components/ux/PremiumLoading';
import { useToast } from '../components/ui/Toast';
import { Message, Conversation } from '../types';

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth() === b.getMonth() &&
         a.getDate() === b.getDate();
}

function getInitials(name?: string): string {
  if (!name) return 'U';
  return name.trim().charAt(0).toUpperCase();
}

function formatShortDate(d: Date, locale: string, t: (key: string, fallback?: string) => string) {
  const now = new Date();
  if (isSameDay(d, now)) return t('inbox.today', 'Aujourd\'hui');
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(d, yesterday)) return t('inbox.yesterday', 'Hier');
  return d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
}

function roleKey(role?: string): string {
  if (!role) return '';
  const upper = role.toUpperCase();
  if (upper === 'ADMIN') return 'inbox.roleAdmin';
  if (upper === 'PROPRIETAIRE' || upper === 'OWNER') return 'inbox.roleOwner';
  if (upper === 'LOCATAIRE' || upper === 'TENANT') return 'inbox.roleTenant';
  return '';
}

interface DateSeparatorProps {
  date: Date;
  locale: string;
}

const DateSeparator: React.FC<DateSeparatorProps> = React.memo(({ date, locale }) => {
  const { t } = useTranslation();
  return (
    <div className="flex justify-center py-2" dir="ltr">
      <span className="flex items-center gap-1 rounded-full bg-slate-200/60 px-3 py-1 text-[10px] font-medium text-slate-600">
        <Calendar size={10} />
        {formatShortDate(date, locale, t)}
      </span>
    </div>
  );
});
DateSeparator.displayName = 'DateSeparator';

interface MessageBubbleProps {
  msg: Message;
  isMine: boolean;
  locale: string;
  onDelete: (id: number) => void;
  dir: 'ltr' | 'rtl';
}

const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({ msg, isMine, locale, onDelete, dir }) => {
  const [showActions, setShowActions] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTouch = useRef(false);

  const handleTouchStart = useCallback(() => {
    if (!isMine || !msg.id || msg.id <= 0) return;
    isTouch.current = true;
    longPressTimer.current = setTimeout(() => {
      setShowActions(true);
    }, 600);
  }, [isMine, msg.id]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const time = new Date(msg.timestamp || msg.createdAt || Date.now()).toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
      dir={dir}
    >
      <div
        className={`group relative max-w-[75%] rounded-2xl px-4 py-2.5 ${
          isMine
            ? 'bg-teal-600 text-white rounded-br-md ms-2'
            : 'bg-white text-slate-700 rounded-bl-md shadow-sm border border-slate-100 me-2'
        }`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchEnd}
        onContextMenu={(e) => {
          if (isMine && msg.id && msg.id > 0) {
            e.preventDefault();
            setShowActions(true);
          }
        }}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
        <div className={`mt-1 flex items-center gap-1 text-[10px] ${isMine ? 'text-white/60' : 'text-slate-400'}`}>
          <span>{time}</span>
          {isMine && (msg.isRead ? <CheckCheck size={10} /> : <Circle size={10} />)}
        </div>
        {isMine && msg.id && msg.id > 0 && (
          <>
            <button
              onClick={() => setShowActions(true)}
              className="absolute -top-2 -end-2 md:opacity-0 md:group-hover:opacity-100 h-6 w-6 flex items-center justify-center rounded-full bg-red-500 text-white shadow-sm transition-opacity opacity-100"
              aria-label="Supprimer"
            >
              <Trash2 size={10} />
            </button>
            {showActions && (
              <div
                className="fixed inset-0 z-40 bg-black/20 flex items-center justify-center"
                onClick={() => setShowActions(false)}
              >
                <div className="bg-white rounded-xl shadow-xl p-4 mx-4 max-w-xs w-full">
                  <p className="text-sm text-slate-700 mb-3">Supprimer ce message ?</p>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setShowActions(false)}
                      className="px-3 py-1.5 text-xs rounded-lg text-slate-600 hover:bg-slate-100"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => {
                        onDelete(msg.id!);
                        setShowActions(false);
                      }}
                      className="px-3 py-1.5 text-xs rounded-lg bg-red-500 text-white hover:bg-red-600"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
});
MessageBubble.displayName = 'MessageBubble';

interface ConversationItemProps {
  conv: Conversation;
  isSelected: boolean;
  isOnline: boolean;
  locale: string;
  onClick: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = React.memo(({
  conv,
  isSelected,
  isOnline,
  locale,
  onClick,
}) => {
  const { t } = useTranslation();
  return (
    <button
      onClick={onClick}
      className={`w-full p-4 text-left flex items-start gap-3 hover:bg-slate-50 transition border-b border-slate-50 ${
        isSelected ? 'bg-teal-600/5 border-s-4 border-s-morocco-royal' : ''
      }`}
    >
      <div className="relative shrink-0">
        {conv.partnerAvatar ? (
          <img
            src={conv.partnerAvatar}
            alt={conv.partnerName}
            className="h-10 w-10 rounded-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : null}
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-morocco-gold to-morocco-emerald text-white font-bold text-sm ${
            conv.partnerAvatar ? 'hidden' : 'flex'
          }`}
        >
          {getInitials(conv.partnerName)}
        </div>
        <span
          className={`absolute -bottom-0.5 -end-0.5 h-3 w-3 rounded-full border-2 border-white ${
            isOnline ? 'bg-emerald-500' : 'bg-slate-300'
          }`}
          title={isOnline ? t('inbox.online') : t('inbox.offline')}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-slate-900 dark:text-slate-50 truncate text-sm">{conv.partnerName}</span>
          {conv.unreadCount > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs text-white font-bold">
              {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
            </span>
          )}
        </div>
        <p className="text-sm text-slate-500 truncate mt-0.5">{conv.lastMessage}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <p className="text-xs text-slate-400">
            {conv.lastMessageDate
              ? new Date(conv.lastMessageDate).toLocaleDateString(locale, { day: 'numeric', month: 'short' })
              : ''}
          </p>
          {conv.partnerRole && roleKey(conv.partnerRole) && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-100">
              {t(roleKey(conv.partnerRole), conv.partnerRole)}
            </span>
          )}
          {conv.propertyTitle && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 truncate max-w-[120px]">
              {conv.propertyTitle}
            </span>
          )}
        </div>
      </div>
    </button>
  );
});
ConversationItem.displayName = 'ConversationItem';

const Inbox: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isNearBottomRef = useRef(true);
  const prevScrollHeightRef = useRef(0);

  const {
    conversations,
    messages,
    selectedPartnerId,
    setSelectedPartnerId,
    loading,
    loadingMore,
    hasMore,
    sending,
    error,
    connected,
    loadConversations,
    loadMessages,
    loadMoreMessages,
    sendMessage,
    sendTyping,
    deleteMessage,
    isPartnerTyping,
    presence,
  } = useMessaging(user?.id, localStorage.getItem('token'));

  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  // Auto-scroll to bottom when a new message arrives if user is near bottom
  useEffect(() => {
    if (messages.length === 0) return;
    const container = chatContainerRef.current;
    if (!container) return;

    if (isNearBottomRef.current) {
      scrollToBottom('smooth');
    }
  }, [messages, scrollToBottom]);

  const handleScroll = useCallback(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const nearBottom = scrollHeight - scrollTop - clientHeight < 80;
    isNearBottomRef.current = nearBottom;

    if (scrollTop < 100 && hasMore && !loadingMore) {
      prevScrollHeightRef.current = scrollHeight;
      loadMoreMessages();
    }
  }, [hasMore, loadingMore, loadMoreMessages]);

  // Preserve scroll position after loading older messages
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container || !loadingMore) return;
    if (prevScrollHeightRef.current > 0) {
      const newScrollHeight = container.scrollHeight;
      container.scrollTop = newScrollHeight - prevScrollHeightRef.current;
      prevScrollHeightRef.current = 0;
    }
  }, [loadingMore, messages.length]);

  const handleSelectConversation = (partnerId: number) => {
    setSelectedPartnerId(partnerId);
    isNearBottomRef.current = true;
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedPartnerId) return;
    try {
      await sendMessage(
        newMessage.trim(),
        selectedPartnerId,
        selectedConversation?.propertyId,
        selectedConversation?.partnerName,
        selectedConversation?.propertyTitle
      );
      setNewMessage('');
      isNearBottomRef.current = true;
      showToast(t('inbox.messageSent', 'Message envoyé'), 'success');
    } catch (err) {
      showToast(t('inbox.sendError', 'Erreur lors de l\'envoi'), 'error');
    }
  };

  const handleInputChange = (value: string) => {
    setNewMessage(value);
    if (selectedPartnerId && value.trim()) {
      sendTyping(selectedPartnerId);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        // stop typing handled by hook timer
      }, 2500);
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (!confirm(t('inbox.confirmDelete', 'Supprimer ce message ?'))) return;
    try {
      await deleteMessage(messageId);
      showToast(t('inbox.deleteSuccess', 'Message supprimé'), 'success');
    } catch (err) {
      showToast(t('inbox.deleteError', 'Erreur de suppression'), 'error');
    }
  };

  const filteredConversations = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return conversations;
    return conversations.filter((c) =>
      c.partnerName?.toLowerCase().includes(term) ||
      c.lastMessage?.toLowerCase().includes(term) ||
      c.propertyTitle?.toLowerCase().includes(term)
    );
  }, [conversations, searchTerm]);

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.partnerId === selectedPartnerId),
    [conversations, selectedPartnerId]
  );

  const dateLocale = useMemo(() => {
    const lang = i18n.language;
    if (lang === 'ar') return 'ar-MA';
    if (lang === 'en') return 'en-US';
    return 'fr-FR';
  }, [i18n.language]);

  const groupedMessages = useMemo(() => {
    const groups: { date: Date; items: Message[] }[] = [];
    messages.forEach((msg) => {
      const date = new Date(msg.timestamp || msg.createdAt || Date.now());
      const last = groups[groups.length - 1];
      if (last && isSameDay(last.date, date)) {
        last.items.push(msg);
      } else {
        groups.push({ date, items: [msg] });
      }
    });
    return groups;
  }, [messages]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-7xl px-4 py-6">
        <ScrollReveal>
          <button
            onClick={() => navigate(-1)}
            className="mb-4 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 transition"
          >
            <ArrowLeft size={16} /> {t('common.back')}
          </button>
        </ScrollReveal>

        <div className="rounded-2xl bg-white shadow-xl overflow-hidden" style={{ height: 'calc(100vh - 140px)' }}>
          <div className="flex h-full">
            {/* Sidebar */}
            <div className={`w-full md:w-80 border-slate-100 flex flex-col ${selectedPartnerId ? 'hidden md:flex' : 'flex'} ${isRTL ? 'border-l' : 'border-r'}`}>
              <div className={`p-4 border-b border-slate-100 ${isRTL ? 'text-right' : 'text-left'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600/10">
                    <MessageCircle size={20} className="text-teal-600" />
                  </div>
                  <h1 className="text-xl font-black text-slate-900 dark:text-slate-50">{t('inbox.title')}</h1>
                  {connected ? (
                    <Wifi size={14} className="text-emerald-500" title={t('inbox.online')} />
                  ) : (
                    <WifiOff size={14} className="text-amber-500" title={t('inbox.offline')} />
                  )}
                </div>
                <div className="relative">
                  <Search size={16} className={`absolute top-1/2 -translate-y-1/2 text-slate-400 ${isRTL ? 'right-3' : 'left-3'}`} />
                  <input
                    type="text"
                    placeholder={t('inbox.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full rounded-xl border border-slate-200 py-2 text-sm focus:border-morocco-royal focus:outline-none focus:ring-2 focus:ring-morocco-royal/10 transition ${isRTL ? 'pr-9 pl-4' : 'pl-9 pr-4'}`}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {loading && conversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <ChatTypingIndicator />
                    <p className="text-sm text-slate-400 mt-3">{t('common.loading')}</p>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-6">
                    <MessagesEmptyState onBrowse={() => navigate('/home')} />
                  </div>
                ) : (
                  <div>
                    {filteredConversations.map((conv) => (
                      <ConversationItem
                        key={conv.partnerId}
                        conv={conv}
                        isSelected={selectedPartnerId === conv.partnerId}
                        isOnline={presence[conv.partnerId]?.status === 'ONLINE'}
                        locale={dateLocale}
                        onClick={() => handleSelectConversation(conv.partnerId)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col ${selectedPartnerId ? 'flex' : 'hidden md:flex'}`}>
              {selectedPartnerId && selectedConversation ? (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 p-4 bg-white/50 backdrop-blur">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setSelectedPartnerId(null)} className="md:hidden p-1 rounded-lg hover:bg-slate-100">
                        <ArrowLeft size={20} className="text-slate-600" />
                      </button>
                      <div className="relative">
                        {selectedConversation.partnerAvatar ? (
                          <img
                            src={selectedConversation.partnerAvatar}
                            alt={selectedConversation.partnerName}
                            className="h-10 w-10 rounded-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : null}
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-morocco-gold to-morocco-emerald text-white font-bold text-sm ${
                            selectedConversation.partnerAvatar ? 'hidden' : 'flex'
                          }`}
                        >
                          {getInitials(selectedConversation.partnerName)}
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-50 text-sm">{selectedConversation.partnerName}</p>
                        <div className="flex items-center gap-2">
                          {selectedConversation.propertyTitle && (
                            <p className="text-xs text-slate-500">{t('inbox.reTo', { title: selectedConversation.propertyTitle })}</p>
                          )}
                          {selectedConversation.partnerRole && roleKey(selectedConversation.partnerRole) && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-100">
                              {t(roleKey(selectedConversation.partnerRole), selectedConversation.partnerRole)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!connected && (
                        <span className="text-[10px] px-2 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                          {t('inbox.reconnecting')}
                        </span>
                      )}
                      <button onClick={() => selectedPartnerId && loadMessages(selectedPartnerId, false)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 transition" title={t('common.refresh')}>
                        <RefreshCw size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Messages */}
                  <div
                    ref={chatContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30"
                  >
                    {loadingMore && (
                      <div className="flex justify-center py-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
                      </div>
                    )}
                    {hasMore && !loadingMore && (
                      <div className="flex justify-center py-1">
                        <span className="text-[10px] text-slate-400">{t('inbox.loadMore', 'Faites défiler pour voir plus')}</span>
                      </div>
                    )}

                    {groupedMessages.map((group) => (
                      <React.Fragment key={group.date.toISOString()}>
                        <DateSeparator date={group.date} locale={dateLocale} />
                        {group.items.map((msg) => {
                          const isMine = msg.senderId === user?.id;
                          return (
                            <motion.div
                              key={msg.id}
                              initial={{ opacity: 0, y: 10, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              transition={{ duration: 0.15 }}
                            >
                              <MessageBubble
                                msg={msg}
                                isMine={isMine}
                                locale={dateLocale}
                                onDelete={handleDeleteMessage}
                                dir={isRTL ? 'rtl' : 'ltr'}
                              />
                            </motion.div>
                          );
                        })}
                      </React.Fragment>
                    ))}

                    {selectedPartnerId && isPartnerTyping(selectedPartnerId) && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-start"
                      >
                        <div className="bg-white text-slate-500 rounded-2xl rounded-bl-md shadow-sm border border-slate-100 px-4 py-2">
                          <div className="flex items-center gap-1">
                            <span className="text-xs">{t('inbox.typing', { name: selectedConversation.partnerName })}</span>
                            <span className="flex gap-0.5">
                              <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="border-t border-slate-100 p-4 bg-white">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => handleInputChange(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={t('inbox.messagePlaceholder')}
                        className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-morocco-royal focus:outline-none focus:ring-2 focus:ring-morocco-royal/10 transition"
                      />
                      <motion.button
                        onClick={handleSend}
                        disabled={!newMessage.trim() || sending}
                        whileTap={{ scale: 0.9 }}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white transition hover:bg-teal-600/90 disabled:opacity-40"
                      >
                        {sending ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          <Send size={18} />
                        )}
                      </motion.button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-slate-400 p-8">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 mb-4">
                    <MessageCircle size={32} className="text-slate-300" />
                  </div>
                  <p className="text-lg font-medium text-slate-500">{t('inbox.selectConversation')}</p>
                  <p className="text-sm mt-1 text-slate-400">{t('inbox.selectContact')}</p>
                  {!connected && (
                    <p className="text-xs mt-3 text-amber-500 flex items-center gap-1">
                      <WifiOff size={12} />
                      {t('inbox.pollingMode')}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inbox;
