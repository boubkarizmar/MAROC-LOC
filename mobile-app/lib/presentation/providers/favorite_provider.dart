import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/property_model.dart';
import '../../services/favorite_service.dart';

class FavoriteState {
  final List<PropertyModel> favorites;
  final Set<int> favoriteIds;
  final bool isLoading;
  final String? error;
  final bool isUnauthorized;

  const FavoriteState({
    this.favorites = const [],
    this.favoriteIds = const {},
    this.isLoading = false,
    this.error,
    this.isUnauthorized = false,
  });

  FavoriteState copyWith({
    List<PropertyModel>? favorites,
    Set<int>? favoriteIds,
    bool? isLoading,
    String? error,
    bool? isUnauthorized,
    bool clearError = false,
  }) {
    return FavoriteState(
      favorites: favorites ?? this.favorites,
      favoriteIds: favoriteIds ?? this.favoriteIds,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : error,
      isUnauthorized: isUnauthorized ?? this.isUnauthorized,
    );
  }

  bool isFavorite(int propertyId) => favoriteIds.contains(propertyId);
}

class FavoriteNotifier extends StateNotifier<FavoriteState> {
  final FavoriteService _service;

  FavoriteNotifier(this._service) : super(const FavoriteState());

  Future<void> loadFavorites() async {
    state = state.copyWith(
        isLoading: true, clearError: true, isUnauthorized: false);
    try {
      final favorites = await _service.getFavorites();
      state = state.copyWith(
        favorites: favorites,
        favoriteIds: favorites.map((p) => p.id).toSet(),
        isLoading: false,
      );
    } on DioException catch (e) {
      final isUnauthorized = e.response?.statusCode == 401;
      state = state.copyWith(
        isLoading: false,
        isUnauthorized: isUnauthorized,
        error: isUnauthorized
            ? 'Session expirée. Veuillez vous reconnecter.'
            : 'Erreur de chargement des favoris',
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Erreur de chargement des favoris',
      );
    }
  }

  Future<void> toggleFavorite(int propertyId) async {
    final isFav = state.isFavorite(propertyId);
    // Optimistic update
    if (isFav) {
      state = state.copyWith(
        favoriteIds: {...state.favoriteIds}..remove(propertyId),
        favorites: state.favorites.where((p) => p.id != propertyId).toList(),
      );
      try {
        await _service.removeFavorite(propertyId);
      } catch (e) {
        // Rollback
        await loadFavorites();
      }
    } else {
      state = state.copyWith(
        favoriteIds: {...state.favoriteIds, propertyId},
      );
      try {
        await _service.addFavorite(propertyId);
      } catch (e) {
        // Rollback
        state = state.copyWith(
          favoriteIds: {...state.favoriteIds}..remove(propertyId),
        );
      }
    }
  }

  Future<void> checkFavorite(int propertyId) async {
    try {
      final isFav = await _service.checkFavorite(propertyId);
      if (isFav) {
        state = state.copyWith(
          favoriteIds: {...state.favoriteIds, propertyId},
        );
      }
    } catch (_) {}
  }
}

final favoriteServiceProvider =
    Provider<FavoriteService>((ref) => FavoriteService());

final favoriteProvider =
    StateNotifierProvider<FavoriteNotifier, FavoriteState>((ref) {
  final service = ref.watch(favoriteServiceProvider);
  return FavoriteNotifier(service);
});
