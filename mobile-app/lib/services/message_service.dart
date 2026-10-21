import '../core/constants/api_constants.dart';
import '../data/models/message_model.dart';
import 'api_client.dart';

class MessageService {
  final ApiClient _apiClient;

  MessageService({ApiClient? apiClient})
      : _apiClient = apiClient ?? ApiClient();

  Future<List<MessageModel>> getConversation(
    int userId, {
    int page = 0,
    int size = 20,
    String? sort,
  }) async {
    final queryParameters = <String, dynamic>{
      'userId': userId,
      'page': page,
      'size': size,
    };
    if (sort != null && sort.isNotEmpty) {
      queryParameters['sort'] = sort;
    }
    final response = await _apiClient.get(
      '${ApiConstants.messages}/conversation',
      queryParameters: queryParameters,
    );
    final data = response.data as List<dynamic>? ?? [];
    return data
        .map((e) => MessageModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Load the user's conversation list from the dedicated backend endpoint.
  Future<List<ConversationModel>> getConversations() async {
    final response = await _apiClient.get('${ApiConstants.messages}/conversations');
    final data = response.data as List<dynamic>? ?? [];
    return data
        .map((e) => ConversationModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<int> getUnreadCount() async {
    final response =
        await _apiClient.get('${ApiConstants.messages}/unread-count');
    final data = response.data;
    if (data is int) return data;
    if (data is Map<String, dynamic>) return data['count'] as int? ?? 0;
    return 0;
  }

  Future<MessageModel> sendMessage({
    required int receiverId,
    required String content,
    int? propertyId,
  }) async {
    final response = await _apiClient.post(
      ApiConstants.messages,
      data: {
        'receiverId': receiverId,
        'content': content,
        if (propertyId != null) 'propertyId': propertyId,
      },
    );
    return MessageModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<void> markAsRead(int messageId) async {
    await _apiClient.put('${ApiConstants.messages}/$messageId/read');
  }

  Future<void> deleteMessage(int messageId) async {
    await _apiClient.delete('${ApiConstants.messages}/$messageId');
  }
}
