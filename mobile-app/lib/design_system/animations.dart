import 'package:flutter/material.dart';

/// MAROC-LOC Animation System
/// Synchronized with frontend/src/design-system/motion.ts
class AppAnimations {
  AppAnimations._();

  // ========== DURATIONS ==========
  static const Duration instant = Duration(milliseconds: 75);
  static const Duration fast = Duration(milliseconds: 150);
  static const Duration normal = Duration(milliseconds: 250);
  static const Duration slow = Duration(milliseconds: 350);
  static const Duration slower = Duration(milliseconds: 500);
  static const Duration cinematic = Duration(milliseconds: 800);
  static const Duration splash = Duration(milliseconds: 2500);

  // ========== CURVES ==========
  static const Curve easeOut = Curves.easeOut;
  static const Curve easeInOut = Curves.easeInOut;
  static const Curve easeOutCubic = Curves.easeOutCubic;
  static const Curve easeInOutCubic = Curves.easeInOutCubic;
  static const Curve elasticOut = Curves.elasticOut;
  static const Curve decelerate = Curves.decelerate;
  static const Curve fastOutSlowIn = Curves.fastOutSlowIn;

  // ========== PAGE TRANSITIONS ==========
  static PageRouteBuilder<T> fadeRoute<T>({
    required Widget page,
    Duration duration = const Duration(milliseconds: 300),
  }) {
    return PageRouteBuilder<T>(
      transitionDuration: duration,
      pageBuilder: (context, animation, secondaryAnimation) => page,
      transitionsBuilder: (context, animation, secondaryAnimation, child) {
        return FadeTransition(
          opacity: CurvedAnimation(parent: animation, curve: easeOut),
          child: child,
        );
      },
    );
  }

  static PageRouteBuilder<T> slideUpRoute<T>({
    required Widget page,
    Duration duration = const Duration(milliseconds: 400),
  }) {
    return PageRouteBuilder<T>(
      transitionDuration: duration,
      pageBuilder: (context, animation, secondaryAnimation) => page,
      transitionsBuilder: (context, animation, secondaryAnimation, child) {
        final offset = Tween<Offset>(
          begin: const Offset(0, 0.15),
          end: Offset.zero,
        ).animate(CurvedAnimation(parent: animation, curve: easeOutCubic));
        final fade = Tween<double>(begin: 0, end: 1).animate(
          CurvedAnimation(parent: animation, curve: easeOut),
        );
        return FadeTransition(
          opacity: fade,
          child: SlideTransition(position: offset, child: child),
        );
      },
    );
  }

  // ========== WIDGET ANIMATIONS ==========
  static Widget fadeIn({
    required Widget child,
    Duration delay = Duration.zero,
    Duration duration = const Duration(milliseconds: 400),
  }) {
    return _DelayedFadeIn(
      delay: delay,
      duration: duration,
      child: child,
    );
  }

  static Widget slideUp({
    required Widget child,
    Duration delay = Duration.zero,
    Duration duration = const Duration(milliseconds: 400),
    double offset = 30,
  }) {
    return _DelayedSlideUp(
      delay: delay,
      duration: duration,
      offset: offset,
      child: child,
    );
  }

  static Widget scaleIn({
    required Widget child,
    Duration delay = Duration.zero,
    Duration duration = const Duration(milliseconds: 400),
  }) {
    return _DelayedScaleIn(
      delay: delay,
      duration: duration,
      child: child,
    );
  }
}

// ========== INTERNAL WIDGETS ==========
class _DelayedFadeIn extends StatefulWidget {
  final Widget child;
  final Duration delay;
  final Duration duration;

  const _DelayedFadeIn({
    required this.child,
    required this.delay,
    required this.duration,
  });

  @override
  State<_DelayedFadeIn> createState() => _DelayedFadeInState();
}

class _DelayedFadeInState extends State<_DelayedFadeIn>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: widget.duration);
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
      opacity: CurvedAnimation(parent: _controller, curve: Curves.easeOut),
      child: widget.child,
    );
  }
}

class _DelayedSlideUp extends StatefulWidget {
  final Widget child;
  final Duration delay;
  final Duration duration;
  final double offset;

  const _DelayedSlideUp({
    required this.child,
    required this.delay,
    required this.duration,
    required this.offset,
  });

  @override
  State<_DelayedSlideUp> createState() => _DelayedSlideUpState();
}

class _DelayedSlideUpState extends State<_DelayedSlideUp>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: widget.duration);
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
      opacity: CurvedAnimation(parent: _controller, curve: Curves.easeOut),
      child: SlideTransition(
        position: Tween<Offset>(
          begin: Offset(0, widget.offset / 100),
          end: Offset.zero,
        ).animate(
            CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic)),
        child: widget.child,
      ),
    );
  }
}

class _DelayedScaleIn extends StatefulWidget {
  final Widget child;
  final Duration delay;
  final Duration duration;

  const _DelayedScaleIn({
    required this.child,
    required this.delay,
    required this.duration,
  });

  @override
  State<_DelayedScaleIn> createState() => _DelayedScaleInState();
}

class _DelayedScaleInState extends State<_DelayedScaleIn>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: widget.duration);
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
    return ScaleTransition(
      scale: CurvedAnimation(
        parent: _controller,
        curve: Curves.elasticOut,
      ),
      child: FadeTransition(
        opacity: CurvedAnimation(parent: _controller, curve: Curves.easeOut),
        child: widget.child,
      ),
    );
  }
}
