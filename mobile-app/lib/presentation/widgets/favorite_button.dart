import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../providers/favorite_provider.dart';
import '../../generated/l10n/app_localizations.dart';

class FavoriteButton extends ConsumerWidget {
  final int propertyId;
  final double size;
  final double iconSize;
  final VoidCallback? onToggle;

  const FavoriteButton({
    super.key,
    required this.propertyId,
    this.size = 36,
    this.iconSize = 18,
    this.onToggle,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final favoriteState = ref.watch(favoriteProvider);
    final isFav = favoriteState.isFavorite(propertyId);
    final colorScheme = Theme.of(context).colorScheme;
    final l10n = AppLocalizations.of(context);

    return Semantics(
      button: true,
      label: isFav ? l10n.tooltip_unfavorite : l10n.tooltip_favorite,
      child: Tooltip(
        message: isFav ? l10n.tooltip_unfavorite : l10n.tooltip_favorite,
        child: GestureDetector(
          onTap: () {
            if (!auth.isAuthenticated) {
              _showLoginPrompt(context);
              return;
            }
            ref.read(favoriteProvider.notifier).toggleFavorite(propertyId);
            onToggle?.call();
          },
          child: Container(
            width: size,
            height: size,
            decoration: BoxDecoration(
              color: colorScheme.surface.withValues(alpha: 0.9),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 200),
                transitionBuilder: (child, animation) => ScaleTransition(
                  scale: animation,
                  child: child,
                ),
                child: Icon(
                  isFav ? Icons.favorite : Icons.favorite_border,
                  key: ValueKey<bool>(isFav),
                  size: iconSize,
                  color:
                      isFav ? colorScheme.error : colorScheme.onSurfaceVariant,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _showLoginPrompt(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(l10n.favorite_login_required_title),
        content: Text(l10n.favorite_login_required_message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(l10n.cancel),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              context.push('/login');
            },
            child: Text(l10n.login_button),
          ),
        ],
      ),
    );
  }
}
