import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/theme_extensions.dart';
import '../../core/design_system/components/app_shimmer.dart';
import '../../core/design_system/tokens/app_tokens.dart';
import '../../generated/l10n/app_localizations.dart';
import '../providers/owner_rankings_provider.dart';
import '../providers/property_provider.dart';
import '../widgets/property_card.dart';


class OwnerProfilePage extends ConsumerStatefulWidget {
  final int ownerId;

  const OwnerProfilePage({super.key, required this.ownerId});

  @override
  ConsumerState<OwnerProfilePage> createState() => _OwnerProfilePageState();
}

class _OwnerProfilePageState extends ConsumerState<OwnerProfilePage> {
  List<dynamic> _ownerProperties = [];
  bool _propertiesLoading = false;
  String? _propertiesError;

  static const _gradients = [
    [AppTokens.primary500, AppTokens.emerald600],
    [AppTokens.info500, AppTokens.indigo500],
    [AppTokens.warning500, AppTokens.orange500],
    [AppTokens.rose500, AppTokens.pink500],
    [AppTokens.violet500, AppTokens.purple500],
    [AppTokens.cyan500, AppTokens.info500],
    [AppTokens.emerald500, AppTokens.primary500],
    [AppTokens.fuchsia500, AppTokens.rose500],
  ];

  @override
  void initState() {
    super.initState();
    Future.microtask(() async {
      // Ensure rankings are loaded
      final rankings = ref.read(ownerRankingsProvider);
      if (rankings.isEmpty) {
        await ref.read(ownerRankingsProvider.notifier).loadRankings();
      }
      _loadProperties();
    });
  }

  Future<void> _loadProperties() async {
    setState(() {
      _propertiesLoading = true;
      _propertiesError = null;
    });
    try {
      final properties =
          await ref.read(propertyServiceProvider).searchProperties(
                ownerId: widget.ownerId,
                size: 20,
              );
      if (mounted) {
        setState(() {
          _ownerProperties = properties;
          _propertiesLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _propertiesError = e.toString();
          _propertiesLoading = false;
        });
      }
    }
  }

