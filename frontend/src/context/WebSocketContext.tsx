import React, { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from './AuthContext';
import { notificationApi, Notification, NotificationPage, NotificationFilters } from '../api/notificationApi';

const WS_URL = import.meta.env.VITE_WS_URL || (typeof window !== 'undefined'
  ? `${window.location.protocol}//${window.location.host}/api/ws`
  : 'http://localhost:8080/api/ws'
);

export interface ChatMessage {
  type: 'CHAT' | 'JOIN' | 'LEAVE' | 'TYPING' | 'READ_RECEIPT';
  id?: number;
  senderId?: number;
  senderName?: string;
  receiverId?: number;
  roomId?: number;
  content?: string;
  propertyId?: number;
  timestamp?: string;
  read?: boolean;
  isTyping?: boolean;
}

export interface NotificationMessage {
  id: string;
  type: string;
  userId?: number;
  title: string;
  body: string;
  actionUrl?: string;
  imageUrl?: string;
  timestamp: string;
  read?: boolean;
}

export interface PresenceUpdate {
  userId: number;
  status: 'ONLINE' | 'AWAY' | 'OFFLINE';
  lastSeen?: string;
  deviceType?: string;
}

const CHAT_TYPES = new Set<ChatMessage['type']>(['CHAT', 'TYPING', 'READ_RECEIPT']);

export interface WebSocketContextValue {
  connected: boolean;
  messages: ChatMessage[];
  notifications: Notification[];
  notificationPage: NotificationPage | null;
  notificationLoading: boolean;
  presence: Record<number, PresenceUpdate>;
  typingUsers: Record<number, boolean>;
  subscribeToRoom: (roomId: number) => (() => void) | undefined;
  sendMessage: (roomId: number, message: Omit<ChatMessage, 'timestamp' | 'type'>) => void;
  sendTyping: (roomId: number, senderId: number) => void;
  sendTypingStop: (roomId: number, senderId: number) => void;
  markAsRead: (roomId: number, messageId: number) => void;
  clearNotifications: () => Promise<void>;
  markNotificationRead: (id: number | string) => Promise<void>;
  deleteNotification: (id: number | string) => Promise<void>;
  loadMoreNotifications: () => void;
  refreshNotifications: () => void;
  notificationMessageList: NotificationMessage[];
}

const WebSocketContext = createContext<WebSocketContextValue | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const clientRef = useRef<Client | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationPage, setNotificationPage] = useState<NotificationPage | null>(null);
  const [notificationFilters, setNotificationFilters] = useState<NotificationFilters>({});
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [presence, setPresence] = useState<Record<number, PresenceUpdate>>({});
  const [typingUsers, setTypingUsers] = useState<Record<number, boolean>>({});

  const globalSubsRef = useRef<StompSubscription[]>([]);
  const activeRoomsRef = useRef<Set<number>>(new Set());
  const roomSubsRef = useRef<Map<number, StompSubscription[]>>(new Map());

  const toNotificationMessage = (n: Notification): NotificationMessage => ({
    id: String(n.id),
    type: n.type,
    userId: n.userId,
    title: n.title,
    body: n.message,
    actionUrl: n.actionUrl,
    imageUrl: n.icon,
    timestamp: n.createdAt,
    read: n.status === 'READ',
  });

  const fetchNotifications = useCallback(async (filters: NotificationFilters = {}, append = false) => {
    if (!token) return;
    setNotificationLoading(true);
    try {
      const page = await notificationApi.getMyNotifications({
        size: 20,
        ...filters,
        page: filters.page ?? 0,
      });
      setNotificationPage(page);
      setNotifications((prev) => {
        if (append && filters.page && filters.page > 0) {
          const existingIds = new Set(prev.map((n) => n.id));
          return [...prev, ...page.content.filter((n) => !existingIds.has(n.id))];
        }
        return page.content;
      });
    } catch (e) {
      if (import.meta.env.DEV) {
        console.error('[Notifications] Failed to fetch notifications:', e);
      }
    } finally {
      setNotificationLoading(false);
    }
  }, [token]);

  const unsubscribeRoom = useCallback((roomId: number) => {
    const subs = roomSubsRef.current.get(roomId);
    if (subs) {
      subs.forEach((sub) => sub.unsubscribe());
      roomSubsRef.current.delete(roomId);
    }
    activeRoomsRef.current.delete(roomId);
  }, []);

  const doSubscribeRoom = useCallback((client: Client, roomId: number) => {
    const chatSub = client.subscribe(`/topic/chat.${roomId}`, (msg: IMessage) => {
      let body: ChatMessage;
      try {
        body = JSON.parse(msg.body);
      } catch (e) {
        if (import.meta.env.DEV) {
          console.error('[WebSocket] Failed to parse chat message:', e);
        }
        return;
      }
      if (body.type === 'TYPING') {
        if (body.senderId) {
          const isTyping = body.isTyping !== false;
          setTypingUsers((prev) => ({ ...prev, [body.senderId!]: isTyping }));
        }
      } else {
        setMessages((prev) => [...prev, body]);
      }
    });

    const typingSub = client.subscribe(`/topic/chat.typing.${roomId}`, (msg: IMessage) => {
      let body: ChatMessage;
      try {
        body = JSON.parse(msg.body);
      } catch (e) {
        if (import.meta.env.DEV) {
          console.error('[WebSocket] Failed to parse typing message:', e);
        }
        return;
      }
      if (body.senderId) {
        const isTyping = body.isTyping !== false;
        setTypingUsers((prev) => ({ ...prev, [body.senderId!]: isTyping }));
      }
    });

    const readSub = client.subscribe(`/topic/chat.read.${roomId}`, (msg: IMessage) => {
      let body: ChatMessage;
      try {
        body = JSON.parse(msg.body);
      } catch (e) {
        if (import.meta.env.DEV) {
          console.error('[WebSocket] Failed to parse read receipt:', e);
        }
        return;
      }
      setMessages((prev) => prev.map((m) => (m.id === body.id ? { ...m, read: true } : m)));
    });

    roomSubsRef.current.set(roomId, [chatSub, typingSub, readSub]);
  }, []);

  useEffect(() => {
    if (!token || !isAuthenticated) {
      setConnected(false);
      setNotifications([]);
      setNotificationPage(null);
      return;
    }

    fetchNotifications({ size: 50 });

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        setConnected(true);
        if (import.meta.env.DEV) {
          console.log('[WebSocket] Connected');
        }

        globalSubsRef.current.forEach((sub) => sub.unsubscribe());
        globalSubsRef.current = [];
        roomSubsRef.current.forEach((subs) => subs.forEach((sub) => sub.unsubscribe()));
        roomSubsRef.current.clear();

        const notifSub = client.subscribe('/user/queue/notifications', (msg: IMessage) => {
          try {
            const body = JSON.parse(msg.body);
            if (CHAT_TYPES.has(body.type)) {
              return;
            }
            const incoming: Notification = {
              id: Number(body.id) || Date.now(),
              title: body.title,
              message: body.body,
              type: body.type,
              priority: 'NORMAL',
              icon: body.imageUrl,
              createdAt: body.timestamp || new Date().toISOString(),
              status: body.read ? 'READ' : 'UNREAD',
              actionUrl: body.actionUrl,
              userId: body.userId,
            };
            setNotifications((prev) => {
              const filtered = prev.filter((n) => n.id !== incoming.id);
              return [incoming, ...filtered].slice(0, 100);
            });
          } catch (e) {
            if (import.meta.env.DEV) {
              console.error('[WebSocket] Failed to parse notification:', e);
            }
          }
        });

        const presenceSub = client.subscribe('/topic/presence', (msg: IMessage) => {
          try {
            const body: PresenceUpdate = JSON.parse(msg.body);
            setPresence((prev) => ({ ...prev, [body.userId]: body }));
          } catch (e) {
            if (import.meta.env.DEV) {
              console.error('[WebSocket] Failed to parse presence:', e);
            }
          }
        });

        globalSubsRef.current.push(notifSub, presenceSub);

        activeRoomsRef.current.forEach((roomId) => {
          doSubscribeRoom(client, roomId);
        });
      },
      onDisconnect: () => {
        setConnected(false);
        if (import.meta.env.DEV) {
          console.log('[WebSocket] Disconnected');
        }
      },
      onStompError: (frame) => {
        if (import.meta.env.DEV) {
          console.error('[WebSocket] STOMP error:', frame.headers['message']);
        }
      },
      onWebSocketError: (event) => {
        if (import.meta.env.DEV) {
          console.error('[WebSocket] Transport error:', event);
        }
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      globalSubsRef.current.forEach((sub) => sub.unsubscribe());
      globalSubsRef.current = [];
      roomSubsRef.current.forEach((subs) => subs.forEach((sub) => sub.unsubscribe()));
      roomSubsRef.current.clear();
      activeRoomsRef.current.clear();
      client.deactivate();
    };
  }, [token, isAuthenticated, fetchNotifications, doSubscribeRoom]);

  useEffect(() => {
    const handleLogout = () => {
      globalSubsRef.current.forEach((sub) => sub.unsubscribe());
      globalSubsRef.current = [];
      roomSubsRef.current.forEach((subs) => subs.forEach((sub) => sub.unsubscribe()));
      roomSubsRef.current.clear();
      activeRoomsRef.current.clear();
      if (clientRef.current) {
        clientRef.current.deactivate();
        clientRef.current = null;
      }
      setConnected(false);
      setNotifications([]);
      setNotificationPage(null);
      setPresence({});
      setTypingUsers({});
    };
    window.addEventListener('auth:logout' as any, handleLogout);
    return () => window.removeEventListener('auth:logout' as any, handleLogout);
  }, []);

  const subscribeToRoom = useCallback(
    (roomId: number) => {
      activeRoomsRef.current.add(roomId);
      const client = clientRef.current;
      if (!client || !client.connected) return;
      doSubscribeRoom(client, roomId);

      return () => {
        unsubscribeRoom(roomId);
      };
    },
    [doSubscribeRoom, unsubscribeRoom]
  );

  const sendMessage = useCallback(
    (roomId: number, message: Omit<ChatMessage, 'timestamp' | 'type'>) => {
      const client = clientRef.current;
      if (!client || !client.connected) {
        if (import.meta.env.DEV) {
          console.warn('[WebSocket] Cannot send: not connected');
        }
        return;
      }
      client.publish({
        destination: `/app/chat.send/${roomId}`,
        body: JSON.stringify(message),
      });
    },
    []
  );

  const sendTyping = useCallback(
    (roomId: number, senderId: number) => {
      const client = clientRef.current;
      if (!client || !client.connected) return;
      client.publish({
        destination: `/app/chat.typing/${roomId}`,
        body: JSON.stringify({ senderId, type: 'TYPING', isTyping: true }),
      });
    },
    []
  );

  const sendTypingStop = useCallback(
    (roomId: number, senderId: number) => {
      const client = clientRef.current;
      if (!client || !client.connected) return;
      client.publish({
        destination: `/app/chat.typing/${roomId}`,
        body: JSON.stringify({ senderId, type: 'TYPING', isTyping: false }),
      });
    },
    []
  );

  const markAsRead = useCallback(
    (roomId: number, messageId: number) => {
      const client = clientRef.current;
      if (!client || !client.connected) return;
      client.publish({
        destination: `/app/chat.read/${roomId}`,
        body: JSON.stringify({ id: messageId, type: 'READ_RECEIPT' }),
      });
    },
    []
  );

  const loadMoreNotifications = useCallback(() => {
    const nextPage = (notificationPage?.number ?? 0) + 1;
    if (notificationPage?.last) return;
    const filters = { ...notificationFilters, page: nextPage };
    setNotificationFilters(filters);
    fetchNotifications(filters, true);
  }, [notificationPage, notificationFilters, fetchNotifications]);

  const refreshNotifications = useCallback(() => {
    fetchNotifications(notificationFilters);
  }, [fetchNotifications, notificationFilters]);

  const clearNotifications = useCallback(async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, status: 'READ' as const, readAt: new Date().toISOString() })));
    } catch (e) {
      if (import.meta.env.DEV) {
        console.error('[Notifications] Failed to mark all read:', e);
      }
    }
  }, []);

  const markNotificationRead = useCallback(async (id: number | string) => {
    const numericId = typeof id === 'string' ? Number(id) : id;
    try {
      await notificationApi.markAsRead(numericId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === numericId ? { ...n, status: 'READ' as const, readAt: new Date().toISOString() } : n))
      );
    } catch (e) {
      if (import.meta.env.DEV) {
        console.error('[Notifications] Failed to mark read:', e);
      }
    }
  }, []);

  const deleteNotification = useCallback(async (id: number | string) => {
    const numericId = typeof id === 'string' ? Number(id) : id;
    try {
      await notificationApi.deleteNotification(numericId);
      setNotifications((prev) => prev.filter((n) => n.id !== numericId));
    } catch (e) {
      if (import.meta.env.DEV) {
        console.error('[Notifications] Failed to delete:', e);
      }
    }
  }, []);

  const value = useMemo<WebSocketContextValue>(
    () => ({
      connected,
      messages,
      notifications,
      notificationPage,
      notificationLoading,
      presence,
      typingUsers,
      subscribeToRoom,
      sendMessage,
      sendTyping,
      sendTypingStop,
      markAsRead,
      clearNotifications,
      markNotificationRead,
      deleteNotification,
      loadMoreNotifications,
      refreshNotifications,
      notificationMessageList: notifications.map(toNotificationMessage),
    }),
    [
      connected,
      messages,
      notifications,
      notificationPage,
      notificationLoading,
      presence,
      typingUsers,
      subscribeToRoom,
      sendMessage,
      sendTyping,
      sendTypingStop,
      markAsRead,
      clearNotifications,
      markNotificationRead,
      deleteNotification,
      loadMoreNotifications,
      refreshNotifications,
    ]
  );

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
};

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within WebSocketProvider');
  }
  return context;
};
