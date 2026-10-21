import 'package:flutter_local_notifications/flutter_local_notifications.dart';

Future<void> initLocalNotifications(
  FlutterLocalNotificationsPlugin plugin,
  void Function(NotificationResponse) onTap,
) async {
  const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
  const iosSettings = DarwinInitializationSettings();
  const initSettings = InitializationSettings(
    android: androidSettings,
    iOS: iosSettings,
  );
  await plugin.initialize(
    settings: initSettings,
    onDidReceiveNotificationResponse: onTap,
  );
}
