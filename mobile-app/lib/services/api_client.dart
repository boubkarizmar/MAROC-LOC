import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../core/constants/api_constants.dart';
import '../core/auth/auth_refresh_listenable.dart';
import 'auth_service.dart';

class ApiClient {
  late final Dio _dio;
  final AuthService _authService;

  ApiClient({AuthService? authService})
      : _authService = authService ?? AuthService() {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiConstants.baseUrl,
        connectTimeout: ApiConstants.connectTimeout,
        receiveTimeout: ApiConstants.receiveTimeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _authService.getToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          if (kDebugMode) {
            debugPrint('➡️ REQUEST: ${options.method} ${options.path}');
          }
          return handler.next(options);
        },
        onResponse: (response, handler) {
          if (kDebugMode) {
            debugPrint(
                '✅ RESPONSE: ${response.statusCode} ${response.requestOptions.path}');
          }
          return handler.next(response);
        },
        onError: (DioException error, handler) async {
          if (kDebugMode) {
            debugPrint(
                '❌ ERROR: ${error.response?.statusCode} ${error.requestOptions.path}');
            debugPrint(error.message);
          }

          if (error.response?.statusCode == 401) {
            try {
              final refreshed = await _authService.refreshToken();
              if (refreshed) {
                final token = await _authService.getToken();
                if (token != null && token.isNotEmpty) {
                  error.requestOptions.headers['Authorization'] =
                      'Bearer $token';
                  return handler
                      .resolve(await _dio.fetch(error.requestOptions));
                }
              }
            } catch (_) {
              // Refresh failed, proceed to logout
            }
            await _authService.logout();
            // Signal auth state change so router/UI reacts
            authRefreshListenable.value = false;
          }
          return handler.next(error);
        },
      ),
    );
  }

  Dio get dio => _dio;

  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return _dio.get<T>(path,
        queryParameters: queryParameters, options: options);
  }

  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return _dio.post<T>(path,
        data: data, queryParameters: queryParameters, options: options);
  }

  Future<Response<T>> put<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return _dio.put<T>(path,
        data: data, queryParameters: queryParameters, options: options);
  }

  Future<Response<T>> delete<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return _dio.delete<T>(path,
        data: data, queryParameters: queryParameters, options: options);
  }

  Future<Response<T>> patch<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return _dio.patch<T>(path,
        data: data, queryParameters: queryParameters, options: options);
  }
}
