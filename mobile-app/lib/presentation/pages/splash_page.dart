import 'package:go_router/go_router.dart';
import 'dart:math' show pi, cos, sin;
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../generated/l10n/app_localizations.dart';
import '../../core/theme/app_theme.dart';
import '../../core/design_system/components/app_logo.dart';
import '../../services/auth_service.dart';

import '../../core/design_system/tokens/app_tokens.dart';

class SplashPage extends StatefulWidget {
  const SplashPage({super.key});

  @override
  State<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends State<SplashPage> with TickerProviderStateMixin {
  late AnimationController _mainController;
  late AnimationController _floatController;
  // _pulseController removed – glow effect now handled by AppLogo.splash
  late AnimationController _shimmerController;

  late Animation<double> _logoScale;
  late Animation<double> _logoOpacity;
  late Animation<double> _titleSlide;
  late Animation<double> _titleOpacity;
  late Animation<double> _taglineSlide;
  late Animation<double> _taglineOpacity;
  late Animation<double> _progressValue;
  late Animation<double> _goldLineWidth;

  @override
  void initState() {
    super.initState();
    // SystemChrome calls removed to prevent Samsung gesture issues

    _mainController = AnimationController(
      duration: const Duration(milliseconds: 2800),
      vsync: this,
    );

    _floatController = AnimationController(
      duration: const Duration(seconds: 3),
      vsync: this,
    )..repeat(reverse: true);

    // Pulse glow handled inside AppLogo.splash

    _shimmerController = AnimationController(
      duration: const Duration(seconds: 3),
      vsync: this,
    )..repeat();

    // Logo appears first with scale + fade
    _logoScale = Tween<double>(begin: 0.3, end: 1.0).animate(
      CurvedAnimation(
        parent: _mainController,
        curve: const Interval(0.0, 0.35, curve: Curves.easeOutBack),
      ),
    );
    _logoOpacity = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(
        parent: _mainController,
        curve: const Interval(0.0, 0.30, curve: Curves.easeOut),
      ),
    );

    // Title slides up
    _titleSlide = Tween<double>(begin: 50, end: 0).animate(
      CurvedAnimation(
        parent: _mainController,
        curve: const Interval(0.25, 0.50, curve: Curves.easeOutCubic),
      ),
    );
    _titleOpacity = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(
        parent: _mainController,
        curve: const Interval(0.25, 0.45, curve: Curves.easeOut),
      ),
    );