  Map<String, dynamic>? _findOwner(List<dynamic> rankings) {
    try {
      return rankings.firstWhere(
        (o) => (o as Map<String, dynamic>)['userId'] == widget.ownerId,
      ) as Map<String, dynamic>?;
    } catch (_) {
      return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    final owners = ref.watch(ownerRankingsProvider);
    final owner = _findOwner(owners);
    final isLoading = owners.isEmpty && owner == null;

    if (isLoading) {
      return Scaffold(
        backgroundColor: context.backgroundColor,
        appBar: AppBar(
          backgroundColor: context.backgroundColor,
          foregroundColor: context.textPrimary,
          elevation: 0,
        ),
        body: _buildSkeleton(),
      );
    }

    if (owner == null) {
      return Scaffold(
        backgroundColor: context.backgroundColor,
        appBar: AppBar(
          backgroundColor: context.backgroundColor,
          foregroundColor: context.textPrimary,
          elevation: 0,
        ),
        body: _buildNotFound(),
      );
    }

    final name =
        owner['name']?.toString() ?? AppLocalizations.of(context).owner_unknown;
    final initials = name
        .split(' ')
        .map((e) => e.isNotEmpty ? e[0] : '')
        .join('')
        .toUpperCase();
    final avatar = owner['avatar']?.toString();
    final city = owner['city']?.toString();
    final verified = owner['verified'] == true;
    final score = (owner['score'] as num?)?.toDouble() ?? 0.0;
    final gradient = _gradients[widget.ownerId % _gradients.length];

    return Scaffold(
      backgroundColor: context.backgroundColor,
      body: CustomScrollView(
        slivers: [
          // AppBar
          SliverAppBar(
            pinned: true,
            backgroundColor: context.backgroundColor,
            foregroundColor: context.textPrimary,
            elevation: 0,
            expandedHeight: 200,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      gradient[0].withValues(alpha: 0.15),
                      gradient[1].withValues(alpha: 0.05),
                    ],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                ),
                child: SafeArea(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const SizedBox(height: 48),
                      Container(
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: LinearGradient(
                            colors: gradient,
                            begin: AlignmentDirectional.topStart,
                            end: AlignmentDirectional.bottomEnd,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: gradient[0].withValues(alpha: 0.3),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        padding: const EdgeInsets.all(3),
                        child: CircleAvatar(
                          radius: 40,
                          backgroundColor: context.cardColor,
                          child: CircleAvatar(
                            radius: 37,
                            backgroundColor:
                                gradient[0].withValues(alpha: 0.15),
                            backgroundImage: avatar != null && avatar.isNotEmpty
                                ? CachedNetworkImageProvider(avatar)
                                : null,
                            child: avatar == null || avatar.isEmpty
                                ? Text(
                                    initials.length > 2
                                        ? initials.substring(0, 2)
                                        : initials,
                                    style: TextStyle(
                                      fontSize: 24,
                                      fontWeight: FontWeight.w800,
                                      color: gradient[0],
                                    ),
                                  )
                                : null,
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            name,
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: context.textPrimary,
                            ),
                          ),
                          if (verified) ...[
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color:
                                    AppTheme.success500.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(
                                    Icons.verified,
                                    size: 12,
                                    color: AppTheme.success500,
                                  ),
                                  const SizedBox(width: 2),
                                  Text(
                                    AppLocalizations.of(context).owner_verified,
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w700,
                                      color: AppTheme.success500,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ],
                      ),
                      if (city != null && city.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 2),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.location_on,
                                size: 14,
                                color: context.textSecondary,
                              ),
                              const SizedBox(width: 2),
                              Text(
                                city,
                                style: TextStyle(
                                  fontSize: 13,
                                  color: context.textSecondary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      const SizedBox(height: 4),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(
                            Icons.star,
                            size: 16,
                            color: AppTheme.gold500,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            score.toStringAsFixed(1),
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              color: AppTheme.gold600,
                            ),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            AppLocalizations.of(context).owner_score,
                            style: TextStyle(
                              fontSize: 12,
                              color: context.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // Stats grid
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsetsDirectional.fromSTEB(16, 8, 16, 16),
              child: _buildStatsGrid(owner),
            ),
          ),

          // Actions
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () =>
                          context.push('/search?ownerId=${widget.ownerId}'),
                      icon: const Icon(Icons.apartment, size: 18),
                      label: Text(
                        AppLocalizations.of(context).owner_view_properties,
                        style: TextStyle(fontWeight: FontWeight.w700),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primary500,
                        foregroundColor: AppTokens.gray50,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(AppTokens.radiusMd),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => context.push('/chat/${widget.ownerId}'),
                      icon: const Icon(Icons.message, size: 18),
                      label: Text(
                        AppLocalizations.of(context).owner_view_profile,
                        style: TextStyle(fontWeight: FontWeight.w700),
                      ),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppTheme.primary500,
                        side: BorderSide(
                          color: AppTheme.primary500.withValues(alpha: 0.3),
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(AppTokens.radiusMd),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Properties section
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsetsDirectional.fromSTEB(16, 24, 16, 12),
              child: Row(
                children: [
                  const Icon(
                    Icons.apartment,
                    color: AppTheme.primary500,
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    AppLocalizations.of(context).owner_properties_title,
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: context.textPrimary,
                    ),
                  ),
                ],
              ),
            ),
          ),

          if (_propertiesLoading)
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) => const Padding(
                    padding: EdgeInsets.only(bottom: 12),
                    child: _PropertySkeletonCard(),
                  ),
                  childCount: 3,
                ),
              ),
            )
          else if (_propertiesError != null)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    Text(
                      AppLocalizations.of(context).owner_loading_error,
                      style: TextStyle(
                        color: context.textSecondary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    ElevatedButton(
                      onPressed: _loadProperties,
                      child: Text(AppLocalizations.of(context).retry),
                    ),
                  ],
                ),
              ),
            )
          else if (_ownerProperties.isEmpty)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Center(
                  child: Column(
                    children: [
                      Icon(
                        Icons.apartment_outlined,
                        size: 48,
                        color: context.textSecondary.withValues(alpha: 0.5),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        AppLocalizations.of(context).dashboard_no_properties,
                        style: TextStyle(
                          fontSize: 14,
                          color: context.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final property = _ownerProperties[index];
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: GestureDetector(
                        onTap: () => context.push('/property/${property.id}'),
                        child: PropertyCard(property: property),
                      ),
                    );
                  },
                  childCount: _ownerProperties.length,
                ),
              ),
            ),

