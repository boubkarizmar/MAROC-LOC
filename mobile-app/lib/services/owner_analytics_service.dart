import '../core/constants/api_constants.dart';
import 'api_client.dart';

class OwnerAnalyticsService {
  final ApiClient _apiClient;

  OwnerAnalyticsService({ApiClient? apiClient})
      : _apiClient = apiClient ?? ApiClient();

  Future<Map<String, dynamic>> getOwnerDashboard() async {
    final response = await _apiClient.get(ApiConstants.ownerDashboard);
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getRevenueAnalytics(String period) async {
    final response = await _apiClient.get(
      ApiConstants.revenueAnalytics,
      queryParameters: {'period': period},
    );
    return response.data as Map<String, dynamic>;
  }
}
