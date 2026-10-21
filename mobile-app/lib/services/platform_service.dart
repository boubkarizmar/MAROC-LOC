import '../core/constants/api_constants.dart';
import 'api_client.dart';

class PlatformService {
  final ApiClient _apiClient;

  PlatformService({ApiClient? apiClient})
      : _apiClient = apiClient ?? ApiClient();

  Future<Map<String, dynamic>> getStats() async {
    final response = await _apiClient.get(ApiConstants.platformStats);
    return response.data as Map<String, dynamic>;
  }
}
