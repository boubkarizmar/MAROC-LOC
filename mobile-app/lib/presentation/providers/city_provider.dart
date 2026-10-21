import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../services/property_service.dart';
import '../providers/property_provider.dart';

class CityStat {
  final String name;
  final String slug;
  final int propertyCount;
  final double? averagePrice;
  final String? image;

  const CityStat({
    required this.name,
    required this.slug,
    required this.propertyCount,
    this.averagePrice,
    this.image,
  });

  factory CityStat.fromJson(Map<String, dynamic> json) {
    return CityStat(
      name: json['name'] as String? ?? 'Inconnu',
      slug: json['slug'] as String? ?? '',
      propertyCount: (json['propertyCount'] as num?)?.toInt() ?? 0,
      averagePrice: (json['averagePrice'] as num?)?.toDouble(),
      image: json['image'] as String?,
    );
  }
}

class CityState {
  final List<CityStat> cities;
  final bool isLoading;
  final String? error;

  const CityState({
    this.cities = const [],
    this.isLoading = false,
    this.error,
  });

  CityState copyWith({
    List<CityStat>? cities,
    bool? isLoading,
    String? error,
    bool clearError = false,
  }) {
    return CityState(
      cities: cities ?? this.cities,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : error,
    );
  }
}

class CityNotifier extends StateNotifier<CityState> {
  final PropertyService _service;

  CityNotifier(this._service) : super(const CityState());

  Future<void> loadCities() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final data = await _service.getCityStatsDetailed();
      final cities = data
          .whereType<Map<String, dynamic>>()
          .map((json) => CityStat.fromJson(json))
          .toList()
        ..sort((a, b) => b.propertyCount.compareTo(a.propertyCount));
      state = state.copyWith(cities: cities, isLoading: false);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Erreur de chargement des villes',
      );
    }
  }
}

final cityProvider = StateNotifierProvider<CityNotifier, CityState>((ref) {
  final service = ref.watch(propertyServiceProvider);
  return CityNotifier(service);
});
