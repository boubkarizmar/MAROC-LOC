import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../services/property_service.dart';
import 'property_provider.dart';

class CategoryState {
  final List<String> categories;
  final List<String> transactionTypes;
  final List<String> cities;
  final bool isLoading;
  final String? error;

  const CategoryState({
    this.categories = const [],
    this.transactionTypes = const [],
    this.cities = const [],
    this.isLoading = false,
    this.error,
  });

  CategoryState copyWith({
    List<String>? categories,
    List<String>? transactionTypes,
    List<String>? cities,
    bool? isLoading,
    String? error,
    bool clearError = false,
  }) {
    return CategoryState(
      categories: categories ?? this.categories,
      transactionTypes: transactionTypes ?? this.transactionTypes,
      cities: cities ?? this.cities,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : error,
    );
  }
}

class CategoryNotifier extends StateNotifier<CategoryState> {
  final PropertyService _service;

  CategoryNotifier(this._service) : super(const CategoryState());

  Future<void> loadAll() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final results = await Future.wait([
        _service.getCategories(),
        _service.getTransactionTypes(),
        _service.getCities(),
      ]);
      state = state.copyWith(
        categories: results[0],
        transactionTypes: results[1],
        cities: results[2],
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Erreur de chargement',
      );
    }
  }
}

final categoryProvider =
    StateNotifierProvider<CategoryNotifier, CategoryState>((ref) {
  final service = ref.watch(propertyServiceProvider);
  return CategoryNotifier(service);
});
