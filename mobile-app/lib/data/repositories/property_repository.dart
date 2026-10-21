import '../../domain/entities/property.dart';
import '../models/property_model.dart';
import '../../services/api_client.dart';
import '../../core/constants/api_constants.dart';

class PropertyRepository {
  final ApiClient _apiClient;

  PropertyRepository({ApiClient? apiClient})
      : _apiClient = apiClient ?? ApiClient();

  Future<List<Property>> getProperties({int page = 0, int size = 20}) async {
    final response = await _apiClient.get(
      ApiConstants.properties,
      queryParameters: {'page': page, 'size': size},
    );
    final data = response.data as Map<String, dynamic>;
    final content = data['content'] as List<dynamic>;
    return content
        .map((e) => PropertyModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Property> getPropertyById(int id) async {
    final response = await _apiClient.get('${ApiConstants.properties}/$id');
    return PropertyModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<List<Property>> searchProperties({
    String? city,
    String? type,
    double? minPrice,
    double? maxPrice,
    int page = 0,
    int size = 20,
  }) async {
    final params = <String, dynamic>{
      'page': page,
      'size': size,
    };
    if (city != null) params['city'] = city;
    if (type != null) params['type'] = type;
    if (minPrice != null) params['minPrice'] = minPrice;
    if (maxPrice != null) params['maxPrice'] = maxPrice;

    final response = await _apiClient.get(
      ApiConstants.searchProperties,
      queryParameters: params,
    );
    final data = response.data as Map<String, dynamic>;
    final content = data['content'] as List<dynamic>;
    return content
        .map((e) => PropertyModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<String>> getCities() async {
    final response = await _apiClient.get(ApiConstants.cities);
    return (response.data as List<dynamic>).cast<String>();
  }
}
