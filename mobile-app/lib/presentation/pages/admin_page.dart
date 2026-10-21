import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/theme_extensions.dart';
import '../../generated/l10n/app_localizations.dart';
import '../../services/admin_service.dart';
import '../../data/models/property_model.dart';
import '../../data/models/user_model.dart';

import '../../core/design_system/tokens/app_tokens.dart';

class AdminPage extends StatefulWidget {
  const AdminPage({super.key});

  @override
  State<AdminPage> createState() => _AdminPageState();
}

class _AdminPageState extends State<AdminPage> {
  final AdminService _adminService = AdminService();

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return DefaultTabController(
      length: 5,
      child: Scaffold(
        backgroundColor: context.backgroundColor,
        appBar: AppBar(
          title: Text(l10n.admin_title),
          backgroundColor: context.backgroundColor,
          foregroundColor: context.textPrimary,
          elevation: 0,
          bottom: TabBar(
            isScrollable: true,
            labelColor: Theme.of(context).colorScheme.primary,
            unselectedLabelColor: context.textMuted,
            indicatorColor: Theme.of(context).colorScheme.primary,
            tabs: [
              Tab(
                  icon: const Icon(Icons.dashboard),
                  text: l10n.admin_tab_dashboard),
              Tab(
                  icon: const Icon(Icons.apartment),
                  text: l10n.admin_tab_properties),
              Tab(icon: const Icon(Icons.people), text: l10n.admin_tab_users),
              Tab(
                  icon: const Icon(Icons.reviews),
                  text: l10n.admin_tab_reviews),
              Tab(
                  icon: const Icon(Icons.settings),
                  text: l10n.admin_tab_settings),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _DashboardTab(adminService: _adminService),
            _PropertiesTab(adminService: _adminService),
            _UsersTab(adminService: _adminService),
            _ReviewsTab(adminService: _adminService),
            _SettingsTab(adminService: _adminService),
          ],
        ),
      ),
    );
  }
}

// ==================== DASHBOARD TAB ====================

class _DashboardTab extends StatefulWidget {
  final AdminService adminService;
  const _DashboardTab({required this.adminService});

  @override
  State<_DashboardTab> createState() => _DashboardTabState();
}

