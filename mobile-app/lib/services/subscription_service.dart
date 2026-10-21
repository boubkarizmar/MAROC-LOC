import '../core/constants/api_constants.dart';
import 'api_client.dart';

class SubscriptionService {
  final ApiClient _apiClient;

  SubscriptionService({ApiClient? apiClient})
      : _apiClient = apiClient ?? ApiClient();

  /// Get current user's subscription usage
  Future<Map<String, dynamic>?> getCurrentSubscription() async {
    try {
      final response = await _apiClient.get(ApiConstants.subscriptionUsage);
      return response.data as Map<String, dynamic>?;
    } catch (_) {
      return null;
    }
  }

  /// Subscribe to a plan (fallback endpoint; backend does not expose this yet)
  Future<Map<String, dynamic>> subscribe({
    required String planType,
    required String paymentMethod,
  }) async {
    final response = await _apiClient.post(
      ApiConstants.subscription,
      data: {
        'planType': planType,
        'paymentMethod': paymentMethod,
      },
    );
    return response.data as Map<String, dynamic>;
  }

  /// Cancel subscription
  Future<void> cancelSubscription() async {
    await _apiClient.put('${ApiConstants.subscription}/cancel');
  }

  /// Get available plans
  Future<List<dynamic>> getAvailablePlans() async {
    final response = await _apiClient.get(ApiConstants.subscriptionTiers);
    final data = response.data as List<dynamic>? ?? [];
    return data;
  }
}
