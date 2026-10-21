import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../data/models/notification_model.dart';
import '../../presentation/providers/notification_provider.dart';
import '../../generated/l10n/app_localizations.dart';


class NotificationsPage extends ConsumerStatefulWidget {
  const NotificationsPage({super.key});

  @override
  ConsumerState<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends ConsumerState<NotificationsPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(notificationProvider.notifier).initialize();
    });
  }

  IconData _getIcon(String type) {
    return switch (type) {
      'NEW_MESSAGE' || 'NEW_CONVERSATION' => Icons.message,
      'PRICE_DROP' => Icons.trending_down,
      'VISIT_REMINDER' || 'VISIT_SCHEDULED' || 'VISIT_CONFIRMED' || 'VISIT_CANCELLED' => Icons.calendar_today,
      'PROPERTY_APPROVED' || 'ADVERTISEMENT_APPROVED' || 'REVIEW_APPROVED' => Icons.check_circle,
      'PROPERTY_REJECTED' || 'ADVERTISEMENT_REJECTED' || 'REVIEW_REJECTED' || 'RESERVATION_REFUSED' || 'PURCHASE_FAILED' || 'PAYMENT_FAILED' => Icons.cancel,
      'FRAUD_FLAG' || 'SUSPICIOUS_LOGIN' => Icons.warning,
      'AI_RECOMMENDATION' => Icons.smart_toy,
      'PAYMENT_CMI_SUCCESS' || 'PAYMENT_STRIPE_SUCCESS' || 'PURCHASE_PAID' => Icons.credit_card,
      'RESERVATION_CREATED' || 'PURCHASE_CREATED' => Icons.home,
      _ => Icons.notifications,
    };
  }

  Color _getIconColor(String type, ColorScheme colors) {
    return switch (type) {
      'NEW_MESSAGE' || 'NEW_CONVERSATION' => colors.primary,
      'PRICE_DROP' => colors.tertiary,
      'VISIT_REMINDER' || 'VISIT_SCHEDULED' || 'VISIT_CONFIRMED' || 'VISIT_CANCELLED' => colors.secondary,
      'PROPERTY_APPROVED' || 'ADVERTISEMENT_APPROVED' || 'REVIEW_APPROVED' => Colors.green,
      'PROPERTY_REJECTED' || 'ADVERTISEMENT_REJECTED' || 'REVIEW_REJECTED' || 'RESERVATION_REFUSED' || 'PURCHASE_FAILED' || 'PAYMENT_FAILED' => colors.error,
      'FRAUD_FLAG' || 'SUSPICIOUS_LOGIN' => colors.error,
      'AI_RECOMMENDATION' => Colors.purple,
      'PAYMENT_CMI_SUCCESS' || 'PAYMENT_STRIPE_SUCCESS' || 'PURCHASE_PAID' => Colors.orange,
      'RESERVATION_CREATED' || 'PURCHASE_CREATED' => colors.primary,
      _ => colors.onSurfaceVariant,
    };
  }

  void _openNotification(NotificationModel notif) {
    if (notif.isUnread) {
      ref.read(notificationProvider.notifier).markAsRead(notif.id);
    }
    if (notif.actionUrl != null && notif.actionUrl!.startsWith('/')) {
      context.push(notif.actionUrl!);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(notificationProvider);
    final l10n = AppLocalizations.of(context);
    final colors = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.notifications_title),
        actions: [
          if (state.unreadCount > 0)
            TextButton(
              onPressed: () => ref.read(notificationProvider.notifier).markAllAsRead(),
              child: Text(l10n.notifications_mark_all_read),
            ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(notificationProvider.notifier).refresh(),
        child: state.loading && state.notifications.isEmpty
            ? const Center(child: CircularProgressIndicator())
            : state.notifications.isEmpty
                ? LayoutBuilder(
                    builder: (context, constraints) {
                      return SingleChildScrollView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        child: ConstrainedBox(
                          constraints: BoxConstraints(minHeight: constraints.maxHeight),
                          child: Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.notifications_none, size: 64, color: colors.outline),
                                const SizedBox(height: 16),
                                Text(l10n.notifications_empty, style: TextStyle(color: colors.outline)),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  )
                : ListView.builder(
                    physics: const AlwaysScrollableScrollPhysics(),
                    itemCount: state.notifications.length + (state.hasMore ? 1 : 0),
                    itemBuilder: (context, index) {
                      if (index >= state.notifications.length) {
                        if (state.loading) {
                          return const Padding(
                            padding: EdgeInsets.all(16),
                            child: Center(child: CircularProgressIndicator()),
                          );
                        }
                        return Padding(
                          padding: const EdgeInsets.all(16),
                          child: Center(
                            child: TextButton(
                              onPressed: () => ref.read(notificationProvider.notifier).loadMore(),
                              child: const Text('Charger plus'),
                            ),
                          ),
                        );
                      }

                      final notif = state.notifications[index];
                      final iconColor = _getIconColor(notif.type, colors);

                      return Dismissible(
                        key: Key('notification-${notif.id}'),
                        direction: DismissDirection.endToStart,
                        background: Container(
                          alignment: Alignment.centerRight,
                          padding: const EdgeInsets.only(right: 20),
                          color: colors.error,
                          child: Icon(Icons.delete, color: colors.onError),
                        ),
                        onDismissed: (_) => ref.read(notificationProvider.notifier).deleteNotification(notif.id),
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: iconColor.withValues(alpha: 0.1),
                            child: notif.icon != null && notif.icon!.isNotEmpty
                                ? Text(notif.icon!, style: const TextStyle(fontSize: 20))
                                : Icon(_getIcon(notif.type), color: iconColor),
                          ),
                          title: Text(
                            notif.title,
                            style: TextStyle(
                              fontWeight: notif.isUnread ? FontWeight.bold : FontWeight.normal,
                            ),
                          ),
                          subtitle: Text(
                            notif.message,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          trailing: notif.isUnread
                              ? Container(
                                  width: 8,
                                  height: 8,
                                  decoration: BoxDecoration(
                                    color: colors.primary,
                                    shape: BoxShape.circle,
                                  ),
                                )
                              : null,
                          onTap: () => _openNotification(notif),
                          onLongPress: () => ref.read(notificationProvider.notifier).deleteNotification(notif.id),
                        ),
                      );
                    },
                  ),
      ),
    );
  }
}
