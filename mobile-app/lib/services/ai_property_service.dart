import 'package:dio/dio.dart';
import '../core/constants/api_constants.dart';

/// AI-driven property helpers (description generation, price suggestion).
///
/// These endpoints live on the AI service, not the Spring Boot backend, so we
/// use a dedicated Dio instance with [ApiConstants.aiBaseUrl].
class AiPropertyService {
  final Dio _dio;

  AiPropertyService({Dio? dio})
      : _dio = dio ??
            Dio(BaseOptions(
              baseUrl: ApiConstants.aiBaseUrl,
              connectTimeout: ApiConstants.connectTimeout,
              receiveTimeout: ApiConstants.receiveTimeout,
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
            ));

  Future<String> generateDescription(Map<String, dynamic> propertyData) async {
    final response = await _dio.post(
      '/owner/generate-description',
      data: propertyData,
    );
    final data = response.data as Map<String, dynamic>;
    return data['description'] as String? ?? '';
  }

  Future<Map<String, dynamic>> suggestPrice(
      Map<String, dynamic> propertyData) async {
    final response = await _dio.post(
      '/owner/suggest-price',
      data: propertyData,
    );
    return response.data as Map<String, dynamic>;
  }
}
