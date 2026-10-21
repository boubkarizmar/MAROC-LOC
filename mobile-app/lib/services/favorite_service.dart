import '../core/constants/api_constants.dart';
import '../data/models/property_model.dart';
import 'api_client.dart';

class FavoriteService {
  final ApiClient _apiClient;

  FavoriteService({ApiClient? apiClient})
      : _apiClient = apiClient ?? ApiClient();

  Future<List<PropertyModel>> getFavorites() async {
    final response = await _apiClient.get(ApiConstants.favorites);
    final data = response.data as List<dynamic>? ?? [];
    return data
        .map((e) => PropertyModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> addFavorite(int propertyId) async {
    await _apiClient.post('${ApiConstants.favorites}/$propertyId');
  }

  Future<void> removeFavorite(int propertyId) async {
    await _apiClient.delete('${ApiConstants.favorites}/$propertyId');
  }

  Future<bool> checkFavorite(int propertyId) async {
    try {
      final response =
          await _apiClient.get('${ApiConstants.favorites}/check/$propertyId');
      return response.data as bool? ?? false;
    } catch (_) {
      return false;
    }
  }
}
