/**
 * Lightweight client-side conversation index used as a fallback when the
 * backend does not expose a "list my conversations" endpoint.
 * The actual messages still live on the backend; this store only keeps the
 * metadata needed to render the inbox list (partner, last message, property
 * context) across page reloads.
 */

export interface ConversationSummary {
  partnerId: number;
  partnerName: string;
  propertyId?: number;
  propertyTitle?: string;
  lastMessage: string;
  lastMessageDate: string;
  unreadCount: number;
}

const STORAGE_KEY = 'marocloc_conversations';

export const conversationStore = {
  getAll(): ConversationSummary[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  save(conversation: ConversationSummary) {
    const all = this.getAll();
    const idx = all.findIndex((c) => c.partnerId === conversation.partnerId);
    const updated =
      idx >= 0
        ? all.map((c, i) => (i === idx ? { ...c, ...conversation } : c))
        : [conversation, ...all];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },

  markRead(partnerId: number) {
    const all = this.getAll();
    const updated = all.map((c) =>
      c.partnerId === partnerId ? { ...c, unreadCount: 0 } : c
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },

  clear() {
    localStorage.removeItem(STORAGE_KEY);
  },
};
