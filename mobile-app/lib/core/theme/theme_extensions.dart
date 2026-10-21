import 'package:flutter/material.dart';
import 'app_theme.dart';

/// Theme-aware helpers that derive colors from the active [ColorScheme]
/// instead of hard-coding light/dark values.
extension ThemeContext on BuildContext {
  ColorScheme get colors => Theme.of(this).colorScheme;
  TextTheme get textTheme => Theme.of(this).textTheme;
  bool get isDark => Theme.of(this).brightness == Brightness.dark;

  /// Surface color for cards and elevated containers.
  Color get cardColor => colors.surface;

  /// Background color for screens and root layouts.
  Color get backgroundColor => colors.surfaceContainerLowest;

  /// Primary container surface (e.g. bottom sheets, dialogs).
  Color get surfaceColor => colors.surfaceContainerLow;

  /// Color for containers that sit above cards.
  Color get surfaceContainerColor => colors.surfaceContainer;

  /// Highest emphasis surface (e.g. input fields in light mode).
  Color get surfaceContainerHighestColor => colors.surfaceContainerHighest;

  Color get textPrimary => colors.onSurface;
  Color get textSecondary => colors.onSurfaceVariant;
  Color get textMuted => colors.outline;
  Color get borderColor => colors.outlineVariant;

  /// Shimmer placeholder colors derived from surface tints.
  Color get shimmerBase =>
      colors.surfaceContainerHighest.withValues(alpha: isDark ? 0.5 : 0.8);
  Color get shimmerHighlight =>
      colors.surfaceContainerHighest.withValues(alpha: isDark ? 0.8 : 0.5);

  /// Semantic helpers.
  Color get successColor => AppTheme.success500;
  Color get errorColor => AppTheme.error500;
  Color get warningColor => AppTheme.warning500;
}
