import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/property_model.dart';
import '../../services/property_service.dart';

class PropertyState {
  final List<PropertyModel> properties;
  final List<PropertyModel> topRanked;
  final List<PropertyModel> myProperties;
  final List<PropertyModel> similarProperties;
  final PropertyModel? selectedProperty;
  final bool isLoading;
  final bool isLoadingMore;
  final bool isSaving;
  final String? error;
  final bool hasMore;
  final int currentPage;

  const PropertyState({
    this.properties = const [],
    this.topRanked = const [],
    this.myProperties = const [],
    this.similarProperties = const [],
    this.selectedProperty,
    this.isLoading = false,
    this.isLoadingMore = false,
    this.isSaving = false,
    this.error,
    this.hasMore = true,
    this.currentPage = 0,
  });

  PropertyState copyWith({
    List<PropertyModel>? properties,
    List<PropertyModel>? topRanked,
    List<PropertyModel>? myProperties,
    List<PropertyModel>? similarProperties,
    PropertyModel? selectedProperty,
    bool? isLoading,
    bool? isLoadingMore,
    bool? isSaving,
    String? error,
    bool? hasMore,
    int? currentPage,
    bool clearError = false,
    bool clearSelected = false,
  }) {
    return PropertyState(
      properties: properties ?? this.properties,
      topRanked: topRanked ?? this.topRanked,
      myProperties: myProperties ?? this.myProperties,
      similarProperties: similarProperties ?? this.similarProperties,
      selectedProperty:
          clearSelected ? null : (selectedProperty ?? this.selectedProperty),
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      isSaving: isSaving ?? this.isSaving,
      error: clearError ? null : error,
      hasMore: hasMore ?? this.hasMore,
      currentPage: currentPage ?? this.currentPage,
    );
  }
}

class PropertyNotifier extends StateNotifier<PropertyState> {
  final PropertyService _service;
  Timer? _searchDebounce;

  PropertyNotifier(this._service) : super(const PropertyState());

  Future<void> loadProperties({bool refresh = false}) async {
    if (state.isLoading || state.isLoadingMore) return;
    if (!refresh && !state.hasMore) return;

    final page = refresh ? 0 : state.currentPage;
    if (refresh) {
      state = state.copyWith(
        properties: [],
        hasMore: true,
        error: null,
        currentPage: 0,
        clearError: true,
      );
    } else if (page > 0) {
      state = state.copyWith(isLoadingMore: true, clearError: true);
    } else {
      state = state.copyWith(isLoading: true, clearError: true);
    }

    try {
      final properties = await _service.getProperties(page: page);
      state = state.copyWith(
        properties: refresh ? properties : [...state.properties, ...properties],
        isLoading: false,
        isLoadingMore: false,
        hasMore: properties.length >= 20,
        currentPage: page + 1,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        isLoadingMore: false,
        error: 'Erreur de chargement: ${e.toString()}',
      );
    }
  }

  Future<void> loadTopRanked({int limit = 5}) async {
    try {
      final topRanked = await _service.getTopRanked(limit: limit);
      state = state.copyWith(topRanked: topRanked);
    } catch (e) {
      // Silently fail for top ranked - not critical
    }
  }

