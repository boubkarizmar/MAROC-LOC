import { useWebSocketContext } from '../context/WebSocketContext';

export type { ChatMessage, NotificationMessage, PresenceUpdate } from '../context/WebSocketContext';

export function useWebSocket(_token?: string | null) {
  return useWebSocketContext();
}
