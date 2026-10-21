import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/theme_extensions.dart';
import '../../core/utils/formatters.dart';
import '../../generated/l10n/app_localizations.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shimmer/shimmer.dart';
import '../providers/property_provider.dart';
import '../providers/platform_provider.dart';
import '../providers/owner_analytics_provider.dart';
import '../widgets/boost_bottom_sheet.dart';
import '../../data/models/property_model.dart';

class DashboardPage extends ConsumerStatefulWidget {
  const DashboardPage({super.key});

  @override
  ConsumerState<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends ConsumerState<DashboardPage> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(propertyProvider.notifier).loadMyProperties();
      ref.read(platformStatsProvider.notifier).loadStats();
      ref.read(ownerAnalyticsProvider.notifier).loadDashboard();
    });
  }

  @override
  Widget build(BuildContext context) {
    final propertyState = ref.watch(propertyProvider);
    final analyticsState = ref.watch(ownerAnalyticsProvider);
    final myProperties = propertyState.myProperties;
    final isLoading = propertyState.isLoading;
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: Text(AppLocalizations.of(context).dashboard_title),
        backgroundColor: colorScheme.primary,
        foregroundColor: colorScheme.onPrimary,
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => context.push('/property/create'),
            tooltip: AppLocalizations.of(context).tooltip_new_property,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        heroTag: 'chatbot_dashboard',
        tooltip: AppLocalizations.of(context).tooltip_chatbot,
        onPressed: () => context.push('/chatbot'),
        backgroundColor: colorScheme.primary,
        elevation: 6,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Icon(Icons.auto_awesome, color: colorScheme.onPrimary, size: 26),
      ),
      body: isLoading && myProperties.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () async {
                await ref.read(propertyProvider.notifier).loadMyProperties();
                await ref.read(platformStatsProvider.notifier).loadStats();
                await ref.read(ownerAnalyticsProvider.notifier).loadDashboard();
              },
              child: CustomScrollView(
                slivers: [
                  // Stats cards
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: analyticsState.isLoading &&
                              analyticsState.dashboardData == null
                          ? const Center(child: CircularProgressIndicator())
                          : analyticsState.error != null &&
                                  analyticsState.dashboardData == null
                              ? _buildStatsEmptyState(analyticsState.error!)
                              : _buildStatsGrid(
                                  analyticsState.dashboardData ?? {}),
                    ),
                  ),
                  // Quick actions
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: _buildQuickActions(context),
                    ),
                  ),
                  const SliverToBoxAdapter(child: SizedBox(height: 16)),
                  // Properties header
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            AppLocalizations.of(context)
                                .dashboard_my_properties,
                            style: Theme.of(context)
                                .textTheme
                                .titleLarge
                                ?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                          ),
                          Text(AppLocalizations.of(context)
                              .dashboard_property_count(myProperties.length)),
                        ],
                      ),
                    ),
                  ),
                  const SliverToBoxAdapter(child: SizedBox(height: 8)),
                  // Property list
                  myProperties.isEmpty
                      ? SliverFillRemaining(
                          child: Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.home_work,
                                    size: 64, color: context.textMuted),
                                const SizedBox(height: 16),
                                Text(AppLocalizations.of(context)
                                    .dashboard_no_properties),
                                const SizedBox(height: 8),
                                ElevatedButton(
                                  onPressed: () =>
                                      context.push('/property/create'),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: colorScheme.primary,
                                    foregroundColor: colorScheme.onPrimary,
                                  ),
                                  child: Text(AppLocalizations.of(context)
                                      .dashboard_add_property),
                                ),
                              ],
                            ),
                          ),
                        )
                      : SliverPadding(
                          padding: const EdgeInsets.all(16),
                          sliver: SliverList(
                            delegate: SliverChildBuilderDelegate(
                              (context, index) {
                                final property = myProperties[index];
                                return _PropertyCard(
                                  property: property,
                                  onTap: () =>
                                      context.push('/property/${property.id}'),
                                  onEdit: () => context
                                      .push('/property/${property.id}/edit'),
                                  onDelete: () => _confirmDelete(property),
                                  onBoost: () => showBoostBottomSheet(
                                    context,
                                    propertyId: property.id,
                                    propertyTitle: property.title,
                                  ),
                                );
                              },
                              childCount: myProperties.length,
                            ),
                          ),
                        ),
                ],
              ),
            ),
    );
  }

  Widget _buildStatsGrid(Map<String, dynamic> stats) {
    final l10n = AppLocalizations.of(context);
    final items = [
      _StatItem(
          l10n.dashboard_title,
          stats['totalProperties']?.toString() ?? '0',
          Icons.home_work,
          AppTheme.primary500),
      _StatItem(
          l10n.stats_views,
          stats['totalPropertyViews']?.toString() ?? '0',
          Icons.visibility,
          AppTheme.info500),
      _StatItem(
          l10n.stats_favorites,
          stats['totalFavorites']?.toString() ?? '0',
          Icons.favorite,
          AppTheme.error500),
      _StatItem(
          l10n.stats_inquiries,
          stats['totalInquiries']?.toString() ?? '0',
          Icons.message,
          AppTheme.warning500),
    ];

    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      childAspectRatio: 1.6,
      crossAxisSpacing: 8,
      mainAxisSpacing: 8,
      children: items.map((item) => _StatCard(item: item)).toList(),
    );
  }

  Widget _buildQuickActions(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final l10n = AppLocalizations.of(context);
    final actions = [
      _QuickAction(l10n.quick_action_new_ad, Icons.add_business,
          colorScheme.primary, () => context.push('/property/create')),
      _QuickAction(l10n.quick_action_visits, Icons.calendar_month,
          AppTheme.info500, () => context.push('/dashboard/visits')),
      _QuickAction(l10n.quick_action_analytics, Icons.analytics,
          AppTheme.warning500, () => context.push('/dashboard/analytics')),
      _QuickAction(
          l10n.quick_action_boost,
          Icons.rocket_launch,
          AppTheme.gold500,
          () => _showBoostPropertyPicker(context)),
    ];

    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: actions
          .map((a) => ActionChip(
                avatar: Icon(a.icon, color: a.color, size: 18),
                label: Text(a.label),
                onPressed: a.onTap,
                backgroundColor: a.color.withValues(alpha: 0.1),
                side: BorderSide(color: a.color.withValues(alpha: 0.3)),
              ))
          .toList(),
    );
  }

  void _showBoostPropertyPicker(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final properties = ref.read(propertyProvider).myProperties;
    if (properties.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l10n.dashboard_no_properties)),
      );
      return;
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(AppTheme.radiusLg),
        ),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    margin: const EdgeInsets.only(bottom: 16),
                    decoration: BoxDecoration(
                      color: context.borderColor,
                      borderRadius: BorderRadius.circular(AppTheme.radiusFull),
                    ),
                  ),
                ),
                Text(
                  l10n.quick_action_boost,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: context.textPrimary,
                      ),
                ),
                const SizedBox(height: 8),
                const SizedBox(height: 16),
                ...properties.map((property) => ListTile(
                      leading: ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: property.coverImage != null
                            ? CachedNetworkImage(
                                imageUrl: property.coverImage!,
                                width: 48,
                                height: 48,
                                fit: BoxFit.cover,
                              )
                            : Container(
                                width: 48,
                                height: 48,
                                color: context.shimmerBase,
                                child: const Icon(Icons.image),
                              ),
                      ),
                      title: Text(
                        property.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      subtitle: Text(formatPrice(context, property.price)),
                      trailing:
                          Icon(Icons.rocket_launch, color: AppTheme.gold500),
                      onTap: () {
                        Navigator.of(ctx).pop();
                        showBoostBottomSheet(
                          context,
                          propertyId: property.id,
                          propertyTitle: property.title,
                        );
                      },
                    )),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildStatsEmptyState(String error) {
    final l10n = AppLocalizations.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 24),
      child: Center(
        child: Column(
          children: [
            Icon(Icons.analytics_outlined,
                size: 48, color: context.textMuted),
            const SizedBox(height: 12),
            Text(
              l10n.error_loading,
              style: TextStyle(color: context.textSecondary),
            ),
            const SizedBox(height: 8),
            TextButton(
              onPressed: () =>
                  ref.read(ownerAnalyticsProvider.notifier).loadDashboard(),
              child: Text(l10n.retry),
            ),
          ],
        ),
      ),
    );
  }

  void _confirmDelete(PropertyModel property) {
    final colorScheme = Theme.of(context).colorScheme;
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(AppLocalizations.of(context).dashboard_confirm_delete),
        content: Text(AppLocalizations.of(context)
            .delete_confirmation_message(property.title)),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text(AppLocalizations.of(context).cancel)),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              await ref
                  .read(propertyProvider.notifier)
                  .deleteProperty(property.id);
            },
            style: ElevatedButton.styleFrom(backgroundColor: colorScheme.error),
            child: Text(AppLocalizations.of(context).delete),
          ),
        ],
      ),
    );
  }
}