  Future<void> loadPropertyDetail(int id) async {
    state =
        state.copyWith(isLoading: true, clearError: true, clearSelected: true);
    try {
      final property = await _service.getPropertyById(id);
      state = state.copyWith(selectedProperty: property, isLoading: false);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Propriété introuvable',
      );
    }
  }

  Future<void> search({
    String? keyword,
    String? city,
    String? type,
    String? category,
    double? minPrice,
    double? maxPrice,
    double? minSurface,
    double? maxSurface,
    int? minRooms,
    int? ownerId,
    bool? furnished,
    bool? hasParking,
    bool? hasPool,
    bool? hasGarden,
    bool? hasAirConditioning,
    bool? hasInternet,
    bool? hasSecurity,
    bool? hasBalcony,
    bool? hasElevator,
    bool? nearSchool,
    bool? nearHospital,
    bool? nearMosque,
    bool? nearBus,
    bool? nearTram,
    bool debounce = false,
  }) async {
    _searchDebounce?.cancel();

    Future<void> doSearch() async {
      state = state.copyWith(isLoading: true, clearError: true);
      try {
        final properties = await _service.searchProperties(
          keyword: keyword,
          city: city,
          type: type,
          category: category,
          minPrice: minPrice,
          maxPrice: maxPrice,
          minSurface: minSurface,
          maxSurface: maxSurface,
          minRooms: minRooms,
          ownerId: ownerId,
          furnished: furnished,
          hasParking: hasParking,
          hasPool: hasPool,
          hasGarden: hasGarden,
          hasAirConditioning: hasAirConditioning,
          hasInternet: hasInternet,
          hasSecurity: hasSecurity,
          hasBalcony: hasBalcony,
          hasElevator: hasElevator,
          nearSchool: nearSchool,
          nearHospital: nearHospital,
          nearMosque: nearMosque,
          nearBus: nearBus,
          nearTram: nearTram,
        );
        state = state.copyWith(
          properties: properties,
          isLoading: false,
          hasMore: false,
          currentPage: 0,
        );
      } catch (e) {
        state = state.copyWith(
          isLoading: false,
          error: 'Erreur de recherche: ${e.toString()}',
        );
      }
    }

    if (debounce) {
      _searchDebounce = Timer(const Duration(milliseconds: 400), doSearch);
    } else {
      await doSearch();
    }
  }

  Future<void> loadMyProperties() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final properties = await _service.getMyProperties();
      state = state.copyWith(myProperties: properties, isLoading: false);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Erreur de chargement: ${e.toString()}',
      );
    }
  }

  Future<void> createProperty(Map<String, dynamic> data,
      {List<MultipartFile> images = const [], MultipartFile? video}) async {
    state = state.copyWith(isSaving: true, clearError: true);
    try {
      final property =
          await _service.createProperty(data, images: images, video: video);
      state = state.copyWith(
        isSaving: false,
        myProperties: [property, ...state.myProperties],
      );
    } catch (e) {
      state = state.copyWith(
        isSaving: false,
        error: 'Erreur de création: ${e.toString()}',
      );
    }
  }

  Future<void> updateProperty(int id, Map<String, dynamic> data,
      {List<MultipartFile> newImages = const [],
      List<String> existingImageUrls = const []}) async {
    state = state.copyWith(isSaving: true, clearError: true);
    try {
      final property = await _service.updateProperty(id, data,
          newImages: newImages, existingImageUrls: existingImageUrls);
      state = state.copyWith(
        isSaving: false,
        myProperties:
            state.myProperties.map((p) => p.id == id ? property : p).toList(),
        selectedProperty: state.selectedProperty?.id == id
            ? property
            : state.selectedProperty,
      );
    } catch (e) {
      state = state.copyWith(
        isSaving: false,
        error: 'Erreur de mise à jour: ${e.toString()}',
      );
    }
  }

  Future<void> loadSimilarProperties(int propertyId, {int limit = 6}) async {
    try {
      final similar =
          await _service.getSimilarProperties(propertyId, limit: limit);
      state = state.copyWith(similarProperties: similar);
    } catch (e) {
      // Silently fail for similar properties
    }
  }

  @override
  void dispose() {
    _searchDebounce?.cancel();
    super.dispose();
  }

  Future<void> deleteProperty(int id) async {
    state = state.copyWith(isSaving: true, clearError: true);
    try {
      await _service.deleteProperty(id);
      state = state.copyWith(
        isSaving: false,
        myProperties: state.myProperties.where((p) => p.id != id).toList(),
      );
    } catch (e) {
      state = state.copyWith(
        isSaving: false,
        error: 'Erreur de suppression: ${e.toString()}',
      );
    }
  }
}

final propertyServiceProvider =
    Provider<PropertyService>((ref) => PropertyService());

final propertyProvider =
    StateNotifierProvider<PropertyNotifier, PropertyState>((ref) {
  final service = ref.watch(propertyServiceProvider);
  return PropertyNotifier(service);
});
