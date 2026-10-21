import 'dart:async';
import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:speech_to_text/speech_to_text.dart';
import 'package:flutter_tts/flutter_tts.dart';
import '../core/constants/api_constants.dart';
import '../data/models/chat/chat_message_model.dart';
import '../data/models/property_model.dart';
import 'auth_service.dart';

/// Exception personnalisée pour les erreurs du chatbot AI
class AIChatException implements Exception {
  final String message;
  final int? statusCode;
  final String? code;

  AIChatException(this.message, {this.statusCode, this.code});

  @override
  String toString() =>
      'AIChatException: $message (code: $code, status: $statusCode)';
}

/// Service complet pour le chatbot IA MAROC-LOC
/// Connecte le backend proxy (JWT) et le AI Service direct
class AIChatService {
  final Dio _backendDio;
  final Dio _aiDio;
  final AuthService _authService;
  final FlutterSecureStorage _secureStorage;
  final SpeechToText _speechToText;
  final FlutterTts _flutterTts;

  String _sessionId = '';
  bool _isSpeechInitialized = false;
  bool _isTtsInitialized = false;

  AIChatService({
    Dio? backendDio,
    Dio? aiDio,
    AuthService? authService,
    FlutterSecureStorage? secureStorage,
    SpeechToText? speechToText,
    FlutterTts? flutterTts,
  })  : _backendDio = backendDio ?? _createBackendDio(),
        _aiDio = aiDio ?? _createAiDio(),
        _authService = authService ?? AuthService(),
        _secureStorage = secureStorage ?? const FlutterSecureStorage(),
        _speechToText = speechToText ?? SpeechToText(),
        _flutterTts = flutterTts ?? FlutterTts();

  static Dio _createBackendDio() {
    return Dio(BaseOptions(
      baseUrl: ApiConstants.baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));
  }

  static Dio _createAiDio() {
    return Dio(BaseOptions(
      baseUrl: ApiConstants.aiBaseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));
  }

