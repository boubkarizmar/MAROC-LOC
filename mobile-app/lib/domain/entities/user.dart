import 'package:equatable/equatable.dart';

class User extends Equatable {
  final int id;
  final String name;
  final String email;
  final String role;
  final String? phoneNumber;
  final String? whatsappNumber;
  final String? city;
  final bool? isVerified;
  final String? preferredCity;
  final double? minBudget;
  final double? maxBudget;
  final String? createdAt;
  final String? updatedAt;

  // Trust & verification fields
  final String? firstNameArabic;
  final String? lastNameArabic;
  final String? firstNameLatin;
  final String? lastNameLatin;
  final String? fullName;
  final String? cin;
  final String? cinImageUrl;
  final String? verifiedAt;
  final String? avatar;

  // Ban fields
  final bool? isBanned;
  final String? bannedAt;
  final String? banReason;

  const User({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.phoneNumber,
    this.whatsappNumber,
    this.city,
    this.isVerified,
    this.preferredCity,
    this.minBudget,
    this.maxBudget,
    this.createdAt,
    this.updatedAt,
    this.firstNameArabic,
    this.lastNameArabic,
    this.firstNameLatin,
    this.lastNameLatin,
    this.fullName,
    this.cin,
    this.cinImageUrl,
    this.verifiedAt,
    this.avatar,
    this.isBanned,
    this.bannedAt,
    this.banReason,
  });

  bool get isAdmin => role == 'ADMIN';
  bool get isProprietaire => role == 'PROPRIETAIRE';
  bool get isLocataire => role == 'LOCATAIRE';
  bool get isActive => !(isBanned ?? false);

  @override
  List<Object?> get props => [
        id,
        name,
        email,
        role,
        phoneNumber,
        whatsappNumber,
        city,
        isVerified,
        preferredCity,
        minBudget,
        maxBudget,
        createdAt,
        updatedAt,
        firstNameArabic,
        lastNameArabic,
        firstNameLatin,
        lastNameLatin,
        fullName,
        cin,
        cinImageUrl,
        verifiedAt,
        avatar,
        isBanned,
        bannedAt,
        banReason,
      ];
}