class _DashboardTabState extends State<_DashboardTab> {
  Future<Map<String, dynamic>>? _future;

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    _future = () async {
      final platform = await widget.adminService.getPlatformAnalytics();
      final monthly = await widget.adminService.getMonthlyAnalytics();
      final yearly = await widget.adminService.getYearlyAnalytics();
      return {
        'platform': platform,
        'monthly': monthly,
        'yearly': yearly,
      };
    }();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return FutureBuilder<Map<String, dynamic>>(
      future: _future,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        final data = snapshot.data ?? {};
        final platform = data['platform'] as Map<String, dynamic>? ?? {};
        final monthly = data['monthly'] as List<dynamic>? ?? [];
        final yearly = data['yearly'] as List<dynamic>? ?? [];

        return RefreshIndicator(
          onRefresh: () async => setState(() => _load()),
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _buildStatsGrid(context, platform, l10n),
              const SizedBox(height: 24),
              _buildSectionTitle(context, l10n.admin_monthly_trends),
              const SizedBox(height: 12),
              _buildBarChart(context, monthly, 'monthLabel', 'properties'),
              const SizedBox(height: 24),
              _buildSectionTitle(context, l10n.admin_yearly_trends),
              const SizedBox(height: 12),
              _buildBarChart(context, yearly, 'year', 'properties'),
              const SizedBox(height: 24),
            ],
          ),
        );
      },
    );
  }

  Widget _buildStatsGrid(BuildContext context, Map<String, dynamic> platform,
      AppLocalizations l10n) {
    final stats = [
      {
        'icon': Icons.people,
        'label': l10n.admin_users,
        'value': '${platform['totalUsers'] ?? 0}',
      },
      {
        'icon': Icons.apartment,
        'label': l10n.admin_properties,
        'value': '${platform['totalProperties'] ?? 0}',
      },
      {
        'icon': Icons.pending_actions,
        'label': l10n.admin_pending_approval,
        'value': '${platform['pendingProperties'] ?? 0}',
      },
      {
        'icon': Icons.message,
        'label': l10n.admin_total_messages,
        'value': '${platform['totalMessages'] ?? 0}',
      },
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 1.2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
      ),
      itemCount: stats.length,
      itemBuilder: (context, index) {
        final stat = stats[index];
        return Card(
          color: context.cardColor,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(stat['icon'] as IconData,
                    color: Theme.of(context).colorScheme.primary),
                const Spacer(),
                Text(
                  stat['value'] as String,
                  style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: context.textPrimary),
                ),
                Text(
                  stat['label'] as String,
                  style: TextStyle(fontSize: 12, color: context.textSecondary),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildSectionTitle(BuildContext context, String title) {
    return Text(
      title,
      style: TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.bold,
          color: context.textPrimary),
    );
  }

  Widget _buildBarChart(BuildContext context, List<dynamic> data,
      String labelKey, String valueKey) {
    if (data.isEmpty) {
      return Card(
        color: context.cardColor,
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Center(
              child: Text(AppLocalizations.of(context).admin_no_monthly_data,
                  style: TextStyle(color: context.textMuted))),
        ),
      );
    }

    final values =
        data.map((e) => (e[valueKey] as num?)?.toDouble() ?? 0.0).toList();
    final maxValue =
        values.isEmpty ? 1.0 : values.reduce((a, b) => a > b ? a : b);
    final safeMax = maxValue == 0 ? 1.0 : maxValue;

    return Card(
      color: context.cardColor,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: SizedBox(
          height: 160,
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: List.generate(data.length, (index) {
              final item = data[index];
              final label = item[labelKey] ?? item['month'] ?? '';
              final value = values[index];
              final heightFactor = value / safeMax;

              return Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      Text('${value.toInt()}',
                          style: TextStyle(
                              fontSize: 10, color: context.textSecondary)),
                      const SizedBox(height: 4),
                      Container(
                        height: 100 * heightFactor,
                        decoration: BoxDecoration(
                          color: AppTheme.primary500.withValues(alpha: 0.7),
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text('$label',
                          style:
                              TextStyle(fontSize: 10, color: context.textMuted),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis),
                    ],
                  ),
                ),
              );
            }),
          ),
        ),
      ),
    );
  }
}

// ==================== PROPERTIES TAB ====================

class _PropertiesTab extends StatefulWidget {
  final AdminService adminService;
  const _PropertiesTab({required this.adminService});

  @override
  State<_PropertiesTab> createState() => _PropertiesTabState();
}

class _PropertiesTabState extends State<_PropertiesTab> {
  Future<List<dynamic>>? _future;

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    _future = widget.adminService.getAdminProperties();
  }

  Future<void> _approve(int id) async {
    final ok = await widget.adminService.approveProperty(id);
    if (ok && mounted) {
      setState(() => _load());
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(AppLocalizations.of(context).approve)),
      );
    }
  }

  Future<void> _reject(int id) async {
    final ok = await widget.adminService
        .rejectProperty(id, reason: 'Rejected by admin');
    if (ok && mounted) {
      setState(() => _load());
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(AppLocalizations.of(context).reject)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return FutureBuilder<List<dynamic>>(
      future: _future,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        final items = snapshot.data ?? [];
        final properties = items
            .map((e) => PropertyModel.fromJson(e as Map<String, dynamic>))
            .toList();

        return RefreshIndicator(
          onRefresh: () async => setState(() => _load()),
          child: ListView.builder(
            padding: const EdgeInsets.all(12),
            itemCount: properties.length,
            itemBuilder: (context, index) {
              final p = properties[index];
              final isPending = p.status == 'PENDING';

              return Card(
                color: context.cardColor,
                margin: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  title: Text(p.title,
                      style: TextStyle(
                          color: context.textPrimary,
                          fontWeight: FontWeight.w600)),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                          '${p.city} • ${p.price.toInt()} ${l10n.property_currency}',
                          style: TextStyle(color: context.textSecondary)),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          _StatusChip(status: p.status),
                          if (isPending) ...[
                            const SizedBox(width: 8),
                            _ActionChip(
                              label: l10n.approve,
                              color: AppTheme.success500,
                              onTap: () => _approve(p.id),
                            ),
                            const SizedBox(width: 8),
                            _ActionChip(
                              label: l10n.reject,
                              color: AppTheme.error500,
                              onTap: () => _reject(p.id),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                  isThreeLine: true,
                ),
              );
            },
          ),
        );
      },
    );
  }
}

