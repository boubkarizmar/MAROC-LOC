import '../core/constants/api_constants.dart';
import '../data/models/site_review_model.dart';
import 'api_client.dart';

class SiteReviewService {
  final ApiClient _apiClient;

  SiteReviewService({ApiClient? apiClient})
      : _apiClient = apiClient ?? ApiClient();

  Future<List<SiteReviewModel>> getAll() async {
    final response = await _apiClient.get(ApiConstants.siteReviews);
    final list = response.data as List<dynamic>? ?? [];
    return list
        .map((e) => SiteReviewModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> create({
    required int rating,
    required String comment,
    String? userName,
    String? userEmail,
  }) async {
    final data = <String, dynamic>{
      'rating': rating,
      'comment': comment,
    };
    if (userName != null && userName.isNotEmpty) data['userName'] = userName;
    if (userEmail != null && userEmail.isNotEmpty) {
      data['userEmail'] = userEmail;
    }
    await _apiClient.post(
      ApiConstants.siteReviews,
      data: data,
    );
  }
}
