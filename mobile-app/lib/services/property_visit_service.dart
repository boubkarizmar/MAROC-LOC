import '../core/constants/api_constants.dart';
import 'api_client.dart';

class PropertyVisitService {
  final ApiClient _apiClient;

  PropertyVisitService({ApiClient? apiClient})
      : _apiClient = apiClient ?? ApiClient();

  /// Schedule a property visit
  Future<Map<String, dynamic>> scheduleVisit({
    required int propertyId,
    required String visitDate,
    required String visitTime,
    required String visitorName,
    required String visitorPhone,
    String? visitorEmail,
    String? notes,
  }) async {
    final response = await _apiClient.post(
      ApiConstants.visits,
      data: {
        'propertyId': propertyId,
        'visitDate': visitDate,
        'visitTime': visitTime,
        'visitorName': visitorName,
        'visitorPhone': visitorPhone,
        if (visitorEmail != null && visitorEmail.isNotEmpty)
          'visitorEmail': visitorEmail,
        if (notes != null && notes.isNotEmpty) 'notes': notes,
      },
    );
    return response.data as Map<String, dynamic>;
  }

  /// Get my scheduled visits
  Future<List<dynamic>> getMyVisits() async {
    final response = await _apiClient.get('${ApiConstants.visits}/my-visits');
    final data = response.data as List<dynamic>? ?? [];
    return data;
  }

  /// Get visits for a property (owner/admin)
  Future<List<dynamic>> getPropertyVisits(int propertyId) async {
    final response =
        await _apiClient.get('${ApiConstants.visits}/property/$propertyId');
    final data = response.data as List<dynamic>? ?? [];
    return data;
  }

  /// Cancel a visit
  Future<void> cancelVisit(int visitId) async {
    await _apiClient.delete('${ApiConstants.visits}/$visitId');
  }

  /// Confirm a visit
  Future<void> confirmVisit(int visitId) async {
    await _apiClient.put('${ApiConstants.visits}/$visitId/confirm');
  }
}
