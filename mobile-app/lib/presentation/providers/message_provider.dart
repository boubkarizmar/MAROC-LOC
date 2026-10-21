import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/utils/conversation_cache.dart';
import '../../data/models/message_model.dart';
import '../../services/message_service.dart';
import '../../services/websocket_service.dart';
import 'auth_provider.dart';

class MessageState {
  final List<MessageModel> messages;
  final List<ConversationModel> conversations;
  final int unreadCount;
  final bool isLoading;
  final bool isLoadingMore;
  final bool hasMore;
  final String? error;
  final bool isConnected;
  final bool isTyping;
  final int? typingUserId;
  final int? activePartnerId;
  final Set<int> pendingMessageIds;
  final Set<int> failedMessageIds;

  const MessageState({
    this.messages = const [],
    this.conversations = const [],
    this.unreadCount = 0,
    this.isLoading = false,
    this.isLoadingMore = false,
    this.hasMore = true,
    this.error,
    this.isConnected = false,
    this.isTyping = false,
    this.typingUserId,
    this.activePartnerId,
    this.pendingMessageIds = const {},
    this.failedMessageIds = const {},
  });

  MessageState copyWith({
    List<MessageModel>? messages,
    List<ConversationModel>? conversations,
    int? unreadCount,
    bool? isLoading,
    bool? isLoadingMore,
    bool? hasMore,
    String? error,
    bool? isConnected,
    bool? isTyping,
    int? typingUserId,
    int? activePartnerId,
    Set<int>? pendingMessageIds,
    Set<int>? failedMessageIds,
    bool clearError = false,
    bool clearTyping = false,
  }) {
    return MessageState(
      messages: messages ?? this.messages,
      conversations: conversations ?? this.conversations,
      unreadCount: unreadCount ?? this.unreadCount,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      hasMore: hasMore ?? this.hasMore,
      error: clearError ? null : error,
      isConnected: isConnected ?? this.isConnected,
      isTyping: clearTyping ? false : (isTyping ?? this.isTyping),
      typingUserId: clearTyping ? null : (typingUserId ?? this.typingUserId),
      activePartnerId: activePartnerId ?? this.activePartnerId,
      pendingMessageIds: pendingMessageIds ?? this.pendingMessageIds,
      failedMessageIds: failedMessageIds ?? this.failedMessageIds,
    );
  }
}

class MessageNotifier extends StateNotifier<MessageState> {
  final MessageService _service;
  final WebSocketService _wsService;
  final Ref _ref;
  StreamSubscription? _msgSub;
  StreamSubscription? _typingSub;
  StreamSubscription? _readSub;
  StreamSubscription? _connSub;
  Timer? _typingTimer;
  Timer? _typingStopTimer;

  final Map<int, int> _currentPage = {};
  final Map<int, bool> _hasMoreByPartner = {};
  static const _pageSize = 20;

  MessageNotifier(this._service, this._wsService, this._ref)
      : super(const MessageState()) {
    _initWebSocket();
  }

  int get _currentUserId => _ref.read(authProvider).user?.id ?? 0;

  void _initWebSocket() {
    try {
      _wsService.connect();
    } catch (_) {}

    _connSub = _wsService.connectionStream.listen((connected) {
      state = state.copyWith(isConnected: connected);
    }, onError: (_) {});

    _msgSub = _wsService.messageStream.listen((data) {
      try {
        final type = data['type'] as String?;
        if (type == 'CHAT') {
          final message = MessageModel.fromJson(data);
          _handleIncomingMessage(message);
        } else if (type == 'READ_RECEIPT') {
          final messageId = data['id'] as int? ??
              (data['messageId'] is int ? data['messageId'] as int : null);
          if (messageId == null) return;
          _markMessageReadLocally(messageId);
        }
      } catch (e) {
        if (kDebugMode) debugPrint('WS message parse error: $e');
      }
    }, onError: (_) {});

    _typingSub = _wsService.typingStream.listen((data) {
      try {
        final userId = data['senderId'] as int? ?? data['userId'] as int?;
        final isTyping = data['isTyping'] as bool? ?? true;
        if (userId == null) return;
        if (isTyping) {
          state = state.copyWith(isTyping: true, typingUserId: userId);
          _typingTimer?.cancel();
          _typingTimer = Timer(const Duration(seconds: 3), () {
            state = state.copyWith(clearTyping: true);
          });
        } else {
          state = state.copyWith(clearTyping: true);
        }
      } catch (e) {
        if (kDebugMode) debugPrint('WS typing parse error: $e');
      }
    }, onError: (_) {});

    _readSub = _wsService.readStream.listen((data) {
      try {
        final messageId = data['id'] as int? ??
            (data['messageId'] is int ? data['messageId'] as int : null);
        if (messageId == null) return;
        _markMessageReadLocally(messageId);
      } catch (e) {
        if (kDebugMode) debugPrint('WS read parse error: $e');
      }
    }, onError: (_) {});
  }

