import 'package:flutter/material.dart';

import '../../../core/design_system/tokens/app_tokens.dart';

/// Premium animation presets for MAROC-LOC Flutter app
class AppAnimations {
  AppAnimations._();

  // ==================== DURATIONS ====================
  static const Duration instant = Duration(milliseconds: 75);
  static const Duration fast = Duration(milliseconds: 150);
  static const Duration normal = Duration(milliseconds: 250);
  static const Duration slow = Duration(milliseconds: 350);
  static const Duration slower = Duration(milliseconds: 500);

  // ==================== CURVES ====================
  static const Curve easeDefault = Curves.easeInOut;
  static const Curve easeOut = Curves.easeOut;
  static const Curve easeIn = Curves.easeIn;
  static const Curve spring = Curves.elasticOut;
  static const Curve smooth = Curves.fastOutSlowIn;

  // ==================== PAGE TRANSITIONS ====================
  static PageRouteBuilder<T> fadeRoute<T>(Widget page) {
    return PageRouteBuilder<T>(
      pageBuilder: (context, animation, secondaryAnimation) => page,
      transitionsBuilder: (context, animation, secondaryAnimation, child) {
        return FadeTransition(
          opacity: animation.drive(CurveTween(curve: easeOut)),
          child: child,
        );
      },
      transitionDuration: slow,
    );
  }

  static PageRouteBuilder<T> slideUpRoute<T>(Widget page) {
    return PageRouteBuilder<T>(
      pageBuilder: (context, animation, secondaryAnimation) => page,
      transitionsBuilder: (context, animation, secondaryAnimation, child) {
        final offset = Tween<Offset>(
          begin: const Offset(0, 0.1),
          end: Offset.zero,
        ).animate(CurvedAnimation(
          parent: animation,
          curve: easeOut,
        ));
        return SlideTransition(
          position: offset,
          child: FadeTransition(
            opacity: animation,
            child: child,
          ),
        );
      },
      transitionDuration: slow,
    );
  }

  // ==================== WIDGET ANIMATIONS ====================
  static Widget fadeIn({
    required Widget child,
    Duration delay = Duration.zero,
    Duration duration = normal,
  }) {
    return _AnimatedFadeIn(
      delay: delay,
      duration: duration,
      child: child,
    );
  }

  static Widget slideUp({
    required Widget child,
    Duration delay = Duration.zero,
    Duration duration = normal,
  }) {
    return _AnimatedSlideUp(
      delay: delay,
      duration: duration,
      child: child,
    );
  }

  static Widget staggeredList({
    required List<Widget> children,
    Duration delay = Duration.zero,
    Duration itemDelay = const Duration(milliseconds: 80),
  }) {
    return Column(
      children: children.asMap().entries.map((entry) {
        final index = entry.key;
        final child = entry.value;
        return slideUp(
          delay: delay + (itemDelay * index),
          child: child,
        );
      }).toList(),
    );
  }
}

class _AnimatedFadeIn extends StatefulWidget {
  final Widget child;
  final Duration delay;
  final Duration duration;

  const _AnimatedFadeIn({
    required this.child,
    required this.delay,
    required this.duration,
  });

  @override
  State<_AnimatedFadeIn> createState() => _AnimatedFadeInState();
}

class _AnimatedFadeInState extends State<_AnimatedFadeIn>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: widget.duration,
      vsync: this,
    );
    _animation = CurvedAnimation(
      parent: _controller,
      curve: AppAnimations.easeOut,
    );
    Future.delayed(widget.delay, () {
      if (mounted) _controller.forward();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _animation,
      child: widget.child,
    );
  }
}

class _AnimatedSlideUp extends StatefulWidget {
  final Widget child;
  final Duration delay;
  final Duration duration;

  const _AnimatedSlideUp({
    required this.child,
    required this.delay,
    required this.duration,
  });

  @override
  State<_AnimatedSlideUp> createState() => _AnimatedSlideUpState();
}

class _AnimatedSlideUpState extends State<_AnimatedSlideUp>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<Offset> _offsetAnimation;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: widget.duration,
      vsync: this,
    );
    _offsetAnimation = Tween<Offset>(
      begin: const Offset(0, 0.15),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: AppAnimations.easeOut,
    ));
    _fadeAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(
        parent: _controller,
        curve: AppAnimations.easeOut,
      ),
    );
    Future.delayed(widget.delay, () {
      if (mounted) _controller.forward();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SlideTransition(
      position: _offsetAnimation,
      child: FadeTransition(
        opacity: _fadeAnimation,
        child: widget.child,
      ),
    );
  }
}

/// Hero-like transition wrapper
class HeroCard extends StatelessWidget {
  final String tag;
  final Widget child;

  const HeroCard({super.key, required this.tag, required this.child});

  @override
  Widget build(BuildContext context) {
    return Hero(
      tag: tag,
      flightShuttleBuilder:
          (context, animation, direction, fromContext, toContext) {
        return AnimatedBuilder(
          animation: animation,
          builder: (context, child) {
            return Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(
                  Tween<double>(begin: 14, end: 0).evaluate(animation),
                ),
                boxShadow: [
                  BoxShadow(
                    color: AppTokens.gray900.withValues(
                      alpha: Tween<double>(begin: 0.1, end: 0.3)
                          .evaluate(animation),
                    ),
                    blurRadius: 20,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: child,
            );
          },
          child: child,
        );
      },
      child: child,
    );
  }
}