// ==================== USERS TAB ====================

class _UsersTab extends StatefulWidget {
  final AdminService adminService;
  const _UsersTab({required this.adminService});

  @override
  State<_UsersTab> createState() => _UsersTabState();
}

class _UsersTabState extends State<_UsersTab> {
  Future<List<dynamic>>? _future;

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    _future = widget.adminService.getAdminUsers();
  }

  Future<void> _verify(int id) async {
    final ok = await widget.adminService.verifyUser(id);
    if (ok && mounted) {
      setState(() => _load());
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(AppLocalizations.of(context).verify)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return FutureBuilder<List<dynamic>>(
      future: _future,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        final items = snapshot.data ?? [];
        final users = items
            .map((e) => UserModel.fromJson(e as Map<String, dynamic>))
            .toList();

        return RefreshIndicator(
          onRefresh: () async => setState(() => _load()),
          child: ListView.builder(
            padding: const EdgeInsets.all(12),
            itemCount: users.length,
            itemBuilder: (context, index) {
              final u = users[index];
              return Card(
                color: context.cardColor,
                margin: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: AppTheme.primary500,
                    child: Text(
                      u.name.isNotEmpty ? u.name[0].toUpperCase() : '?',
                      style: const TextStyle(color: AppTokens.gray50),
                    ),
                  ),
                  title: Text(u.name,
                      style: TextStyle(
                          color: context.textPrimary,
                          fontWeight: FontWeight.w600)),
                  subtitle: Text('${u.email} • ${u.city ?? ''}',
                      style: TextStyle(color: context.textSecondary)),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      _StatusChip(status: u.role),
                      const SizedBox(width: 8),
                      if (!(u.isVerified ?? false))
                        _ActionChip(
                          label: l10n.verify,
                          color: AppTheme.success500,
                          onTap: () => _verify(u.id),
                        )
                      else
                        Chip(
                          label: Text(l10n.verify,
                              style: const TextStyle(fontSize: 11)),
                          backgroundColor: AppTheme.success50,
                          side: BorderSide.none,
                        ),
                    ],
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }
}

// ==================== REVIEWS TAB ====================

class _ReviewsTab extends StatefulWidget {
  final AdminService adminService;
  const _ReviewsTab({required this.adminService});

  @override
  State<_ReviewsTab> createState() => _ReviewsTabState();
}

class _ReviewsTabState extends State<_ReviewsTab> {
  Future<List<dynamic>>? _future;

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    _future = widget.adminService.getPendingReviews();
  }

  Future<void> _moderate(int id, String action) async {
    final ok = await widget.adminService.moderateReview(id, action);
    if (ok && mounted) {
      setState(() => _load());
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: Text(action == 'APPROVE'
                ? AppLocalizations.of(context).approve
                : AppLocalizations.of(context).reject)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return FutureBuilder<List<dynamic>>(
      future: _future,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        final items = snapshot.data ?? [];

        return RefreshIndicator(
          onRefresh: () async => setState(() => _load()),
          child: ListView.builder(
            padding: const EdgeInsets.all(12),
            itemCount: items.length,
            itemBuilder: (context, index) {
              final r = items[index] as Map<String, dynamic>;
              final id = r['id'] as int? ?? 0;
              final comment = r['comment'] as String? ?? '';
              final userName = r['userName'] as String? ?? 'User';
              final rating = r['rating'] as int? ?? 0;

              return Card(
                color: context.cardColor,
                margin: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  title: Text(userName,
                      style: TextStyle(
                          color: context.textPrimary,
                          fontWeight: FontWeight.w600)),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: List.generate(
                            5,
                            (i) => Icon(Icons.star,
                                size: 14,
                                color: i < rating
                                    ? AppTheme.gold400
                                    : context.borderColor)),
                      ),
                      const SizedBox(height: 4),
                      Text(comment,
                          style: TextStyle(color: context.textSecondary)),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          _ActionChip(
                            label: l10n.approve,
                            color: AppTheme.success500,
                            onTap: () => _moderate(id, 'APPROVE'),
                          ),
                          const SizedBox(width: 8),
                          _ActionChip(
                            label: l10n.reject,
                            color: AppTheme.error500,
                            onTap: () => _moderate(id, 'REJECT'),
                          ),
                        ],
                      ),
                    ],
                  ),
                  isThreeLine: true,
                ),
              );
            },
          ),
        );
      },
    );
  }
}

