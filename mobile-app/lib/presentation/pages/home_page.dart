import 'package:go_router/go_router.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../generated/l10n/app_localizations.dart';
import '../../core/design_system/tokens/app_tokens.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/theme_extensions.dart';
import '../../core/utils/formatters.dart';
import '../../core/design_system/components/app_shimmer.dart';
import '../../core/design_system/components/app_logo.dart';
import '../../core/design_system/widgets/app_empty_state.dart';
import '../providers/property_provider.dart';
import '../providers/category_provider.dart';
import '../providers/ads_provider.dart';
import '../providers/platform_provider.dart';
import '../providers/recommendation_provider.dart';
import '../providers/auth_provider.dart';
import '../providers/site_review_provider.dart';
import '../providers/owner_rankings_provider.dart';
import '../../data/models/property_model.dart';
import '../../data/models/site_review_model.dart';
import '../../services/recently_viewed_service.dart';
import '../../services/property_service.dart';
import '../widgets/favorite_button.dart';

class HomePage extends ConsumerStatefulWidget {
  const HomePage({super.key});

  @override
  ConsumerState<HomePage> createState() => _HomePageState();
}

class _HomePageState extends ConsumerState<HomePage> {
  final ScrollController _scrollController = ScrollController();
  late Future<List<PropertyModel>> _recentPropertiesFuture;

  @override
  void initState() {
    super.initState();
    _recentPropertiesFuture = _loadRecentProperties();
    Future.microtask(() {
      ref.read(propertyProvider.notifier).loadProperties();
      ref.read(propertyProvider.notifier).loadTopRanked();
      ref.read(categoryProvider.notifier).loadAll();
      ref.read(ownerRankingsProvider.notifier).loadRankings();
      ref.read(siteReviewProvider.notifier).loadReviews();
      ref
          .read(adsProvider.notifier)
          .loadRotatedAds(slot: 'home_feed', limit: 3);
      if (ref.read(authProvider).isAuthenticated) {
        ref.read(platformStatsProvider.notifier).loadStats();
        ref.read(recommendationProvider.notifier).loadRecommendations(limit: 6);
        ref.read(recommendationProvider.notifier).loadTrending(limit: 6);
      }
    });

    _scrollController.addListener(_onScroll);
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      ref.read(propertyProvider.notifier).loadProperties();
    }
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  Future<List<PropertyModel>> _loadRecentProperties() async {
    final ids = await RecentlyViewedService().getRecentlyViewed();
    if (ids.isEmpty) return [];

    final service = PropertyService();
    final futures = ids.map((id) async {
      try {
        return await service.getPropertyById(id);
      } catch (_) {
        return null;
      }
    });
    final results = await Future.wait(futures);
    return results.whereType<PropertyModel>().toList();
  }

