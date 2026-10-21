import { useEffect, useState, useCallback, useRef } from 'react';
import { useWebSocket } from './useWebSocket';
import { messageApi } from '../api/messageApi';
import { Message, Conversation } from '../types';
import { conversationStore } from '../utils/conversationStore';

export type { Conversation };

const PAGE_SIZE = 20;

function getRoomId(userId: number, partnerId: number): number {
  return Math.min(userId, partnerId) * 100000 + Math.max(userId, partnerId);
}

export function useMessaging(userId: number | undefined, _token?: string | null) {
  const {
    connected,
    messages: wsMessages,
    typingUsers: wsTypingUsers,
    presence,
    subscribeToRoom,
    sendMessage: wsSendMessage,
    sendTyping: wsSendTyping,
    sendTypingStop: wsSendTypingStop,
    markAsRead: wsMarkAsRead,
  } = useWebSocket();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const unsubRef = useRef<(() => void) | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadConversations = useCallback(async () => {
    try {
      setError(null);
      let convList: Conversation[] = [];

      try {
        const res = await messageApi.getConversations();
        convList = Array.isArray(res.data) ? res.data : [];
      } catch {
        // Backend conversation endpoint unavailable — use client fallback.
      }

      if (convList.length === 0) {
        const stored = conversationStore.getAll();
        convList = stored.map((c) => ({
          partnerId: c.partnerId,
          partnerName: c.partnerName,
          lastMessage: c.lastMessage,
          lastMessageDate: c.lastMessageDate,
          unreadCount: c.unreadCount,
          propertyId: c.propertyId,
          propertyTitle: c.propertyTitle,
        }));
      }

      setConversations(convList);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Failed to load conversations', err);
      }
      setError('Impossible de charger les conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (partnerId: number, showLoader = true) => {
    if (showLoader) setLoading(true);
    setLoadingMore(false);
    setPage(0);
    setHasMore(true);
    try {
      const res = await messageApi.getConversation(partnerId, 0, PAGE_SIZE, 'DESC');
      const history: Message[] = Array.isArray(res.data) ? res.data : [];
      setMessages([...history].reverse());
      setHasMore(history.length >= PAGE_SIZE);

      if (userId) {
        const unread = history.filter((m) => m.receiverId === userId && !m.isRead && m.id);
        for (const m of unread) {
          if (connected) {
            const roomId = getRoomId(userId, partnerId);
            wsMarkAsRead(roomId, m.id);
          } else {
            messageApi.markAsRead(m.id).catch(() => {});
          }
        }
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Failed to load messages', err);
      }
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [userId, connected, wsMarkAsRead]);

  const loadMoreMessages = useCallback(async () => {
    if (!selectedPartnerId || !hasMore || loadingMore) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const res = await messageApi.getConversation(selectedPartnerId, nextPage, PAGE_SIZE, 'DESC');
      const older: Message[] = Array.isArray(res.data) ? res.data : [];
      if (older.length === 0) {
        setHasMore(false);
      } else {
        setMessages((prev) => [...older.reverse(), ...prev]);
        setPage(nextPage);
        setHasMore(older.length >= PAGE_SIZE);
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Failed to load older messages', err);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [selectedPartnerId, hasMore, loadingMore, page]);

  // Subscribe to WebSocket room when partner changes
  useEffect(() => {
    if (!selectedPartnerId || !userId) return;

    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }

    const roomId = getRoomId(userId, selectedPartnerId);
    const unsubscribe = subscribeToRoom(roomId);
    if (unsubscribe) {
      unsubRef.current = unsubscribe;
    }

    loadMessages(selectedPartnerId);

    return () => {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
  }, [selectedPartnerId, userId, subscribeToRoom, loadMessages]);

  // Merge WebSocket real-time messages into local state
  useEffect(() => {
    if (!selectedPartnerId || !userId || wsMessages.length === 0) return;

    const roomId = getRoomId(userId, selectedPartnerId);
    const incoming = wsMessages[wsMessages.length - 1];
    if (incoming.roomId !== roomId) return;
    if (incoming.type !== 'CHAT') return;

    setMessages((prev) => {
      const existingIds = new Set(prev.map((m) => m.id));
      if (incoming.id && existingIds.has(incoming.id)) return prev;

      const tempMatch = incoming.senderId === userId
        ? prev.find((m) => m.id < 0 && m.content === incoming.content && m.senderId === userId)
        : undefined;

      const mapped: Message = {
        id: incoming.id || Date.now(),
        senderId: incoming.senderId || 0,
        receiverId: incoming.receiverId || 0,
        content: incoming.content || '',
        timestamp: incoming.timestamp || new Date().toISOString(),
        isRead: incoming.read || incoming.senderId === userId || false,
        senderName: incoming.senderName || '',
        senderRole: incoming.senderId === userId ? undefined : prev.find((m) => m.senderId === incoming.senderId)?.senderRole,
        receiverName: '',
        receiverRole: undefined,
        propertyId: incoming.propertyId,
      };

      if (tempMatch) {
        return prev.map((m) => (m.id === tempMatch.id ? mapped : m));
      }

      return [...prev, mapped].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    });

    if (incoming.receiverId === userId && incoming.id && connected) {
      wsMarkAsRead(roomId, incoming.id);
    }

    // Update conversation preview without full reload
    if (incoming.senderId && incoming.content) {
      setConversations((prev) => {
        const partnerId = incoming.senderId === userId ? incoming.receiverId : incoming.senderId;
        if (!partnerId) return prev;
        const exists = prev.find((c) => c.partnerId === partnerId);
        const updated: Conversation = {
          partnerId,
          partnerName: exists?.partnerName || incoming.senderName || `User ${partnerId}`,
          lastMessage: incoming.content,
          lastMessageDate: incoming.timestamp || new Date().toISOString(),
          unreadCount: partnerId === selectedPartnerId
            ? 0
            : (exists?.unreadCount || 0) + (incoming.receiverId === userId ? 1 : 0),
          propertyId: incoming.propertyId ?? exists?.propertyId,
          propertyTitle: exists?.propertyTitle,
        };
        const filtered = prev.filter((c) => c.partnerId !== partnerId);
        return [updated, ...filtered].sort(
          (a, b) => new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime()
        );
      });
    }
  }, [wsMessages, selectedPartnerId, userId, connected, wsMarkAsRead]);

  // Apply read receipts from WebSocket to the local message list
  useEffect(() => {
    if (!selectedPartnerId || !userId || wsMessages.length === 0) return;
    const last = wsMessages[wsMessages.length - 1];
    if (last.type === 'READ_RECEIPT' && last.id) {
      setMessages((prev) => prev.map((m) => (m.id === last.id ? { ...m, isRead: true } : m)));
    }
  }, [wsMessages, selectedPartnerId, userId]);

  const sendMessage = useCallback(
    async (content: string, receiverId: number, propertyId?: number, partnerName?: string, propertyTitle?: string) => {
      if (!userId) return;
      setSending(true);

      const roomId = getRoomId(userId, receiverId);
      const trimmed = content.trim();

      const optimisticMsg: Message = {
        id: -Date.now(),
        senderId: userId,
        receiverId,
        content: trimmed,
        timestamp: new Date().toISOString(),
        isRead: false,
        senderName: 'Vous',
        receiverName: '',
        propertyId,
      };
      setMessages((prev) => [...prev, optimisticMsg]);

      try {
        if (connected) {
          wsSendMessage(roomId, {
            senderId: userId,
            receiverId,
            content: trimmed,
            propertyId,
          });
        } else {
          const res = await messageApi.send({ receiverId, content: trimmed, propertyId });
          const saved = res.data;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === optimisticMsg.id
                ? {
                    ...saved,
                    senderName: saved.senderName || 'Vous',
                  }
                : m
            )
          );
        }

        conversationStore.save({
          partnerId: receiverId,
          partnerName: partnerName || `User ${receiverId}`,
          propertyId,
          propertyTitle,
          lastMessage: trimmed,
          lastMessageDate: new Date().toISOString(),
          unreadCount: 0,
        });

        // Optimistically update conversation list
        setConversations((prev) => {
          const exists = prev.find((c) => c.partnerId === receiverId);
          const updated: Conversation = {
            partnerId: receiverId,
            partnerName: partnerName || exists?.partnerName || `User ${receiverId}`,
            lastMessage: trimmed,
            lastMessageDate: new Date().toISOString(),
            unreadCount: exists?.unreadCount || 0,
            propertyId: propertyId ?? exists?.propertyId,
            propertyTitle: propertyTitle ?? exists?.propertyTitle,
          };
          return [updated, ...prev.filter((c) => c.partnerId !== receiverId)];
        });
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('Failed to send message', err);
        }
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
        throw err;
      } finally {
        setSending(false);
      }
    },
    [userId, connected, wsSendMessage]
  );

  const sendTyping = useCallback(
    (receiverId: number) => {
      if (!userId || !connected) return;
      const roomId = getRoomId(userId, receiverId);
      wsSendTyping(roomId, userId);

      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        wsSendTypingStop(roomId, userId);
      }, 2000);
    },
    [userId, connected, wsSendTyping, wsSendTypingStop]
  );

  const markRead = useCallback(
    (messageId: number, receiverId: number) => {
      if (!userId || !connected) return;
      const roomId = getRoomId(userId, receiverId);
      wsMarkAsRead(roomId, messageId);
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, isRead: true } : m)));
    },
    [userId, connected, wsMarkAsRead]
  );

  const deleteMessage = useCallback(
    async (messageId: number) => {
      try {
        await messageApi.delete(messageId);
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
        if (selectedPartnerId) {
          // Refresh conversation preview in background
          loadConversations();
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('Failed to delete message', err);
        }
        throw err;
      }
    },
    [selectedPartnerId, loadConversations]
  );

  const isPartnerTyping = useCallback(
    (partnerId: number) => {
      return !!wsTypingUsers[partnerId];
    },
    [wsTypingUsers]
  );

  // Deep-linking: pre-select conversation from URL query params
  useEffect(() => {
    if (!userId) return;
    const params = new URLSearchParams(window.location.search);
    const partnerIdParam = params.get('partnerId');
    const propertyIdParam = params.get('propertyId');
    if (partnerIdParam) {
      const partnerId = Number(partnerIdParam);
      if (!isNaN(partnerId)) {
        setSelectedPartnerId(partnerId);
        if (propertyIdParam) {
          const propertyId = Number(propertyIdParam);
          if (!isNaN(propertyId)) {
            conversationStore.save({
              partnerId,
              partnerName: `User ${partnerId}`,
              propertyId,
              lastMessage: '',
              lastMessageDate: new Date().toISOString(),
              unreadCount: 0,
            });
          }
        }
      }
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadConversations();
    }
  }, [userId, loadConversations]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, []);

  return {
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
    markRead,
    deleteMessage,
    isPartnerTyping,
    presence,
  };
}
