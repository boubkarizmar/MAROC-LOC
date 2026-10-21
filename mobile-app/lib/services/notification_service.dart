import '../core/constants/api_constants.dart';
import '../data/models/notification_model.dart';
import 'api_client.dart';

class NotificationService {
  final ApiClient _apiClient;

  NotificationService({ApiClient? apiClient}) : _apiClient = apiClient ?? ApiClient();

  Future<List<NotificationModel>> fetchNotifications({
    String? status,
    String? type,
    String? search,
    int page = 0,
    int size = 20,
  }) async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      ApiConstants.notifications,
      queryParameters: {
        if (status != null && status != 'ALL') 'status': status,
        if (type != null && type != 'ALL') 'type': type,
        if (search != null && search.isNotEmpty) 'search': search,
        'page': page,
        'size': size,
      },
    );

    final data = response.data?['data'] as Map<String, dynamic>?;
    final content = data?['content'] as List<dynamic>? ?? [];
    return content
        .map((e) => NotificationModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<int> fetchUnreadCount() async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      ApiConstants.notificationUnreadCount,
    );
    return response.data?['data'] as int? ?? 0;
  }

  Future<int> markAllAsRead() async {
    final response = await _apiClient.patch<Map<String, dynamic>>(
      ApiConstants.notificationReadAll,
    );
    return response.data?['data'] as int? ?? 0;
  }

  Future<NotificationModel> markAsRead(int id) async {
    final response = await _apiClient.patch<Map<String, dynamic>>(
      '${ApiConstants.notifications}/$id/read',
    );
    return NotificationModel.fromJson(response.data?['data'] as Map<String, dynamic>);
  }

  Future<void> deleteNotification(int id) async {
    await _apiClient.delete<Map<String, dynamic>>(
      '${ApiConstants.notifications}/$id',
    );
  }

  Future<Map<String, dynamic>> fetchStats() async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      ApiConstants.notificationStats,
    );
    return response.data?['data'] as Map<String, dynamic>? ?? {};
  }

  Future<void> registerFcmToken(String token, {String deviceType = 'ANDROID'}) async {
    await _apiClient.post<Map<String, dynamic>>(
      ApiConstants.fcmRegister,
      data: {'token': token, 'deviceType': deviceType},
    );
  }

  Future<void> unregisterFcmToken(String token) async {
    await _apiClient.post<Map<String, dynamic>>(
      ApiConstants.fcmUnregister,
      data: {'token': token},
    );
  }
}
