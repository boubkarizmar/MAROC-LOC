import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/property_model.dart';
import '../../services/property_service.dart';

class RecommendationState {
  final List<PropertyModel> recommendations;
  final List<PropertyModel> similar;
  final List<PropertyModel> trending;
  final bool isLoading;
  final String? error;

  const RecommendationState({
    this.recommendations = const [],
    this.similar = const [],
    this.trending = const [],
    this.isLoading = false,
    this.error,
  });

  RecommendationState copyWith({
    List<PropertyModel>? recommendations,
    List<PropertyModel>? similar,
    List<PropertyModel>? trending,
    bool? isLoading,
    String? error,
    bool clearError = false,
  }) {
    return RecommendationState(
      recommendations: recommendations ?? this.recommendations,
      similar: similar ?? this.similar,
      trending: trending ?? this.trending,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : error ?? this.error,
    );
  }
}

class RecommendationNotifier extends StateNotifier<RecommendationState> {
  final PropertyService _service;

  RecommendationNotifier(this._service) : super(const RecommendationState());

  Future<void> loadRecommendations({int limit = 6}) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final recommendations = await _service.getRecommendations(limit: limit);
      state = state.copyWith(
        recommendations: recommendations,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Erreur de chargement des recommandations',
      );
    }
  }

  Future<void> loadSimilar(int propertyId, {int limit = 6}) async {
    try {
      final similar =
          await _service.getSimilarProperties(propertyId, limit: limit);
      state = state.copyWith(similar: similar);
    } catch (e) {
      // Silently fail for similar properties
    }
  }

  Future<void> loadTrending({String period = 'week', int limit = 6}) async {
    try {
      final trending =
          await _service.getTrendingProperties(period: period, limit: limit);
      state = state.copyWith(trending: trending);
    } catch (e) {
      // Silently fail for trending
    }
  }
}

final recommendationServiceProvider =
    Provider<PropertyService>((ref) => PropertyService());

final recommendationProvider =
    StateNotifierProvider<RecommendationNotifier, RecommendationState>((ref) {
  final service = ref.watch(recommendationServiceProvider);
  return RecommendationNotifier(service);
});
