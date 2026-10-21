import 'package:go_router/go_router.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../generated/l10n/app_localizations.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/design_system/tokens/app_tokens.dart';
import '../../core/design_system/components/app_shimmer.dart';
import '../../core/theme/theme_extensions.dart';
import '../../core/theme/app_theme.dart';
import '../../core/design_system/widgets/app_empty_state.dart';
import '../providers/favorite_provider.dart';

class FavoritesPage extends ConsumerStatefulWidget {
  const FavoritesPage({super.key});

  @override
  ConsumerState<FavoritesPage> createState() => _FavoritesPageState();
}

class _FavoritesPageState extends ConsumerState<FavoritesPage> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(favoriteProvider.notifier).loadFavorites();
    });
  }

  Future<void> _onRefresh() async {
    await ref.read(favoriteProvider.notifier).loadFavorites();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(favoriteProvider);

    return Scaffold(
      backgroundColor: context.backgroundColor,
      appBar: AppBar(
        title: Text(AppLocalizations.of(context).favorites_title),
        backgroundColor: context.backgroundColor,
        elevation: 0,
        foregroundColor: context.textPrimary,
      ),
      body: RefreshIndicator(
        onRefresh: _onRefresh,
        color: AppTheme.primary500,
        backgroundColor: Theme.of(context).colorScheme.surface,
        child: _buildBody(state),
      ),
    );
  }

  Widget _buildBody(FavoriteState state) {
    if (state.isLoading && state.favorites.isEmpty) {
      return ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: 4,
        separatorBuilder: (_, __) => const SizedBox(height: 16),
        itemBuilder: (_, __) => const PropertyCardShimmer(),
      );
    }

    if (state.isUnauthorized) {
      return LayoutBuilder(
        builder: (context, constraints) {
          return SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            child: ConstrainedBox(
              constraints: BoxConstraints(minHeight: constraints.maxHeight),
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.all(32),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.lock_outline,
                          size: 64, color: context.textMuted),
                      const SizedBox(height: 16),
                      Text(
                        state.error!,
                        textAlign: TextAlign.center,
                        style: TextStyle(
                            color: context.textSecondary, fontSize: 16),
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: () => context.go('/login'),
                        child: Text(AppLocalizations.of(context)
                            .favorites_login_required),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      );
    }

    if (state.error != null && state.favorites.isEmpty) {
      return LayoutBuilder(
        builder: (context, constraints) {
          return SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            child: ConstrainedBox(
              constraints: BoxConstraints(minHeight: constraints.maxHeight),
              child: Center(
                child: AppEmptyState(
                  variant: EmptyStateVariant.favorites,
                  title: AppLocalizations.of(context).error_loading,
                  description: state.error!,
                  actionLabel: AppLocalizations.of(context).retry,
                  onAction: () =>
                      ref.read(favoriteProvider.notifier).loadFavorites(),
                ),
              ),
            ),
          );
        },
      );
    }

    if (state.favorites.isEmpty) {
      return LayoutBuilder(
        builder: (context, constraints) {
          return SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            child: ConstrainedBox(
              constraints: BoxConstraints(minHeight: constraints.maxHeight),
              child: Center(
                child: AppEmptyState(
                  variant: EmptyStateVariant.favorites,
                  title: AppLocalizations.of(context).favorites_empty_title,
                  description:
                      AppLocalizations.of(context).favorites_empty_desc,
                  actionLabel: AppLocalizations.of(context).favorites_explore,
                ),
              ),
            ),
          );
        },
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: state.favorites.length,
      separatorBuilder: (_, __) => const SizedBox(height: 16),
      itemBuilder: (context, index) {
        final property = state.favorites[index];
        return _FavoriteCard(
          property: property,
          onTap: () {
            context.push('/property/${property.id}');
          },
          onRemove: () {
            ref.read(favoriteProvider.notifier).toggleFavorite(property.id);
          },
        );
      },
    );
  }
}

class _FavoriteCard extends StatelessWidget {
  final dynamic property;
  final VoidCallback onTap;
  final VoidCallback onRemove;

  const _FavoriteCard({
    required this.property,
    required this.onTap,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    final price = property.finalPrice?.toStringAsFixed(0) ??
        property.price.toStringAsFixed(0);
    return Container(
      decoration: BoxDecoration(
        color: context.cardColor,
        borderRadius: BorderRadius.circular(AppTokens.radiusLg),
        boxShadow: AppTokens.shadowCard(context),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppTokens.radiusLg),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.horizontal(
                left: Radius.circular(AppTokens.radiusLg),
              ),
              child: SizedBox(
                width: 120,
                height: 120,
                child: property.coverImage != null
                    ? CachedNetworkImage(
                        imageUrl: property.coverImage!,
                        fit: BoxFit.cover,
                        placeholder: (_, __) =>
                            Container(color: AppTheme.gray200),
                        errorWidget: (_, __, ___) => Container(
                          color: AppTheme.gray200,
                          child:
                              const Icon(Icons.image, color: AppTheme.gray400),
                        ),
                      )
                    : Container(
                        color: AppTheme.gray200,
                        child: const Icon(Icons.home, color: AppTheme.gray400),
                      ),
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      property.title,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: context.textPrimary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      property.city,
                      style:
                          TextStyle(fontSize: 12, color: context.textSecondary),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '$price MAD',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.primary500,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            IconButton(
              icon: const Icon(Icons.favorite, color: AppTheme.error500),
              onPressed: onRemove,
            ),
          ],
        ),
      ),
    );
  }
}