  void _handleIncomingMessage(MessageModel message) {
    final currentUserId = _currentUserId;
    final partnerId = message.senderId == currentUserId
        ? message.receiverId
        : message.senderId;
    if (partnerId == 0 || partnerId == currentUserId) return;

    final isActiveConversation = state.activePartnerId == partnerId;

    if (isActiveConversation) {
      // Avoid adding duplicate real messages.
      if (state.messages.any((m) => m.id == message.id && m.id > 0)) {
        return;
      }

      // Replace a recent optimistic message sent by the current user.
      if (message.senderId == currentUserId) {
        final optimistic = state.messages.lastWhere(
          (m) =>
              m.id < 0 &&
              m.senderId == currentUserId &&
              m.receiverId == partnerId &&
              m.content == message.content,
          orElse: () => MessageModel(
            id: 0,
            senderId: 0,
            senderName: '',
            receiverId: 0,
            receiverName: '',
            content: '',
            isRead: true,
          ),
        );
        if (optimistic.id != 0) {
          state = state.copyWith(
            messages: state.messages
                .where((m) => m.id != optimistic.id)
                .followedBy([message])
                .toList(),
            pendingMessageIds: state.pendingMessageIds.difference({optimistic.id}),
            failedMessageIds: state.failedMessageIds.difference({optimistic.id}),
          );
          _autoMarkAsRead(message, partnerId);
          _updateConversationPreview(partnerId, message);
          return;
        }
      }

      state = state.copyWith(
        messages: [...state.messages, message],
      );
      _autoMarkAsRead(message, partnerId);
    } else if (message.receiverId == currentUserId && !message.isRead) {
      state = state.copyWith(unreadCount: state.unreadCount + 1);
    }

    _updateConversationPreview(partnerId, message);
  }

  void _autoMarkAsRead(MessageModel message, int partnerId) {
    final currentUserId = _currentUserId;
    if (message.receiverId != currentUserId || message.isRead) return;

    final roomId = MessageModel.roomIdFor(currentUserId, partnerId);
    _wsService.sendReadReceipt(roomId, message.id);
    _service.markAsRead(message.id).catchError((_) {});
    _markMessageReadLocally(message.id);
    _updateConversationUnreadCount(partnerId, 0);
  }

  void _updateConversationPreview(int partnerId, MessageModel message) {
    final currentUserId = _currentUserId;
    final existing = state.conversations.firstWhere(
      (c) => c.partnerId == partnerId,
      orElse: () => ConversationModel(
        partnerId: partnerId,
        partnerName: message.senderId == partnerId
            ? message.senderName
            : message.receiverName,
        partnerRole: message.senderId == partnerId
            ? message.senderRole
            : message.receiverRole,
        lastMessage: message.content,
        lastMessageDate: message.timestamp ?? message.createdAt,
        unreadCount: 0,
        propertyId: message.propertyId,
        propertyTitle: message.propertyTitle,
      ),
    );

    int unreadIncrement = 0;
    if (message.receiverId == currentUserId &&
        !message.isRead &&
        state.activePartnerId != partnerId) {
      unreadIncrement = 1;
    }

    final updated = ConversationModel(
      partnerId: existing.partnerId,
      partnerName: existing.partnerName.isNotEmpty
          ? existing.partnerName
          : (message.senderId == partnerId
              ? message.senderName
              : message.receiverName),
      partnerAvatar: existing.partnerAvatar,
      partnerRole: existing.partnerRole ??
          (message.senderId == partnerId
              ? message.senderRole
              : message.receiverRole),
      lastMessage: message.content,
      lastMessageDate: message.timestamp ?? message.createdAt,
      unreadCount: state.activePartnerId == partnerId
          ? 0
          : existing.unreadCount + unreadIncrement,
      propertyId: message.propertyId ?? existing.propertyId,
      propertyTitle: message.propertyTitle ?? existing.propertyTitle,
    );

    final filtered = state.conversations.where((c) => c.partnerId != partnerId).toList();
    final newList = [updated, ...filtered]..sort((a, b) {
        final aDate = a.lastMessageDate != null
            ? DateTime.tryParse(a.lastMessageDate!)
            : null;
        final bDate = b.lastMessageDate != null
            ? DateTime.tryParse(b.lastMessageDate!)
            : null;
        if (aDate == null && bDate == null) return 0;
        if (aDate == null) return 1;
        if (bDate == null) return -1;
        return bDate.compareTo(aDate);
      });

    state = state.copyWith(conversations: newList);
    ConversationCache.saveAll(newList);
  }

