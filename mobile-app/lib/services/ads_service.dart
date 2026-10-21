import '../core/constants/api_constants.dart';
import '../data/models/ad_model.dart';
import 'api_client.dart';

class AdsService {
  final ApiClient _apiClient;

  AdsService({ApiClient? apiClient}) : _apiClient = apiClient ?? ApiClient();

  Future<List<AdModel>> getActiveAds() async {
    final response = await _apiClient.get(ApiConstants.ads);
    final data = response.data as List<dynamic>? ?? [];
    return data
        .map((e) => AdModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<AdModel>> getRotatedAds({
    required String slot,
    int limit = 3,
  }) async {
    final response = await _apiClient.get(
      ApiConstants.adsRotation,
      queryParameters: {'slot': slot, 'limit': limit},
    );
    final data = response.data as List<dynamic>? ?? [];
    return data
        .map((e) => AdModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<Map<String, dynamic>>> getPlans() async {
    final response = await _apiClient.get(ApiConstants.adsPlans);
    final data = response.data as List<dynamic>? ?? [];
    return data.map((e) => e as Map<String, dynamic>).toList();
  }

  Future<int?> createAdRequest(Map<String, dynamic> data) async {
    final response = await _apiClient.post(ApiConstants.adsRequests, data: data);
    final body = response.data as Map<String, dynamic>? ?? {};
    if (body.containsKey('data') && body['data'] is Map<String, dynamic>) {
      final adData = body['data'] as Map<String, dynamic>;
      return adData['id'] as int?;
    }
    return body['id'] as int?;
  }

  Future<Map<String, dynamic>> createCheckoutSession(Map<String, dynamic> data) async {
    final response = await _apiClient.post(ApiConstants.adsCheckout, data: data);
    return response.data as Map<String, dynamic>;
  }

  Future<void> updateMetrics(int adId,
      {int clicks = 0, int views = 0, int impressions = 0}) async {
    await _apiClient.put(
      '${ApiConstants.ads}/$adId/metrics',
      data: {
        'advertisementId': adId,
        'clicksIncrement': clicks,
        'viewsIncrement': views,
        'impressionsIncrement': impressions,
      },
    );
  }
}
