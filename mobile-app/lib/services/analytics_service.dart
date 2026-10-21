import 'package:dio/dio.dart';
import '../core/constants/api_constants.dart';

class AnalyticsService {
  final Dio _aiDio = Dio(BaseOptions(
    baseUrl: ApiConstants.aiBaseUrl,
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
  ));

  Future<Map<String, dynamic>> getOverview() async {
    try {
      final res = await _aiDio.get('/analytics/overview');
      return res.data as Map<String, dynamic>;
    } catch (e) {
      return {};
    }
  }

  Future<List<dynamic>> getIntentDistribution() async {
    try {
      final res = await _aiDio.get('/analytics/intents');
      return res.data as List<dynamic>;
    } catch (e) {
      return [];
    }
  }

  Future<List<dynamic>> getLanguageDistribution() async {
    try {
      final res = await _aiDio.get('/analytics/languages');
      return res.data as List<dynamic>;
    } catch (e) {
      return [];
    }
  }

  Future<List<dynamic>> getTimeline({int days = 30}) async {
    try {
      final res = await _aiDio
          .get('/analytics/timeline', queryParameters: {'days': days});
      return res.data as List<dynamic>;
    } catch (e) {
      return [];
    }
  }

  Future<List<dynamic>> getTopSearches({int limit = 10}) async {
    try {
      final res = await _aiDio
          .get('/analytics/top-searches', queryParameters: {'limit': limit});
      return res.data as List<dynamic>;
    } catch (e) {
      return [];
    }
  }
}
