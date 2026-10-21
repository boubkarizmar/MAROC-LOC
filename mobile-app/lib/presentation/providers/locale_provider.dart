import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

const _storage = FlutterSecureStorage();
const _localeKey = 'app_locale';

final localeProvider = StateNotifierProvider<LocaleNotifier, Locale>((ref) {
  return LocaleNotifier();
});

class LocaleNotifier extends StateNotifier<Locale> {
  LocaleNotifier() : super(const Locale('fr')) {
    _loadLocale();
  }

  Future<void> _loadLocale() async {
    final value = await _storage.read(key: _localeKey);
    if (value != null) {
      state = Locale(value);
    }
  }

  Future<void> setLocale(Locale locale) async {
    state = locale;
    await _storage.write(key: _localeKey, value: locale.languageCode);
  }
}
