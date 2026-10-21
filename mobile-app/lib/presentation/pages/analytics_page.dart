import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/theme_extensions.dart';
import '../../core/utils/formatters.dart';
import '../../generated/l10n/app_localizations.dart';
import '../providers/owner_analytics_provider.dart';

class AnalyticsPage extends ConsumerStatefulWidget {
  const AnalyticsPage({super.key});

  @override
  ConsumerState<AnalyticsPage> createState() => _AnalyticsPageState();
}

class _AnalyticsPageState extends ConsumerState<AnalyticsPage> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(ownerAnalyticsProvider.notifier).loadDashboard();
    });
  }

  Future<void> _onRefresh() async {
    await ref.read(ownerAnalyticsProvider.notifier).loadDashboard();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(ownerAnalyticsProvider);
    final data = state.dashboardData;
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: Text(AppLocalizations.of(context).analytics_title),
        backgroundColor: colorScheme.primary,
        foregroundColor: colorScheme.onPrimary,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: AppLocalizations.of(context).tooltip_refresh,
            onPressed: _onRefresh,
          ),
        ],
      ),
      body: state.isLoading && data == null
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _onRefresh,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  if (state.error != null) _ErrorBanner(message: state.error!),
                  _StatsRow(data: data),
                  const SizedBox(height: 24),
                  _PropertyStatus(data: data),
                  const SizedBox(height: 24),
                  _TopProperties(data: data),
                ],
              ),
            ),
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  final String message;

  const _ErrorBanner({required this.message});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: colorScheme.errorContainer,
        borderRadius: BorderRadius.circular(AppTheme.radiusMd),
        border: Border.all(color: colorScheme.error.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Icon(Icons.error_outline, color: colorScheme.error, size: 20),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: TextStyle(
                color: colorScheme.onErrorContainer,
                fontSize: 13,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatsRow extends StatelessWidget {
  final Map<String, dynamic>? data;

  const _StatsRow({this.data});

  String _val(dynamic key) {
    if (data == null) return '--';
    final v = data![key];
    if (v == null) return '--';
    return v.toString();
  }

  String _formatNum(dynamic key) {
    if (data == null) return '--';
    final v = data![key];
    if (v == null) return '--';
    if (v is num) {
      return v.toInt().toString().replaceAllMapped(
            RegExp(r'\B(?=(\d{3})+(?!\d))'),
            (match) => ',',
          );
    }
    return v.toString();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Wrap(
      spacing: 12,
      runSpacing: 12,
      children: [
        _StatCard(
          label: l10n.analytics_properties,
          value: _val('totalProperties'),
          icon: Icons.apartment_outlined,
          color: AppTheme.primary500,
        ),
        _StatCard(
          label: l10n.analytics_views,
          value: _formatNum('totalPropertyViews'),
          icon: Icons.visibility_outlined,
          color: AppTheme.atlas500,
        ),
        _StatCard(
          label: l10n.analytics_favorites,
          value: _formatNum('totalFavorites'),
          icon: Icons.favorite_outline,
          color: AppTheme.terracotta500,
        ),
        _StatCard(
          label: l10n.analytics_inquiries,
          value: _formatNum('totalInquiries'),
          icon: Icons.message_outlined,
          color: AppTheme.gold500,
        ),
        _StatCard(
          label: l10n.analytics_rating,
          value: data != null && data!['averageRating'] != null
              ? (data!['averageRating'] as num).toStringAsFixed(1)
              : '--',
          subValue: '${_val('totalReviews')} ${l10n.analytics_reviews}',
          icon: Icons.star_outline,
          color: AppTheme.success500,
        ),
        _StatCard(
          label: l10n.analytics_ad_spend,
          value: data != null && data!['totalAdSpend'] != null
              ? formatPrice(context, (data!['totalAdSpend'] as num).toDouble(),
                  compact: true)
              : '--',
          icon: Icons.payments_outlined,
          color: AppTheme.info500,
        ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final String? subValue;
  final IconData icon;
  final Color color;

  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
    this.subValue,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: '$label, $value${subValue != null ? ', $subValue' : ''}',
      child: SizedBox(
        width: (MediaQuery.of(context).size.width - 56) / 2,
        child: Card(
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppTheme.radiusLg),
          ),
          color: context.cardColor,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                  ),
                  child: Icon(icon, color: color, size: 24),
                ),
                const SizedBox(height: 12),
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: context.textPrimary,
                  ),
                ),
                if (subValue != null)
                  Text(
                    subValue!,
                    style: TextStyle(
                      fontSize: 11,
                      color: context.textSecondary,
                    ),
                  ),
                const SizedBox(height: 4),
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    color: context.textSecondary,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _PropertyStatus extends StatelessWidget {
  final Map<String, dynamic>? data;

  const _PropertyStatus({this.data});

  @override
  Widget build(BuildContext context) {
    final active = (data?['activeProperties'] ?? 0) as int;
    final pending = (data?['pendingProperties'] ?? 0) as int;
    final total = (data?['totalProperties'] ?? 0) as int;
    final inactive = total - active - pending;

    final l10n = AppLocalizations.of(context);
    final items = [
      {
        'label': l10n.analytics_active,
        'value': active,
        'color': AppTheme.primary500
      },
      {
        'label': l10n.status_pending,
        'value': pending,
        'color': AppTheme.gold500
      },
      {
        'label': l10n.analytics_inactive,
        'value': inactive,
        'color': AppTheme.gray400
      },
    ];

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
      ),
      color: context.cardColor,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              AppLocalizations.of(context).analytics_property_status,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: context.textPrimary,
              ),
            ),
            const SizedBox(height: 16),
            ...items.map((item) {
              final value = item['value'] as int;
              final pct = total > 0 ? value / total : 0.0;
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          item['label'] as String,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                            color: context.textSecondary,
                          ),
                        ),
                        Text(
                          '$value (${(pct * 100).toStringAsFixed(0)}%)',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: context.textPrimary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: pct.toDouble().clamp(0.0, 1.0),
                        backgroundColor: context.borderColor,
                        valueColor: AlwaysStoppedAnimation<Color>(
                          item['color'] as Color,
                        ),
                        minHeight: 8,
                      ),
                    ),
                  ],
                ),
              );
            }),
          ],
        ),
      ),
    );
  }
}

