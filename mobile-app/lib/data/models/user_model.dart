import '../../core/utils/media_url_utils.dart';
import '../../domain/entities/user.dart';

class UserModel extends User {
  const UserModel({
    required super.id,
    required super.name,
    required super.email,
    required super.role,
    super.phoneNumber,
    super.whatsappNumber,
    super.city,
    super.isVerified,
    super.preferredCity,
    super.minBudget,
    super.maxBudget,
    super.createdAt,
    super.updatedAt,
    super.firstNameArabic,
    super.lastNameArabic,
    super.firstNameLatin,
    super.lastNameLatin,
    super.fullName,
    super.cin,
    super.cinImageUrl,
    super.verifiedAt,
    super.avatar,
    super.isBanned,
    super.bannedAt,
    super.banReason,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    fixMediaUrlsInJson(json);
    return UserModel(
      id: json['id'] as int,
      name: json['name'] as String,
      email: json['email'] as String,
      role: json['role'] as String,
      phoneNumber: json['phoneNumber'] as String?,
      whatsappNumber: json['whatsappNumber'] as String?,
      city: json['city'] as String?,
      isVerified: json['isVerified'] as bool?,
      preferredCity: json['preferredCity'] as String?,
      minBudget: (json['minBudget'] as num?)?.toDouble(),
      maxBudget: (json['maxBudget'] as num?)?.toDouble(),
      createdAt: json['createdAt'] as String?,
      updatedAt: json['updatedAt'] as String?,
      firstNameArabic: json['firstNameArabic'] as String?,
      lastNameArabic: json['lastNameArabic'] as String?,
      firstNameLatin: json['firstNameLatin'] as String?,
      lastNameLatin: json['lastNameLatin'] as String?,
      fullName: json['fullName'] as String?,
      cin: json['cin'] as String?,
      cinImageUrl: json['cinImageUrl'] as String?,
      verifiedAt: json['verifiedAt'] as String?,
      avatar: json['avatar'] as String?,
      isBanned: json['isBanned'] as bool?,
      bannedAt: json['bannedAt'] as String?,
      banReason: json['banReason'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'role': role,
      'phoneNumber': phoneNumber,
      'whatsappNumber': whatsappNumber,
      'city': city,
      'isVerified': isVerified,
      'preferredCity': preferredCity,
      'minBudget': minBudget,
      'maxBudget': maxBudget,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
      'firstNameArabic': firstNameArabic,
      'lastNameArabic': lastNameArabic,
      'firstNameLatin': firstNameLatin,
      'lastNameLatin': lastNameLatin,
      'fullName': fullName,
      'cin': cin,
      'cinImageUrl': cinImageUrl,
      'verifiedAt': verifiedAt,
      'avatar': avatar,
      'isBanned': isBanned,
      'bannedAt': bannedAt,
      'banReason': banReason,
    };
  }
}
