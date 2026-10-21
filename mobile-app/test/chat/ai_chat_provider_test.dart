import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:marocloc_mobile/data/models/chat/chat_message_model.dart';
import 'package:marocloc_mobile/presentation/providers/ai_chat_provider.dart';
import 'package:marocloc_mobile/data/models/property_model.dart';
import 'package:marocloc_mobile/services/ai_chat_service.dart';

/// Mock manuel du AIChatService
class MockAIChatService implements AIChatService {
  String _sessionId = 'mock-session';
  List<ChatMessageModel> _storedMessages = [];

  @override
  String get sessionId => _sessionId;

  @override
  Future<void> initialize() async {}

  @override
  Future<void> resetSession() async {
    _sessionId = 'mock-session-${DateTime.now().millisecondsSinceEpoch}';
  }

  @override
  Future<ChatMessageModel> sendMessage({
    required String message,
    String language = 'fr',
    int retryCount = 1,
  }) async {
    return ChatMessageModel(
      id: 'bot-1',
      text: 'Réponse mock: $message',
      isUser: false,
      timestamp: DateTime.now(),
      intent: 'TEST',
      role: 'GUEST',
    );
  }

  @override
  Future<void> saveMessageHistory(List<ChatMessageModel> messages) async {
    _storedMessages = List.from(messages);
  }

  @override
  Future<List<ChatMessageModel>> loadMessageHistory() async {
    return _storedMessages;
  }

  @override
  Future<void> clearHistory() async {
    _storedMessages = [];
  }

  @override
  Future<void> trackConversation({
    required String intent,
    required String language,
    required int messageCount,
    String? propertyId,
  }) async {}

  @override
  Future<void> trackPropertyClick({
    required int propertyId,
    required String source,
  }) async {}

  @override
  Future<void> setTtsLanguage(String language) async {}

  @override
  Future<void> speak(String text, {String language = 'fr'}) async {}

  @override
  Future<void> stopSpeaking() async {}

  @override
  Future<void> dispose() async {}

  // Voice stubs
  @override
  bool get isSpeechAvailable => false;

  @override
  Future<bool> startListening({
    required Function(String text) onResult,
    required Function() onDone,
    String language = 'fr',
  }) async => false;

  @override
  Future<void> stopListening() async {}

  @override
  bool get isListening => false;

  @override
  Future<ChatMessageModel> sendVoiceMessage({
    required String audioPath,
    String language = 'fr',
  }) async => ChatMessageModel.error('Voice not available in mock');

  @override
  Future<List<PropertyModel>> searchProperties({required String query, String language = 'fr'}) async => [];

  @override
  Future<void> clearAllSessions() async {}

  @override
  Future<bool> isSpeaking() async => false;
}

void main() {
  late MockAIChatService mockService;
  late ProviderContainer container;

  setUp(() {
    mockService = MockAIChatService();
    container = ProviderContainer(
      overrides: [
        aiChatServiceProvider.overrideWithValue(mockService),
      ],
    );
  });

  tearDown(() {
    container.dispose();
  });

  group('AIChatNotifier', () {
    test('initial state has empty messages and is not initialized', () {
      final state = container.read(aiChatProvider);
      expect(state.messages, isEmpty);
      expect(state.isInitialized, false);
      expect(state.isLoading, false);
      expect(state.currentLanguage, 'fr');
    });

    test('initialize loads history and sets initialized', () async {
      await container.read(aiChatProvider.notifier).initialize();

      final state = container.read(aiChatProvider);
      expect(state.isInitialized, true);
      expect(state.messages.length, 1); // Welcome message
      expect(state.messages.first.type, ChatMessageType.system);
    });

    test('sendMessage adds user message and bot response', () async {
      await container.read(aiChatProvider.notifier).initialize();
      await container.read(aiChatProvider.notifier).sendMessage('appartement casablanca');

      final state = container.read(aiChatProvider);
      expect(state.messages.length, 3); // welcome + user + bot
      expect(state.messages[1].isUser, true);
      expect(state.messages[1].text, 'appartement casablanca');
      expect(state.messages[2].isUser, false);
      expect(state.messages[2].text, 'Réponse mock: appartement casablanca');
      expect(state.isLoading, false);
    });

    test('changeLanguage updates language and adds system message', () async {
      await container.read(aiChatProvider.notifier).initialize();
      await container.read(aiChatProvider.notifier).changeLanguage('ar');

      final state = container.read(aiChatProvider);
      expect(state.currentLanguage, 'ar');
      expect(state.messages.length, 2); // welcome + system
    });

    test('resetConversation clears messages and creates new session', () async {
      await container.read(aiChatProvider.notifier).initialize();
      await container.read(aiChatProvider.notifier).resetConversation();

      final state = container.read(aiChatProvider);
      expect(state.messages.length, 1);
      expect(state.messages.first.type, ChatMessageType.system);
    });

    test('clearError removes error state', () {
      // On ne peut pas simuler facilement une erreur avec le mock,
      // mais on teste que clearError ne plante pas
      container.read(aiChatProvider.notifier).clearError();
      final state = container.read(aiChatProvider);
      expect(state.error, isNull);
    });
  });
}