class _TopProperties extends StatelessWidget {
  final Map<String, dynamic>? data;

  const _TopProperties({this.data});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final colorScheme = Theme.of(context).colorScheme;
    final topProperties = (data?['topProperties'] as List<dynamic>?) ?? [];

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
      ),
      color: context.cardColor,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              l10n.analytics_top_properties,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: context.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            if (topProperties.isEmpty)
              Center(
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 24),
                  child: Text(
                    l10n.analytics_no_properties_yet,
                    style: TextStyle(color: context.textMuted),
                  ),
                ),
              )
            else
              ...topProperties.asMap().entries.map((entry) {
                final index = entry.key;
                final prop = entry.value as Map<String, dynamic>;
                final rankColor = index == 0
                    ? AppTheme.gold500
                    : index == 1
                        ? AppTheme.gray400
                        : index == 2
                            ? AppTheme.terracotta500
                            : AppTheme.gray300;
                final rankTextColor =
                    index < 3 ? colorScheme.onPrimary : context.textSecondary;

                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  child: Row(
                    children: [
                      Container(
                        width: 32,
                        height: 32,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: rankColor,
                          borderRadius:
                              BorderRadius.circular(AppTheme.radiusMd),
                        ),
                        child: Text(
                          '${index + 1}',
                          style: TextStyle(
                            color: rankTextColor,
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              prop['title'] ?? l10n.analytics_unknown,
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: context.textPrimary,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '${prop['city'] ?? ''} • ${prop['views'] ?? 0} ${l10n.analytics_views}',
                              style: TextStyle(
                                fontSize: 12,
                                color: context.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        formatPrice(
                            context, ((prop['price'] ?? 0) as num).toDouble(),
                            compact: true),
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: colorScheme.primary,
                        ),
                      ),
                    ],
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }
}
