import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/chat/chat_message_model.dart';
import '../../services/ai_chat_service.dart';

/// État du chatbot
class AIChatState {
  final List<ChatMessageModel> messages;
  final bool isLoading;
  final bool isListening;
  final bool isSpeaking;
  final String currentLanguage;
  final String? error;
  final String sessionId;
  final bool isInitialized;
  final List<String> availableLanguages;

  const AIChatState({
    this.messages = const [],
    this.isLoading = false,
    this.isListening = false,
    this.isSpeaking = false,
    this.currentLanguage = 'fr',
    this.error,
    this.sessionId = '',
    this.isInitialized = false,
    this.availableLanguages = const ['fr', 'ar', 'en', 'darija'],
  });

  AIChatState copyWith({
    List<ChatMessageModel>? messages,
    bool? isLoading,
    bool? isListening,
    bool? isSpeaking,
    String? currentLanguage,
    String? error,
    String? sessionId,
    bool? isInitialized,
    List<String>? availableLanguages,
  }) {
    return AIChatState(
      messages: messages ?? this.messages,
      isLoading: isLoading ?? this.isLoading,
      isListening: isListening ?? this.isListening,
      isSpeaking: isSpeaking ?? this.isSpeaking,
      currentLanguage: currentLanguage ?? this.currentLanguage,
      error: error,
      sessionId: sessionId ?? this.sessionId,
      isInitialized: isInitialized ?? this.isInitialized,
      availableLanguages: availableLanguages ?? this.availableLanguages,
    );
  }

  /// Récupère les quick replies du dernier message bot
  List<QuickReply>? get lastQuickReplies {
    final botMessages = messages.where((m) => !m.isUser).toList();
    if (botMessages.isEmpty) return null;
    return botMessages.last.quickReplies;
  }

  /// Vérifie si le dernier message a des propriétés
  bool get hasPropertyCards {
    final botMessages = messages.where((m) => !m.isUser).toList();
    if (botMessages.isEmpty) return false;
    final last = botMessages.last;
    return last.properties != null && last.properties!.isNotEmpty;
  }
}

/// Notifier Riverpod pour le chatbot IA
class AIChatNotifier extends StateNotifier<AIChatState> {
  final AIChatService _chatService;

  AIChatNotifier(this._chatService) : super(const AIChatState());

  /// Initialise le provider
  Future<void> initialize() async {
    try {
      await _chatService.initialize();
      final history = await _chatService.loadMessageHistory();
      state = state.copyWith(
        isInitialized: true,
        sessionId: _chatService.sessionId,
        messages: history.isEmpty ? [_buildWelcomeMessage()] : history,
      );
    } catch (e) {
      state = state.copyWith(
        isInitialized: true,
        error: 'Erreur d\'initialisation du chat',
        messages: [_buildWelcomeMessage()],
      );
    }
  }

  /// Message de bienvenue multilingue
  ChatMessageModel _buildWelcomeMessage() {
    final welcomeTexts = {
      'fr':
          'Bonjour ! Je suis votre assistant IA MAROC-LOC. Comment puis-je vous aider aujourd\'hui ? 🏠',
      'ar': 'مرحباً! أنا مساعدك الذكي ماروك لوك. كيف يمكنني مساعدتك اليوم؟ 🏠',
      'en':
          'Hello! I am your MAROC-LOC AI assistant. How can I help you today? 🏠',
      'darija':
          'سلام! أنا مساعدك الذكي ديال ماروك لوك. كيفاش نقدر نعاونك اليوم؟ 🏠',
    };

    return ChatMessageModel.system(
      welcomeTexts[state.currentLanguage] ?? welcomeTexts['fr']!,
    );
  }

