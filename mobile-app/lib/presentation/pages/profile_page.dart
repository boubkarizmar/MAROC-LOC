import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import '../../generated/l10n/app_localizations.dart';
import '../providers/auth_provider.dart';
import '../providers/theme_provider.dart';
import '../widgets/language_switcher.dart';

import '../../core/design_system/tokens/app_tokens.dart';

class ProfilePage extends ConsumerWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final user = auth.user;
    final l10n = AppLocalizations.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.profile_title),
        backgroundColor: AppTheme.primary500,
        foregroundColor: AppTokens.gray50,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              if (user != null) ...[
                Semantics(
                  label: user.name,
                  child: CircleAvatar(
                    radius: 40,
                    backgroundColor: AppTheme.gold400,
                    child: Text(
                      user.name.isNotEmpty ? user.name[0].toUpperCase() : '?',
                      style: const TextStyle(
                          fontSize: 32, color: AppTokens.gray50),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Text(user.name, style: Theme.of(context).textTheme.titleLarge),
                Text(user.email, style: TextStyle(color: AppTheme.gray500)),
                const SizedBox(height: 8),
                Chip(
                  label: Text(user.role),
                  backgroundColor: AppTheme.primary50,
                ),
                const SizedBox(height: 24),
                ListTile(
                  leading: const Icon(Icons.edit),
                  title: Text(l10n.profile_edit),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => context.push('/profile/edit'),
                ),
                if (auth.isProprietaire || auth.isAdmin)
                  ListTile(
                    leading: const Icon(Icons.dashboard),
                    title: Text(l10n.profile_dashboard),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => context.push('/dashboard'),
                  ),
                ListTile(
                  leading: const Icon(Icons.receipt_long),
                  title: Text(l10n.my_reservations_title),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => context.push('/reservations'),
                ),
                if (auth.isAdmin)
                  ListTile(
                    leading: const Icon(Icons.admin_panel_settings),
                    title: Text(l10n.profile_admin),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => context.push('/admin'),
                  ),
                ListTile(
                  leading: const Icon(Icons.dark_mode),
                  title: Text(l10n.profile_dark_mode),
                  trailing: Switch(
                    value: Theme.of(context).brightness == Brightness.dark,
                    onChanged: (_) =>
                        ref.read(themeProvider.notifier).toggleTheme(),
                  ),
                ),
                const LanguageSwitcher(),
                const Divider(height: 32),
                Text(
                  l10n.profile_tools,
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                        color: AppTheme.gray500,
                        fontWeight: FontWeight.w600,
                      ),
                ),
                const SizedBox(height: 8),
                ListTile(
                  leading: const Icon(Icons.calculate_outlined,
                      color: AppTheme.primary500),
                  title: Text(l10n.profile_mortgage_calculator),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => context.push('/tools/mortgage-calculator'),
                ),
              ],
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    ref.read(authProvider.notifier).logout();
                    context.go('/login');
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.error500,
                    foregroundColor: AppTokens.gray50,
                  ),
                  child: Text(l10n.profile_logout),
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}
