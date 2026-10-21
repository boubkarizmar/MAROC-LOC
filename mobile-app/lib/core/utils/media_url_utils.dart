import '../constants/api_constants.dart';

/// Fixes relative media URLs returned by the backend to absolute URLs.
/// Mirrors the React frontend `fixMediaUrl()` behavior in `axiosConfig.ts`.
String fixMediaUrl(String? url) {
  if (url == null || url.isEmpty) return '';
  if (url.startsWith('data:') || url.startsWith('blob:')) return '';

  var fixedUrl = url.trim();

  // Fix double-slash path issues from backend
  fixedUrl = fixedUrl
      .replaceAll('/api/videos//uploads/images/', '/api/uploads/images/')
      .replaceAll('/api/videos//uploads/videos/', '/api/uploads/videos/')
      .replaceAll('/api/videos//uploads/', '/api/uploads/')
      .replaceAll('/api/videos//', '/api/')
      .replaceAll('//uploads/', '/uploads/')
      .replaceAll('/api/videos/uploads/', '/api/uploads/');

  if (fixedUrl.contains('/api/videos//')) {
    fixedUrl = fixedUrl.replaceAll('/api/videos//', '/api/uploads/');
  }

  // Already absolute
  if (fixedUrl.startsWith('http://') || fixedUrl.startsWith('https://')) {
    return fixedUrl;
  }

  // Prefix with asset base URL (strip trailing /api from API base)
  final baseUrl = ApiConstants.baseUrl.replaceAll(RegExp(r'/api/?$'), '');

  if (fixedUrl.startsWith('/api/uploads/')) {
    return '$baseUrl$fixedUrl';
  }

  if (fixedUrl.startsWith('/uploads/')) {
    return '$baseUrl/api$fixedUrl';
  }

  if (!fixedUrl.startsWith('/')) {
    return '$baseUrl/api/uploads/$fixedUrl';
  }

  return '$baseUrl$fixedUrl';
}

/// Fixes all media URLs inside a parsed JSON map.
/// Used to patch backend responses before model parsing.
void fixMediaUrlsInJson(Map<String, dynamic> json) {
  // Fix imageUrl
  if (json['imageUrl'] is String) {
    json['imageUrl'] = fixMediaUrl(json['imageUrl'] as String);
  }

  // Fix videoTour
  if (json['videoTour'] is String) {
    json['videoTour'] = fixMediaUrl(json['videoTour'] as String);
  }

  // Fix videoUrl
  if (json['videoUrl'] is String) {
    json['videoUrl'] = fixMediaUrl(json['videoUrl'] as String);
  }

  // Fix images array
  if (json['images'] is List) {
    json['images'] = (json['images'] as List)
        .whereType<String>()
        .where((url) => url.trim().isNotEmpty)
        .map(fixMediaUrl)
        .toList();
  }

  // Fix avatar
  if (json['avatar'] is String) {
    json['avatar'] = fixMediaUrl(json['avatar'] as String);
  }

  // Fix cinImageUrl
  if (json['cinImageUrl'] is String) {
    json['cinImageUrl'] = fixMediaUrl(json['cinImageUrl'] as String);
  }
}