          SliverToBoxAdapter(
            child: SafeArea(
              top: false,
              child:
                  SizedBox(height: MediaQuery.of(context).padding.bottom + 16),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsGrid(Map<String, dynamic> owner) {
    final propertyCount = (owner['propertyCount'] as num?)?.toInt() ?? 0;
    final averageRating = (owner['averageRating'] as num?)?.toDouble() ?? 0.0;
    final reviewCount = (owner['reviewCount'] as num?)?.toInt() ?? 0;
    final responseRate = (owner['responseRate'] as num?)?.toDouble() ?? 0.0;
    final visitCount = (owner['visitCount'] as num?)?.toInt() ?? 0;
    final premiumAdCount = (owner['premiumAdCount'] as num?)?.toInt() ?? 0;

    final l10n = AppLocalizations.of(context);
    final stats = [
      _StatItem(
        icon: Icons.apartment,
        value: '$propertyCount',
        label: l10n.owner_stats_properties,
        color: AppTheme.primary500,
      ),
      _StatItem(
        icon: Icons.star,
        value: averageRating.toStringAsFixed(1),
        label: l10n.owner_stats_rating,
        color: AppTheme.gold500,
      ),
      _StatItem(
        icon: Icons.reviews,
        value: '$reviewCount',
        label: l10n.owner_reviews,
        color: AppTheme.info500,
      ),
      _StatItem(
        icon: Icons.message,
        value: '${responseRate.toStringAsFixed(0)}%',
        label: l10n.owner_response_rate,
        color: AppTheme.success500,
      ),
      _StatItem(
        icon: Icons.visibility,
        value: '$visitCount',
        label: l10n.owner_visits,
        color: AppTheme.warning500,
      ),
      _StatItem(
        icon: Icons.workspace_premium,
        value: '$premiumAdCount',
        label: l10n.owner_stats_premium,
        color: AppTheme.gold500,
      ),
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        childAspectRatio: 1.35,
        crossAxisSpacing: 6,
        mainAxisSpacing: 6,
      ),
      itemCount: stats.length,
      itemBuilder: (context, index) => _StatCard(stat: stats[index]),
    );
  }

  Widget _buildSkeleton() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          const AppShimmer(width: 80, height: 80, circle: true),
          const SizedBox(height: 12),
          const AppShimmer(width: 150, height: 20, borderRadius: 4),
          const SizedBox(height: 8),
          const AppShimmer(width: 100, height: 14, borderRadius: 4),
          const SizedBox(height: 24),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              childAspectRatio: 1.1,
              crossAxisSpacing: 8,
              mainAxisSpacing: 8,
            ),
            itemCount: 6,
            itemBuilder: (_, __) => Container(
              decoration: BoxDecoration(
                color: context.cardColor,
                borderRadius: BorderRadius.circular(AppTokens.radiusLg),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const AppShimmer(width: 24, height: 24, circle: true),
                  const SizedBox(height: 8),
                  AppShimmer(width: 40, height: 14, borderRadius: 2),
                  const SizedBox(height: 4),
                  AppShimmer(width: 50, height: 10, borderRadius: 2),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNotFound() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.person_off_outlined,
            size: 64,
            color: context.textSecondary.withValues(alpha: 0.5),
          ),
          const SizedBox(height: 16),
          Text(
            AppLocalizations.of(context).owner_not_found,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: context.textSecondary,
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () => context.pop(),
            child: Text(AppLocalizations.of(context).back),
          ),
        ],
      ),
    );
  }
}

class _StatItem {
  final IconData icon;
  final String value;
  final String label;
  final Color color;

  _StatItem({
    required this.icon,
    required this.value,
    required this.label,
    required this.color,
  });
}

class _StatCard extends StatelessWidget {
  final _StatItem stat;

  const _StatCard({required this.stat});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: context.cardColor,
        borderRadius: BorderRadius.circular(AppTokens.radiusLg),
        boxShadow: AppTokens.shadowCard(context),
        border: Border.all(
          color: context.borderColor.withValues(alpha: 0.3),
        ),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: stat.color.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(stat.icon, size: 18, color: stat.color),
          ),
          const SizedBox(height: 4),
          Text(
            stat.value,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w800,
              color: context.textPrimary,
            ),
          ),
          Text(
            stat.label,
            style: TextStyle(
              fontSize: 10,
              color: context.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}

class _PropertySkeletonCard extends StatelessWidget {
  const _PropertySkeletonCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 280,
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
              top: Radius.circular(AppTokens.radiusLg),
            ),
            child: const AppShimmer(
              width: double.infinity,
              height: 160,
              borderRadius: 0,
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const AppShimmer(
                  width: double.infinity,
                  height: 16,
                  borderRadius: 4,
                ),
                const SizedBox(height: 8),
                const AppShimmer(width: 120, height: 14, borderRadius: 4),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const AppShimmer(width: 80, height: 14, borderRadius: 4),
                    const Spacer(),
                    const AppShimmer(width: 28, height: 28, circle: true),
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
