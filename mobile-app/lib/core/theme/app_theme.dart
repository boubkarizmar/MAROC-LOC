import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

/// MAROC-LOC Premium Luxury Design System
/// Moroccan Elegance × Modern Luxury
class AppTheme {
  AppTheme._();

  // Convenience aliases for common colors
  static const Color primaryColor = primary500;
  static const Color secondaryColor = gold500;
  static const Color accentColor = terracotta500;

  // ==================== COLOR TOKENS ====================

  // Primary palette
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

  // Gold palette (Luxury accent)
  static const Color gold50 = Color(0xFFFDF9F0);
  static const Color gold100 = Color(0xFFFAF0D9);
  static const Color gold200 = Color(0xFFF5E2B3);
  static const Color gold300 = Color(0xFFEDCD82);
  static const Color gold400 = Color(0xFFD4AF37);
  static const Color gold500 = Color(0xFFC8A96B);
  static const Color gold600 = Color(0xFFA68B4B);
  static const Color gold700 = Color(0xFF8A733D);
  static const Color gold800 = Color(0xFF6E5C31);
  static const Color gold900 = Color(0xFF524526);

  // Terracotta palette
  static const Color terracotta400 = Color(0xFFD4856A);
  static const Color terracotta500 = Color(0xFFB65F3C);
  static const Color terracotta600 = Color(0xFF964D2F);

  // Sand palette
  static const Color sand50 = Color(0xFFFDFBF7);
  static const Color sand100 = Color(0xFFFDF8F0);
  static const Color sand200 = Color(0xFFF5E6D3);

  // Atlas palette
  static const Color atlas500 = Color(0xFF3A6D8C);
  static const Color atlas600 = Color(0xFF2D556E);

  // Neutral palette
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

  // Semantic colors
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

  // Dark mode (Luxury Dark)
  static const Color darkBg = Color(0xFF0A0F1C);
  static const Color darkSurface = Color(0xFF141B2D);
  static const Color darkSurfaceElevated = Color(0xFF1E2740);
  static const Color darkBorder = Color(0xFF2A3655);

  // ==================== TYPOGRAPHY ====================

  static const String fontFamilyLatin = 'Inter';
  static const String fontFamilyArabic = 'Cairo';

  static TextTheme _buildTextTheme(bool isArabic) {
    final textStyle = isArabic ? GoogleFonts.cairo : GoogleFonts.inter;

    return TextTheme(
      displayLarge: textStyle(
        fontSize: 56,
        fontWeight: FontWeight.w800,
        height: 1.1,
        letterSpacing: -0.02,
      ),
      displayMedium: textStyle(
        fontSize: 40,
        fontWeight: FontWeight.w700,
        height: 1.2,
        letterSpacing: -0.02,
      ),
      displaySmall: textStyle(
        fontSize: 32,
        fontWeight: FontWeight.w700,
        height: 1.25,
        letterSpacing: -0.01,
      ),
      headlineLarge: textStyle(
        fontSize: 24,
        fontWeight: FontWeight.w600,
        height: 1.3,
        letterSpacing: -0.01,
      ),
      headlineMedium: textStyle(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        height: 1.35,
      ),
      headlineSmall: textStyle(
        fontSize: 18,
        fontWeight: FontWeight.w600,
        height: 1.4,
      ),
      titleLarge: textStyle(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        height: 1.4,
        letterSpacing: 0.01,
      ),
      bodyLarge: textStyle(
        fontSize: 18,
        fontWeight: FontWeight.w400,
        height: 1.6,
      ),
      bodyMedium: textStyle(
        fontSize: 16,
        fontWeight: FontWeight.w400,
        height: 1.6,
      ),
      bodySmall: textStyle(
        fontSize: 14,
        fontWeight: FontWeight.w400,
        height: 1.5,
        letterSpacing: 0.01,
      ),
      labelLarge: textStyle(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        height: 1,
        letterSpacing: 0.02,
      ),
      labelMedium: textStyle(
        fontSize: 12,
        fontWeight: FontWeight.w500,
        height: 1.4,
        letterSpacing: 0.02,
      ),
      labelSmall: textStyle(
        fontSize: 11,
        fontWeight: FontWeight.w700,
        height: 1,
        letterSpacing: 0.08,
      ),
    );
  }

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

  // ==================== SHADOWS ====================

