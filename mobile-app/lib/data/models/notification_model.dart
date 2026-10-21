class NotificationModel {
  final int id;
  final String title;
  final String message;
  final String type;
  final String priority;
  final String? icon;
  final DateTime createdAt;
  final DateTime? readAt;
  final int? userId;
  final int? senderId;
  final String? role;
  final int? entityId;
  final String? entityType;
  final String? actionUrl;
  final String status;
  final Map<String, dynamic>? metadata;

  const NotificationModel({
    required this.id,
    required this.title,
    required this.message,
    required this.type,
    required this.priority,
    this.icon,
    required this.createdAt,
    this.readAt,
    this.userId,
    this.senderId,
    this.role,
    this.entityId,
    this.entityType,
    this.actionUrl,
    required this.status,
    this.metadata,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['id'] as int,
      title: json['title'] as String? ?? '',
      message: json['message'] as String? ?? '',
      type: json['type'] as String? ?? 'SYSTEM',
      priority: json['priority'] as String? ?? 'NORMAL',
      icon: json['icon'] as String?,
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
      readAt: json['readAt'] == null
          ? null
          : DateTime.tryParse(json['readAt'] as String),
      userId: json['userId'] as int?,
      senderId: json['senderId'] as int?,
      role: json['role'] as String?,
      entityId: json['entityId'] as int?,
      entityType: json['entityType'] as String?,
      actionUrl: json['actionUrl'] as String?,
      status: json['status'] as String? ?? 'UNREAD',
      metadata: json['metadata'] as Map<String, dynamic>?,
    );
  }

  bool get isUnread => status == 'UNREAD';

  NotificationModel copyWith({
    int? id,
    String? title,
    String? message,
    String? type,
    String? priority,
    String? icon,
    DateTime? createdAt,
    DateTime? readAt,
    int? userId,
    int? senderId,
    String? role,
    int? entityId,
    String? entityType,
    String? actionUrl,
    String? status,
    Map<String, dynamic>? metadata,
  }) {
    return NotificationModel(
      id: id ?? this.id,
      title: title ?? this.title,
      message: message ?? this.message,
      type: type ?? this.type,
      priority: priority ?? this.priority,
      icon: icon ?? this.icon,
      createdAt: createdAt ?? this.createdAt,
      readAt: readAt ?? this.readAt,
      userId: userId ?? this.userId,
      senderId: senderId ?? this.senderId,
      role: role ?? this.role,
      entityId: entityId ?? this.entityId,
      entityType: entityType ?? this.entityType,
      actionUrl: actionUrl ?? this.actionUrl,
      status: status ?? this.status,
      metadata: metadata ?? this.metadata,
    );
  }
}
