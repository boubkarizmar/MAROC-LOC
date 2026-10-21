import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../../data/models/message_model.dart';

class ConversationCache {
  static const _key = 'marocloc_conversations_cache';

  static Future<List<ConversationModel>> getAll() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_key);
      if (raw == null || raw.isEmpty) return [];
      final list = jsonDecode(raw) as List<dynamic>;
      return list
          .map((e) => ConversationModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (_) {
      return [];
    }
  }

  static Future<void> saveAll(List<ConversationModel> conversations) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final data = conversations.map((c) => c.toJson()).toList();
      await prefs.setString(_key, jsonEncode(data));
    } catch (_) {
      // ignore cache write errors
    }
  }

  static Future<void> clear() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_key);
    } catch (_) {}
  }
}
