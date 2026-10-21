import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../services/owner_analytics_service.dart';

class OwnerAnalyticsState {
  final Map<String, dynamic>? dashboardData;
  final bool isLoading;
  final String? error;

  const OwnerAnalyticsState({
    this.dashboardData,
    this.isLoading = false,
    this.error,
  });

  OwnerAnalyticsState copyWith({
    Map<String, dynamic>? dashboardData,
    bool? isLoading,
    String? error,
    bool clearError = false,
    bool clearData = false,
  }) {
    return OwnerAnalyticsState(
      dashboardData: clearData ? null : (dashboardData ?? this.dashboardData),
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : error,
    );
  }
}

class OwnerAnalyticsNotifier extends StateNotifier<OwnerAnalyticsState> {
  final OwnerAnalyticsService _service;

  OwnerAnalyticsNotifier(this._service) : super(const OwnerAnalyticsState());

  Future<void> loadDashboard() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final data = await _service.getOwnerDashboard();
      state = state.copyWith(dashboardData: data, isLoading: false);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Erreur de chargement: ${e.toString()}',
      );
    }
  }

  Future<void> loadRevenueAnalytics(String period) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final data = await _service.getRevenueAnalytics(period);
      final updated = Map<String, dynamic>.from(state.dashboardData ?? {});
      updated['revenue'] = data;
      state = state.copyWith(dashboardData: updated, isLoading: false);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Erreur de chargement: ${e.toString()}',
      );
    }
  }

  void clearError() {
    state = state.copyWith(clearError: true);
  }
}

final ownerAnalyticsServiceProvider = Provider<OwnerAnalyticsService>(
  (ref) => OwnerAnalyticsService(),
);

final ownerAnalyticsProvider =
    StateNotifierProvider<OwnerAnalyticsNotifier, OwnerAnalyticsState>((ref) {
  final service = ref.watch(ownerAnalyticsServiceProvider);
  return OwnerAnalyticsNotifier(service);
});