  static List<BoxShadow> get shadowXs => [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.04),
          blurRadius: 2,
          offset: const Offset(0, 1),
        ),
      ];

  static List<BoxShadow> get shadowSm => [
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

  static List<BoxShadow> get shadowMd => [
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

  static List<BoxShadow> get shadowLg => [
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

  static List<BoxShadow> get shadowXl => [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.08),
          blurRadius: 25,
          offset: const Offset(0, 20),
        ),
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.04),
          blurRadius: 10,
          offset: const Offset(0, 10),
        ),
      ];

  static List<BoxShadow> get shadow2xl => [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.25),
          blurRadius: 50,
          offset: const Offset(0, 25),
        ),
      ];

  static List<BoxShadow> get shadowGold => [
        BoxShadow(
          color: gold500.withValues(alpha: 0.22),
          blurRadius: 55,
          offset: const Offset(0, 18),
        ),
      ];

  static List<BoxShadow> get shadowGoldSm => [
        BoxShadow(
          color: gold500.withValues(alpha: 0.18),
          blurRadius: 14,
          offset: const Offset(0, 4),
        ),
      ];

  static List<BoxShadow> get shadowPrimary => [
        BoxShadow(
          color: primary500.withValues(alpha: 0.14),
          blurRadius: 80,
          offset: const Offset(0, 24),
        ),
      ];

  // ==================== THEME DATA ====================

  static ThemeData lightTheme(bool isArabic) {
    final textTheme = _buildTextTheme(isArabic);

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      fontFamily: isArabic ? fontFamilyArabic : fontFamilyLatin,
      colorScheme: const ColorScheme.light(
        primary: primary500,
        onPrimary: Colors.white,
        secondary: gold500,
        onSecondary: Colors.white,
        surface: Colors.white,
        onSurface: gray900,
        error: error500,
        onError: Colors.white,
        surfaceContainerHighest: gray100,
        outline: gray200,
      ),
      scaffoldBackgroundColor: gray50,
      textTheme: textTheme,
      appBarTheme: AppBarTheme(
        centerTitle: true,
        elevation: 0,
        scrolledUnderElevation: 0,
        backgroundColor: gray50,
        foregroundColor: gray900,
        titleTextStyle: textTheme.headlineSmall?.copyWith(color: gray900),
        systemOverlayStyle: SystemUiOverlayStyle.dark,
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radiusLg)),
        color: Colors.white,
        margin: EdgeInsets.zero,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: gold500,
          foregroundColor: gray900,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(radiusMd)),
          textStyle: textTheme.labelLarge
              ?.copyWith(color: gray900, fontWeight: FontWeight.w700),
          shadowColor: gold500.withValues(alpha: 0.3),
        ).copyWith(
          elevation: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.pressed)) return 0;
            if (states.contains(WidgetState.hovered)) return 4;
            return 2;
          }),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: primary500,
          side: const BorderSide(color: gray200),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(radiusMd)),
          textStyle: textTheme.labelLarge,
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: primary500,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(radiusMd)),
          textStyle: textTheme.labelLarge,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: gray100,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          borderSide: const BorderSide(color: gold400, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          borderSide: const BorderSide(color: error500, width: 1),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          borderSide: const BorderSide(color: error500, width: 2),
        ),
        hintStyle: textTheme.bodySmall?.copyWith(color: gray400),
        labelStyle: textTheme.bodySmall?.copyWith(color: gray600),
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: Colors.white,
        selectedItemColor: gold500,
        unselectedItemColor: gray400,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
        selectedLabelStyle: textTheme.labelMedium
            ?.copyWith(fontWeight: FontWeight.w600, color: gold500),
        unselectedLabelStyle: textTheme.labelMedium,
      ),
      chipTheme: ChipThemeData(
        backgroundColor: gray100,
        selectedColor: gold50,
        labelStyle: textTheme.labelMedium?.copyWith(color: gray700),
        secondaryLabelStyle: textTheme.labelMedium?.copyWith(color: gold600),
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radiusFull)),
        side: BorderSide.none,
      ),
      dividerTheme: DividerThemeData(
        color: gray200,
        thickness: 1,
        space: 1,
      ),
      splashColor: gold100.withValues(alpha: 0.3),
      highlightColor: gold50.withValues(alpha: 0.3),
    );
  }

  static ThemeData darkTheme(bool isArabic) {
    final textTheme = _buildTextTheme(isArabic);

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      fontFamily: isArabic ? fontFamilyArabic : fontFamilyLatin,
      colorScheme: const ColorScheme.dark(
        primary: gold400,
        onPrimary: gray900,
        secondary: gold500,
        onSecondary: gray900,
        surface: darkSurface,
        onSurface: gray50,
        error: error400,
        onError: Colors.white,
        surfaceContainerHighest: darkSurfaceElevated,
        outline: darkBorder,
      ),
      scaffoldBackgroundColor: darkBg,
      textTheme: textTheme.apply(
        bodyColor: gray50,
        displayColor: gray50,
      ),
      appBarTheme: AppBarTheme(
        centerTitle: true,
        elevation: 0,
        scrolledUnderElevation: 0,
        backgroundColor: darkBg,
        foregroundColor: gray50,
        titleTextStyle: textTheme.headlineSmall?.copyWith(color: gray50),
        systemOverlayStyle: SystemUiOverlayStyle.light,
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radiusLg)),
        color: darkSurface,
        margin: EdgeInsets.zero,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: gold500,
          foregroundColor: gray900,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(radiusMd)),
          textStyle: textTheme.labelLarge
              ?.copyWith(color: gray900, fontWeight: FontWeight.w700),
          shadowColor: gold500.withValues(alpha: 0.3),
        ).copyWith(
          elevation: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.pressed)) return 0;
            if (states.contains(WidgetState.hovered)) return 4;
            return 2;
          }),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: gold400,
          side: const BorderSide(color: darkBorder),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(radiusMd)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: darkSurface,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          borderSide: const BorderSide(color: darkBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          borderSide: const BorderSide(color: darkBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          borderSide: const BorderSide(color: gold400, width: 2),
        ),
        hintStyle: textTheme.bodySmall?.copyWith(color: gray500),
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: darkSurface,
        selectedItemColor: gold400,
        unselectedItemColor: gray500,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
        selectedLabelStyle: textTheme.labelMedium
            ?.copyWith(fontWeight: FontWeight.w600, color: gold400),
        unselectedLabelStyle: textTheme.labelMedium,
      ),
      chipTheme: ChipThemeData(
        backgroundColor: darkSurfaceElevated,
        selectedColor: gold900,
        labelStyle: textTheme.labelMedium?.copyWith(color: gray300),
        secondaryLabelStyle: textTheme.labelMedium?.copyWith(color: gold300),
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radiusFull)),
        side: BorderSide.none,
      ),
      dividerTheme: DividerThemeData(
        color: darkBorder,
        thickness: 1,
        space: 1,
      ),
      splashColor: gold700.withValues(alpha: 0.2),
      highlightColor: gold800.withValues(alpha: 0.2),
    );
  }
}
