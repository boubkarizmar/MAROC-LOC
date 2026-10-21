import '../core/constants/api_constants.dart';
import 'api_client.dart';

/// Service for property promotion / boosting.
///
/// If the backend does not yet expose a dedicated boost endpoint,
/// [boostProperty] returns `false` so the UI can fall back to a
/// simulated SnackBar feedback.
class PromotionService {
  final ApiClient _apiClient;

  PromotionService({ApiClient? apiClient})
      : _apiClient = apiClient ?? ApiClient();

  /// Attempts to boost a property.
  ///
  /// Returns `true` when the server acknowledges the boost,
  /// `false` when the endpoint is missing (simulation mode).
  Future<bool> boostProperty(
    int propertyId,
    String boostType, {
    int durationDays = 7,
  }) async {
    try {
      await _apiClient.post(
        '${ApiConstants.properties}/$propertyId/boost',
        data: {
          'boostType': boostType,
          'durationDays': durationDays,
        },
      );
      return true;
    } catch (_) {
      // No dedicated boost endpoint yet – let the UI simulate it.
      return false;
    }
  }
}
