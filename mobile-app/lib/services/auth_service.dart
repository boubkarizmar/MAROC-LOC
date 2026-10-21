import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:dio/dio.dart';
import '../core/constants/api_constants.dart';
import '../data/models/user_model.dart';

class AuthService {
  static const _secureStorage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  static const _tokenKey = 'auth_token';
  static const _refreshTokenKey = 'refresh_token';
  static const _userKey = 'auth_user';

  Future<SharedPreferences> get _prefs async => SharedPreferences.getInstance();

  // Use SharedPreferences on web as fallback since flutter_secure_storage
  // may not persist reliably across hot-reloads in debug mode
  bool get _usePrefs => kIsWeb;

  Future<void> saveToken(String token) async {
    if (_usePrefs) {
      await (await _prefs).setString(_tokenKey, token);
    } else {
      await _secureStorage.write(key: _tokenKey, value: token);
    }
  }

  Future<String?> _safeGetString(String key) async {
    if (!_usePrefs) {
      return await _secureStorage.read(key: key);
    }
    final prefs = await _prefs;
    try {
      return prefs.getString(key);
    } catch (e) {
      // shared_preferences_web jsonDecodes all values; JSON objects become
      // Maps instead of Strings, causing getString to throw TypeError.
      // Remove the corrupted key so the user can re-authenticate.
      await prefs.remove(key);
      return null;
    }
  }

  Future<String?> getToken() async {
    final raw = await _safeGetString(_tokenKey);
    return _sanitizeToken(raw);
  }

  Future<void> saveRefreshToken(String token) async {
    if (_usePrefs) {
      await (await _prefs).setString(_refreshTokenKey, token);
    } else {
      await _secureStorage.write(key: _refreshTokenKey, value: token);
    }
  }

  Future<String?> getRefreshToken() async {
    final raw = await _safeGetString(_refreshTokenKey);
    return _sanitizeToken(raw);
  }

  Future<void> saveUser(UserModel user) async {
    final value = jsonEncode(user.toJson());
    if (_usePrefs) {
      await (await _prefs).setString(_userKey, value);
    } else {
      await _secureStorage.write(key: _userKey, value: value);
    }
  }

  Future<UserModel?> getUser() async {
    final userJson = await _safeGetString(_userKey);
    if (userJson == null) return null;
    try {
      return UserModel.fromJson(jsonDecode(userJson));
    } catch (_) {
      return null;
    }
  }

  /// Strips accidental JSON wrapping quotes and whitespace from stored tokens.
  String? _sanitizeToken(String? value) {
    if (value == null) return null;
    var cleaned = value.trim();
    if (cleaned.length >= 2 &&
        cleaned.startsWith('"') &&
        cleaned.endsWith('"')) {
      cleaned = cleaned.substring(1, cleaned.length - 1);
    }
    cleaned = cleaned.trim();
    return cleaned.isEmpty ? null : cleaned;
  }

  Future<bool> isLoggedIn() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }

  Future<bool> refreshToken() async {
    try {
      final refreshTokenValue = await getRefreshToken();
      if (refreshTokenValue == null || refreshTokenValue.isEmpty) {
        return false;
      }
      final dio = Dio(BaseOptions(
        baseUrl: ApiConstants.baseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        headers: {'Content-Type': 'application/json'},
      ));
      final response = await dio.post(
        ApiConstants.refreshToken,
        data: {'refreshToken': refreshTokenValue},
      );
      if (response.statusCode == 200 && response.data != null) {
        final data = response.data is Map<String, dynamic>
            ? response.data
            : jsonDecode(response.data);
        final newToken = data['accessToken'] ?? data['token'];
        final newRefresh = data['refreshToken'];
        if (newToken != null) {
          await saveToken(newToken);
          if (newRefresh != null) {
            await saveRefreshToken(newRefresh);
          }
          return true;
        }
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  Future<void> logout() async {
    try {
      final refreshTokenValue = await getRefreshToken();
      if (refreshTokenValue != null && refreshTokenValue.isNotEmpty) {
        final dio = Dio(BaseOptions(
          baseUrl: ApiConstants.baseUrl,
          connectTimeout: const Duration(seconds: 15),
          receiveTimeout: const Duration(seconds: 15),
          headers: {'Content-Type': 'application/json'},
        ));
        await dio.post(
          ApiConstants.logout,
          data: {'refreshToken': refreshTokenValue},
        );
      }
    } catch (_) {
      // Ignore backend logout errors and clean local session anyway.
    }

    if (_usePrefs) {
      final p = await _prefs;
      await p.remove(_tokenKey);
      await p.remove(_refreshTokenKey);
      await p.remove(_userKey);
    } else {
      await _secureStorage.delete(key: _tokenKey);
      await _secureStorage.delete(key: _refreshTokenKey);
      await _secureStorage.delete(key: _userKey);
    }
  }

  Future<UserModel?> updateProfile(Map<String, dynamic> data) async {
    final token = await getToken();
    if (token == null) return null;
    final dio = Dio(BaseOptions(
      baseUrl: ApiConstants.baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    ));
    final response = await dio.put('${ApiConstants.users}/me', data: data);
    if (response.statusCode == 200 && response.data != null) {
      final user = UserModel.fromJson(response.data as Map<String, dynamic>);
      await saveUser(user);
      return user;
    }
    return null;
  }
}
