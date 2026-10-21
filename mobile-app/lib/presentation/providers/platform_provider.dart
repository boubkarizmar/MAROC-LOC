import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../services/platform_service.dart';

class PlatformStatsState {
  final int totalUsers;
  final int totalProperties;
  final int totalCities;
  final int totalMessages;
  final bool isLoading;
  final String? error;

  const PlatformStatsState({
    this.totalUsers = 0,
    this.totalProperties = 0,
    this.totalCities = 0,
    this.totalMessages = 0,
    this.isLoading = false,
    this.error,
  });

  PlatformStatsState copyWith({
    int? totalUsers,
    int? totalProperties,
    int? totalCities,
    int? totalMessages,
    bool? isLoading,
    String? error,
    bool clearError = false,
  }) {
    return PlatformStatsState(
      totalUsers: totalUsers ?? this.totalUsers,
      totalProperties: totalProperties ?? this.totalProperties,
      totalCities: totalCities ?? this.totalCities,
      totalMessages: totalMessages ?? this.totalMessages,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : error,
    );
  }
}

class PlatformStatsNotifier extends StateNotifier<PlatformStatsState> {
  final PlatformService _service;

  PlatformStatsNotifier(this._service) : super(const PlatformStatsState());

  Future<void> loadStats() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final stats = await _service.getStats();
      state = state.copyWith(
        totalUsers: stats['totalUsers'] as int? ?? 0,
        totalProperties: stats['totalProperties'] as int? ?? 0,
        totalCities: stats['totalCities'] as int? ?? 0,
        totalMessages: stats['totalMessages'] as int? ?? 0,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Erreur de chargement');
    }
  }
}

final platformServiceProvider =
    Provider<PlatformService>((ref) => PlatformService());

final platformStatsProvider =
    StateNotifierProvider<PlatformStatsNotifier, PlatformStatsState>((ref) {
  final service = ref.watch(platformServiceProvider);
  return PlatformStatsNotifier(service);
});
