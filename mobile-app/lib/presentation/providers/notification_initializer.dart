import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'notification_provider.dart';

class NotificationInitializer extends ConsumerStatefulWidget {
  final Widget child;

  const NotificationInitializer({super.key, required this.child});

  @override
  ConsumerState<NotificationInitializer> createState() => _NotificationInitializerState();
}

class _NotificationInitializerState extends ConsumerState<NotificationInitializer> {
  bool _started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_started) {
      _started = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        ref.read(notificationProvider.notifier).initialize();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return widget.child;
  }
}
