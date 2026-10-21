import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/notification_model.dart';
import '../../services/firebase_messaging_service.dart';
import '../../services/notification_service.dart';
import '../../services/websocket_service.dart';

@immutable
class NotificationState {
  final List<NotificationModel> notifications;
  final int unreadCount;
  final bool initialized;
  final bool loading;
  final bool hasMore;
  final int page;
  final String? error;

  const NotificationState({
    this.notifications = const [],
    this.unreadCount = 0,
    this.initialized = false,
    this.loading = false,
    this.hasMore = true,
    this.page = 0,
    this.error,
  });

  NotificationState copyWith({
    List<NotificationModel>? notifications,
    int? unreadCount,
    bool? initialized,
    bool? loading,
    bool? hasMore,
    int? page,
    String? error,
  }) {
    return NotificationState(
      notifications: notifications ?? this.notifications,
      unreadCount: unreadCount ?? this.unreadCount,
      initialized: initialized ?? this.initialized,
      loading: loading ?? this.loading,
      hasMore: hasMore ?? this.hasMore,
      page: page ?? this.page,
      error: error ?? this.error,
    );
  }
}

class NotificationNotifier extends StateNotifier<NotificationState> {
  final NotificationService _notificationService;
  final FirebaseMessagingService _messagingService;
  final WebSocketService _webSocketService;

  StreamSubscription<Map<String, dynamic>>? _wsSubscription;
  StreamSubscription<bool>? _connectionSubscription;

  NotificationNotifier(
    this._notificationService,
    this._messagingService,
    this._webSocketService,
  ) : super(const NotificationState());

  Future<void> initialize() async {
    try {
      await _messagingService.initialize(
        onNotificationTap: (data) => _handleNotificationTap(data),
      );

      // Sync FCM token with backend (best-effort; optional without google-services.json)
      final fcmToken = _messagingService.fcmToken;
      if (fcmToken != null && fcmToken.isNotEmpty) {
        _syncFcmToken(fcmToken);
      }
      _messagingService.onTokenRefresh.listen((token) => _syncFcmToken(token));

      // Listen to WebSocket notifications
      _wsSubscription = _webSocketService.messageStream.listen(_handleWebSocketMessage);
      _connectionSubscription = _webSocketService.connectionStream.listen((connected) {
        if (connected) {
          refresh();
        }
      });

      await refresh();
      state = state.copyWith(initialized: true);
    } catch (e) {
      state = state.copyWith(error: e.toString(), initialized: true);
    }
  }

  Future<void> refresh() async {
    state = state.copyWith(loading: true, error: null);
    try {
      final [notifications as List<NotificationModel>, count as int] = await Future.wait([
        _notificationService.fetchNotifications(size: 50),
        _notificationService.fetchUnreadCount(),
      ]);
      state = state.copyWith(
        notifications: notifications,
        unreadCount: count,
        page: 0,
        hasMore: notifications.length == 50,
        loading: false,
      );
    } catch (e) {
      state = state.copyWith(loading: false, error: e.toString());
    }
  }

  Future<void> loadMore() async {
    if (state.loading || !state.hasMore) return;
    state = state.copyWith(loading: true);
    try {
      final nextPage = state.page + 1;
      final notifications = await _notificationService.fetchNotifications(
        page: nextPage,
        size: 20,
      );
      final existingIds = state.notifications.map((n) => n.id).toSet();
      final merged = [
        ...state.notifications,
        ...notifications.where((n) => !existingIds.contains(n.id)),
      ];
      state = state.copyWith(
        notifications: merged,
        page: nextPage,
        hasMore: notifications.length == 20,
        loading: false,
      );
    } catch (e) {
      state = state.copyWith(loading: false, error: e.toString());
    }
  }

  Future<void> markAsRead(int id) async {
    try {
      await _notificationService.markAsRead(id);
      _updateReadStatus(id);
    } catch (e) {
      debugPrint('Failed to mark notification as read: $e');
    }
  }

  Future<void> markAllAsRead() async {
    try {
      await _notificationService.markAllAsRead();
      final updated = state.notifications
          .map((n) => n.copyWith(status: 'READ'))
          .toList();
      state = state.copyWith(notifications: updated, unreadCount: 0);
    } catch (e) {
      debugPrint('Failed to mark all notifications as read: $e');
    }
  }

  Future<void> deleteNotification(int id) async {
    try {
      await _notificationService.deleteNotification(id);
      final updated = state.notifications.where((n) => n.id != id).toList();
      final unread = updated.where((n) => n.isUnread).length;
      state = state.copyWith(notifications: updated, unreadCount: unread);
    } catch (e) {
      debugPrint('Failed to delete notification: $e');
    }
  }

  void addNotification(NotificationModel notification) {
    final exists = state.notifications.any((n) => n.id == notification.id);
    if (exists) return;
    state = state.copyWith(
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + (notification.isUnread ? 1 : 0),
    );
  }

  void _updateReadStatus(int id) {
    final updated = state.notifications.map((n) {
      return n.id == id ? n.copyWith(status: 'READ', readAt: DateTime.now()) : n;
    }).toList();
    final unread = updated.where((n) => n.isUnread).length;
    state = state.copyWith(notifications: updated, unreadCount: unread);
  }

  void _handleWebSocketMessage(Map<String, dynamic> data) {
    final type = data['type'] as String? ?? '';
    // Chat messages also flow through this stream; ignore non-notification types
    if (type == 'CHAT' || type == 'JOIN' || type == 'LEAVE' || type == 'TYPING' || type == 'READ_RECEIPT') {
      return;
    }
    final notification = NotificationModel(
      id: data['id'] != null ? int.tryParse(data['id'].toString()) ?? DateTime.now().millisecondsSinceEpoch : DateTime.now().millisecondsSinceEpoch,
      title: data['title'] as String? ?? '',
      message: data['body'] as String? ?? '',
      type: type,
      priority: 'NORMAL',
      icon: data['imageUrl'] as String?,
      createdAt: DateTime.tryParse(data['timestamp'] as String? ?? '') ?? DateTime.now(),
      status: data['read'] == true ? 'READ' : 'UNREAD',
      actionUrl: data['actionUrl'] as String?,
      userId: data['userId'] as int?,
    );
    addNotification(notification);
  }

  void _handleNotificationTap(Map<String, dynamic> data) {
    debugPrint('Notification tapped: $data');
  }

  Future<void> _syncFcmToken(String token) async {
    try {
      final deviceType = defaultTargetPlatform == TargetPlatform.iOS ? 'IOS' : 'ANDROID';
      await _notificationService.registerFcmToken(token, deviceType: deviceType);
    } catch (e) {
      debugPrint('FCM token sync skipped: $e');
    }
  }

  @override
  void dispose() {
    _wsSubscription?.cancel();
    _connectionSubscription?.cancel();
    super.dispose();
  }
}

final notificationServiceProvider = Provider<NotificationService>((ref) {
  return NotificationService();
});

final firebaseMessagingServiceProvider = Provider<FirebaseMessagingService>((ref) {
  return FirebaseMessagingService();
});

final webSocketServiceProvider = Provider<WebSocketService>((ref) {
  return WebSocketService();
});

final notificationProvider = StateNotifierProvider<NotificationNotifier, NotificationState>((ref) {
  final service = ref.watch(notificationServiceProvider);
  final messaging = ref.watch(firebaseMessagingServiceProvider);
  final ws = ref.watch(webSocketServiceProvider);
  return NotificationNotifier(service, messaging, ws);
});