  void _markMessageReadLocally(int messageId) {
    state = state.copyWith(
      messages: state.messages.map((m) {
        if (m.id == messageId) {
          return m.copyWith(isRead: true);
        }
        return m;
      }).toList(),
    );
  }

  Future<void> loadConversations() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final conversations = await _service.getConversations();
      state = state.copyWith(
        conversations: conversations,
        isLoading: false,
      );
      await ConversationCache.saveAll(conversations);
    } catch (e) {
      final cached = await ConversationCache.getAll();
      state = state.copyWith(
        isLoading: false,
        conversations: cached,
        error: cached.isEmpty ? 'Impossible de charger les conversations' : null,
      );
    }
  }

  Future<void> loadConversation(int userId) async {
    state = state.copyWith(
      isLoading: true,
      clearError: true,
      activePartnerId: userId,
      pendingMessageIds: const {},
      failedMessageIds: const {},
    );
    _currentPage[userId] = 0;
    _hasMoreByPartner[userId] = true;
    try {
      final page = await _service.getConversation(
        userId,
        page: 0,
        size: _pageSize,
        sort: 'DESC',
      );
      // Backend returns newest first; reverse so oldest is at the top.
      final messages = page.reversed.toList();
      state = state.copyWith(
        messages: messages,
        isLoading: false,
        hasMore: page.length >= _pageSize,
      );
      _markConversationAsRead(userId, messages);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Erreur de chargement des messages',
      );
    }
  }

  Future<void> loadMoreMessages(int partnerId) async {
    if (state.isLoadingMore) return;
    if (_hasMoreByPartner[partnerId] == false) return;

    final nextPage = (_currentPage[partnerId] ?? 0) + 1;
    state = state.copyWith(isLoadingMore: true);
    try {
      final page = await _service.getConversation(
        partnerId,
        page: nextPage,
        size: _pageSize,
        sort: 'DESC',
      );
      final olderMessages = page.reversed.toList();
      _currentPage[partnerId] = nextPage;
      _hasMoreByPartner[partnerId] = page.length >= _pageSize;
      state = state.copyWith(
        messages: [...olderMessages, ...state.messages],
        isLoadingMore: false,
        hasMore: page.length >= _pageSize,
      );
    } catch (e) {
      state = state.copyWith(isLoadingMore: false);
    }
  }

  void _markConversationAsRead(int partnerId, List<MessageModel> messages) {
    final currentUserId = _currentUserId;
    if (currentUserId == 0) return;

    final roomId = MessageModel.roomIdFor(currentUserId, partnerId);
    final unread = messages.where((m) =>
        m.receiverId == currentUserId && !m.isRead && m.id > 0);

    for (final m in unread) {
      if (state.isConnected) {
        _wsService.sendReadReceipt(roomId, m.id);
      }
      _service.markAsRead(m.id).catchError((_) {});
      _markMessageReadLocally(m.id);
    }

    if (unread.isNotEmpty) {
      state = state.copyWith(
        unreadCount: state.unreadCount > unread.length
            ? state.unreadCount - unread.length
            : 0,
      );
      _updateConversationUnreadCount(partnerId, 0);
    }
  }

  void _updateConversationUnreadCount(int partnerId, int unreadCount) {
    final idx = state.conversations.indexWhere((c) => c.partnerId == partnerId);
    if (idx < 0) return;
    final updated = state.conversations[idx].copyWith(unreadCount: unreadCount);
    final newList = [...state.conversations];
    newList[idx] = updated;
    state = state.copyWith(conversations: newList);
    ConversationCache.saveAll(newList);
  }

  Future<void> loadUnreadCount() async {
    try {
      final count = await _service.getUnreadCount();
      state = state.copyWith(unreadCount: count);
    } catch (_) {}
  }

  Future<void> sendMessage({
    required int receiverId,
    required String content,
    int? propertyId,
  }) async {
    final currentUserId = _currentUserId;
    if (currentUserId == 0) return;

    final roomId = MessageModel.roomIdFor(currentUserId, receiverId);
    final trimmed = content.trim();
    if (trimmed.isEmpty) return;

    // Optimistic local message.
    final optimisticId = -DateTime.now().millisecondsSinceEpoch;
    final optimistic = MessageModel(
      id: optimisticId,
      senderId: currentUserId,
      senderName: 'Vous',
      receiverId: receiverId,
      receiverName: '',
      content: trimmed,
      isRead: false,
      timestamp: DateTime.now().toIso8601String(),
      propertyId: propertyId,
    );

    if (state.activePartnerId == receiverId) {
      state = state.copyWith(
        messages: [...state.messages, optimistic],
        pendingMessageIds: {...state.pendingMessageIds, optimisticId},
        failedMessageIds: state.failedMessageIds.difference({optimisticId}),
        clearError: true,
      );
    } else {
      state = state.copyWith(
        pendingMessageIds: {...state.pendingMessageIds, optimisticId},
        failedMessageIds: state.failedMessageIds.difference({optimisticId}),
        clearError: true,
      );
    }

    if (state.isConnected) {
      _wsService.sendMessage(roomId, {
        'senderId': currentUserId,
        'receiverId': receiverId,
        'content': trimmed,
        if (propertyId != null) 'propertyId': propertyId,
      });
      // The server will broadcast the persisted message back; it replaces the
      // optimistic bubble in _handleIncomingMessage.
    } else {
      try {
        final message = await _service.sendMessage(
          receiverId: receiverId,
          content: trimmed,
          propertyId: propertyId,
        );
        if (state.activePartnerId == receiverId) {
          state = state.copyWith(
            messages: state.messages
                .where((m) => m.id != optimisticId)
                .followedBy([message])
                .toList(),
            pendingMessageIds: state.pendingMessageIds.difference({optimisticId}),
          );
        } else {
          state = state.copyWith(
            pendingMessageIds: state.pendingMessageIds.difference({optimisticId}),
          );
        }
      } catch (e) {
        state = state.copyWith(
          error: 'Erreur d\'envoi du message',
          pendingMessageIds: state.pendingMessageIds.difference({optimisticId}),
          failedMessageIds: {...state.failedMessageIds, optimisticId},
        );
        return;
      }
    }

    _updateConversationPreview(
      receiverId,
      MessageModel(
        id: optimisticId,
        senderId: currentUserId,
        senderName: optimistic.senderName,
        receiverId: receiverId,
        receiverName: '',
        content: trimmed,
        isRead: true,
        timestamp: optimistic.timestamp,
        propertyId: propertyId,
      ),
    );
  }

  void sendTyping(int receiverId) {
    final currentUserId = _currentUserId;
    if (currentUserId == 0) return;
    if (!state.isConnected) return;
    final roomId = MessageModel.roomIdFor(currentUserId, receiverId);
    _wsService.sendTyping(roomId, currentUserId, isTyping: true);

    _typingStopTimer?.cancel();
    _typingStopTimer = Timer(const Duration(milliseconds: 1500), () {
      _wsService.sendTyping(roomId, currentUserId, isTyping: false);
    });
  }

  void subscribeToRoom(int roomId) {
    _wsService.subscribeToRoom(roomId);
  }

  void unsubscribeFromRoom(int roomId) {
    _wsService.unsubscribeFromRoom(roomId);
  }

  void setActivePartner(int? partnerId) {
    state = state.copyWith(activePartnerId: partnerId);
  }

  Future<void> markAsRead(int messageId) async {
    try {
      await _service.markAsRead(messageId);
      _markMessageReadLocally(messageId);
      state = state.copyWith(
        unreadCount: state.unreadCount > 0 ? state.unreadCount - 1 : 0,
      );
    } catch (_) {}
  }

  Future<void> deleteMessage(int messageId) async {
    try {
      await _service.deleteMessage(messageId);
      final updated = state.messages.where((m) => m.id != messageId).toList();
      state = state.copyWith(messages: updated);
      if (state.activePartnerId != null) {
        loadConversations();
      }
    } catch (e) {
      state = state.copyWith(error: 'Erreur de suppression');
    }
  }

  void reconnect() {
    try {
      _wsService.connect();
    } catch (_) {}
  }

  @override
  void dispose() {
    _msgSub?.cancel();
    _typingSub?.cancel();
    _readSub?.cancel();
    _connSub?.cancel();
    _typingTimer?.cancel();
    _typingStopTimer?.cancel();
    super.dispose();
  }
}

final messageServiceProvider =
    Provider<MessageService>((ref) => MessageService());
final webSocketServiceProvider =
    Provider<WebSocketService>((ref) => WebSocketService());

final messageProvider =
    StateNotifierProvider<MessageNotifier, MessageState>((ref) {
  final service = ref.watch(messageServiceProvider);
  final wsService = ref.watch(webSocketServiceProvider);
  return MessageNotifier(service, wsService, ref);
});