  /// Intercepteur JWT pour le backend
  Future<void> _setupBackendInterceptor() async {
    _backendDio.interceptors.clear();
    _backendDio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _authService.getToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        if (kDebugMode) {
          debugPrint('➡️ AI CHAT REQUEST: ${options.method} ${options.path}');
        }
        return handler.next(options);
      },
      onResponse: (response, handler) {
        if (kDebugMode) {
          debugPrint('✅ AI CHAT RESPONSE: ${response.statusCode}');
        }
        return handler.next(response);
      },
      onError: (DioException error, handler) async {
        if (kDebugMode) {
          debugPrint(
              '❌ AI CHAT ERROR: ${error.response?.statusCode} ${error.message}');
        }
        if (error.response?.statusCode == 401) {
          final refreshed = await _authService.refreshToken();
          if (refreshed) {
            final token = await _authService.getToken();
            error.requestOptions.headers['Authorization'] = 'Bearer $token';
            return handler
                .resolve(await _backendDio.fetch(error.requestOptions));
          }
        }
        return handler.next(error);
      },
    ));
  }

  /// Intercepteur JWT pour le AI service
  Future<void> _setupAiInterceptor() async {
    _aiDio.interceptors.clear();
    _aiDio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _authService.getToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        if (kDebugMode) {
          debugPrint('➡️ AI SERVICE REQUEST: ${options.method} ${options.path}');
        }
        return handler.next(options);
      },
      onResponse: (response, handler) {
        if (kDebugMode) {
          debugPrint('✅ AI SERVICE RESPONSE: ${response.statusCode}');
        }
        return handler.next(response);
      },
      onError: (DioException error, handler) async {
        if (kDebugMode) {
          debugPrint(
              '❌ AI SERVICE ERROR: ${error.response?.statusCode} ${error.message}');
        }
        return handler.next(error);
      },
    ));
  }

  /// Initialise le service
  Future<void> initialize() async {
    await _setupBackendInterceptor();
    await _setupAiInterceptor();
    await _initSpeech();
    await _initTts();
    await _loadSession();
  }

  /// Initialise Speech-to-Text
  Future<void> _initSpeech() async {
    try {
      _isSpeechInitialized = await _speechToText.initialize(
        onError: (error) => debugPrint('STT Error: $error'),
        onStatus: (status) => debugPrint('STT Status: $status'),
      );
    } catch (e) {
      _isSpeechInitialized = false;
      debugPrint('Failed to init speech: $e');
    }
  }

  /// Initialise Text-to-Speech
  Future<void> _initTts() async {
    try {
      await _flutterTts.setVolume(1.0);
      await _flutterTts.setSpeechRate(0.5);
      await _flutterTts.setPitch(1.0);
      _isTtsInitialized = true;
    } catch (e) {
      _isTtsInitialized = false;
      debugPrint('Failed to init TTS: $e');
    }
  }

  /// Définit la langue TTS
  Future<void> setTtsLanguage(String language) async {
    if (!_isTtsInitialized) return;
    final langMap = {
      'fr': 'fr-FR',
      'ar': 'ar-SA',
      'en': 'en-US',
      'darija': 'fr-FR', // Fallback to French for Darija
    };
    await _flutterTts.setLanguage(langMap[language] ?? 'fr-FR');
  }

  /// Charge la session depuis le stockage sécurisé
  Future<void> _loadSession() async {
    final stored = await _secureStorage.read(key: 'chat_session_id');
    if (stored != null && stored.isNotEmpty) {
      _sessionId = stored;
    } else {
      await resetSession();
    }
  }

  /// Sauvegarde la session
  Future<void> _saveSession() async {
    await _secureStorage.write(key: 'chat_session_id', value: _sessionId);
  }

  /// Récupère l'ID de session actuel
  String get sessionId => _sessionId;

  /// Réinitialise la session
  Future<void> resetSession() async {
    _sessionId =
        '${DateTime.now().millisecondsSinceEpoch}_${DateTime.now().hashCode}';
    await _saveSession();
  }

  /// Récupère le rôle utilisateur depuis le token/auth
  Future<String?> _getUserRole() async {
    try {
      final user = await _authService.getUser();
      return user?.role;
    } catch (e) {
      return null;
    }
  }

  /// Envoie un message texte au chatbot
  /// Utilise le backend proxy (/v1/ai/chat) avec JWT
  Future<ChatMessageModel> sendMessage({
    required String message,
    String language = 'fr',
    int retryCount = 1,
  }) async {
    if (_sessionId.isEmpty) await resetSession();

    final userRole = await _getUserRole();

    for (int attempt = 0; attempt <= retryCount; attempt++) {
      try {
        final response = await _aiDio.post(
          ApiConstants.aiChat,
          data: {
            'message': message,
            'session_id': _sessionId,
            'language': language,
            'user_role': userRole ?? 'GUEST',
          },
        );

        final data = response.data as Map<String, dynamic>;

        // Sauvegarde la session retournée si différente
        final returnedSessionId = data['session_id'] as String?;
        if (returnedSessionId != null && returnedSessionId.isNotEmpty) {
          _sessionId = returnedSessionId;
          await _saveSession();
        }

        return ChatMessageModel.fromApiResponse(data);
      } on DioException catch (_) {
        if (attempt == retryCount) {
          // Fallback: try AI service directly if backend proxy fails
          return await _sendMessageDirect(
            message: message,
            language: language,
            userRole: userRole,
          );
        }
        await Future.delayed(Duration(milliseconds: 500 * (attempt + 1)));
      } catch (_) {
        if (attempt == retryCount) {
          return ChatMessageModel.error(
            'Erreur de connexion au service IA. Veuillez réessayer.',
          );
        }
      }
    }

    return ChatMessageModel.error('Erreur inattendue.');
  }

  /// Envoi direct au AI service (fallback sans auth)
  Future<ChatMessageModel> _sendMessageDirect({
    required String message,
    String language = 'fr',
    String? userRole,
  }) async {
    try {
      final response = await _aiDio.post('/smart/chat', data: {
        'message': message,
        'session_id': _sessionId,
        'language': language,
        'user_role': userRole ?? 'GUEST',
      });

      final data = response.data as Map<String, dynamic>;
      final returnedSessionId = data['session_id'] as String?;
      if (returnedSessionId != null && returnedSessionId.isNotEmpty) {
        _sessionId = returnedSessionId;
        await _saveSession();
      }

      return ChatMessageModel.fromApiResponse(data);
    } catch (e) {
      return ChatMessageModel.error(
        'Service IA temporairement indisponible. Veuillez réessayer plus tard.',
      );
    }
  }

  /// Recherche intelligente de propriétés via AI
  Future<List<PropertyModel>> searchProperties({
    required String query,
    String language = 'fr',
  }) async {
    try {
      final response = await _aiDio.post(
        ApiConstants.aiSearch,
        data: {
          'query': query,
          'language': language,
          'session_id': _sessionId,
        },
      );

      final data = response.data as Map<String, dynamic>;
      final results = data['results'] as List<dynamic>?;
      if (results == null) return [];

      return results
          .map((r) => PropertyModel.fromAiJson(r as Map<String, dynamic>))
          .toList();
    } catch (e) {
      debugPrint('AI search error: $e');
      return [];
    }
  }

  // ==================== VOICE ASSISTANT ====================

  /// Vérifie si le microphone est disponible
  bool get isSpeechAvailable => _isSpeechInitialized;

  /// Démarre l'écoute vocale (Speech-to-Text)
  Future<bool> startListening({
    required Function(String text) onResult,
    required Function() onDone,
    String language = 'fr',
  }) async {
    if (!_isSpeechInitialized) {
      await _initSpeech();
    }
    if (!_isSpeechInitialized) return false;

    final localeMap = {
      'fr': 'fr_FR',
      'ar': 'ar_SA',
      'en': 'en_US',
      'darija': 'fr_MA',
    };

    try {
      await _speechToText.listen(
        onResult: (result) {
          if (result.finalResult) {
            onResult(result.recognizedWords);
            onDone();
          }
        },
        listenOptions: SpeechListenOptions(
          listenMode: ListenMode.confirmation,
          cancelOnError: true,
          partialResults: false,
          localeId: localeMap[language] ?? 'fr_FR',
        ),
      );
      return true;
    } catch (e) {
      debugPrint('Listen error: $e');
      return false;
    }
  }

  /// Arrête l'écoute vocale
  Future<void> stopListening() async {
    if (_isSpeechInitialized) {
      await _speechToText.stop();
    }
  }

  /// Vérifie si l'écoute est active
  bool get isListening => _speechToText.isListening;

  /// Envoie un message vocal: transcription + chat
  Future<ChatMessageModel> sendVoiceMessage({
    required String audioPath,
    String language = 'fr',
  }) async {
    if (_sessionId.isEmpty) await resetSession();

    try {
      // Étape 1: Transcription
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(audioPath),
        'language': language,
      });

      final transcribeRes =
          await _aiDio.post('/voice/transcribe', data: formData);
      final transcript = transcribeRes.data['text'] as String? ?? '';

      if (transcript.isEmpty) {
        return ChatMessageModel.error('Aucun texte détecté dans l\'audio.');
      }

      // Étape 2: Chat avec le texte transcrit
      final chatRes =
          await sendMessage(message: transcript, language: language);

      // On retourne le message chat, mais on garde l'info du transcript
      return chatRes;
    } catch (e) {
      return ChatMessageModel.error(
        'Erreur de traitement vocal. Veuillez réessayer.',
      );
    }
  }

  /// Text-to-Speech: lit un texte à haute voix
  Future<void> speak(String text, {String language = 'fr'}) async {
    if (!_isTtsInitialized) return;
    await setTtsLanguage(language);
    await _flutterTts.speak(text);
  }

  /// Arrête la lecture TTS
  Future<void> stopSpeaking() async {
    if (_isTtsInitialized) {
      await _flutterTts.stop();
    }
  }

  /// Vérifie si TTS parle actuellement
  Future<bool> isSpeaking() async {
    if (!_isTtsInitialized) return false;
    // flutter_tts ne fournit pas de méthode isSpeaking fiable cross-platform
    // On retourne false par défaut
    return false;
  }

  // ==================== ANALYTICS ====================

  /// Track une conversation pour analytics
  Future<void> trackConversation({
    required String intent,
    required String language,
    required int messageCount,
    String? propertyId,
  }) async {
    try {
      await _aiDio.post('/analytics/track', data: {
        'event': 'chat_conversation',
        'session_id': _sessionId,
        'intent': intent,
        'language': language,
        'message_count': messageCount,
        'property_id': propertyId,
        'timestamp': DateTime.now().toIso8601String(),
      });
    } catch (e) {
      debugPrint('Analytics track error: $e');
    }
  }

  /// Track un clic sur une propriété dans le chat
  Future<void> trackPropertyClick({
    required int propertyId,
    required String source,
  }) async {
    try {
      await _aiDio.post('/analytics/track', data: {
        'event': 'chat_property_click',
        'session_id': _sessionId,
        'property_id': propertyId,
        'source': source,
        'timestamp': DateTime.now().toIso8601String(),
      });
    } catch (e) {
      debugPrint('Analytics track error: $e');
    }
  }

  // ==================== SESSION PERSISTENCE ====================

  /// Sauvegarde l'historique des messages
  Future<void> saveMessageHistory(List<ChatMessageModel> messages) async {
    try {
      final jsonList = messages.map((m) => m.toJson()).toList();
      await _secureStorage.write(
        key: 'chat_history_$_sessionId',
        value: jsonEncode(jsonList),
      );
    } catch (e) {
      debugPrint('Save history error: $e');
    }
  }

  /// Charge l'historique des messages
  Future<List<ChatMessageModel>> loadMessageHistory() async {
    try {
      final stored = await _secureStorage.read(key: 'chat_history_$_sessionId');
      if (stored == null || stored.isEmpty) return [];

      final jsonList = jsonDecode(stored) as List<dynamic>;
      return jsonList
          .map((j) => _messageFromJson(j as Map<String, dynamic>))
          .toList();
    } catch (e) {
      debugPrint('Load history error: $e');
      return [];
    }
  }

  ChatMessageModel _messageFromJson(Map<String, dynamic> json) {
    final typeStr = json['type'] as String? ?? 'text';
    final type = ChatMessageType.values.firstWhere(
      (t) => t.name == typeStr,
      orElse: () => ChatMessageType.text,
    );

    return ChatMessageModel(
      id: json['id'] as String,
      text: json['text'] as String,
      isUser: json['isUser'] as bool,
      timestamp: DateTime.parse(json['timestamp'] as String),
      type: type,
      properties: (json['properties'] as List<dynamic>?)
          ?.map((p) => PropertyModel.fromJson(p as Map<String, dynamic>))
          .toList(),
      quickReplies: (json['quickReplies'] as List<dynamic>?)
          ?.map((q) => QuickReply.fromJson(q as Map<String, dynamic>))
          .toList(),
      actions: (json['actions'] as List<dynamic>?)
          ?.map((a) => ChatAction.fromJson(a as Map<String, dynamic>))
          .toList(),
      audioUrl: json['audioUrl'] as String?,
      intent: json['intent'] as String?,
      role: json['role'] as String?,
      confidence: (json['confidence'] as num?)?.toDouble(),
      language: json['language'] as String?,
    );
  }

  /// Efface l'historique de la session actuelle
  Future<void> clearHistory() async {
    await _secureStorage.delete(key: 'chat_history_$_sessionId');
  }

  /// Efface toutes les sessions
  Future<void> clearAllSessions() async {
    await _secureStorage.deleteAll();
  }

  /// Dispose les ressources
  Future<void> dispose() async {
    await stopListening();
    await stopSpeaking();
    _speechToText.cancel();
  }
}
