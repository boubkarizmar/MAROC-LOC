import 'package:flutter_test/flutter_test.dart';
import 'package:marocloc_mobile/presentation/providers/message_provider.dart';
import 'package:marocloc_mobile/data/models/message_model.dart';

void main() {
  group('MessageState', () {
    test('initial state has zero unread count', () {
      const state = MessageState();
      expect(state.unreadCount, 0);
      expect(state.messages, isEmpty);
      expect(state.isConnected, false);
      expect(state.isTyping, false);
    });

    test('copyWith updates unread count', () {
      const state = MessageState();
      final newState = state.copyWith(unreadCount: 5);
      expect(newState.unreadCount, 5);
    });

    test('clearTyping resets typing state', () {
      const state = MessageState(isTyping: true, typingUserId: 1);
      final newState = state.copyWith(clearTyping: true);
      expect(newState.isTyping, false);
      expect(newState.typingUserId, null);
    });
  });

  group('MessageModel', () {
    test('fromJson parses correctly', () {
      final json = {
        'id': 1,
        'senderId': 2,
        'senderName': 'John',
        'receiverId': 3,
        'receiverName': 'Jane',
        'content': 'Hello',
        'isRead': false,
        'timestamp': '2024-01-01T00:00:00Z',
      };
      final message = MessageModel.fromJson(json);
      expect(message.id, 1);
      expect(message.senderName, 'John');
      expect(message.isRead, false);
    });
  });
}
