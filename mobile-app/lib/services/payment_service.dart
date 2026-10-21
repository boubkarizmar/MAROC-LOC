import '../core/constants/api_constants.dart';
import 'api_client.dart';

class PaymentService {
  final ApiClient _apiClient;

  PaymentService({ApiClient? apiClient})
      : _apiClient = apiClient ?? ApiClient();

  /// Initiate a CMI payment for an advertisement or a generic charge.
  ///
  /// The backend wraps the CMI form parameters in its standard ApiResponse,
  /// so we return `response.data['data']` when present.
  Future<Map<String, dynamic>> initiateCmiPayment({
    required String orderId,
    required double amount,
    int? advertisementId,
    int? propertyId,
    String? transactionType,
    String? email,
    String currency = '504',
    String lang = 'fr',
  }) async {
    final response = await _apiClient.post(
      ApiConstants.cmiInitiate,
      data: {
        'orderId': orderId,
        'amount': amount,
        'currency': currency,
        'lang': lang,
        if (email != null && email.isNotEmpty) 'email': email,
        if (advertisementId != null) 'advertisementId': advertisementId,
        if (propertyId != null) 'propertyId': propertyId,
        if (transactionType != null && transactionType.isNotEmpty)
          'transactionType': transactionType,
      },
    );

    final body = response.data as Map<String, dynamic>? ?? {};
    // Backend wraps successful payloads in ApiResponse { status, data, ... }
    if (body.containsKey('data') && body['data'] is Map<String, dynamic>) {
      return body['data'] as Map<String, dynamic>;
    }
    return body;
  }

  /// Get payment status by provider order id.
  Future<Map<String, dynamic>> getPaymentStatus(String orderId) async {
    final response = await _apiClient.get(
      '${ApiConstants.payments}/status',
      queryParameters: {'orderId': orderId},
    );

    final body = response.data as Map<String, dynamic>? ?? {};
    if (body.containsKey('data') && body['data'] is Map<String, dynamic>) {
      return body['data'] as Map<String, dynamic>;
    }
    return body;
  }

  /// Get advertisement payment history for current user.
  Future<List<dynamic>> getMyPayments() async {
    final response = await _apiClient.get('${ApiConstants.ads}/payments');
    final data = response.data as List<dynamic>? ?? [];
    return data;
  }
}
