import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/ad_model.dart';
import '../../services/ads_service.dart';

class AdsState {
  final List<AdModel> ads;
  final bool isLoading;
  final String? error;

  const AdsState({
    this.ads = const [],
    this.isLoading = false,
    this.error,
  });

  AdsState copyWith({
    List<AdModel>? ads,
    bool? isLoading,
    String? error,
    bool clearError = false,
  }) {
    return AdsState(
      ads: ads ?? this.ads,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : error,
    );
  }
}

class AdsNotifier extends StateNotifier<AdsState> {
  final AdsService _service;

  AdsNotifier(this._service) : super(const AdsState());

  Future<void> loadAds() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final ads = await _service.getActiveAds();
      state = state.copyWith(ads: ads, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Erreur de chargement');
    }
  }

  Future<void> loadRotatedAds({required String slot, int limit = 3}) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final ads = await _service.getRotatedAds(slot: slot, limit: limit);
      state = state.copyWith(ads: ads, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Erreur de chargement');
    }
  }
}

final adsServiceProvider = Provider<AdsService>((ref) => AdsService());

final adsProvider = StateNotifierProvider<AdsNotifier, AdsState>((ref) {
  final service = ref.watch(adsServiceProvider);
  return AdsNotifier(service);
});
