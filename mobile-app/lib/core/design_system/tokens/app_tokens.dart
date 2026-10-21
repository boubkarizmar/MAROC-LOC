import 'package:flutter/material.dart';

/// MAROC-LOC Design Tokens
/// Single source of truth for colors, spacing, radius, shadows
class AppTokens {
  AppTokens._();

  // ==================== PRIMARY ====================
  static const Color primary50 = Color(0xFFF0FDF9);
  static const Color primary100 = Color(0xFFCCFBEF);
  static const Color primary200 = Color(0xFF99F6E0);
  static const Color primary300 = Color(0xFF5EEAD4);
  static const Color primary400 = Color(0xFF2DD4BF);
  static const Color primary500 = Color(0xFF0D9488);
  static const Color primary600 = Color(0xFF0F766E);
  static const Color primary700 = Color(0xFF115E59);
  static const Color primary800 = Color(0xFF134E4A);
  static const Color primary900 = Color(0xFF042F2E);

  // ==================== GOLD ====================
  static const Color gold50 = Color(0xFFFDF9F0);
  static const Color gold100 = Color(0xFFFAF0D9);
  static const Color gold200 = Color(0xFFF5E2B3);
  static const Color gold300 = Color(0xFFEDCD82);
  static const Color gold400 = Color(0xFFD4AF37);
  static const Color gold500 = Color(0xFFC8A96B);
  static const Color gold600 = Color(0xFFA68B4B);
  static const Color gold700 = Color(0xFF8A733D);

  // ==================== TERRACOTTA ====================
  static const Color terracotta400 = Color(0xFFD4856A);
  static const Color terracotta500 = Color(0xFFB65F3C);
  static const Color terracotta600 = Color(0xFF964D2F);

  // ==================== SAND ====================
  static const Color sand50 = Color(0xFFFDFBF7);
  static const Color sand100 = Color(0xFFFDF8F0);
  static const Color sand200 = Color(0xFFF5E6D3);

  // ==================== ATLAS ====================
  static const Color atlas500 = Color(0xFF3A6D8C);
  static const Color atlas600 = Color(0xFF2D556E);

  // ==================== GRAY ====================
  static const Color gray50 = Color(0xFFF8FAFC);
  static const Color gray100 = Color(0xFFF1F5F9);
  static const Color gray200 = Color(0xFFE2E8F0);
  static const Color gray300 = Color(0xFFCBD5E1);
  static const Color gray400 = Color(0xFF94A3B8);
  static const Color gray500 = Color(0xFF64748B);
  static const Color gray600 = Color(0xFF475569);
  static const Color gray700 = Color(0xFF334155);
  static const Color gray800 = Color(0xFF1E293B);
  static const Color gray900 = Color(0xFF0F172A);

  // ==================== SEMANTIC ====================
  static const Color success50 = Color(0xFFF0FDF4);
  static const Color success500 = Color(0xFF22C55E);
  static const Color success600 = Color(0xFF16A34A);
  static const Color warning50 = Color(0xFFFFFBEB);
  static const Color warning500 = Color(0xFFF59E0B);
  static const Color warning600 = Color(0xFFD97706);
  static const Color error50 = Color(0xFFFEF2F2);
  static const Color error400 = Color(0xFFF87171);
  static const Color error500 = Color(0xFFEF4444);
  static const Color error600 = Color(0xFFDC2626);
  static const Color info50 = Color(0xFFEFF6FF);
  static const Color info500 = Color(0xFF3B82F6);

  // ==================== GRADIENT ACCENTS ====================
  static const Color emerald500 = Color(0xFF10B981);
  static const Color emerald600 = Color(0xFF059669);
  static const Color indigo500 = Color(0xFF6366F1);
  static const Color orange500 = Color(0xFFF97316);
  static const Color rose500 = Color(0xFFF43F5E);
  static const Color pink500 = Color(0xFFEC4899);
  static const Color violet500 = Color(0xFF8B5CF6);
  static const Color purple500 = Color(0xFFA855F7);
  static const Color cyan500 = Color(0xFF06B6D4);
  static const Color fuchsia500 = Color(0xFFD946EF);

  // ==================== DARK MODE ====================
  static const Color darkBg = Color(0xFF0A0F1C);
  static const Color darkSurface = Color(0xFF141B2D);
  static const Color darkSurfaceElevated = Color(0xFF1E2740);
  static const Color darkBorder = Color(0xFF2A3655);

  // ==================== BRAND COLORS ====================
  static const Color whatsappBrand = Color(0xFF25D366);

  // ==================== MEDAL COLORS ====================
  static const Color medalGold = Color(0xFFFFD700);
  static const Color medalSilver = Color(0xFFC0C0C0);
  static const Color medalBronze = Color(0xFFCD7F32);

  // ==================== SPACING ====================
  static const double space0 = 0;
  static const double space1 = 4;
  static const double space2 = 8;
  static const double space3 = 12;
  static const double space4 = 16;
  static const double space5 = 20;
  static const double space6 = 24;
  static const double space8 = 32;
  static const double space10 = 40;
  static const double space12 = 48;
  static const double space16 = 64;
  static const double space20 = 80;

  // ==================== RADIUS ====================
  static const double radiusNone = 0;
  static const double radiusSm = 6;
  static const double radiusMd = 10;
  static const double radiusLg = 14;
  static const double radiusXl = 20;
  static const double radius2xl = 28;
  static const double radiusFull = 9999;

  // ==================== DURATION ====================
  static const Duration durationInstant = Duration(milliseconds: 75);
  static const Duration durationFast = Duration(milliseconds: 150);
  static const Duration durationNormal = Duration(milliseconds: 250);
  static const Duration durationSlow = Duration(milliseconds: 350);
  static const Duration durationSlower = Duration(milliseconds: 500);

  // ==================== SHADOWS ====================
  static List<BoxShadow> shadowXs(BuildContext context) => [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.04),
          blurRadius: 2,
          offset: const Offset(0, 1),
        ),
      ];

  static List<BoxShadow> shadowSm(BuildContext context) => [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.08),
          blurRadius: 3,
          offset: const Offset(0, 1),
        ),
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.04),
          blurRadius: 2,
          offset: const Offset(0, 1),
        ),
      ];

  static List<BoxShadow> shadowMd(BuildContext context) => [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.08),
          blurRadius: 6,
          offset: const Offset(0, 4),
        ),
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.04),
          blurRadius: 4,
          offset: const Offset(0, 2),
        ),
      ];

  static List<BoxShadow> shadowLg(BuildContext context) => [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.08),
          blurRadius: 15,
          offset: const Offset(0, 10),
        ),
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.04),
          blurRadius: 6,
          offset: const Offset(0, 4),
        ),
      ];

  static List<BoxShadow> shadowGold(BuildContext context) => [
        BoxShadow(
          color: gold500.withValues(alpha: 0.22),
          blurRadius: 55,
          offset: const Offset(0, 18),
        ),
      ];

  static List<BoxShadow> shadowPrimary(BuildContext context) => [
        BoxShadow(
          color: primary500.withValues(alpha: 0.14),
          blurRadius: 80,
          offset: const Offset(0, 24),
        ),
      ];

  static List<BoxShadow> shadowCard(BuildContext context) => [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.06),
          blurRadius: 12,
          offset: const Offset(0, 4),
        ),
      ];

  static List<BoxShadow> shadowCardHover(BuildContext context) => [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.10),
          blurRadius: 20,
          offset: const Offset(0, 8),
        ),
      ];
}
