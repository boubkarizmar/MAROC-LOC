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


class OwnersPage extends ConsumerStatefulWidget {
  const OwnersPage({super.key});

  @override
  ConsumerState<OwnersPage> createState() => _OwnersPageState();
}

class _OwnersPageState extends ConsumerState<OwnersPage> {
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    Future.microtask(() async {
      await ref.read(ownerRankingsProvider.notifier).loadRankings();
      if (mounted) setState(() => _isLoading = false);
    });
  }

  static const _medalColors = [
    AppTokens.medalGold, // Gold
    AppTokens.medalSilver, // Silver
    AppTokens.medalBronze, // Bronze
  ];

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
  Widget build(BuildContext context) {
    final owners = ref.watch(ownerRankingsProvider);

    return Scaffold(
      backgroundColor: context.backgroundColor,
      appBar: AppBar(
        title: Text(AppLocalizations.of(context).owners_title),
        backgroundColor: context.backgroundColor,
        foregroundColor: context.textPrimary,
        elevation: 0,
      ),
      body: _isLoading
          ? _buildSkeletonList()
          : owners.isEmpty
              ? _buildEmptyState()
              : RefreshIndicator(
                  onRefresh: () async {
                    setState(() => _isLoading = true);
                    await ref
                        .read(ownerRankingsProvider.notifier)
                        .loadRankings();
                    if (mounted) setState(() => _isLoading = false);
                  },
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: owners.length,
                    itemBuilder: (context, index) {
                      final owner = owners[index] as Map<String, dynamic>;
                      return _OwnerListTile(
                        owner: owner,
                        index: index,
                        gradient: _gradients[index % _gradients.length],
                        medalColor: index < 3 ? _medalColors[index] : null,
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
    );
  }

  Widget _buildSkeletonList() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: 8,
      itemBuilder: (context, index) => const Padding(
        padding: EdgeInsets.only(bottom: 12),
        child: _OwnerSkeletonTile(),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.people_outline,
            size: 64,
            color: context.textSecondary.withValues(alpha: 0.5),
          ),
          const SizedBox(height: 16),
          Text(
            AppLocalizations.of(context).owners_empty,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: context.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}

class _OwnerListTile extends StatelessWidget {
  final Map<String, dynamic> owner;
  final int index;
  final List<Color> gradient;
  final Color? medalColor;
  final VoidCallback onTap;

  const _OwnerListTile({
    required this.owner,
    required this.index,
    required this.gradient,
    this.medalColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final name =
        owner['name']?.toString() ?? AppLocalizations.of(context).owner_unknown;
    final initials = name
        .split(' ')
        .map((e) => e.isNotEmpty ? e[0] : '')
        .join('')
        .toUpperCase();
    final avatar = owner['avatar']?.toString();
    final city = owner['city']?.toString();
    final propertyCount = (owner['propertyCount'] as num?)?.toInt() ?? 0;
    final reviewCount = (owner['reviewCount'] as num?)?.toInt() ?? 0;
    final responseRate = (owner['responseRate'] as num?)?.toDouble() ?? 0.0;
    final visitCount = (owner['visitCount'] as num?)?.toInt() ?? 0;
    final verified = owner['verified'] == true;
    final score = (owner['score'] as num?)?.toDouble() ?? 0.0;
    final scorePercent = score.clamp(0, 100);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: context.cardColor,
          borderRadius: BorderRadius.circular(AppTokens.radiusLg),
          boxShadow: AppTokens.shadowCard(context),
          border: Border.all(
            color: context.borderColor.withValues(alpha: 0.5),
          ),
        ),
        child: Column(
          children: [
            Row(
              children: [
                // Rank / Medal
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: medalColor != null
                        ? medalColor!.withValues(alpha: 0.15)
                        : AppTheme.primary50,
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: medalColor != null
                        ? Text(
                            '${index + 1}',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w800,
                              color: medalColor,
                            ),
                          )
                        : Text(
                            '${index + 1}',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.primary500,
                            ),
                          ),
                  ),
                ),
                const SizedBox(width: 12),
                // Avatar
                Container(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: LinearGradient(
                      colors: gradient,
                      begin: AlignmentDirectional.topStart,
                      end: AlignmentDirectional.bottomEnd,
                    ),
                  ),
                  padding: const EdgeInsets.all(2),
                  child: CircleAvatar(
                    radius: 26,
                    backgroundColor: context.cardColor,
                    child: CircleAvatar(
                      radius: 24,
                      backgroundColor: gradient[0].withValues(alpha: 0.2),
                      backgroundImage: avatar != null && avatar.isNotEmpty
                          ? CachedNetworkImageProvider(avatar)
                          : null,
                      child: avatar == null || avatar.isEmpty
                          ? Text(
                              initials.length > 2
                                  ? initials.substring(0, 2)
                                  : initials,
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                                color: gradient[0],
                              ),
                            )
                          : null,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                // Info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w800,
                                color: context.textPrimary,
                              ),
                            ),
                          ),
                          if (verified) ...[
                            const SizedBox(width: 4),
                            Container(
                              padding: const EdgeInsets.all(2),
                              decoration: const BoxDecoration(
                                color: AppTheme.success500,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                Icons.check,
                                size: 10,
                                color: AppTokens.gray50,
                              ),
                            ),
                          ],
                        ],
                      ),
                      if (city != null && city.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 2),
                          child: Row(
                            children: [
                              Icon(
                                Icons.location_on,
                                size: 12,
                                color: context.textSecondary,
                              ),
                              const SizedBox(width: 2),
                              Text(
                                city,
                                style: TextStyle(
                                  fontSize: 12,
                                  color: context.textSecondary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      const SizedBox(height: 6),
                      // Score bar
                      Row(
                        children: [
                          Icon(
                            Icons.star,
                            size: 14,
                            color: AppTheme.gold500,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            score.toStringAsFixed(1),
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w800,
                              color: AppTheme.gold600,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(4),
                              child: LinearProgressIndicator(
                                value: scorePercent / 100,
                                minHeight: 6,
                                backgroundColor: context.borderColor,
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  medalColor != null
                                      ? medalColor!.withValues(alpha: 0.8)
                                      : AppTheme.primary500,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            // Stats row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _StatChip(
                  icon: Icons.apartment,
                  label: '$propertyCount',
                  sublabel: AppLocalizations.of(context).owner_stats_properties,
                  color: AppTheme.primary500,
                ),
                _StatChip(
                  icon: Icons.reviews,
                  label: '$reviewCount',
                  sublabel: AppLocalizations.of(context).owner_reviews,
                  color: AppTheme.info500,
                ),
                _StatChip(
                  icon: Icons.message,
                  label: '${responseRate.toStringAsFixed(0)}%',
                  sublabel: AppLocalizations.of(context).owner_response_rate,
                  color: AppTheme.success500,
                ),
                _StatChip(
                  icon: Icons.visibility,
                  label: '$visitCount',
                  sublabel: AppLocalizations.of(context).owner_visits,
                  color: AppTheme.warning500,
                ),
              ],
            ),
            const SizedBox(height: 12),
            // Actions
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: onTap,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppTheme.primary500,
                      side: BorderSide(
                          color: AppTheme.primary500.withValues(alpha: 0.3)),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(AppTokens.radiusMd),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 10),
                    ),
                    child: Text(
                      AppLocalizations.of(context).owner_view_profile,
                      style: TextStyle(fontWeight: FontWeight.w700),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      final userId = owner['userId'] as int?;
                      if (userId != null) {
                        context.push('/search?ownerId=$userId');
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary500,
                      foregroundColor: AppTokens.gray50,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(AppTokens.radiusMd),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 10),
                    ),
                    child: Text(
                      AppLocalizations.of(context).owner_view_properties,
                      style: TextStyle(fontWeight: FontWeight.w700),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _StatChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final String sublabel;
  final Color color;

  const _StatChip({
    required this.icon,
    required this.label,
    required this.sublabel,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, size: 16, color: color),
        const SizedBox(height: 2),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w800,
            color: context.textPrimary,
          ),
        ),
        Text(
          sublabel,
          style: TextStyle(
            fontSize: 10,
            color: context.textSecondary,
          ),
        ),
      ],
    );
  }
}

class _OwnerSkeletonTile extends StatelessWidget {
  const _OwnerSkeletonTile();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.cardColor,
        borderRadius: BorderRadius.circular(AppTokens.radiusLg),
        boxShadow: AppTokens.shadowCard(context),
      ),
      child: Column(
        children: [
          Row(
            children: [
              const AppShimmer(width: 32, height: 32, circle: true),
              const SizedBox(width: 12),
              const AppShimmer(width: 52, height: 52, circle: true),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const AppShimmer(width: 120, height: 16, borderRadius: 4),
                    const SizedBox(height: 8),
                    const AppShimmer(width: 80, height: 12, borderRadius: 4),
                    const SizedBox(height: 8),
                    const AppShimmer(
                        width: double.infinity, height: 8, borderRadius: 4),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: List.generate(
              4,
              (_) => Column(
                children: [
                  const AppShimmer(width: 16, height: 16, circle: true),
                  const SizedBox(height: 4),
                  const AppShimmer(width: 24, height: 10, borderRadius: 2),
                  const SizedBox(height: 2),
                  const AppShimmer(width: 30, height: 8, borderRadius: 2),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
