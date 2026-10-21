class SiteReviewModel {
  final int id;
  final int rating;
  final String comment;
  final String? userName;
  final String? userEmail;
  final String status;
  final DateTime createdAt;

  SiteReviewModel({
    required this.id,
    required this.rating,
    required this.comment,
    this.userName,
    this.userEmail,
    required this.status,
    required this.createdAt,
  });

  factory SiteReviewModel.fromJson(Map<String, dynamic> json) {
    return SiteReviewModel(
      id: json['id'] ?? 0,
      rating: json['rating'] ?? 0,
      comment: json['comment'] ?? '',
      userName: json['userName'] as String?,
      userEmail: json['userEmail'] as String?,
      status: json['status'] ?? 'APPROVED',
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
    );
  }
}
