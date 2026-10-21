import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

class RecentlyViewedService {
  static const _secureStorage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );
  static const _key = 'recently_viewed_properties';

  Future<SharedPreferences> get _prefs async => SharedPreferences.getInstance();

  bool get _usePrefs => kIsWeb;

  Future<void> addRecentlyViewed(int propertyId) async {
    try {
      final ids = await getRecentlyViewed();
      ids.remove(propertyId);
      ids.insert(0, propertyId);
      if (ids.length > 10) {
        ids.length = 10;
      }
      final value = jsonEncode(ids);
      if (_usePrefs) {
        await (await _prefs).setString(_key, value);
      } else {
        await _secureStorage.write(key: _key, value: value);
      }
    } catch (_) {
      // Silently fail for recently viewed
    }
  }

  Future<List<int>> getRecentlyViewed() async {
    try {
      final jsonStr = _usePrefs
          ? (await _prefs).getString(_key)
          : await _secureStorage.read(key: _key);
      if (jsonStr == null || jsonStr.isEmpty) return [];
      final list = jsonDecode(jsonStr) as List<dynamic>;
      return list.map((e) => e as int).toList();
    } catch (_) {
      return [];
    }
  }

  Future<void> clearRecentlyViewed() async {
    try {
      if (_usePrefs) {
        await (await _prefs).remove(_key);
      } else {
        await _secureStorage.delete(key: _key);
      }
    } catch (_) {}
  }
}
