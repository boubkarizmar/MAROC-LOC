class ApiConstants {
  ApiConstants._();

  /// Default is Android emulator loopback (10.0.2.2).
  /// For a real device, build with --dart-define=API_BASE_URL=http://HOST_IP:8080/api
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:8080/api',
  );

  /// WebSocket base URL for SockJS (must use http:// scheme, not ws://)
  static const String wsBaseUrl = String.fromEnvironment(
    'WS_BASE_URL',
    defaultValue: 'http://10.0.2.2:8080/api',
  );

  /// AI Service URL (analytics, chatbot, TTS)
  static const String aiBaseUrl = String.fromEnvironment(
    'AI_BASE_URL',
    defaultValue: 'http://10.0.2.2:8000',
  );

  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);

  // Auth endpoints
  static const String login = '/v1/auth/login';
  static const String register = '/v1/auth/register';
  static const String refreshToken = '/v1/auth/refresh';
  static const String logout = '/v1/auth/logout';

  // Property endpoints (v2)
  static const String properties = '/v2/properties';
  static const String searchProperties = '/v2/properties/search';
  static const String myProperties = '/v2/properties/my-properties';
  static const String cities = '/v2/properties/cities';
  static const String categories = '/v2/properties/categories';
  static const String transactionTypes = '/v2/properties/transaction-types';
  static const String topRanked = '/v2/properties/top-ranked';
  static const String ownerRankings = '/v2/properties/owner-rankings';
  static const String cityStats = '/v2/properties/city-stats';
  static const String cityStatsDetailed = '/v2/properties/city-stats/detailed';
  static const String propertyReserve = '/v2/properties'; // /{id}/reserve
  static const String myReservations = '/v1/reservations/my';

  // User endpoints
  static const String users = '/v1/users';
  static const String favorites = '/v1/favorites';
  static const String messages = '/v1/messages';
  static const String reviews = '/v1/reviews';
  static const String siteReviews = '/v1/reviews/site';

  // Ads endpoints
  static const String ads = '/v1/ads';
  static const String adsRotation = '/v1/ads/rotation';
  static const String adsRequests = '/v1/ads/requests';
  static const String adsPlans = '/v1/ads/plans';
  static const String adsCheckout = '/v1/ads/checkout';

  // Recommendation endpoints
  static const String recommendations = '/v1/recommendations/personalized';
  static const String similarProperties = '/v1/recommendations/similar';
  static const String trendingProperties = '/v1/recommendations/trending';
  static const String nearbyProperties = '/v1/recommendations/nearby';

  // Platform endpoints
  static const String platformStats = '/v1/platform/stats';

  // AI endpoints (served by the AI service directly)
  static const String aiChat = '/smart/chat';
  static const String aiSearch = '/v1/ai/search';
  static const String aiVoice = '/v1/ai/voice/chat';

  // Payment endpoints
  static const String payments = '/v1/payments';
  static const String cmiInitiate = '/v1/payments/cmi/initiate';

  // Notification endpoints
  static const String notifications = '/v1/notifications';
  static const String notificationUnreadCount = '/v1/notifications/unread-count';
  static const String notificationReadAll = '/v1/notifications/read-all';
  static const String notificationStats = '/v1/notifications/stats';
  static const String notificationPreferences = '/v1/notifications/preferences';
  static const String fcmRegister = '/v1/fcm/register';
  static const String fcmUnregister = '/v1/fcm/unregister';

  // Subscription endpoints
  static const String subscription = '/v1/subscriptions';

  // Visit endpoints
  static const String visits = '/v1/visits';

  // Comment endpoints
  static const String comments = '/v1/reviews/comments';

  // Event tracking
  static const String events = '/v1/events';

  // Fraud review
  static const String fraudReview = '/v1/fraud-review';

  // Admin
  static const String adminStats = '/v1/admin/stats';
  static const String adminProperties = '/v1/admin/properties';
  static const String adminUsers = '/v1/admin/users';
  static const String adminAds = '/v1/admin/ads';
  static const String adminEvents = '/v1/admin/events';
  static const String adminSettings = '/v1/admin/settings';

  // Review moderation
  static const String reviewModeration = '/v1/reviews/moderation';
  static const String reviewModerationPending = '/v1/reviews/moderation/pending';

  // Admin analytics & stats
  static const String adminPlatformAnalytics = '/v1/analytics/admin/platform';
  static const String adminMonthlyAnalytics = '/v1/analytics/admin/monthly';
  static const String adminYearlyAnalytics = '/v1/analytics/admin/yearly';
  static const String adminStatsEnhanced = '/v1/admin/stats/enhanced';

  // Owner analytics
  static const String ownerDashboard = '/v1/analytics/owner/dashboard';
  static const String revenueAnalytics = '/v1/analytics/revenue';

  // Subscription endpoints (backend is /v1/subscription, not /v1/subscriptions)
  static const String subscriptionTiers = '/v1/subscription/tiers';
  static const String subscriptionUsage = '/v1/subscription/usage';

  // Fraud review decision endpoint
  static const String fraudReviewDecision = '/v1/fraud-review';

  // Comment endpoints
  static const String commentsBase = '/v1/reviews/comments';
  static const String commentsByReview = '/v1/reviews/comments/review';
}
