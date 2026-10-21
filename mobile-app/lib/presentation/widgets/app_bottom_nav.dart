import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../generated/l10n/app_localizations.dart';
import '../providers/notification_provider.dart';

class AppBottomNav extends ConsumerWidget {
  final Widget child;

  const AppBottomNav({super.key, required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final location = GoRouterState.of(context).matchedLocation;
    final colorScheme = Theme.of(context).colorScheme;
    final l10n = AppLocalizations.of(context);
    final unreadCount = ref.watch(notificationProvider).unreadCount;

    final tabs = [
      _NavItem(label: l10n.nav_home, icon: Icons.home_rounded, path: '/home'),
      _NavItem(
          label: l10n.nav_search, icon: Icons.search_rounded, path: '/search'),
      _NavItem(
          label: l10n.nav_favorites,
          icon: Icons.favorite_rounded,
          path: '/favorites'),
      _NavItem(
          label: l10n.nav_messages,
          icon: Icons.chat_bubble_rounded,
          path: '/messages'),
      _NavItem(
          label: l10n.notifications_title,
          icon: Icons.notifications_rounded,
          path: '/notifications',
          badgeCount: unreadCount),
      _NavItem(
          label: l10n.nav_profile,
          icon: Icons.person_rounded,
          path: '/profile'),
    ];

    final currentIndex = tabs.indexWhere((t) => location == t.path);

    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: currentIndex >= 0 ? currentIndex : 0,
        onDestinationSelected: (index) {
          final targetPath = tabs[index].path;
          if (location != targetPath) {
            context.go(targetPath);
          }
        },
        backgroundColor: colorScheme.surface,
        indicatorColor: colorScheme.primaryContainer,
        destinations: tabs.map((tab) {
          final isSelected = location == tab.path;
          return Semantics(
            selected: isSelected,
            label: tab.label,
            child: NavigationDestination(
              icon: Badge(
                isLabelVisible: tab.badgeCount > 0,
                label: tab.badgeCount > 99
                    ? const Text('99+')
                    : Text('${tab.badgeCount}'),
                child: Icon(
                  tab.icon,
                  color: isSelected
                      ? colorScheme.primary
                      : colorScheme.onSurfaceVariant,
                ),
              ),
              label: tab.label,
              selectedIcon: Icon(tab.icon, color: colorScheme.primary),
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _NavItem {
  final String label;
  final IconData icon;
  final String path;
  final int badgeCount;

  _NavItem({
    required this.label,
    required this.icon,
    required this.path,
    this.badgeCount = 0,
  });
}
