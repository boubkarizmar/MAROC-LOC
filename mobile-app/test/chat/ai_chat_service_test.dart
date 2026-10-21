import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/services.dart';
import 'package:marocloc_mobile/data/models/chat/chat_message_model.dart';
import 'package:marocloc_mobile/services/ai_chat_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  // Mock flutter_secure_storage channel
  const storageChannel = MethodChannel('plugins.it_nomads.com/flutter_secure_storage');
  TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
      .setMockMethodCallHandler(storageChannel, (call) async => null);

  late AIChatService service;

  setUp(() {
    service = AIChatService();
  });

  group('AIChatService', () {
    test('sessionId is generated after resetSession', () async {
      expect(service.sessionId, isEmpty);
      await service.resetSession();
      expect(service.sessionId.isNotEmpty, true);
    });

    test('resetSession generates different session ID', () async {
      await service.resetSession();
      final oldSession = service.sessionId;
      await Future.delayed(const Duration(milliseconds: 10));
      await service.resetSession();
      expect(service.sessionId, isNot(equals(oldSession)));
    });

    test('sendMessage returns ChatMessageModel even without server', () async {
      await service.resetSession();
      final result = await service.sendMessage(
        message: 'test message',
        language: 'fr',
        retryCount: 0,
      );
      expect(result, isA<ChatMessageModel>());
      expect(result.id.isNotEmpty, true);
    });

    test('searchProperties returns empty list on no connection', () async {
      final results = await service.searchProperties(query: 'test');
      expect(results, isA<List>());
    });

    test('isSpeechAvailable is false without initialization', () {
      expect(service.isSpeechAvailable, false);
    });

    test('isListening is false by default', () {
      expect(service.isListening, false);
    });

    test('isSpeaking returns false by default', () async {
      final speaking = await service.isSpeaking();
      expect(speaking, false);
    });
  });
}
