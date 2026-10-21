import '../../core/utils/media_url_utils.dart';
import 'property_model.dart';

class AdModel {
  final int id;
  final String title;
  final String description;
  final String? imageUrl;
  final String? videoUrl;
  final String type;
  final String plan;
  final int? propertyId;
  final List<int>? propertyIds;
  final bool isActive;
  final double? budget;
  final String? startDate;
  final String? endDate;
  final int? createdByUserId;
  final String? createdByUserEmail;
  final int clicks;
  final int views;
  final String status;
  final String? targetUrl;
  final String? slot;
  final int priority;
  final String? createdAt;
  final String? updatedAt;
  final PropertyModel? property;

  const AdModel({
    required this.id,
    required this.title,
    required this.description,
    this.imageUrl,
    this.videoUrl,
    required this.type,
    required this.plan,
    this.propertyId,
    this.propertyIds,
    this.isActive = false,
    this.budget,
    this.startDate,
    this.endDate,
    this.createdByUserId,
    this.createdByUserEmail,
    this.clicks = 0,
    this.views = 0,
    this.status = 'PENDING',
    this.targetUrl,
    this.slot,
    this.priority = 0,
    this.createdAt,
    this.updatedAt,
    this.property,
  });

  factory AdModel.fromJson(Map<String, dynamic> json) {
    fixMediaUrlsInJson(json);
    return AdModel(
      id: json['id'] as int,
      title: json['title'] as String,
      description: json['description'] as String,
      imageUrl: json['imageUrl'] as String?,
      videoUrl: json['videoUrl'] as String?,
      type: json['type'] as String? ?? 'BOOST_PUBLICATION',
      plan: json['plan'] as String? ?? 'BOOST_BASIC',
      propertyId: json['propertyId'] as int?,
      propertyIds: (json['propertyIds'] as List<dynamic>?)?.cast<int>(),
      isActive: json['isActive'] as bool? ?? false,
      budget: (json['budget'] as num?)?.toDouble(),
      startDate: json['startDate'] as String?,
      endDate: json['endDate'] as String?,
      createdByUserId: json['createdByUserId'] as int?,
      createdByUserEmail: json['createdByUserEmail'] as String?,
      clicks: json['clicks'] as int? ?? 0,
      views: json['views'] as int? ?? 0,
      status: json['status'] as String? ?? 'PENDING',
      targetUrl: json['targetUrl'] as String?,
      slot: json['slot'] as String?,
      priority: json['priority'] as int? ?? 0,
      createdAt: json['createdAt'] as String?,
      updatedAt: json['updatedAt'] as String?,
      property: json['property'] is Map<String, dynamic>
          ? () {
              final propertyJson =
                  Map<String, dynamic>.from(json['property'] as Map);
              fixMediaUrlsInJson(propertyJson);
              return PropertyModel.fromJson(propertyJson);
            }()
          : null,
    );
  }

  /// Returns the best available image URL for this ad, mirroring the React fallback.
  String? get resolvedImageUrl {
    if (imageUrl != null && imageUrl!.isNotEmpty) return imageUrl;
    return property?.coverImage;
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'imageUrl': imageUrl,
      'videoUrl': videoUrl,
      'type': type,
      'plan': plan,
      'propertyId': propertyId,
      'propertyIds': propertyIds,
      'isActive': isActive,
      'budget': budget,
      'startDate': startDate,
      'endDate': endDate,
      'createdByUserId': createdByUserId,
      'createdByUserEmail': createdByUserEmail,
      'clicks': clicks,
      'views': views,
      'status': status,
      'targetUrl': targetUrl,
      'slot': slot,
      'priority': priority,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
      'property': property?.toJson(),
    };
  }
}
