import 'package:flutter/material.dart';
import '../tokens/app_tokens.dart';

class AppShimmer extends StatefulWidget {
  final double width;
  final double height;
  final double borderRadius;
  final bool circle;

  const AppShimmer({
    super.key,
    required this.width,
    required this.height,
    this.borderRadius = AppTokens.radiusMd,
    this.circle = false,
  });

  @override
  State<AppShimmer> createState() => _AppShimmerState();
}

class _AppShimmerState extends State<AppShimmer>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    )..repeat();
    _animation = Tween<double>(begin: -1, end: 2).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Container(
          width: widget.width,
          height: widget.height,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(
              widget.circle ? widget.width / 2 : widget.borderRadius,
            ),
            gradient: LinearGradient(
              begin: Alignment(_animation.value - 1, 0),
              end: Alignment(_animation.value, 0),
              colors: isDark
                  ? [
                      AppTokens.darkSurfaceElevated,
                      AppTokens.darkBorder,
                      AppTokens.darkSurfaceElevated,
                    ]
                  : [
                      AppTokens.gray200,
                      AppTokens.gray100,
                      AppTokens.gray200,
                    ],
            ),
          ),
        );
      },
    );
  }
}

class PropertyCardShimmer extends StatelessWidget {
  const PropertyCardShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).cardTheme.color,
        borderRadius: BorderRadius.circular(AppTokens.radiusLg),
        border: Border.all(
          color: Theme.of(context).brightness == Brightness.dark
              ? AppTokens.darkBorder
              : AppTokens.gray200,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const AppShimmer(
              width: double.infinity,
              height: 180,
              borderRadius: AppTokens.radiusLg),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const AppShimmer(width: 200, height: 20),
                const SizedBox(height: 8),
                const AppShimmer(width: 140, height: 14),
                const SizedBox(height: 12),
                Row(
                  children: [
                    const AppShimmer(
                        width: 100,
                        height: 24,
                        borderRadius: AppTokens.radiusFull),
                    const SizedBox(width: 8),
                    AppShimmer(
                      width: 80,
                      height: 24,
                      borderRadius: AppTokens.radiusFull,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class PropertyListShimmer extends StatelessWidget {
  final int count;

  const PropertyListShimmer({super.key, this.count = 6});

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: count,
      separatorBuilder: (_, __) => const SizedBox(height: 16),
      itemBuilder: (_, __) => const PropertyCardShimmer(),
    );
  }
}
