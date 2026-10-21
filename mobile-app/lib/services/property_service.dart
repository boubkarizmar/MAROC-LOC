import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:http_parser/http_parser.dart';
import '../core/constants/api_constants.dart';
import '../data/models/property_model.dart';
import 'api_client.dart';

class PropertyService {
  final ApiClient _apiClient;

  PropertyService({ApiClient? apiClient})
      : _apiClient = apiClient ?? ApiClient();

  Future<List<PropertyModel>> getProperties({
    int page = 0,
    int size = 20,
    String sort = 'createdAt,desc',
  }) async {
    final response = await _apiClient.get(
      ApiConstants.properties,
      queryParameters: {'page': page, 'size': size, 'sort': sort},
    );
    final data = response.data as Map<String, dynamic>;
    final content = data['content'] as List<dynamic>? ?? [];
    return content
        .map((e) => PropertyModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<PropertyModel>> getTopRanked({int limit = 5}) async {
    final response = await _apiClient.get(
      ApiConstants.topRanked,
      queryParameters: {'limit': limit},
    );
    final body = response.data;
    final List<dynamic> data;
    if (body is Map<String, dynamic> && body.containsKey('content')) {
      data = body['content'] as List<dynamic>? ?? [];
    } else if (body is List<dynamic>) {
      data = body;
    } else {
      data = [];
    }
    return data
        .map((e) => PropertyModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<PropertyModel> getPropertyById(int id) async {
    final response = await _apiClient.get('${ApiConstants.properties}/$id');
    return PropertyModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<List<PropertyModel>> searchProperties({
    String? keyword,
    String? city,
    String? type,
    String? category,
    double? minPrice,
    double? maxPrice,
    double? minSurface,
    double? maxSurface,
    int? minRooms,
    int? maxRooms,
    int? minFloor,
    int? maxFloor,
    int? minBuildingAge,
    int? maxBuildingAge,
    int? ownerId,
    double? latitude,
    double? longitude,
    double? radiusKm,
    int page = 0,
    int size = 20,
    String sort = 'createdAt,desc',
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
    bool? nearUniversity,
    bool? nearBus,
    bool? nearTram,
    bool? nearMarket,
    bool? nearTrainStation,
    bool? popularArea,
    bool? modernArea,
    bool? quietArea,
    bool? familyArea,
    String? sunDirection,
    bool? gardenView,
    bool? streetView,
    bool? seaView,
    String? paymentMethod,
    bool? isVerified,
  }) async {
    final params = <String, dynamic>{
      'page': page,
      'size': size,
      'sort': sort,
    };
    if (keyword != null && keyword.isNotEmpty) params['keyword'] = keyword;
    if (city != null && city.isNotEmpty) params['city'] = city;
    if (type != null && type.isNotEmpty) params['type'] = type;
    if (category != null && category.isNotEmpty) params['category'] = category;
    if (minPrice != null) params['minPrice'] = minPrice;
    if (maxPrice != null) params['maxPrice'] = maxPrice;
    if (minSurface != null) params['minSurface'] = minSurface;
    if (maxSurface != null) params['maxSurface'] = maxSurface;
    if (minRooms != null) params['minRooms'] = minRooms;
    if (maxRooms != null) params['maxRooms'] = maxRooms;
    if (minFloor != null) params['minFloor'] = minFloor;
    if (maxFloor != null) params['maxFloor'] = maxFloor;
    if (minBuildingAge != null) params['minBuildingAge'] = minBuildingAge;
    if (maxBuildingAge != null) params['maxBuildingAge'] = maxBuildingAge;
    if (ownerId != null) params['ownerId'] = ownerId;
    if (latitude != null) params['latitude'] = latitude;
    if (longitude != null) params['longitude'] = longitude;
    if (radiusKm != null) params['radiusKm'] = radiusKm;
    if (furnished != null) params['furnished'] = furnished;
    if (hasParking != null) params['hasParking'] = hasParking;
    if (hasPool != null) params['hasPool'] = hasPool;
    if (hasGarden != null) params['hasGarden'] = hasGarden;
    if (hasAirConditioning != null) {
      params['hasAirConditioning'] = hasAirConditioning;
    }
    if (hasInternet != null) params['hasInternet'] = hasInternet;
    if (hasSecurity != null) params['hasSecurity'] = hasSecurity;
    if (hasBalcony != null) params['hasBalcony'] = hasBalcony;
    if (hasElevator != null) params['hasElevator'] = hasElevator;
    if (nearSchool != null) params['nearSchool'] = nearSchool;
    if (nearHospital != null) params['nearHospital'] = nearHospital;
    if (nearMosque != null) params['nearMosque'] = nearMosque;
    if (nearUniversity != null) params['nearUniversity'] = nearUniversity;
    if (nearBus != null) params['nearBus'] = nearBus;
    if (nearTram != null) params['nearTram'] = nearTram;
    if (nearMarket != null) params['nearMarket'] = nearMarket;
    if (nearTrainStation != null) {
      params['nearTrainStation'] = nearTrainStation;
    }
    if (popularArea != null) params['popularArea'] = popularArea;
    if (modernArea != null) params['modernArea'] = modernArea;
    if (quietArea != null) params['quietArea'] = quietArea;
    if (familyArea != null) params['familyArea'] = familyArea;
    if (sunDirection != null && sunDirection.isNotEmpty) {
      params['sunDirection'] = sunDirection;
    }
    if (gardenView != null) params['gardenView'] = gardenView;
    if (streetView != null) params['streetView'] = streetView;
    if (seaView != null) params['seaView'] = seaView;
    if (paymentMethod != null && paymentMethod.isNotEmpty) {
      params['paymentMethod'] = paymentMethod;
    }
    if (isVerified != null) params['isVerified'] = isVerified;

    final response = await _apiClient.get(
      ApiConstants.searchProperties,
      queryParameters: params,
    );
    final data = response.data as Map<String, dynamic>;
    final content = data['content'] as List<dynamic>? ?? [];
    return content
        .map((e) => PropertyModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<String>> getCities() async {
    final response = await _apiClient.get(ApiConstants.cities);
    return (response.data as List<dynamic>?)?.cast<String>() ?? [];
  }

  Future<List<String>> getCategories() async {
    final response = await _apiClient.get(ApiConstants.categories);
    return (response.data as List<dynamic>?)?.cast<String>() ?? [];
  }

  Future<List<String>> getTransactionTypes() async {
    final response = await _apiClient.get(ApiConstants.transactionTypes);
    return (response.data as List<dynamic>?)?.cast<String>() ?? [];
  }

  Future<Map<String, dynamic>> getCityStats() async {
    final response = await _apiClient.get(ApiConstants.cityStats);
    return response.data as Map<String, dynamic>;
  }

  Future<List<dynamic>> getCityStatsDetailed() async {
    final response = await _apiClient.get(ApiConstants.cityStatsDetailed);
    final data = response.data as List<dynamic>? ?? [];
    return data;
  }

  Future<List<PropertyModel>> getRecommendations({int limit = 8}) async {
    final response = await _apiClient.get(
      ApiConstants.recommendations,
      queryParameters: {'limit': limit},
    );
    final data = response.data as List<dynamic>? ?? [];
    return data
        .map((e) => PropertyModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<PropertyModel>> getSimilarProperties(int propertyId,
      {int limit = 6}) async {
    final response = await _apiClient.get(
      '${ApiConstants.similarProperties}/$propertyId',
      queryParameters: {'limit': limit},
    );
    final data = response.data as List<dynamic>? ?? [];
    return data
        .map((e) => PropertyModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<PropertyModel>> getTrendingProperties(
      {String period = 'week', int limit = 8}) async {
    final response = await _apiClient.get(
      ApiConstants.trendingProperties,
      queryParameters: {'period': period, 'limit': limit},
    );
    final data = response.data as List<dynamic>? ?? [];
    return data
        .map((e) => PropertyModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<PropertyModel>> getMyProperties(
      {int page = 0, int size = 20}) async {
    final response = await _apiClient.get(
      ApiConstants.myProperties,
      queryParameters: {'page': page, 'size': size},
    );
    final data = response.data as Map<String, dynamic>;
    final content = data['content'] as List<dynamic>? ?? [];
    return content
        .map((e) => PropertyModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<PropertyModel> createProperty(
    Map<String, dynamic> propertyData, {
    List<MultipartFile> images = const [],
    MultipartFile? video,
  }) async {
    final formData = FormData.fromMap({
      'property': MultipartFile.fromString(
        jsonEncode(propertyData),
        filename: 'property.json',
        contentType: MediaType.parse('application/json'),
      ),
      if (images.isNotEmpty) 'images': images,
      if (video != null) 'video': video,
    });
    final response = await _apiClient.post(
      ApiConstants.properties,
      data: formData,
    );
    return PropertyModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<PropertyModel> updateProperty(
    int id,
    Map<String, dynamic> propertyData, {
    List<MultipartFile> newImages = const [],
    List<String> existingImageUrls = const [],
  }) async {
    // Conserve les images existantes dans le DTO ; le backend les fusionne avec les nouvelles.
    if (existingImageUrls.isNotEmpty) {
      propertyData['images'] = existingImageUrls;
    }
    final formData = FormData.fromMap({
      'property': MultipartFile.fromString(
        jsonEncode(propertyData),
        filename: 'property.json',
        contentType: MediaType.parse('application/json'),
      ),
      if (newImages.isNotEmpty) 'newImages': newImages,
    });
    final response = await _apiClient.put(
      '${ApiConstants.properties}/$id/with-images',
      data: formData,
    );
    return PropertyModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<void> deleteProperty(int id) async {
    await _apiClient.delete('${ApiConstants.properties}/$id');
  }

  Future<List<dynamic>> getOwnerRankings() async {
    final response = await _apiClient.get(ApiConstants.ownerRankings);
    final data = response.data as List<dynamic>? ?? [];
    return data;
  }
}
