import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/property_visit_model.dart';
import '../../services/property_visit_service.dart';

class VisitState {
  final List<PropertyVisitModel> visits;
  final bool isLoading;
  final String? error;

  const VisitState({
    this.visits = const [],
    this.isLoading = false,
    this.error,
  });

  VisitState copyWith({
    List<PropertyVisitModel>? visits,
    bool? isLoading,
    String? error,
    bool clearError = false,
  }) {
    return VisitState(
      visits: visits ?? this.visits,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : error,
    );
  }
}

class VisitNotifier extends StateNotifier<VisitState> {
  final PropertyVisitService _service;

  VisitNotifier(this._service) : super(const VisitState());

  Future<void> loadMyVisits() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final data = await _service.getMyVisits();
      final visits = data
          .whereType<Map<String, dynamic>>()
          .map((json) => PropertyVisitModel.fromJson(json))
          .toList();
      state = state.copyWith(visits: visits, isLoading: false);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Impossible de charger les visites. Veuillez réessayer.',
      );
    }
  }

  Future<void> cancelVisit(int id) async {
    try {
      await _service.cancelVisit(id);
      await loadMyVisits();
    } catch (e) {
      state = state.copyWith(
        error: 'Erreur d\'annulation: ${e.toString()}',
      );
    }
  }

  Future<void> confirmVisit(int id) async {
    try {
      await _service.confirmVisit(id);
      await loadMyVisits();
    } catch (e) {
      state = state.copyWith(
        error: 'Erreur de confirmation: ${e.toString()}',
      );
    }
  }
}

final propertyVisitServiceProvider = Provider<PropertyVisitService>((ref) {
  return PropertyVisitService();
});

final visitProvider = StateNotifierProvider<VisitNotifier, VisitState>((ref) {
  final service = ref.watch(propertyVisitServiceProvider);
  return VisitNotifier(service);
});
