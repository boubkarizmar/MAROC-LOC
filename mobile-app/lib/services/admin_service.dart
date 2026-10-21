import '../core/constants/api_constants.dart';
import 'api_client.dart';

class AdminService {
  final ApiClient _apiClient;

  AdminService({ApiClient? apiClient}) : _apiClient = apiClient ?? ApiClient();

  Future<Map<String, dynamic>> getPlatformAnalytics() async {
    try {
      final res = await _apiClient.get(ApiConstants.adminPlatformAnalytics);
      return res.data as Map<String, dynamic>;
    } catch (e) {
      return {};
    }
  }

  Future<List<dynamic>> getMonthlyAnalytics() async {
    try {
      final res = await _apiClient.get(ApiConstants.adminMonthlyAnalytics);
      return res.data as List<dynamic>;
    } catch (e) {
      return [];
    }
  }

  Future<List<dynamic>> getYearlyAnalytics() async {
    try {
      final res = await _apiClient.get(ApiConstants.adminYearlyAnalytics);
      return res.data as List<dynamic>;
    } catch (e) {
      return [];
    }
  }

  Future<Map<String, dynamic>> getEnhancedStats() async {
    try {
      final res = await _apiClient.get(ApiConstants.adminStatsEnhanced);
      return res.data as Map<String, dynamic>;
    } catch (e) {
      return {};
    }
  }

  Future<List<dynamic>> getAdminProperties({String? status}) async {
    try {
      final res = await _apiClient.get(
        ApiConstants.adminProperties,
        queryParameters: status != null ? {'status': status} : null,
      );
      final data = res.data as Map<String, dynamic>;
      return data['content'] as List<dynamic>? ?? [];
    } catch (e) {
      return [];
    }
  }

  Future<bool> approveProperty(int propertyId) async {
    try {
      await _apiClient.post(
        '${ApiConstants.adminProperties}/approve',
        data: {'propertyId': propertyId},
      );
      return true;
    } catch (e) {
      return false;
    }
  }

  Future<bool> rejectProperty(int propertyId, {String? reason}) async {
    try {
      await _apiClient.post(
        '${ApiConstants.adminProperties}/reject',
        data: {'propertyId': propertyId, 'reason': reason ?? ''},
      );
      return true;
    } catch (e) {
      return false;
    }
  }

  Future<List<dynamic>> getAdminUsers() async {
    try {
      final res = await _apiClient.get(ApiConstants.adminUsers);
      final data = res.data as Map<String, dynamic>;
      return data['content'] as List<dynamic>? ?? [];
    } catch (e) {
      return [];
    }
  }

  Future<bool> verifyUser(int userId) async {
    try {
      await _apiClient.post(
        '${ApiConstants.adminUsers}/verify',
        data: {'userId': userId},
      );
      return true;
    } catch (e) {
      return false;
    }
  }

  Future<List<dynamic>> getPendingReviews() async {
    try {
      final res = await _apiClient.get(ApiConstants.reviewModerationPending);
      final data = res.data as Map<String, dynamic>;
      return data['content'] as List<dynamic>? ?? [];
    } catch (e) {
      return [];
    }
  }

  Future<bool> moderateReview(int reviewId, String action,
      {String? reason}) async {
    try {
      await _apiClient.post(
        ApiConstants.reviewModeration,
        data: {
          'reviewId': reviewId,
          'action': action,
          if (reason != null) 'reason': reason,
        },
      );
      return true;
    } catch (e) {
      return false;
    }
  }

  Future<Map<String, dynamic>> getSettings() async {
    try {
      final res = await _apiClient.get(ApiConstants.adminSettings);
      return res.data as Map<String, dynamic>;
    } catch (e) {
      return {};
    }
  }

  Future<bool> updateSettings(Map<String, dynamic> settings) async {
    try {
      await _apiClient.put(ApiConstants.adminSettings, data: settings);
      return true;
    } catch (e) {
      return false;
    }
  }
}