  Future<void> _onRefresh() async {
    await ref.read(propertyProvider.notifier).loadProperties(refresh: true);
    await ref.read(propertyProvider.notifier).loadTopRanked();
    await ref.read(categoryProvider.notifier).loadAll();
    await ref.read(ownerRankingsProvider.notifier).loadRankings();
    await ref.read(siteReviewProvider.notifier).loadReviews();
    await ref
        .read(adsProvider.notifier)
        .loadRotatedAds(slot: 'home_feed', limit: 3);
    if (ref.read(authProvider).isAuthenticated) {
      await ref
          .read(recommendationProvider.notifier)
          .loadRecommendations(limit: 6);
      await ref.read(recommendationProvider.notifier).loadTrending(limit: 6);
      await ref.read(platformStatsProvider.notifier).loadStats();
    }
    if (mounted) {
      setState(() {
        _recentPropertiesFuture = _loadRecentProperties();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.backgroundColor,
      floatingActionButton: FloatingActionButton(
        heroTag: 'chatbot_home',
        tooltip: AppLocalizations.of(context).tooltip_chatbot,
        onPressed: () => context.push('/chatbot'),
        backgroundColor: AppTheme.primary500,
        elevation: 6,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: const Icon(Icons.auto_awesome, color: AppTheme.gray50, size: 26),
      ),
      body: RefreshIndicator(
        onRefresh: _onRefresh,
        color: AppTheme.primary500,
        backgroundColor: Theme.of(context).colorScheme.surface,
        child: CustomScrollView(
          controller: _scrollController,
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            _buildAppBar(),
            _buildHeroSection(),
            _buildTrustBand(),
            _buildCategoriesSection(),
            _buildTopOwnersSection(),
            _buildTopRankedSection(),
            _buildRecommendationsSection(),
            _buildRecentlyViewedSection(),
            _buildAdsSection(),
            _buildPropertyFeedHeader(),
            _buildPropertyFeed(),
            _buildCityShowcase(),
            _buildSiteReviewsSection(),
            const SliverPadding(padding: EdgeInsets.only(bottom: 32)),
          ],
        ),
      ),
    );
  }

  Widget _buildAppBar() {
    return SliverAppBar(
      floating: true,
      pinned: true,
      elevation: 0,
      backgroundColor: AppTheme.darkBg,
      expandedHeight: 0,
      title: Row(
        children: [
          AppLogo.small(),
          const SizedBox(width: 8),
          Text(
            AppLocalizations.of(context).home_app_bar_title,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: AppTheme.gray50,
              letterSpacing: 2,
            ),
          ),
        ],
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.notifications_none, color: AppTheme.gray50),
          tooltip: AppLocalizations.of(context).notifications_title,
          onPressed: () => context.push('/notifications'),
        ),
      ],
    );
  }

  Widget _buildHeroSection() {
    return SliverToBoxAdapter(
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              AppTheme.primary600,
              AppTheme.primary500,
              context.backgroundColor
            ],
            stops: [0.0, 0.7, 1.0],
          ),
        ),
        child: Padding(
          padding: const EdgeInsetsDirectional.fromSTEB(20, 16, 20, 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Badge
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: AppTheme.gray50.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(AppTokens.radiusFull),
                  border: Border.all(
                      color: AppTheme.gold400.withValues(alpha: 0.4)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.workspace_premium,
                        color: AppTheme.gold400, size: 14),
                    const SizedBox(width: 6),
                    Text(
                      AppLocalizations.of(context).home_hero_badge,
                      style: const TextStyle(
                        color: AppTheme.gray50,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              // Title
              Text(
                AppLocalizations.of(context).home_hero_title,
                style: TextStyle(
                  color: AppTheme.gray50,
                  fontSize: 32,
                  fontWeight: FontWeight.w900,
                  height: 1.15,
                ),
              ),
              const SizedBox(height: 20),
              // Search bar
              Container(
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surface,
                  borderRadius: BorderRadius.circular(AppTokens.radiusXl),
                  boxShadow: AppTokens.shadowLg(context),
                ),
                child: TextField(
                  onSubmitted: (value) {
                    ref.read(propertyProvider.notifier).search(keyword: value);
                  },
                  decoration: InputDecoration(
                    hintText: AppLocalizations.of(context).home_search_hint,
                    hintStyle: TextStyle(color: AppTheme.gray400, fontSize: 14),
                    prefixIcon:
                        const Icon(Icons.search, color: AppTheme.primary500),
                    suffixIcon: Container(
                      margin: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: AppTheme.primary600,
                        borderRadius: BorderRadius.circular(AppTokens.radiusMd),
                      ),
                      child: const Icon(Icons.auto_awesome,
                          color: AppTheme.gray50, size: 20),
                    ),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 16),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTrustBand() {
    return Consumer(
      builder: (context, ref, child) {
        final stats = ref.watch(platformStatsProvider);
        return SliverToBoxAdapter(
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
            decoration: BoxDecoration(
              color: context.cardColor,
              borderRadius: BorderRadius.circular(AppTokens.radiusLg),
              boxShadow: AppTokens.shadowSm(context),
              border:
                  Border.all(color: AppTheme.gray200.withValues(alpha: 0.5)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _TrustStat(
                  value: stats.isLoading ? '...' : '${stats.totalProperties}+',
                  label: AppLocalizations.of(context).home_stats_properties,
                  icon: Icons.home_work,
                ),
                _TrustStat(
                  value: stats.isLoading ? '...' : '${stats.totalUsers}+',
                  label: AppLocalizations.of(context).home_stats_users,
                  icon: Icons.people,
                ),
                _TrustStat(
                  value: stats.isLoading ? '...' : '${stats.totalCities}+',
                  label: AppLocalizations.of(context).home_stats_cities,
                  icon: Icons.location_city,
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildCategoriesSection() {
    return Consumer(
      builder: (context, ref, child) {
        final categories = ref.watch(categoryProvider);
        if (categories.isLoading || categories.transactionTypes.isEmpty) {
          return const SliverToBoxAdapter(child: SizedBox.shrink());
        }
        return SliverToBoxAdapter(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsetsDirectional.fromSTEB(16, 16, 16, 12),
                child: Text(
                  AppLocalizations.of(context).home_category_title,
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: context.textPrimary,
                  ),
                ),
              ),
              SizedBox(
                height: 44,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: categories.transactionTypes.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (context, index) {
                    final type = categories.transactionTypes[index];
                    return ActionChip(
                      label: Text(
                        _translateType(type),
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.primary500,
                        ),
                      ),
                      backgroundColor: AppTheme.primary50,
                      side: BorderSide.none,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(AppTokens.radiusFull),
                      ),
                      onPressed: () {
                        ref.read(propertyProvider.notifier).search(type: type);
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildTopRankedSection() {
    return Consumer(
      builder: (context, ref, child) {
        final propertyState = ref.watch(propertyProvider);
        if (propertyState.topRanked.isEmpty) {
          return const SliverToBoxAdapter(child: SizedBox.shrink());
        }

        return SliverToBoxAdapter(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsetsDirectional.fromSTEB(16, 24, 16, 12),
                child: Row(
                  children: [
                    const Icon(Icons.trending_up,
                        color: AppTheme.gold500, size: 20),
                    const SizedBox(width: 8),
                    Text(
                      AppLocalizations.of(context).home_selection_title,
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: context.textPrimary,
                      ),
                    ),
                  ],
                ),
              ),
              SizedBox(
                height: 280,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: propertyState.topRanked.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 12),
                  itemBuilder: (context, index) {
                    final property = propertyState.topRanked[index];
                    return _TopRankedCard(
                      property: property,
                      onTap: () => _navigateToDetail(property.id),
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildAdsSection() {
    return Consumer(
      builder: (context, ref, child) {
        final adsState = ref.watch(adsProvider);
        if (adsState.ads.isEmpty) {
          return const SliverToBoxAdapter(child: SizedBox.shrink());
        }

        return SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsetsDirectional.fromSTEB(16, 24, 16, 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.gold50,
                    borderRadius: BorderRadius.circular(AppTokens.radiusSm),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.workspace_premium,
                          color: AppTheme.gold500, size: 12),
                      const SizedBox(width: 4),
                      Text(
                        AppLocalizations.of(context).home_sponsored_badge,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.gold600,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                SizedBox(
                  height: 160,
                  child: PageView.builder(
                    itemCount: adsState.ads.length,
                    itemBuilder: (context, index) {
                      final ad = adsState.ads[index];
                      final imageUrl = ad.resolvedImageUrl;
                      return GestureDetector(
                        onTap: () async {
                          if (ad.propertyId != null) {
                            _navigateToDetail(ad.propertyId!);
                          } else if (ad.targetUrl != null &&
                              ad.targetUrl!.isNotEmpty) {
                            // External target URLs are not handled in-app.
                          }
                          // Metrics endpoint is restricted to ADMIN/PROPRIETAIRE.
                          final auth = ref.read(authProvider);
                          if (auth.isAdmin || auth.isProprietaire) {
                            try {
                              await ref
                                  .read(adsServiceProvider)
                                  .updateMetrics(ad.id, clicks: 1);
                            } catch (_) {
                              // Silently ignore; navigation is the priority.
                            }
                          }
                        },
                        child: Container(
                          margin: const EdgeInsetsDirectional.only(end: 8),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(AppTokens.radiusLg),
                            image: imageUrl != null && imageUrl.isNotEmpty
                                ? DecorationImage(
                                    image: CachedNetworkImageProvider(imageUrl),
                                    fit: BoxFit.cover,
                                  )
                                : null,
                            color: AppTheme.gray200,
                          ),
                          child: imageUrl == null || imageUrl.isEmpty
                              ? Center(
                                  child: Text(
                                    ad.title,
                                    style: TextStyle(
                                      fontWeight: FontWeight.w700,
                                      color: context.textPrimary,
                                    ),
                                  ),
                                )
                              : null,
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildRecommendationsSection() {
    return SliverToBoxAdapter(
      child: Consumer(
        builder: (context, ref, child) {
          final recState = ref.watch(recommendationProvider);
          final recommendations = recState.recommendations;

          if (recommendations.isEmpty) return const SizedBox.shrink();

          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsetsDirectional.fromSTEB(16, 24, 16, 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          AppLocalizations.of(context).home_for_you,
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.gold400,
                            letterSpacing: 1.2,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          AppLocalizations.of(context)
                              .home_recommendations_title,
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.gray900,
                          ),
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppTheme.primary50,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.auto_awesome,
                              size: 14, color: AppTheme.primary500),
                          const SizedBox(width: 4),
                          Text(
                            AppLocalizations.of(context).home_recommendations_ai_badge,
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.primary500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              SizedBox(
                height: 280,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: recommendations.length,
                  itemBuilder: (context, index) {
                    final property = recommendations[index];
                    return _buildRecommendationCard(property);
                  },
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildRecommendationCard(PropertyModel property) {
    return GestureDetector(
      onTap: () => context.push('/property/${property.id}'),
      child: Container(
        width: 240,
        margin: const EdgeInsetsDirectional.only(end: 12),
        decoration: BoxDecoration(
          color: context.cardColor,
          borderRadius: BorderRadius.circular(AppTokens.radiusLg),
          boxShadow: AppTokens.shadowCard(context),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(AppTokens.radiusLg)),
              child: Stack(
                fit: StackFit.expand,
                children: [
                  CachedNetworkImage(
                    imageUrl: property.coverImage ?? '',
                    height: 140,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    placeholder: (context, url) =>
                        const AppShimmer(height: 140, width: 240),
                    errorWidget: (context, url, error) => Container(
                      height: 140,
                      width: 240,
                      color: AppTheme.gray50,
                      child: const Icon(Icons.image_not_supported,
                          color: AppTheme.gray400),
                    ),
                  ),
                  PositionedDirectional(top: 8, end: 8,
                    child: FavoriteButton(
                        propertyId: property.id, size: 32, iconSize: 16),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    property.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: context.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(Icons.location_on,
                          size: 12, color: AppTheme.gold400),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          property.city,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 12,
                            color: AppTheme.gray500,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    formatPrice(context, property.price),
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.primary500,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPropertyFeedHeader() {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsetsDirectional.fromSTEB(16, 24, 16, 12),
        child: Consumer(
          builder: (context, ref, child) {
            final propertyState = ref.watch(propertyProvider);
            return Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      AppLocalizations.of(context).home_feed_title,
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: context.textPrimary,
                      ),
                    ),
                    if (!propertyState.isLoading)
                      Text(
                        '${propertyState.properties.length} ${AppLocalizations.of(context).home_feed_results}',
                        style: TextStyle(
                          fontSize: 13,
                          color: context.textSecondary,
                        ),
                      ),
                  ],
                ),
                Row(
                  children: [
                    TextButton(
                      onPressed: () => context.push('/search'),
                      child: Text(AppLocalizations.of(context).home_see_more),
                    ),
                    IconButton(
                      icon: const Icon(Icons.filter_list,
                          color: AppTheme.primary500),
                      onPressed: () {},
                    ),
                  ],
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildPropertyFeed() {
    return Consumer(
      builder: (context, ref, child) {
        final propertyState = ref.watch(propertyProvider);

        if (propertyState.isLoading && propertyState.properties.isEmpty) {
          return SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            sliver: SliverList(
              delegate: SliverChildBuilderDelegate(
                (_, __) => const Padding(
                  padding: EdgeInsets.only(bottom: 16),
                  child: PropertyCardShimmer(),
                ),
                childCount: 4,
              ),
            ),
          );
        }

        if (propertyState.error != null && propertyState.properties.isEmpty) {
          return SliverFillRemaining(
            child: AppEmptyState(
              variant: EmptyStateVariant.properties,
              title: AppLocalizations.of(context).home_feed_error,
              description: propertyState.error!,
              actionLabel: AppLocalizations.of(context).retry,
              onAction: () => ref
                  .read(propertyProvider.notifier)
                  .loadProperties(refresh: true),
            ),
          );
        }

        if (propertyState.properties.isEmpty) {
          return SliverFillRemaining(
            child: AppEmptyState(
              variant: EmptyStateVariant.properties,
              title: AppLocalizations.of(context).home_feed_empty,
              description: AppLocalizations.of(context).home_feed_empty_desc,
            ),
          );
        }

        return SliverPadding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          sliver: SliverList(
            delegate: SliverChildBuilderDelegate(
              (context, index) {
                if (index == propertyState.properties.length) {
                  return propertyState.isLoadingMore
                      ? const Padding(
                          padding: EdgeInsets.all(16),
                          child: Center(child: CircularProgressIndicator()),
                        )
                      : const SizedBox.shrink();
                }
                final property = propertyState.properties[index];
                return Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: _PropertyCard(
                    property: property,
                    onTap: () => _navigateToDetail(property.id),
                  ),
                );
              },
              childCount: propertyState.properties.length + 1,
            ),
          ),
        );
      },
    );
  }

  Widget _buildCityShowcase() {
    return Consumer(
      builder: (context, ref, child) {
        final categories = ref.watch(categoryProvider);
        if (categories.cities.isEmpty) {
          return const SliverToBoxAdapter(child: SizedBox.shrink());
        }

        final displayCities = categories.cities.take(6).toList();
        return SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsetsDirectional.fromSTEB(16, 24, 16, 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  AppLocalizations.of(context).home_cities_title,
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: context.textPrimary,
                  ),
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: displayCities.map((city) {
                    return ActionChip(
                      avatar: const Icon(Icons.location_on,
                          size: 16, color: AppTheme.primary500),
                      label: Text(city),
                      backgroundColor: context.cardColor,
                      side: const BorderSide(color: AppTheme.gray200),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(AppTokens.radiusFull),
                      ),
                      onPressed: () {
                        ref.read(propertyProvider.notifier).search(city: city);
                      },
                    );
                  }).toList(),
                ),
                const SizedBox(height: 8),
                Center(
                  child: TextButton(
                    onPressed: () => context.push('/cities'),
                    child: Text(AppLocalizations.of(context).home_see_all),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildTopOwnersSection() {
    return Consumer(
      builder: (context, ref, child) {
        final owners = ref.watch(ownerRankingsProvider);
        if (owners.isEmpty) {
          return const SliverToBoxAdapter(child: SizedBox.shrink());
        }

        final displayOwners = owners.take(8).toList();
        return SliverToBoxAdapter(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsetsDirectional.fromSTEB(16, 24, 16, 12),
                child: Row(
                  children: [
                    const Icon(Icons.emoji_events,
                        color: AppTheme.gold500, size: 20),
                    const SizedBox(width: 8),
                    Text(
                      AppLocalizations.of(context).home_top_owners,
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: context.textPrimary,
                      ),
                    ),
                  ],
                ),
              ),
              SizedBox(
                height: 180,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: displayOwners.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 12),
                  itemBuilder: (context, index) {
                    final owner = displayOwners[index];
                    return _OwnerCard(
                      owner: owner,
                      onTap: () {
                        final userId = owner['userId'] as int?;
                        if (userId != null) {
                          context.push('/owners/$userId');
                        }
                      },
                    );
                  },
                ),
              ),
              Padding(
                padding: const EdgeInsetsDirectional.fromSTEB(16, 12, 16, 8),
                child: Center(
                  child: TextButton(
                    onPressed: () => context.push('/search'),
                    child: Text(AppLocalizations.of(context).home_see_more),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSiteReviewsSection() {
    return Consumer(
      builder: (context, ref, child) {
        final reviews = ref.watch(siteReviewProvider);
        return SliverToBoxAdapter(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsetsDirectional.fromSTEB(16, 24, 16, 12),
                child: Row(
                  children: [
                    const Icon(Icons.reviews,
                        color: AppTheme.primary500, size: 20),
                    const SizedBox(width: 8),
                    Text(
                      AppLocalizations.of(context).home_site_reviews,
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: context.textPrimary,
                      ),
                    ),
                  ],
                ),
              ),
              if (reviews.isNotEmpty)
                SizedBox(
                  height: 160,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: reviews.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 12),
                    itemBuilder: (context, index) {
                      final review = reviews[index];
                      return _SiteReviewCard(review: review);
                    },
                  ),
                ),
              Padding(
                padding: const EdgeInsetsDirectional.fromSTEB(16, 12, 16, 8),
                child: Center(
                  child: ElevatedButton.icon(
                    onPressed: () => _showSiteReviewSheet(context),
                    icon: const Icon(Icons.edit, size: 16),
                    label: Text(AppLocalizations.of(context).home_leave_review),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary500,
                      foregroundColor: AppTheme.gray50,
                      textStyle: TextStyle(fontWeight: FontWeight.w700),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(AppTokens.radiusLg),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  void _showSiteReviewSheet(BuildContext context) {
    int rating = 0;
    final commentController = TextEditingController();
    final nameController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppTokens.radiusXl)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setState) {
            return Padding(
              padding: EdgeInsetsDirectional.only(
                bottom: MediaQuery.of(ctx).viewInsets.bottom,
                start: 20,
                end: 20,
                top: 20,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    AppLocalizations.of(context).home_review_title,
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(5, (index) {
                      return IconButton(
                        icon: Icon(
                          index < rating ? Icons.star : Icons.star_border,
                          color: AppTheme.gold500,
                        ),
                        onPressed: () => setState(() => rating = index + 1),
                      );
                    }),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: nameController,
                    decoration: InputDecoration(
                      labelText: AppLocalizations.of(context).home_review_name,
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: commentController,
                    decoration: InputDecoration(
                      labelText:
                          AppLocalizations.of(context).home_review_comment,
                      border: OutlineInputBorder(),
                    ),
                    maxLines: 3,
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: rating > 0 && commentController.text.isNotEmpty
                          ? () {
                              ref.read(siteReviewProvider.notifier).submit(
                                    rating: rating,
                                    comment: commentController.text,
                                    userName: nameController.text.isNotEmpty
                                        ? nameController.text
                                        : null,
                                  );
                              Navigator.pop(ctx);
                            }
                          : null,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primary500,
                        foregroundColor: AppTheme.gray50,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      child:
                          Text(AppLocalizations.of(context).home_review_send),
                    ),
                  ),
                  const SizedBox(height: 20),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildRecentlyViewedSection() {
    return SliverToBoxAdapter(
      child: FutureBuilder<List<PropertyModel>>(
        future: _recentPropertiesFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const SizedBox.shrink();
          }
          final properties = snapshot.data ?? [];
          if (properties.isEmpty) return const SizedBox.shrink();

          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsetsDirectional.fromSTEB(16, 24, 16, 12),
                child: Row(
                  children: [
                    const Icon(Icons.history,
                        color: AppTheme.primary500, size: 20),
                    const SizedBox(width: 8),
                    Text(
                      AppLocalizations.of(context).home_recently_viewed,
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: context.textPrimary,
                      ),
                    ),
                  ],
                ),
              ),
              SizedBox(
                height: 260,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: properties.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 12),
                  itemBuilder: (context, index) {
                    final property = properties[index];
                    return _RecentPropertyCard(
                      property: property,
                      onTap: () => _navigateToDetail(property.id),
                    );
                  },
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  void _navigateToDetail(int propertyId) {
    context.push('/property/$propertyId');
  }

  String _translateType(String type) {
    switch (type) {
      case 'RENT':
        return AppLocalizations.of(context).property_type_rent;
      case 'BUY':
        return AppLocalizations.of(context).property_type_buy;
      case 'MORTGAGE':
        return AppLocalizations.of(context).property_type_mortgage;
      default:
        return type;
    }
  }
}

class _TrustStat extends StatelessWidget {
  final String value;
  final String label;
  final IconData icon;

  const _TrustStat(
      {required this.value, required this.label, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, color: AppTheme.primary500, size: 20),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w800,
            color: context.textPrimary,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            color: context.textSecondary,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}

class _TopRankedCard extends StatelessWidget {
  final dynamic property;
  final VoidCallback onTap;

  const _TopRankedCard({required this.property, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final price = property.finalPrice?.toStringAsFixed(0) ??
        property.price.toStringAsFixed(0);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 220,
        decoration: BoxDecoration(
          color: context.cardColor,
          borderRadius: BorderRadius.circular(AppTokens.radiusLg),
          boxShadow: AppTokens.shadowCard(context),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(AppTokens.radiusLg)),
              child: Stack(
                children: [
                  AspectRatio(
                    aspectRatio: 16 / 10,
                    child: property.coverImage != null
                        ? CachedNetworkImage(
                            imageUrl: property.coverImage!,
                            fit: BoxFit.cover,
                            placeholder: (_, __) =>
                                Container(color: AppTheme.gray200),
                            errorWidget: (_, __, ___) => Container(
                              color: AppTheme.gray200,
                              child: const Icon(Icons.image,
                                  color: AppTheme.gray400),
                            ),
                          )
                        : Container(
                            color: AppTheme.gray200,
                            child:
                                const Icon(Icons.home, color: AppTheme.gray400),
                          ),
                  ),
                  PositionedDirectional(top: 8, end: 8,
                    child: FavoriteButton(
                        propertyId: property.id as int, size: 32, iconSize: 16),
                  ),
                  PositionedDirectional(top: 8, start: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppTheme.gold500,
                        borderRadius: BorderRadius.circular(AppTokens.radiusSm),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.star,
                              size: 12, color: AppTheme.gray50),
                          const SizedBox(width: 4),
                          Text(
                            'Top',
                            style: TextStyle(
                              color: context.cardColor,
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
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
                  Row(
                    children: [
                      Icon(Icons.location_on,
                          size: 12, color: context.textMuted),
                      const SizedBox(width: 4),
                      Text(
                        property.city,
                        style: TextStyle(
                            fontSize: 12, color: context.textSecondary),
                      ),
                    ],
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
          ],
        ),
      ),
    );
  }
}

class _PropertyCard extends StatelessWidget {
  final dynamic property;
  final VoidCallback onTap;

  const _PropertyCard({required this.property, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final price = property.finalPrice?.toStringAsFixed(0) ??
        property.price.toStringAsFixed(0);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: context.cardColor,
          borderRadius: BorderRadius.circular(AppTokens.radiusLg),
          boxShadow: AppTokens.shadowCard(context),
          border: Border.all(color: AppTheme.gray200.withValues(alpha: 0.5)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(AppTokens.radiusLg)),
              child: Stack(
                children: [
                  AspectRatio(
                    aspectRatio: 16 / 9,
                    child: property.coverImage != null
                        ? CachedNetworkImage(
                            imageUrl: property.coverImage!,
                            fit: BoxFit.cover,
                            placeholder: (_, __) =>
                                Container(color: AppTheme.gray200),
                            errorWidget: (_, __, ___) => Container(
                              color: AppTheme.gray200,
                              child: const Icon(Icons.image,
                                  color: AppTheme.gray400),
                            ),
                          )
                        : Container(
                            color: AppTheme.gray200,
                            child:
                                const Icon(Icons.home, color: AppTheme.gray400),
                          ),
                  ),
                  if (property.isVerified == true)
                    PositionedDirectional(top: 12, start: 12,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppTheme.success500,
                          borderRadius: BorderRadius.circular(AppTokens.radiusFull),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.verified,
                                size: 10, color: AppTheme.gray50),
                            const SizedBox(width: 4),
                            Text(
                              'Vérifié',
                              style: TextStyle(
                                color: context.cardColor,
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  PositionedDirectional(top: 12, end: 12,
                    child: FavoriteButton(propertyId: property.id as int),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppTheme.primary50,
                          borderRadius: BorderRadius.circular(AppTokens.radiusSm),
                        ),
                        child: Text(
                          property.type == 'RENT'
                              ? AppLocalizations.of(context).property_type_rent
                              : AppLocalizations.of(context).property_type_buy,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.primary500,
                          ),
                        ),
                      ),
                      if (property.discountPercentage != null &&
                          property.discountPercentage! > 0)
                        Container(
                          margin: const EdgeInsetsDirectional.only(start: 8),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppTheme.error50,
                            borderRadius: BorderRadius.circular(AppTokens.radiusSm),
                          ),
                          child: Text(
                            '-${property.discountPercentage!.toStringAsFixed(0)}%',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.error500,
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    property.title,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: context.textPrimary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(Icons.location_on,
                          size: 14, color: AppTheme.gold500),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          '${property.city}${property.address.isNotEmpty ? ', ${property.address}' : ''}',
                          style: TextStyle(
                              fontSize: 13, color: context.textSecondary),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Text(
                        '$price MAD',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.primary500,
                        ),
                      ),
                      if (property.type == 'RENT')
                        Text(
                          AppLocalizations.of(context).home_per_month,
                          style: TextStyle(
                            fontSize: 12,
                            color: context.textMuted,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      _FeaturePill(
                          icon: Icons.bed,
                          label:
                              '${property.rooms}${AppLocalizations.of(context).property_rooms_unit}'),
                      const SizedBox(width: 8),
                      if (property.bathrooms != null)
                        _FeaturePill(
                            icon: Icons.bathroom,
                            label:
                                '${property.bathrooms}${AppLocalizations.of(context).property_bathrooms_unit}'),
                      if (property.bathrooms != null) const SizedBox(width: 8),
                      _FeaturePill(
                          icon: Icons.square_foot,
                          label: formatArea(context, property.surface)),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _OwnerCard extends StatelessWidget {
  final dynamic owner;
  final VoidCallback onTap;

  const _OwnerCard({required this.owner, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final name = owner['name']?.toString() ?? '';
    final initials = name
        .split(' ')
        .map((e) => e.isNotEmpty ? e[0] : '')
        .join('')
        .toUpperCase();
    final avatar = owner['avatar']?.toString();
    final propertyCount = owner['propertyCount'] as int? ?? 0;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 130,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: context.cardColor,
          borderRadius: BorderRadius.circular(AppTokens.radiusLg),
          boxShadow: AppTokens.shadowCard(context),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircleAvatar(
              radius: 28,
              backgroundColor: AppTheme.primary100,
              backgroundImage: avatar != null && avatar.isNotEmpty
                  ? CachedNetworkImageProvider(avatar)
                  : null,
              child: avatar == null || avatar.isEmpty
                  ? Text(
                      initials.length > 2 ? initials.substring(0, 2) : initials,
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.primary500,
                      ),
                    )
                  : null,
            ),
            const SizedBox(height: 8),
            Text(
              name,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: context.textPrimary,
              ),
            ),
            const SizedBox(height: 4),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.star, size: 14, color: AppTheme.gold500),
                const SizedBox(width: 4),
                Text(
                  owner['score'] != null
                      ? (owner['score'] as num).toStringAsFixed(1)
                      : '0.0',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.gold600,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              AppLocalizations.of(context)
                  .owner_properties_count(propertyCount),
              style: TextStyle(
                fontSize: 11,
                color: context.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SiteReviewCard extends StatelessWidget {
  final SiteReviewModel review;

  const _SiteReviewCard({required this.review});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 280,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.cardColor,
        borderRadius: BorderRadius.circular(AppTokens.radiusLg),
        boxShadow: AppTokens.shadowCard(context),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: AppTheme.primary100,
                child: Text(
                  review.userName?.isNotEmpty == true
                      ? review.userName![0].toUpperCase()
                      : '?',
                  style: TextStyle(
                    fontWeight: FontWeight.w800,
                    color: AppTheme.primary500,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  review.userName ??
                      AppLocalizations.of(context).property_detail_anonymous,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: context.textPrimary,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: List.generate(5, (i) {
              return Icon(
                i < review.rating ? Icons.star : Icons.star_border,
                size: 16,
                color: AppTheme.gold500,
              );
            }),
          ),
          const SizedBox(height: 8),
          Text(
            review.comment,
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: 13,
              color: context.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}

class _RecentPropertyCard extends StatelessWidget {
  final PropertyModel property;
  final VoidCallback onTap;

  const _RecentPropertyCard({required this.property, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 200,
        decoration: BoxDecoration(
          color: context.cardColor,
          borderRadius: BorderRadius.circular(AppTokens.radiusLg),
          boxShadow: AppTokens.shadowCard(context),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(AppTokens.radiusLg)),
              child: CachedNetworkImage(
                imageUrl: property.coverImage ?? '',
                height: 130,
                width: 200,
                fit: BoxFit.cover,
                placeholder: (_, __) => Container(color: AppTheme.gray200),
                errorWidget: (_, __, ___) => Container(
                  color: AppTheme.gray200,
                  child: const Icon(Icons.home, color: AppTheme.gray400),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    property.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: context.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(Icons.location_on,
                          size: 12, color: AppTheme.gold500),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          property.city,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 12,
                            color: context.textSecondary,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '${property.price.toStringAsFixed(0)} MAD',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.primary500,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FeaturePill extends StatelessWidget {
  final IconData icon;
  final String label;

  const _FeaturePill({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: AppTheme.gold50.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(AppTokens.radiusFull),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: AppTheme.primary500),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: context.textPrimary,
            ),
          ),
        ],
      ),
    );
  }
}
