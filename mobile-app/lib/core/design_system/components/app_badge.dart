import 'package:flutter/material.dart';
import '../tokens/app_tokens.dart';

enum AppBadgeVariant { primary, gold, success, warning, error, info, neutral }

enum AppBadgeSize { small, medium }

class AppBadge extends StatelessWidget {
  final String label;
  final AppBadgeVariant variant;
  final AppBadgeSize size;
  final bool showDot;

  const AppBadge({
    super.key,
    required this.label,
    this.variant = AppBadgeVariant.primary,
    this.size = AppBadgeSize.medium,
    this.showDot = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    final (bgColor, textColor, dotColor) = _getColors();

    final padding = size == AppBadgeSize.small
        ? const EdgeInsets.symmetric(horizontal: 8, vertical: 3)
        : const EdgeInsets.symmetric(horizontal: 10, vertical: 4);

    final textStyle = size == AppBadgeSize.small
        ? theme.textTheme.labelSmall?.copyWith(fontSize: 10)
        : theme.textTheme.labelSmall;

    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(AppTokens.radiusFull),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (showDot) ...[
            Container(
              width: 6,
              height: 6,
              decoration: BoxDecoration(
                color: dotColor,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 5),
          ],
          Text(
            label,
            style: textStyle?.copyWith(
              color: textColor,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  (Color, Color, Color) _getColors() {
    switch (variant) {
      case AppBadgeVariant.primary:
        return (
          AppTokens.primary50,
          AppTokens.primary700,
          AppTokens.primary500,
        );
      case AppBadgeVariant.gold:
        return (
          AppTokens.gold50,
          AppTokens.gold700,
          AppTokens.gold500,
        );
      case AppBadgeVariant.success:
        return (
          AppTokens.success50,
          AppTokens.success600,
          AppTokens.success500,
        );
      case AppBadgeVariant.warning:
        return (
          AppTokens.warning50,
          AppTokens.warning600,
          AppTokens.warning500,
        );
      case AppBadgeVariant.error:
        return (
          AppTokens.error50,
          AppTokens.error600,
          AppTokens.error500,
        );
      case AppBadgeVariant.info:
        return (
          AppTokens.info50,
          AppTokens.info500,
          AppTokens.info500,
        );
      case AppBadgeVariant.neutral:
        return (
          AppTokens.gray100,
          AppTokens.gray600,
          AppTokens.gray400,
        );
    }
  }
}
