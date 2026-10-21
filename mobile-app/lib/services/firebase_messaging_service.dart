import 'dart:async';
import 'dart:convert';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import 'local_notifications_initializer.dart'
    if (dart.library.html) 'local_notifications_initializer_web.dart';

/// Background message handler (must be top-level)
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  try {
    await Firebase.initializeApp();
    debugPrint('Handling background message: ${message.messageId}');
  } catch (_) {
    // Firebase non disponible (web sans config, desktop non supporté) : ignorer
  }
}

class FirebaseMessagingService {
  static final FirebaseMessagingService _instance =
      FirebaseMessagingService._internal();
  factory FirebaseMessagingService() => _instance;
  FirebaseMessagingService._internal();

  FirebaseMessaging? _messaging;
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();
  final _tokenRefreshController = StreamController<String>.broadcast();

  String? _fcmToken;
  Function(Map<String, dynamic>)? _onNotificationTap;

  String? get fcmToken => _fcmToken;
  Stream<String> get onTokenRefresh => _tokenRefreshController.stream;

  Future<void> initialize(
      {Function(Map<String, dynamic>)? onNotificationTap}) async {
    _onNotificationTap = onNotificationTap;

    try {
      // Web/desktop sans config Firebase : initialisation optionnelle
      await Firebase.initializeApp();
      _messaging = FirebaseMessaging.instance;
    } catch (e) {
      debugPrint('Firebase non disponible, notifications push désactivées: $e');
      _messaging = null;
      return;
    }

    if (_messaging == null) return;

    try {
      // Request permissions
      NotificationSettings settings = await _messaging!.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );
      debugPrint('FCM permission status: ${settings.authorizationStatus}');

      // Foreground messages
      FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

      // Background & terminated
      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

      // Notification tap (app in background)
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        _onNotificationTap?.call(message.data);
      });

      // Local notifications init (mobile/desktop only via import conditionnel)
      await initLocalNotifications(
        _localNotifications,
        (NotificationResponse response) {
          if (response.payload != null) {
            final data = jsonDecode(response.payload!) as Map<String, dynamic>;
            _onNotificationTap?.call(data);
          }
        },
      );

      // Get token
      _fcmToken = await _messaging!.getToken();
      debugPrint('FCM Token: $_fcmToken');

      // Listen for token refresh
      _messaging!.onTokenRefresh.listen((newToken) {
        _fcmToken = newToken;
        debugPrint('FCM Token refreshed: $newToken');
        _tokenRefreshController.add(newToken);
      });
    } catch (e) {
      debugPrint('Erreur initialisation FCM: $e');
      _messaging = null;
    }
  }

  void _handleForegroundMessage(RemoteMessage message) {
    debugPrint('Foreground message received: ${message.notification?.title}');

    if (kIsWeb) return;

    RemoteNotification? notification = message.notification;
    AndroidNotification? android = message.notification?.android;

    if (notification != null && android != null) {
      _localNotifications.show(
        id: notification.hashCode,
        title: notification.title,
        body: notification.body,
        notificationDetails: NotificationDetails(
          android: AndroidNotificationDetails(
            'marocloc_channel',
            'MAROC-LOC Notifications',
            channelDescription: 'Real-time property alerts and messages',
            importance: Importance.max,
            priority: Priority.high,
            icon: '@mipmap/ic_launcher',
          ),
        ),
        payload: jsonEncode(message.data),
      );
    }
  }

  Future<void> subscribeToTopic(String topic) async {
    if (_messaging == null) return;
    await _messaging!.subscribeToTopic(topic);
    debugPrint('Subscribed to topic: $topic');
  }

  Future<void> unsubscribeFromTopic(String topic) async {
    if (_messaging == null) return;
    await _messaging!.unsubscribeFromTopic(topic);
    debugPrint('Unsubscribed from topic: $topic');
  }

  Future<void> deleteToken() async {
    if (_messaging == null) return;
    await _messaging!.deleteToken();
    _fcmToken = null;
  }

  void dispose() {
    _tokenRefreshController.close();
  }
}
