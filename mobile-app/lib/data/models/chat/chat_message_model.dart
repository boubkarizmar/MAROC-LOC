import 'package:equatable/equatable.dart';
import '../../models/property_model.dart';

/// Type de message dans le chat
enum ChatMessageType {
  text,
  propertyCard,
  typingIndicator,
  error,
  system,
}

/// Action rapide suggérée par le bot
class QuickReply extends Equatable {
  final String label;
  final String action;
  final String? icon;

  const QuickReply({
    required this.label,
    required this.action,
    this.icon,
  });

  factory QuickReply.fromJson(Map<String, dynamic> json) {
    return QuickReply(
      label: json['label'] as String? ?? '',
      action: json['action'] as String? ?? '',
      icon: json['icon'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'label': label,
        'action': action,
        'icon': icon,
      };

  @override
  List<Object?> get props => [label, action, icon];
}

/// Action cliquable dans un message
class ChatAction extends Equatable {
  final String type;
  final String label;
  final Map<String, dynamic> payload;

  const ChatAction({
    required this.type,
    required this.label,
    this.payload = const {},
  });

  factory ChatAction.fromJson(Map<String, dynamic> json) {
    return ChatAction(
      type: json['type'] as String? ?? '',
      label: json['label'] as String? ?? '',
      payload: (json['payload'] as Map<String, dynamic>?) ?? {},
    );
  }

  Map<String, dynamic> toJson() => {
        'type': type,
        'label': label,
        'payload': payload,
      };

  @override
  List<Object?> get props => [type, label, payload];
}

/// Message de conversation
class ChatMessageModel extends Equatable {
  final String id;
  final String text;
  final bool isUser;
  final DateTime timestamp;
  final ChatMessageType type;
  final List<PropertyModel>? properties;
  final List<QuickReply>? quickReplies;
  final List<ChatAction>? actions;
  final String? audioUrl;
  final String? intent;
  final String? role;
  final double? confidence;
  final String? language;
  final String? errorMessage;
  final bool isRead;

  const ChatMessageModel({
    required this.id,
    required this.text,
    required this.isUser,
    required this.timestamp,
    this.type = ChatMessageType.text,
    this.properties,
    this.quickReplies,
    this.actions,
    this.audioUrl,
    this.intent,
    this.role,
    this.confidence,
    this.language,
    this.errorMessage,
    this.isRead = true,
  });

  /// Crée un message utilisateur
  factory ChatMessageModel.user({
    required String id,
    required String text,
    DateTime? timestamp,
  }) {
    return ChatMessageModel(
      id: id,
      text: text,
      isUser: true,
      timestamp: timestamp ?? DateTime.now(),
      type: ChatMessageType.text,
    );
  }

  /// Crée un message bot à partir de la réponse API
  factory ChatMessageModel.fromApiResponse(
    Map<String, dynamic> data, {
    DateTime? timestamp,
  }) {
    final props = data['properties'] as List<dynamic>?;
    final qr = data['quick_replies'] as List<dynamic>?;
    final acts = data['actions'] as List<dynamic>?;

    return ChatMessageModel(
      id: data['session_id'] as String? ??
          DateTime.now().millisecondsSinceEpoch.toString(),
      text: data['response'] as String? ?? '',
      isUser: false,
      timestamp: timestamp ?? DateTime.now(),
      type: ChatMessageType.text,
      properties: props
          ?.map((p) => PropertyModel.fromAiJson(p as Map<String, dynamic>))
          .toList(),
      quickReplies: qr
          ?.map((q) => QuickReply.fromJson(q as Map<String, dynamic>))
          .toList(),
      actions: acts
          ?.map((a) => ChatAction.fromJson(a as Map<String, dynamic>))
          .toList(),
      audioUrl: data['audio_url'] as String?,
      intent: data['intent'] as String?,
      role: data['role'] as String?,
      confidence: (data['confidence'] as num?)?.toDouble(),
      language: data['language'] as String?,
    );
  }

  /// Crée un message d'erreur
  factory ChatMessageModel.error(String message) {
    return ChatMessageModel(
      id: 'error_${DateTime.now().millisecondsSinceEpoch}',
      text: message,
      isUser: false,
      timestamp: DateTime.now(),
      type: ChatMessageType.error,
      errorMessage: message,
    );
  }

  /// Crée un message système (ex: bienvenue)
  factory ChatMessageModel.system(String text) {
    return ChatMessageModel(
      id: 'system_${DateTime.now().millisecondsSinceEpoch}',
      text: text,
      isUser: false,
      timestamp: DateTime.now(),
      type: ChatMessageType.system,
    );
  }

  /// Crée un typing indicator
  factory ChatMessageModel.typing() {
    return ChatMessageModel(
      id: 'typing_${DateTime.now().millisecondsSinceEpoch}',
      text: '',
      isUser: false,
      timestamp: DateTime.now(),
      type: ChatMessageType.typingIndicator,
    );
  }

  ChatMessageModel copyWith({
    String? id,
    String? text,
    bool? isUser,
    DateTime? timestamp,
    ChatMessageType? type,
    List<PropertyModel>? properties,
    List<QuickReply>? quickReplies,
    List<ChatAction>? actions,
    String? audioUrl,
    String? intent,
    String? role,
    double? confidence,
    String? language,
    String? errorMessage,
    bool? isRead,
  }) {
    return ChatMessageModel(
      id: id ?? this.id,
      text: text ?? this.text,
      isUser: isUser ?? this.isUser,
      timestamp: timestamp ?? this.timestamp,
      type: type ?? this.type,
      properties: properties ?? this.properties,
      quickReplies: quickReplies ?? this.quickReplies,
      actions: actions ?? this.actions,
      audioUrl: audioUrl ?? this.audioUrl,
      intent: intent ?? this.intent,
      role: role ?? this.role,
      confidence: confidence ?? this.confidence,
      language: language ?? this.language,
      errorMessage: errorMessage ?? this.errorMessage,
      isRead: isRead ?? this.isRead,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'text': text,
        'isUser': isUser,
        'timestamp': timestamp.toIso8601String(),
        'type': type.name,
        'properties': properties?.map((p) => p.toJson()).toList(),
        'quickReplies': quickReplies?.map((q) => q.toJson()).toList(),
        'actions': actions?.map((a) => a.toJson()).toList(),
        'audioUrl': audioUrl,
        'intent': intent,
        'role': role,
        'confidence': confidence,
        'language': language,
      };

  @override
  List<Object?> get props => [
        id,
        text,
        isUser,
        timestamp,
        type,
        properties,
        quickReplies,
        actions,
        audioUrl,
        intent,
        role,
        confidence,
        language,
        errorMessage,
        isRead,
      ];
}

/// Session de conversation
class ChatSession extends Equatable {
  final String sessionId;
  final String title;
  final DateTime createdAt;
  final DateTime lastMessageAt;
  final int messageCount;
  final String? language;

  const ChatSession({
    required this.sessionId,
    required this.title,
    required this.createdAt,
    required this.lastMessageAt,
    this.messageCount = 0,
    this.language,
  });

  factory ChatSession.fromJson(Map<String, dynamic> json) {
    return ChatSession(
      sessionId: json['sessionId'] as String,
      title: json['title'] as String? ?? 'Conversation',
      createdAt: DateTime.parse(json['createdAt'] as String),
      lastMessageAt: DateTime.parse(json['lastMessageAt'] as String),
      messageCount: json['messageCount'] as int? ?? 0,
      language: json['language'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'sessionId': sessionId,
        'title': title,
        'createdAt': createdAt.toIso8601String(),
        'lastMessageAt': lastMessageAt.toIso8601String(),
        'messageCount': messageCount,
        'language': language,
      };

  ChatSession copyWith({
    String? sessionId,
    String? title,
    DateTime? createdAt,
    DateTime? lastMessageAt,
    int? messageCount,
    String? language,
  }) {
    return ChatSession(
      sessionId: sessionId ?? this.sessionId,
      title: title ?? this.title,
      createdAt: createdAt ?? this.createdAt,
      lastMessageAt: lastMessageAt ?? this.lastMessageAt,
      messageCount: messageCount ?? this.messageCount,
      language: language ?? this.language,
    );
  }

  @override
  List<Object?> get props =>
      [sessionId, title, createdAt, lastMessageAt, messageCount, language];
}