    // Tagline slides up
    _taglineSlide = Tween<double>(begin: 30, end: 0).animate(
      CurvedAnimation(
        parent: _mainController,
        curve: const Interval(0.40, 0.60, curve: Curves.easeOutCubic),
      ),
    );
    _taglineOpacity = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(
        parent: _mainController,
        curve: const Interval(0.40, 0.55, curve: Curves.easeOut),
      ),
    );

    // Gold divider line
    _goldLineWidth = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(
        parent: _mainController,
        curve: const Interval(0.50, 0.75, curve: Curves.easeOutCubic),
      ),
    );

    // Progress bar
    _progressValue = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(
        parent: _mainController,
        curve: const Interval(0.55, 1.0, curve: Curves.easeInOut),
      ),
    );

    _mainController.forward();

    // Navigate after splash
    Future.delayed(const Duration(milliseconds: 3200), () async {
      if (!mounted) return;

      const storage = FlutterSecureStorage();
      final onboardingComplete =
          await storage.read(key: 'onboarding_complete') == 'true';
      final token = await AuthService().getToken();

      if (!mounted) return;

      if (token != null && token.isNotEmpty) {
        context.go('/home');
      } else if (!onboardingComplete) {
        context.go('/onboarding');
      } else {
        context.go('/login');
      }
    });
  }

  @override
  void dispose() {
    _mainController.dispose();
    _floatController.dispose();
    // _pulseController disposed with AppLogo
    _shimmerController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Scaffold(
      backgroundColor: AppTheme.darkBg,
      body: AnimatedBuilder(
        animation: _mainController,
        builder: (context, child) {
          return Stack(
            children: [
              // Luxury dark gradient background
              Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      AppTheme.darkBg,
                      AppTokens.darkBg,
                      AppTokens.darkSurface,
                    ],
                    stops: [0.0, 0.5, 1.0],
                  ),
                ),
              ),

              // Animated shimmer overlay
              AnimatedBuilder(
                animation: _shimmerController,
                builder: (context, child) {
                  return Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment(
                          -1 + _shimmerController.value * 2,
                          -1,
                        ),
                        end: Alignment(
                          -1 + _shimmerController.value * 2 + 0.5,
                          1,
                        ),
                        colors: [
                          Theme.of(context)
                              .colorScheme
                              .surface
                              .withValues(alpha: 0),
                          AppTheme.gold400.withValues(alpha: 0.03),
                          Theme.of(context)
                              .colorScheme
                              .surface
                              .withValues(alpha: 0),
                        ],
                      ),
                    ),
                  );
                },
              ),

              // Moroccan pattern overlay
              Positioned.fill(
                child: CustomPaint(
                  painter: _MoroccanPatternPainter(
                    opacity: 0.08,
                  ),
                ),
              ),

              // Floating orbs for depth
              ..._buildFloatingOrbs(),

              // Main content
              Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Spacer(flex: 3),

                    // Floating Logo
                    AnimatedBuilder(
                      animation: _floatController,
                      builder: (context, child) {
                        final floatOffset = Tween<double>(begin: -6, end: 6)
                            .evaluate(_floatController);
                        return Transform.translate(
                          offset: Offset(0, floatOffset),
                          child: child,
                        );
                      },
                      child: ScaleTransition(
                        scale: _logoScale,
                        child: FadeTransition(
                          opacity: _logoOpacity,
                          child: AppLogo.splash(),
                        ),
                      ),
                    ),

                    const SizedBox(height: 32),

                    // Title MAROC-LOC
                    Transform.translate(
                      offset: Offset(0, _titleSlide.value),
                      child: Opacity(
                        opacity: _titleOpacity.value,
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              'MAROC',
                              style: TextStyle(
                                fontSize: 36,
                                fontWeight: FontWeight.w900,
                                color: AppTokens.gray50,
                                letterSpacing: 4,
                                height: 1.1,
                                shadows: [
                                  Shadow(
                                    color:
                                        AppTokens.gray50.withValues(alpha: 0.1),
                                    blurRadius: 20,
                                  ),
                                ],
                              ),
                            ),
                            Text(
                              'LOC',
                              style: TextStyle(
                                fontSize: 36,
                                fontWeight: FontWeight.w900,
                                color: AppTheme.gold400,
                                letterSpacing: 4,
                                height: 1.1,
                                shadows: [
                                  Shadow(
                                    color:
                                        AppTheme.gold400.withValues(alpha: 0.4),
                                    blurRadius: 20,
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Gold divider line
                    SizedBox(
                      width: 120 * _goldLineWidth.value,
                      child: Container(
                        height: 2,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              Theme.of(context)
                                  .colorScheme
                                  .surface
                                  .withValues(alpha: 0),
                              AppTheme.gold400,
                              Theme.of(context)
                                  .colorScheme
                                  .surface
                                  .withValues(alpha: 0),
                            ],
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Tagline
                    Transform.translate(
                      offset: Offset(0, _taglineSlide.value),
                      child: Opacity(
                        opacity: _taglineOpacity.value,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 20,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            color: AppTheme.gold400.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: AppTheme.gold400.withValues(alpha: 0.3),
                              width: 1,
                            ),
                          ),
                          child: Text(
                            l10n.splash_tagline,
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.gold300,
                              letterSpacing: 2,
                            ),
                          ),
                        ),
                      ),
                    ),

                    const Spacer(flex: 2),

                    // Progress indicator
                    SizedBox(
                      width: 180,
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: _progressValue.value,
                          backgroundColor: Theme.of(context)
                              .colorScheme
                              .surface
                              .withValues(alpha: 0.1),
                          valueColor: const AlwaysStoppedAnimation<Color>(
                            AppTheme.gold400,
                          ),
                          minHeight: 3,
                        ),
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Loading text
                    FadeTransition(
                      opacity: _taglineOpacity,
                      child: Text(
                        _getLoadingText(_progressValue.value, l10n),
                        style: TextStyle(
                          fontSize: 11,
                          color: AppTokens.gray50.withValues(alpha: 0.4),
                          letterSpacing: 1.5,
                        ),
                      ),
                    ),

                    const SizedBox(height: 48),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  List<Widget> _buildFloatingOrbs() {
    final orbs = [
      {'size': 200.0, 'top': 80.0, 'left': -60.0, 'color': AppTheme.gold400},
      {
        'size': 160.0,
        'top': 200.0,
        'right': -40.0,
        'color': AppTheme.primary500
      },
      {'size': 120.0, 'top': 500.0, 'left': 30.0, 'color': AppTheme.gold400},
      {
        'size': 180.0,
        'top': 600.0,
        'right': -30.0,
        'color': AppTheme.primary500
      },
    ];

    return orbs.map((orb) {
      final size = orb['size'] as double;
      final top = orb['top'] as double;
      final left = orb['left'] as double?;
      final right = orb['right'] as double?;
      final color = orb['color'] as Color;

      return AnimatedBuilder(
        animation: _floatController,
        builder: (context, child) {
          final offset =
              Tween<double>(begin: -8, end: 8).evaluate(_floatController);
          return Positioned(
            top: top + offset,
            left: left,
            right: right,
            child: Container(
              width: size,
              height: size,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    color.withValues(alpha: 0.08),
                    Theme.of(context).colorScheme.surface.withValues(alpha: 0),
                  ],
                ),
              ),
            ),
          );
        },
      );
    }).toList();
  }

  String _getLoadingText(double progress, AppLocalizations l10n) {
    if (progress < 0.2) return l10n.splash_init;
    if (progress < 0.4) return l10n.splash_connecting;
    if (progress < 0.6) return l10n.splash_loading_data;
    if (progress < 0.8) return l10n.splash_preparing;
    return l10n.splash_starting;
  }
}

class _MoroccanPatternPainter extends CustomPainter {
  final double opacity;

  _MoroccanPatternPainter({required this.opacity});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppTheme.gold400.withValues(alpha: opacity)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.8;

    const spacing = 100.0;
    for (double x = 0; x < size.width + spacing; x += spacing) {
      for (double y = 0; y < size.height + spacing; y += spacing) {
        _drawZelligeStar(canvas, Offset(x, y), 16, paint);
      }
    }
  }

  void _drawZelligeStar(
      Canvas canvas, Offset center, double radius, Paint paint) {
    final path = Path();
    for (int i = 0; i < 8; i++) {
      final angle = (i * pi / 4) - pi / 2;
      final r = i % 2 == 0 ? radius : radius * 0.4;
      final x = center.dx + r * cos(angle);
      final y = center.dy + r * sin(angle);
      if (i == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }
    path.close();
    canvas.drawPath(path, paint);

    // Inner circle
    canvas.drawCircle(
      center,
      radius * 0.25,
      paint..strokeWidth = 0.5,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