// ==================== SETTINGS TAB ====================

class _SettingsTab extends StatefulWidget {
  final AdminService adminService;
  const _SettingsTab({required this.adminService});

  @override
  State<_SettingsTab> createState() => _SettingsTabState();
}

class _SettingsTabState extends State<_SettingsTab> {
  Future<Map<String, dynamic>>? _future;

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    _future = widget.adminService.getSettings();
  }

  Future<void> _toggle(
      Map<String, dynamic> current, String key, bool value) async {
    final updated = Map<String, dynamic>.from(current);
    updated[key] = value;
    final ok = await widget.adminService.updateSettings(updated);
    if (ok && mounted) {
      setState(() => _load());
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return FutureBuilder<Map<String, dynamic>>(
      future: _future,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        final settings = snapshot.data ?? {};

        final flags = [
          {'key': 'aiChatEnabled', 'label': l10n.feature_ai_chat},
          {'key': 'voiceSearchEnabled', 'label': l10n.feature_voice_search},
          {'key': 'adsEnabled', 'label': l10n.feature_ads},
          {'key': 'reviewsEnabled', 'label': l10n.feature_reviews},
          {'key': 'paymentsEnabled', 'label': l10n.feature_payments},
        ];

        return ListView.builder(
          padding: const EdgeInsets.all(12),
          itemCount: flags.length,
          itemBuilder: (context, index) {
            final flag = flags[index];
            final key = flag['key']!;
            final label = flag['label']!;
            final value = settings[key] as bool? ?? true;

            return Card(
              color: context.cardColor,
              margin: const EdgeInsets.only(bottom: 8),
              child: SwitchListTile(
                title:
                    Text(label, style: TextStyle(color: context.textPrimary)),
                value: value,
                activeColor: AppTheme.primary500,
                onChanged: (newValue) => _toggle(settings, key, newValue),
              ),
            );
          },
        );
      },
    );
  }
}

// ==================== SHARED WIDGETS ====================

class _StatusChip extends StatelessWidget {
  final String status;
  const _StatusChip({required this.status});

  @override
  Widget build(BuildContext context) {
    Color color;
    switch (status.toUpperCase()) {
      case 'PENDING':
        color = AppTheme.warning500;
        break;
      case 'APPROVED':
      case 'VERIFIED':
        color = AppTheme.success500;
        break;
      case 'REJECTED':
        color = AppTheme.error500;
        break;
      default:
        color = context.textMuted;
    }

    return Chip(
      visualDensity: VisualDensity.compact,
      label: Text(status, style: const TextStyle(fontSize: 11)),
      backgroundColor: color.withValues(alpha: 0.1),
      side: BorderSide.none,
      labelStyle: TextStyle(color: color, fontWeight: FontWeight.w500),
      padding: EdgeInsets.zero,
    );
  }
}

class _ActionChip extends StatelessWidget {
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _ActionChip(
      {required this.label, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Chip(
        visualDensity: VisualDensity.compact,
        label: Text(label, style: const TextStyle(fontSize: 11)),
        backgroundColor: color.withValues(alpha: 0.1),
        side: BorderSide.none,
        labelStyle: TextStyle(color: color, fontWeight: FontWeight.w600),
        padding: EdgeInsets.zero,
      ),
    );
  }
}
