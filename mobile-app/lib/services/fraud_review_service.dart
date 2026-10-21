import '../core/constants/api_constants.dart';
import 'api_client.dart';

class FraudReviewService {
  final ApiClient _apiClient;

  FraudReviewService({ApiClient? apiClient})
      : _apiClient = apiClient ?? ApiClient();

  /// Get fraud review dashboard stats
  Future<Map<String, dynamic>> getDashboardStats() async {
    try {
      final response =
          await _apiClient.get('${ApiConstants.fraudReview}/dashboard');
      return response.data as Map<String, dynamic>;
    } catch (_) {
      return {};
    }
  }

  /// Get pending fraud reviews
  Future<List<dynamic>> getPendingReviews() async {
    try {
      final response =
          await _apiClient.get('${ApiConstants.fraudReview}/pending');
      final data = response.data as List<dynamic>? ?? [];
      return data;
    } catch (_) {
      return [];
    }
  }

  /// Approve a fraud review (fraudScoreId)
  Future<void> approveReview(int fraudScoreId) async {
    await _apiClient.post(
      '${ApiConstants.fraudReviewDecision}/$fraudScoreId',
      data: {'decision': 'APPROVE'},
    );
  }

  /// Reject a fraud review (fraudScoreId)
  Future<void> rejectReview(int fraudScoreId, {String? reason}) async {
    final body = <String, dynamic>{
      'decision': 'REJECT',
      if (reason != null && reason.isNotEmpty) 'explanation': reason,
    };
    await _apiClient.post(
      '${ApiConstants.fraudReviewDecision}/$fraudScoreId',
      data: body,
    );
  }
}
