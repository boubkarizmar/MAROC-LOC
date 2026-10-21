import 'package:flutter/material.dart';

/// MAROC-LOC Typography System
/// Synchronized with frontend/src/design-system/typography.ts
class AppTypography {
  AppTypography._();

  static const String fontFamilyLatin = 'Inter';
  static const String fontFamilyArabic = 'Cairo';

  static String fontFamily(bool isArabic) =>
      isArabic ? fontFamilyArabic : fontFamilyLatin;

  // ========== DISPLAY ==========
  static TextStyle displayLarge({bool isArabic = false}) => TextStyle(
        fontFamily: fontFamily(isArabic),
        fontSize: 56,
        fontWeight: FontWeight.w800,
        height: 1.1,
        letterSpacing: -0.02,
      );

  static TextStyle displayMedium({bool isArabic = false}) => TextStyle(
        fontFamily: fontFamily(isArabic),
        fontSize: 40,
        fontWeight: FontWeight.w700,
        height: 1.2,
        letterSpacing: -0.02,
      );

  static TextStyle displaySmall({bool isArabic = false}) => TextStyle(
        fontFamily: fontFamily(isArabic),
        fontSize: 32,
        fontWeight: FontWeight.w700,
        height: 1.25,
        letterSpacing: -0.01,
      );

  // ========== HEADLINE ==========
  static TextStyle headlineLarge({bool isArabic = false}) => TextStyle(
        fontFamily: fontFamily(isArabic),
        fontSize: 24,
        fontWeight: FontWeight.w600,
        height: 1.3,
        letterSpacing: -0.01,
      );

  static TextStyle headlineMedium({bool isArabic = false}) => TextStyle(
        fontFamily: fontFamily(isArabic),
        fontSize: 20,
        fontWeight: FontWeight.w600,
        height: 1.35,
      );

  static TextStyle headlineSmall({bool isArabic = false}) => TextStyle(
        fontFamily: fontFamily(isArabic),
        fontSize: 18,
        fontWeight: FontWeight.w600,
        height: 1.4,
      );

  // ========== TITLE ==========
  static TextStyle titleLarge({bool isArabic = false}) => TextStyle(
        fontFamily: fontFamily(isArabic),
        fontSize: 16,
        fontWeight: FontWeight.w600,
        height: 1.4,
        letterSpacing: 0.01,
      );

  static TextStyle titleMedium({bool isArabic = false}) => TextStyle(
        fontFamily: fontFamily(isArabic),
        fontSize: 14,
        fontWeight: FontWeight.w600,
        height: 1.4,
      );

  // ========== BODY ==========
  static TextStyle bodyLarge({bool isArabic = false}) => TextStyle(
        fontFamily: fontFamily(isArabic),
        fontSize: 18,
        fontWeight: FontWeight.w400,
        height: 1.6,
      );

  static TextStyle bodyMedium({bool isArabic = false}) => TextStyle(
        fontFamily: fontFamily(isArabic),
        fontSize: 16,
        fontWeight: FontWeight.w400,
        height: 1.6,
      );

  static TextStyle bodySmall({bool isArabic = false}) => TextStyle(
        fontFamily: fontFamily(isArabic),
        fontSize: 14,
        fontWeight: FontWeight.w400,
        height: 1.5,
        letterSpacing: 0.01,
      );

  // ========== LABEL ==========
  static TextStyle labelLarge({bool isArabic = false}) => TextStyle(
        fontFamily: fontFamily(isArabic),
        fontSize: 14,
        fontWeight: FontWeight.w600,
        height: 1,
        letterSpacing: 0.02,
      );

  static TextStyle labelMedium({bool isArabic = false}) => TextStyle(
        fontFamily: fontFamily(isArabic),
        fontSize: 12,
        fontWeight: FontWeight.w500,
        height: 1.4,
        letterSpacing: 0.02,
      );

  static TextStyle labelSmall({bool isArabic = false}) => TextStyle(
        fontFamily: fontFamily(isArabic),
        fontSize: 11,
        fontWeight: FontWeight.w700,
        height: 1,
        letterSpacing: 0.08,
      );

  // ========== SPECIAL ==========
  static TextStyle overline({bool isArabic = false}) => TextStyle(
        fontFamily: fontFamily(isArabic),
        fontSize: 11,
        fontWeight: FontWeight.w800,
        height: 1,
        letterSpacing: 0.22,
      );

  static TextStyle price({bool isArabic = false}) => TextStyle(
        fontFamily: fontFamily(isArabic),
        fontSize: 24,
        fontWeight: FontWeight.w800,
        height: 1.1,
        letterSpacing: -0.02,
      );

  static TextStyle score({bool isArabic = false}) => TextStyle(
        fontFamily: fontFamily(isArabic),
        fontSize: 14,
        fontWeight: FontWeight.w800,
        height: 1,
      );
}
