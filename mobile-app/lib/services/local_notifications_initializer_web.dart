import 'package:flutter_local_notifications/flutter_local_notifications.dart';

Future<void> initLocalNotifications(
  FlutterLocalNotificationsPlugin plugin,
  void Function(NotificationResponse) onTap,
) async {
  // Les notifications locales ne sont pas supportées sur le web.
}
