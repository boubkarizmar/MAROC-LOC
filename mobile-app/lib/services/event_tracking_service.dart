import '../core/constants/api_constants.dart';
import 'api_client.dart';

class EventTrackingService {
  final ApiClient _apiClient;

  EventTrackingService({ApiClient? apiClient})
      : _apiClient = apiClient ?? ApiClient();

  /// Track a user event
  Future<void> trackEvent({
    required String eventType,
    Map<String, dynamic>? metadata,
    int? propertyId,
  }) async {
    try {
      await _apiClient.post(
        ApiConstants.events,
        data: {
          'eventType': eventType,
          if (metadata != null) 'metadata': metadata,
          if (propertyId != null) 'propertyId': propertyId,
        },
      );
    } catch (_) {
      // Silently fail for tracking events
    }
  }

  /// Track property view
  Future<void> trackPropertyView(int propertyId) async {
    await trackEvent(
      eventType: 'property.view',
      propertyId: propertyId,
    );
  }

  /// Track search query
  Future<void> trackSearch(String query) async {
    await trackEvent(
      eventType: 'search.query',
      metadata: {'query': query},
    );
  }

  /// Track favorite add
  Future<void> trackFavoriteAdd(int propertyId) async {
    await trackEvent(
      eventType: 'favorite.add',
      propertyId: propertyId,
    );
  }
}
