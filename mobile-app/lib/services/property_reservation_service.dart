import '../core/constants/api_constants.dart';
import 'api_client.dart';

/// Service for property reservation/purchase transactions.
///
/// The backend starts the property-reservation saga and returns signed
/// CMI payment parameters in the response, so the UI can jump straight to
/// the CMI WebView without calling the generic initiate endpoint again.
class PropertyReservationService {
  final ApiClient _apiClient;

  PropertyReservationService({ApiClient? apiClient})
      : _apiClient = apiClient ?? ApiClient();

  /// Reserve (RENT) or buy (SALE) a property.
  ///
  /// [transactionType] must be either 'RESERVATION' or 'PURCHASE'.
  /// Returns the backend's payment parameters map (hash, orderId, amount, ...).
  Future<Map<String, dynamic>> initiateTransaction(
    int propertyId,
    String transactionType, {
    String lang = 'fr',
  }) async {
    final action = transactionType == 'PURCHASE' ? 'buy' : 'reserve';
    final response = await _apiClient.post(
      '${ApiConstants.propertyReserve}/$propertyId/$action',
      queryParameters: {'lang': lang},
    );

    final body = response.data as Map<String, dynamic>? ?? {};
    if (body.containsKey('data') && body['data'] is Map<String, dynamic>) {
      return body['data'] as Map<String, dynamic>;
    }
    return body;
  }

  /// Get the current user's reservations/purchases.
  Future<List<dynamic>> getMyReservations() async {
    final response = await _apiClient.get(ApiConstants.myReservations);
    final raw = response.data;
    if (raw is List<dynamic>) {
      return raw;
    }
    final body = raw as Map<String, dynamic>? ?? {};
    if (body.containsKey('data') && body['data'] is List<dynamic>) {
      return body['data'] as List<dynamic>;
    }
    return [];
  }
}
