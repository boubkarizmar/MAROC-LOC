class MessageModel {
  final int id;
  final int senderId;
  final String senderName;
  final String? senderRole;
  final int receiverId;
  final String receiverName;
  final String? receiverRole;
  final String content;
  final bool isRead;
  final String? timestamp;
  final String? createdAt;
  final int? propertyId;
  final String? propertyTitle;

  const MessageModel({
    required this.id,
    required this.senderId,
    required this.senderName,
    this.senderRole,
    required this.receiverId,
    required this.receiverName,
    this.receiverRole,
    required this.content,
    required this.isRead,
    this.timestamp,
    this.createdAt,
    this.propertyId,
    this.propertyTitle,
  });

  factory MessageModel.fromJson(Map<String, dynamic> json) {
    return MessageModel(
      id: _asInt(json['id']) ?? 0,
      senderId: _asInt(json['senderId']) ?? 0,
      senderName: json['senderName'] as String? ?? 'Inconnu',
      senderRole: json['senderRole'] as String?,
      receiverId: _asInt(json['receiverId']) ?? 0,
      receiverName: json['receiverName'] as String? ?? 'Inconnu',
      receiverRole: json['receiverRole'] as String?,
      content: json['content'] as String? ?? '',
      isRead: json['isRead'] as bool? ?? false,
      timestamp: json['timestamp'] as String?,
      createdAt: json['createdAt'] as String?,
      propertyId: _asInt(json['propertyId']),
      propertyTitle: json['propertyTitle'] as String?,
    );
  }

  static int? _asInt(dynamic value) {
    if (value == null) return null;
    if (value is int) return value;
    if (value is double) return value.toInt();
    if (value is String) return int.tryParse(value);
    return null;
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'senderId': senderId,
      'senderName': senderName,
      if (senderRole != null) 'senderRole': senderRole,
      'receiverId': receiverId,
      'receiverName': receiverName,
      if (receiverRole != null) 'receiverRole': receiverRole,
      'content': content,
      'isRead': isRead,
      'timestamp': timestamp,
      'createdAt': createdAt,
      'propertyId': propertyId,
      'propertyTitle': propertyTitle,
    };
  }

  MessageModel copyWith({
    int? id,
    int? senderId,
    String? senderName,
    String? senderRole,
    int? receiverId,
    String? receiverName,
    String? receiverRole,
    String? content,
    bool? isRead,
    String? timestamp,
    String? createdAt,
    int? propertyId,
    String? propertyTitle,
  }) {
    return MessageModel(
      id: id ?? this.id,
      senderId: senderId ?? this.senderId,
      senderName: senderName ?? this.senderName,
      senderRole: senderRole ?? this.senderRole,
      receiverId: receiverId ?? this.receiverId,
      receiverName: receiverName ?? this.receiverName,
      receiverRole: receiverRole ?? this.receiverRole,
      content: content ?? this.content,
      isRead: isRead ?? this.isRead,
      timestamp: timestamp ?? this.timestamp,
      createdAt: createdAt ?? this.createdAt,
      propertyId: propertyId ?? this.propertyId,
      propertyTitle: propertyTitle ?? this.propertyTitle,
    );
  }

  /// Deterministic room id shared with the React client.
  static int roomIdFor(int userId, int partnerId) {
    final a = userId < partnerId ? userId : partnerId;
    final b = userId < partnerId ? partnerId : userId;
    return a * 100000 + b;
  }
}

class ConversationModel {
  final int partnerId;
  final String partnerName;
  final String? partnerAvatar;
  final String? partnerRole;
  final String lastMessage;
  final String? lastMessageDate;
  final int unreadCount;
  final int? propertyId;
  final String? propertyTitle;

  const ConversationModel({
    required this.partnerId,
    required this.partnerName,
    this.partnerAvatar,
    this.partnerRole,
    required this.lastMessage,
    this.lastMessageDate,
    required this.unreadCount,
    this.propertyId,
    this.propertyTitle,
  });

  factory ConversationModel.fromJson(Map<String, dynamic> json) {
    return ConversationModel(
      partnerId: MessageModel._asInt(json['partnerId']) ?? 0,
      partnerName: json['partnerName'] as String? ?? 'Inconnu',
      partnerAvatar: json['partnerAvatar'] as String?,
      partnerRole: json['partnerRole'] as String?,
      lastMessage: json['lastMessage'] as String? ?? '',
      lastMessageDate: json['lastMessageDate'] as String?,
      unreadCount: MessageModel._asInt(json['unreadCount']) ?? 0,
      propertyId: MessageModel._asInt(json['propertyId']),
      propertyTitle: json['propertyTitle'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'partnerId': partnerId,
        'partnerName': partnerName,
        'partnerAvatar': partnerAvatar,
        'partnerRole': partnerRole,
        'lastMessage': lastMessage,
        'lastMessageDate': lastMessageDate,
        'unreadCount': unreadCount,
        'propertyId': propertyId,
        'propertyTitle': propertyTitle,
      };

  ConversationModel copyWith({
    int? partnerId,
    String? partnerName,
    String? partnerAvatar,
    String? partnerRole,
    String? lastMessage,
    String? lastMessageDate,
    int? unreadCount,
    int? propertyId,
    String? propertyTitle,
  }) {
    return ConversationModel(
      partnerId: partnerId ?? this.partnerId,
      partnerName: partnerName ?? this.partnerName,
      partnerAvatar: partnerAvatar ?? this.partnerAvatar,
      partnerRole: partnerRole ?? this.partnerRole,
      lastMessage: lastMessage ?? this.lastMessage,
      lastMessageDate: lastMessageDate ?? this.lastMessageDate,
      unreadCount: unreadCount ?? this.unreadCount,
      propertyId: propertyId ?? this.propertyId,
      propertyTitle: propertyTitle ?? this.propertyTitle,
    );
  }
}
