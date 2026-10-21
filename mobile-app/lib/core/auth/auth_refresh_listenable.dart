import 'package:flutter/foundation.dart';

/// Global listenable used to notify GoRouter and other listeners
/// when authentication state changes (login, logout, token expiry).
final authRefreshListenable = ValueNotifier<bool>(false);