  /// Envoie un message texte
  Future<void> sendMessage(String text) async {
    if (text.trim().isEmpty) return;

    // Ajoute le message utilisateur
    final userMessage = ChatMessageModel.user(
      id: 'user_${DateTime.now().millisecondsSinceEpoch}',
      text: text.trim(),
    );

    final updatedMessages = [...state.messages, userMessage];
    state = state.copyWith(
      messages: updatedMessages,
      isLoading: true,
      error: null,
    );

    // Sauvegarde l'historique
    await _chatService.saveMessageHistory(updatedMessages);

    // Appel API
    try {
      final response = await _chatService.sendMessage(
        message: text.trim(),
        language: state.currentLanguage,
      );

      final finalMessages = [...state.messages, response];
      state = state.copyWith(
        messages: finalMessages,
        isLoading: false,
        sessionId: _chatService.sessionId,
      );

      // Sauvegarde + analytics
      await _chatService.saveMessageHistory(finalMessages);
      await _chatService.trackConversation(
        intent: response.intent ?? 'UNKNOWN',
        language: response.language ?? state.currentLanguage,
        messageCount: finalMessages.length,
      );

      // Auto TTS pour les réponses courtes
      if (!response.isUser &&
          response.text.length < 200 &&
          response.type != ChatMessageType.error) {
        await speak(response.text);
      }
    } catch (e) {
      final errorMessage = ChatMessageModel.error(
        'Erreur de connexion. Veuillez réessayer.',
      );
      final finalMessages = [...state.messages, errorMessage];
      state = state.copyWith(
        messages: finalMessages,
        isLoading: false,
        error: e.toString(),
      );
      await _chatService.saveMessageHistory(finalMessages);
    }
  }

  /// Envoie un quick reply
  Future<void> sendQuickReply(QuickReply quickReply) async {
    await sendMessage(quickReply.label);
  }

  /// Démarre l'écoute vocale
  Future<void> startVoiceInput() async {
    if (state.isListening) return;

    state = state.copyWith(isListening: true, error: null);

    final success = await _chatService.startListening(
      onResult: (text) async {
        state = state.copyWith(isListening: false);
        if (text.isNotEmpty) {
          await sendMessage(text);
        }
      },
      onDone: () {
        state = state.copyWith(isListening: false);
      },
      language: state.currentLanguage,
    );

    if (!success) {
      state = state.copyWith(
        isListening: false,
        error: 'Microphone non disponible',
      );
    }
  }

  /// Arrête l'écoute vocale
  Future<void> stopVoiceInput() async {
    await _chatService.stopListening();
    state = state.copyWith(isListening: false);
  }

  /// Lit un message à haute voix
  Future<void> speak(String text) async {
    state = state.copyWith(isSpeaking: true);
    await _chatService.speak(text, language: state.currentLanguage);
    state = state.copyWith(isSpeaking: false);
  }

  /// Arrête la lecture
  Future<void> stopSpeaking() async {
    await _chatService.stopSpeaking();
    state = state.copyWith(isSpeaking: false);
  }

  /// Change la langue
  Future<void> changeLanguage(String language) async {
    if (!state.availableLanguages.contains(language)) return;

    state = state.copyWith(currentLanguage: language);
    await _chatService.setTtsLanguage(language);

    // Ajoute un message système indiquant le changement
    final langLabels = {
      'fr': 'Langue changée en Français',
      'ar': 'تم تغيير اللغة إلى العربية',
      'en': 'Language changed to English',
      'darija': 'بدلت اللغة للدارجة',
    };

    final systemMsg = ChatMessageModel.system(
      langLabels[language] ?? langLabels['fr']!,
    );

    final updatedMessages = [...state.messages, systemMsg];
    state = state.copyWith(messages: updatedMessages);
    await _chatService.saveMessageHistory(updatedMessages);
  }

  /// Réinitialise la conversation
  Future<void> resetConversation() async {
    await _chatService.resetSession();
    await _chatService.clearHistory();
    state = state.copyWith(
      messages: [_buildWelcomeMessage()],
      sessionId: _chatService.sessionId,
      error: null,
      isLoading: false,
      isListening: false,
      isSpeaking: false,
    );
  }

  /// Charge l'historique
  Future<void> loadHistory() async {
    final history = await _chatService.loadMessageHistory();
    if (history.isNotEmpty) {
      state = state.copyWith(messages: history);
    }
  }

  /// Track un clic sur une propriété
  Future<void> trackPropertyClick(int propertyId) async {
    await _chatService.trackPropertyClick(
      propertyId: propertyId,
      source: 'chatbot',
    );
  }

  /// Efface l'erreur
  void clearError() {
    state = state.copyWith(error: null);
  }

  @override
  void dispose() {
    _chatService.dispose();
    super.dispose();
  }
}

/// Provider pour le service AI Chat
final aiChatServiceProvider = Provider<AIChatService>((ref) {
  return AIChatService();
});

/// Provider pour l'état du chatbot
final aiChatProvider =
    StateNotifierProvider<AIChatNotifier, AIChatState>((ref) {
  final service = ref.watch(aiChatServiceProvider);
  return AIChatNotifier(service);
});