class _StatItem {
  final String label;
  final String value;
  final IconData icon;
  final Color color;
  _StatItem(this.label, this.value, this.icon, this.color);
}

class _StatCard extends StatelessWidget {
  final _StatItem item;
  const _StatCard({required this.item});

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: '${item.label}, ${item.value}',
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: item.color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: item.color.withValues(alpha: 0.2)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(item.icon, color: item.color, size: 20),
            const Spacer(),
            Text(item.value,
                style:
                    const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            Text(item.label,
                style: TextStyle(fontSize: 12, color: context.textSecondary)),
          ],
        ),
      ),
    );
  }
}

class _QuickAction {
  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;
  _QuickAction(this.label, this.icon, this.color, this.onTap);
}

class _PropertyCard extends StatelessWidget {
  final PropertyModel property;
  final VoidCallback onTap;
  final VoidCallback onEdit;
  final VoidCallback onDelete;
  final VoidCallback onBoost;

  const _PropertyCard({
    required this.property,
    required this.onTap,
    required this.onEdit,
    required this.onDelete,
    required this.onBoost,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: property.coverImage != null
                    ? CachedNetworkImage(
                        imageUrl: property.coverImage!,
                        width: 80,
                        height: 80,
                        fit: BoxFit.cover,
                        placeholder: (context, url) => Shimmer.fromColors(
                          baseColor: context.shimmerBase,
                          highlightColor: context.shimmerHighlight,
                          child: Container(color: colorScheme.surface),
                        ),
                        errorWidget: (context, url, error) => Container(
                          color: context.shimmerBase,
                          child: Icon(Icons.image_not_supported,
                              color: colorScheme.onSurfaceVariant),
                        ),
                      )
                    : _placeholderImage(context),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      property.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 4),
                    Text(
                        '${property.city} • ${formatPrice(context, property.price)}',
                        style: TextStyle(
                            color: context.textSecondary, fontSize: 13)),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: _statusColor(property.status)
                            .withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        _statusLabel(property.status, context),
                        style: TextStyle(
                          fontSize: 11,
                          color: _statusColor(property.status),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              Column(
                children: [
                  IconButton(
                    icon: const Icon(Icons.edit, size: 20),
                    tooltip: AppLocalizations.of(context).edit,
                    onPressed: onEdit,
                    color: colorScheme.primary,
                  ),
                  IconButton(
                    icon: const Icon(Icons.delete, size: 20),
                    tooltip: AppLocalizations.of(context).delete,
                    onPressed: onDelete,
                    color: colorScheme.error,
                  ),
                  IconButton(
                    icon: const Icon(Icons.rocket_launch, size: 20),
                    tooltip: AppLocalizations.of(context).tooltip_boost,
                    onPressed: onBoost,
                    color: AppTheme.gold500,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _placeholderImage(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Container(
      width: 80,
      height: 80,
      color: context.shimmerBase,
      child: Icon(Icons.image, color: colorScheme.onSurfaceVariant),
    );
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'APPROVED':
      case 'AVAILABLE':
        return AppTheme.success500;
      case 'PENDING':
        return AppTheme.warning500;
      case 'RESERVED':
      case 'RENTED':
        return AppTheme.info500;
      default:
        return AppTheme.gray500;
    }
  }

  String _statusLabel(String status, BuildContext context) {
    final l10n = AppLocalizations.of(context);
    switch (status) {
      case 'APPROVED':
      case 'AVAILABLE':
        return l10n.status_available;
      case 'PENDING':
        return l10n.status_pending;
      case 'RESERVED':
        return l10n.status_reserved;
      case 'RENTED':
        return l10n.status_rented;
      default:
        return status;
    }
  }
}
