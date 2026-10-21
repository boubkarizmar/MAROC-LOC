import '../core/constants/api_constants.dart';
import 'api_client.dart';

class CommentService {
  final ApiClient _apiClient;

  CommentService({ApiClient? apiClient})
      : _apiClient = apiClient ?? ApiClient();

  /// Get comments for a review
  Future<List<dynamic>> getCommentsForReview(int reviewId) async {
    final response = await _apiClient.get(
      '${ApiConstants.commentsByReview}/$reviewId',
    );
    final data = response.data as List<dynamic>? ?? [];
    return data;
  }

  /// Add a comment to a review
  Future<Map<String, dynamic>> addComment({
    required int reviewId,
    required String content,
  }) async {
    final response = await _apiClient.post(
      ApiConstants.commentsBase,
      data: {
        'reviewId': reviewId,
        'content': content,
      },
    );
    return response.data as Map<String, dynamic>;
  }

  /// Delete a comment
  Future<void> deleteComment(int commentId) async {
    await _apiClient.delete('${ApiConstants.commentsBase}/$commentId');
  }
}
