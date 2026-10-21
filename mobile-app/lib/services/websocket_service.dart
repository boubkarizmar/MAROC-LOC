import 'dart:async';
import 'dart:convert';
import 'package:stomp_dart_client/stomp_dart_client.dart';
import '../core/constants/api_constants.dart';
import 'auth_service.dart';

class WebSocketService {
  StompClient? _client;
  final AuthService _authService;
  final _messageController = StreamController<Map<String, dynamic>>.broadcast();
  final _typingController = StreamController<Map<String, dynamic>>.broadcast();
  final _readController = StreamController<Map<String, dynamic>>.broadcast();
  final _connectionController = StreamController<bool>.broadcast();

  /// Active room subscriptions so we can unsubscribe explicitly and recreate
  /// them after a reconnect.
  final Map<int, List<StompUnsubscribe>> _roomSubscriptions = {};

  /// Throttle state for typing events per room.
  final Map<int, DateTime> _lastTypingSent = {};
  static const _typingThrottle = Duration(milliseconds: 300);

  StompUnsubscribe? _notificationUnsubscribe;

  WebSocketService({AuthService? authService})
      : _authService = authService ?? AuthService();

  Stream<Map<String, dynamic>> get messageStream => _messageController.stream;
  Stream<Map<String, dynamic>> get typingStream => _typingController.stream;
  Stream<Map<String, dynamic>> get readStream => _readController.stream;
  Stream<bool> get connectionStream => _connectionController.stream;

  Future<void> connect() async {
    if (_client?.connected == true) return;

    final token = await _authService.getToken();
    if (token == null) return;

    final wsUrl = '${ApiConstants.wsBaseUrl}/ws';

    _client = StompClient(
      config: StompConfig.sockJS(
        url: wsUrl,
        webSocketConnectHeaders: {'Authorization': 'Bearer $token'},
        stompConnectHeaders: {'Authorization': 'Bearer $token'},
        onConnect: _onConnect,
        onDisconnect: _onDisconnect,
        onWebSocketError: (error) => _connectionController.add(false),
        onStompError: (frame) => _connectionController.add(false),
        reconnectDelay: const Duration(seconds: 5),
      ),
    );

    _client!.activate();
  }

  void _onConnect(StompFrame frame) {
    _connectionController.add(true);

    _notificationUnsubscribe = _client!.subscribe(
      destination: '/user/queue/notifications',
      callback: (frame) {
        if (frame.body == null) return;
        final data = jsonDecode(frame.body!) as Map<String, dynamic>;
        final type = data['type'] as String?;
        // The personal notification queue may receive both ChatMessage and
        // NotificationMessage payloads. Chat payloads are handled by room
        // subscriptions, so filter them out here.
        if (type == 'CHAT' || type == 'TYPING' || type == 'READ_RECEIPT') {
          return;
        }
        _messageController.add(data);
      },
    );

    // Resubscribe active rooms after reconnect.
    final rooms = _roomSubscriptions.keys.toList();
    for (final roomId in rooms) {
      _roomSubscriptions[roomId]?.clear();
      _subscribeRoom(roomId);
    }
  }

  void _onDisconnect(StompFrame frame) {
    _connectionController.add(false);
  }

  void subscribeToRoom(int roomId) {
    // Prevent duplicate subscriptions for the same room.
    if (_roomSubscriptions.containsKey(roomId)) return;

    _roomSubscriptions[roomId] = [];
    if (_client?.connected == true) {
      _subscribeRoom(roomId);
    }
  }

  void _subscribeRoom(int roomId) {
    if (_client?.connected != true) return;

    final subs = _roomSubscriptions[roomId] ??= [];

    subs.add(_client!.subscribe(
      destination: '/topic/chat.$roomId',
      callback: (frame) {
        if (frame.body != null) {
          _messageController.add(jsonDecode(frame.body!));
        }
      },
    ));

    subs.add(_client!.subscribe(
      destination: '/topic/chat.typing.$roomId',
      callback: (frame) {
        if (frame.body != null) {
          _typingController.add(jsonDecode(frame.body!));
        }
      },
    ));

    subs.add(_client!.subscribe(
      destination: '/topic/chat.read.$roomId',
      callback: (frame) {
        if (frame.body != null) {
          _readController.add(jsonDecode(frame.body!));
        }
      },
    ));
  }

  void unsubscribeFromRoom(int roomId) {
    final subs = _roomSubscriptions.remove(roomId);
    if (subs == null) return;
    for (final unsub in subs) {
      unsub();
    }
  }

  void sendMessage(int roomId, Map<String, dynamic> message) {
    if (_client?.connected != true) return;

    _client!.send(
      destination: '/app/chat.send/$roomId',
      body: jsonEncode(message),
    );
  }

  void sendTyping(int roomId, int userId, {bool isTyping = true}) {
    if (_client?.connected != true) return;

    // Throttle "isTyping: true" frames but always allow stop frames so the
    // peer typing indicator does not get stuck.
    if (isTyping) {
      final now = DateTime.now();
      final last = _lastTypingSent[roomId];
      if (last != null && now.difference(last) < _typingThrottle) {
        return;
      }
      _lastTypingSent[roomId] = now;
    } else {
      _lastTypingSent.remove(roomId);
    }

    _client!.send(
      destination: '/app/chat.typing/$roomId',
      body: jsonEncode({
        'userId': userId,
        'senderId': userId,
        'type': 'TYPING',
        'isTyping': isTyping,
      }),
    );
  }

  void sendReadReceipt(int roomId, int messageId) {
    if (_client?.connected != true) return;

    _client!.send(
      destination: '/app/chat.read/$roomId',
      body: jsonEncode({'id': messageId, 'type': 'READ_RECEIPT'}),
    );
  }

  void disconnect() {
    _notificationUnsubscribe?.call();
    _notificationUnsubscribe = null;
    _client?.deactivate();
    _client = null;
  }

  void dispose() {
    disconnect();
    _messageController.close();
    _typingController.close();
    _readController.close();
    _connectionController.close();
  }
}
