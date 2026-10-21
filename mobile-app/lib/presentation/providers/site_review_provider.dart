import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/site_review_model.dart';
import '../../services/site_review_service.dart';

final siteReviewServiceProvider = Provider<SiteReviewService>((ref) {
  return SiteReviewService();
});

final siteReviewProvider =
    StateNotifierProvider<SiteReviewNotifier, List<SiteReviewModel>>((ref) {
  return SiteReviewNotifier(ref.read(siteReviewServiceProvider));
});

class SiteReviewNotifier extends StateNotifier<List<SiteReviewModel>> {
  final SiteReviewService _service;

  SiteReviewNotifier(this._service) : super([]);

  Future<void> loadReviews() async {
    try {
      final reviews = await _service.getAll();
      state = reviews;
    } catch (e) {
      state = [];
    }
  }

  Future<void> submit({
    required int rating,
    required String comment,
    String? userName,
    String? userEmail,
  }) async {
    await _service.create(
      rating: rating,
      comment: comment,
      userName: userName,
      userEmail: userEmail,
    );
    await loadReviews();
  }
}
