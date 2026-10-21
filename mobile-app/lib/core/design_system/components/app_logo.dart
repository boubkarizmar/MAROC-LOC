import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

import '../tokens/app_tokens.dart';

/// Responsive logo component aligned with the web frontend design system.
///
/// Variants:
/// - [AppLogo.splash] : Large circular logo with gold glow for the splash screen.
/// - [AppLogo.auth]   : Rounded-square logo with teal gradient for login/register.
/// - [AppLogo.small]  : Compact logo for AppBar / home header.
/// - [AppLogo.onboarding] : Medium logo for onboarding page.
class AppLogo extends StatelessWidget {
  final double? size;
  final BoxShape shape;
  final BoxFit fit;
  final String assetPath;
  final List<BoxShadow> Function(BuildContext)? shadowBuilder;
  final EdgeInsets? padding;

  const AppLogo._({
    super.key,
    this.size,
    this.shape = BoxShape.rectangle,
    this.fit = BoxFit.contain,
    required this.assetPath,
    this.shadowBuilder,
    this.padding,
  });

  /// Splash-screen variant : large circular glow logo.
  factory AppLogo.splash({Key? key}) => AppLogo._(
        key: key,
        assetPath: 'assets/images/logo_square.png',
        size: 220,
        shape: BoxShape.rectangle,
        fit: BoxFit.contain,
        shadowBuilder: AppTokens.shadowGold,
      );

  /// Auth-page variant : rounded square with teal gradient, matching the web login.
  factory AppLogo.auth({Key? key}) => AppLogo._(
        key: key,
        assetPath: 'assets/images/logo.png',
        shape: BoxShape.rectangle,
        fit: BoxFit.contain,
        padding: const EdgeInsets.all(8),
      );

  /// Small variant for AppBar / headers.
  factory AppLogo.small({Key? key}) => AppLogo._(
        key: key,
        assetPath: 'assets/images/logo.png',
        size: 32,
        shape: BoxShape.rectangle,
        fit: BoxFit.contain,
      );

  /// Onboarding variant : medium size.
  factory AppLogo.onboarding({Key? key}) => AppLogo._(
        key: key,
        assetPath: 'assets/images/logo.png',
        shape: BoxShape.rectangle,
        fit: BoxFit.contain,
      );

  double _resolveSize(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    if (size != null) return size!;

    switch (shape) {
      case BoxShape.circle:
        // Splash: ~28 % of screen width, clamped between 100 and 160 dp
        return (screenWidth * 0.28).clamp(100.0, 160.0);
      case BoxShape.rectangle:
        // Auth pages: responsive based on context
        if (padding != null && padding!.top == 8) {
          // Auth variant (has padding 8)
          return (screenWidth * 0.18).clamp(64.0, 96.0);
        }
        // Onboarding
        return (screenWidth * 0.25).clamp(80.0, 120.0);
    }
  }

  @override
  Widget build(BuildContext context) {
    final resolvedSize = _resolveSize(context);
    final isCircle = shape == BoxShape.circle;

    Widget image = Image.asset(
      assetPath,
      fit: fit,
      width: resolvedSize,
      height: resolvedSize,
      errorBuilder: (_, __, ___) => Container(
        color: isCircle ? AppTheme.darkSurface : AppTheme.primary50,
        child: Icon(
          Icons.home_work,
          size: resolvedSize * 0.45,
          color: isCircle ? AppTheme.gold400 : AppTheme.primary500,
        ),
      ),
    );

    // Apply padding for auth variant
    if (padding != null) {
      image = Padding(padding: padding!, child: image);
    }

    // Clip to shape
    if (isCircle) {
      image = ClipOval(child: image);
    } else if (padding != null) {
      // Auth-like rounded square
      image = ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: image,
      );
    }

    if (padding != null) {
      // Teal gradient for auth pages, matching the web login
      image = Container(
        width: resolvedSize,
        height: resolvedSize,
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [AppTheme.primary500, AppTokens.primary600],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color:
                  Theme.of(context).colorScheme.shadow.withValues(alpha: 0.08),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: image,
      );
    } else {
      image = SizedBox(
        width: resolvedSize,
        height: resolvedSize,
        child: image,
      );
    }

    // Wrap with shadow if provided (splash)
    if (shadowBuilder != null) {
      image = Container(
        width: resolvedSize,
        height: resolvedSize,
        decoration: BoxDecoration(
          shape: shape,
          boxShadow: shadowBuilder!(context),
        ),
        child: image,
      );
    }

    return Center(child: image);
  }
}
