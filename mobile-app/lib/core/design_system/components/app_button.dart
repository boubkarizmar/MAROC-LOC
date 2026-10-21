import 'package:flutter/material.dart';
import '../tokens/app_tokens.dart';

enum AppButtonVariant { primary, secondary, ghost, gold, danger, outlined }

enum AppButtonSize { small, medium, large }

class AppButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final AppButtonVariant variant;
  final AppButtonSize size;
  final bool isLoading;
  final Widget? leading;
  final Widget? trailing;
  final bool fullWidth;

  const AppButton({
    super.key,
    required this.label,
    this.onPressed,
    this.variant = AppButtonVariant.primary,
    this.size = AppButtonSize.medium,
    this.isLoading = false,
    this.leading,
    this.trailing,
    this.fullWidth = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDisabled = onPressed == null || isLoading;

    return AnimatedScale(
      scale: isDisabled ? 1.0 : 1.0,
      duration: const Duration(milliseconds: 150),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        width: fullWidth ? double.infinity : null,
        child: ElevatedButton(
          onPressed: isDisabled ? null : onPressed,
          style: _buildStyle(theme),
          child: _buildContent(theme),
        ),
      ),
    );
  }

  ButtonStyle _buildStyle(ThemeData theme) {
    final colorScheme = theme.colorScheme;

    final padding = switch (size) {
      AppButtonSize.small =>
        const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      AppButtonSize.medium =>
        const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
      AppButtonSize.large =>
        const EdgeInsets.symmetric(horizontal: 32, vertical: 18),
    };

    final borderRadius = BorderRadius.circular(AppTokens.radiusMd);

    return switch (variant) {
      AppButtonVariant.primary => ElevatedButton.styleFrom(
          backgroundColor: colorScheme.primary,
          foregroundColor: colorScheme.onPrimary,
          elevation: 0,
          padding: padding,
          shape: RoundedRectangleBorder(borderRadius: borderRadius),
          textStyle: theme.textTheme.labelLarge
              ?.copyWith(color: colorScheme.onPrimary),
          shadowColor: colorScheme.primary.withValues(alpha: 0.3),
        ),
      AppButtonVariant.secondary => ElevatedButton.styleFrom(
          backgroundColor: colorScheme.surfaceContainerHighest,
          foregroundColor: colorScheme.onSurface,
          elevation: 0,
          padding: padding,
          shape: RoundedRectangleBorder(
            borderRadius: borderRadius,
            side: BorderSide(color: colorScheme.outlineVariant),
          ),
          textStyle: theme.textTheme.labelLarge,
        ),
      AppButtonVariant.ghost => TextButton.styleFrom(
          foregroundColor: colorScheme.primary,
          padding: padding,
          shape: RoundedRectangleBorder(borderRadius: borderRadius),
          textStyle: theme.textTheme.labelLarge,
        ),
      AppButtonVariant.gold => ElevatedButton.styleFrom(
          backgroundColor: AppTokens.gold500,
          foregroundColor: colorScheme.onPrimary,
          elevation: 0,
          padding: padding,
          shape: RoundedRectangleBorder(borderRadius: borderRadius),
          textStyle: theme.textTheme.labelLarge
              ?.copyWith(color: colorScheme.onPrimary),
          shadowColor: AppTokens.gold500.withValues(alpha: 0.3),
        ),
      AppButtonVariant.danger => ElevatedButton.styleFrom(
          backgroundColor: colorScheme.error,
          foregroundColor: colorScheme.onError,
          elevation: 0,
          padding: padding,
          shape: RoundedRectangleBorder(borderRadius: borderRadius),
          textStyle:
              theme.textTheme.labelLarge?.copyWith(color: colorScheme.onError),
        ),
      AppButtonVariant.outlined => ElevatedButton.styleFrom(
          backgroundColor: theme.colorScheme.surface.withValues(alpha: 0),
          foregroundColor: colorScheme.primary,
          elevation: 0,
          padding: padding,
          shape: RoundedRectangleBorder(
            borderRadius: borderRadius,
            side: BorderSide(color: colorScheme.primary, width: 1.5),
          ),
          textStyle: theme.textTheme.labelLarge,
        ),
    };
  }

  Widget _buildContent(ThemeData theme) {
    final colorScheme = theme.colorScheme;

    if (isLoading) {
      return SizedBox(
        height: 20,
        width: 20,
        child: CircularProgressIndicator(
          strokeWidth: 2.5,
          valueColor: AlwaysStoppedAnimation<Color>(
            switch (variant) {
              AppButtonVariant.ghost ||
              AppButtonVariant.outlined =>
                colorScheme.primary,
              AppButtonVariant.gold => colorScheme.onPrimary,
              _ => colorScheme.onPrimary,
            },
          ),
        ),
      );
    }

    return Row(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (leading != null) ...[
          leading!,
          const SizedBox(width: 8),
        ],
        Text(label),
        if (trailing != null) ...[
          const SizedBox(width: 8),
          trailing!,
        ],
      ],
    );
  }
}
