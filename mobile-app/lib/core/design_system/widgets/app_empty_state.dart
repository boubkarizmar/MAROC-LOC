import 'package:flutter/material.dart';
import '../tokens/app_tokens.dart';
import '../components/app_button.dart';
import '../../../generated/l10n/app_localizations.dart';

// Compatibility aliases for old naming
typedef _AppSpacing = AppTokens;
typedef _AppRadius = AppTokens;

enum EmptyStateVariant {
  properties,
  search,
  favorites,
  messages,
  notifications,
  generic,
}

class AppEmptyState extends StatelessWidget {
  final EmptyStateVariant variant;
  final String? title;
  final String? description;
  final String? actionLabel;
  final VoidCallback? onAction;
  final bool compact;

  const AppEmptyState({
    super.key,
    required this.variant,
    this.title,
    this.description,
    this.actionLabel,
    this.onAction,
    this.compact = false,
  });

  IconData get _icon {
    switch (variant) {
      case EmptyStateVariant.properties:
        return Icons.home_outlined;
      case EmptyStateVariant.search:
        return Icons.search_off_outlined;
      case EmptyStateVariant.favorites:
        return Icons.favorite_outline;
      case EmptyStateVariant.messages:
        return Icons.chat_bubble_outline;
      case EmptyStateVariant.notifications:
        return Icons.notifications_none_outlined;
      case EmptyStateVariant.generic:
        return Icons.folder_open_outlined;
    }
  }

  String _defaultTitle(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    switch (variant) {
      case EmptyStateVariant.properties:
        return l10n.empty_property_title;
      case EmptyStateVariant.search:
        return l10n.empty_search_title;
      case EmptyStateVariant.favorites:
        return l10n.favorites_empty_title;
      case EmptyStateVariant.messages:
        return l10n.messages_empty_title;
      case EmptyStateVariant.notifications:
        return l10n.empty_notifications_title;
      case EmptyStateVariant.generic:
        return l10n.empty_generic_title;
    }
  }

  String _defaultDescription(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    switch (variant) {
      case EmptyStateVariant.properties:
        return l10n.empty_property_desc;
      case EmptyStateVariant.search:
        return l10n.empty_search_desc;
      case EmptyStateVariant.favorites:
        return l10n.favorites_empty_desc;
      case EmptyStateVariant.messages:
        return l10n.messages_empty_desc;
      case EmptyStateVariant.notifications:
        return l10n.empty_notifications_desc;
      case EmptyStateVariant.generic:
        return l10n.empty_generic_desc;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Semantics(
      label:
          '${title ?? _defaultTitle(context)}, ${description ?? _defaultDescription(context)}',
      child: Center(
        child: Padding(
          padding:
              EdgeInsets.all(compact ? _AppSpacing.space4 : _AppSpacing.space8),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: compact ? 64 : 96,
                height: compact ? 64 : 96,
                decoration: BoxDecoration(
                  color: theme.colorScheme.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(_AppRadius.radius2xl),
                ),
                child: Icon(
                  _icon,
                  size: compact ? 32 : 48,
                  color: theme.colorScheme.primary,
                ),
              ),
              SizedBox(
                  height: compact ? _AppSpacing.space4 : _AppSpacing.space6),
              Text(
                title ?? _defaultTitle(context),
                style: theme.textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
                textAlign: TextAlign.center,
              ),
              SizedBox(height: _AppSpacing.space2),
              Text(
                description ?? _defaultDescription(context),
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: AppTokens.gray600,
                ),
                textAlign: TextAlign.center,
              ),
              if (onAction != null) ...[
                SizedBox(height: _AppSpacing.space6),
                AppButton(
                  label: actionLabel ?? AppLocalizations.of(context).explore,
                  variant: AppButtonVariant.primary,
                  onPressed: onAction,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
