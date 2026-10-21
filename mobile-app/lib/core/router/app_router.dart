import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../presentation/providers/auth_provider.dart';
import '../../core/auth/auth_refresh_listenable.dart';
import '../../presentation/pages/splash_page.dart';
import '../../presentation/pages/login_page.dart';
import '../../presentation/pages/register_page.dart';
import '../../presentation/pages/home_page.dart';
import '../../presentation/pages/property_list_page.dart';
import '../../presentation/pages/property_detail_page.dart';
import '../../presentation/pages/favorites_page.dart';
import '../../presentation/pages/messages_page.dart';
import '../../presentation/pages/dashboard_page.dart';
import '../../presentation/pages/profile_page.dart';
import '../../presentation/pages/create_property_page.dart';
import '../../presentation/pages/edit_property_page.dart';
import '../../presentation/pages/chat_detail_page.dart';
import '../../presentation/pages/edit_profile_page.dart';
import '../../presentation/pages/visits_page.dart';
import '../../presentation/pages/analytics_page.dart';
import '../../presentation/pages/admin_page.dart';
import '../../presentation/screens/onboarding_screen.dart';
import '../../presentation/pages/chatbot_page.dart';
import '../../presentation/pages/create_ad_page.dart';
import '../../presentation/pages/forgot_password_page.dart';
import '../../presentation/pages/my_reservations_page.dart';
import '../../presentation/pages/mortgage_calculator_page.dart';
import '../../presentation/pages/owners_page.dart';
import '../../presentation/pages/owner_profile_page.dart';
import '../../presentation/pages/cities_page.dart';
import '../../presentation/pages/payment_callback_page.dart';
import '../../presentation/pages/cmi_payment_page.dart';
import '../../presentation/pages/cmi_webview_page.dart';
import '../../pages/notifications/notifications_page.dart';
import '../../presentation/widgets/app_bottom_nav.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/splash',
    debugLogDiagnostics: true,
    refreshListenable: authRefreshListenable,
    redirect: (context, state) {
      final authState = ref.read(authProvider);
      final isAuthenticated = authState.isAuthenticated;
      final user = authState.user;
      final isLoading = authState.isLoading;
      final location = state.matchedLocation;

      // Allow splash, login, register and onboarding always
      if (location == '/splash' ||
          location == '/login' ||
          location == '/register' ||
          location == '/onboarding') {
        return null;
      }

      // Publicly accessible routes: guests can browse listings, owners, cities
      // and property details. Protected actions (favorites, messages, boost,
      // creation) redirect to login at the point of action inside each page.
      final publicRoutes = [
        '/home',
        '/search',
        '/owners',
        '/cities',
        '/property',
      ];

      // Wait for auth check
      if (isLoading) return '/splash';

      // Redirect unauthenticated to login for non-public routes
      final isPublic = publicRoutes.any((route) =>
          route == '/property'
              ? location.startsWith('/property/')
              : location == route);
      if (!isAuthenticated && !isPublic) return '/login';

      // Role-based guards
      final isAdmin = user?.role == 'ADMIN';
      final isProprietaire = user?.role == 'PROPRIETAIRE';

      if (location.startsWith('/dashboard') ||
          location.startsWith('/property/create') ||
          (location.startsWith('/property/') && location.endsWith('/edit'))) {
        if (!isProprietaire && !isAdmin) return '/home';
      }

      if (location.startsWith('/admin')) {
        if (!isAdmin) return '/home';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashPage(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginPage(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterPage(),
      ),
      GoRoute(
        path: '/onboarding',
        builder: (context, state) => const OnboardingScreen(),
      ),
      GoRoute(
        path: '/notifications',
        builder: (context, state) => const NotificationsPage(),
      ),
      // Main shell with bottom nav
      ShellRoute(
        builder: (context, state, child) => AppBottomNav(child: child),
        routes: [
          GoRoute(
            path: '/home',
            builder: (context, state) => const HomePage(),
          ),
          GoRoute(
            path: '/search',
            builder: (context, state) => const PropertyListPage(),
          ),
          GoRoute(
            path: '/favorites',
            builder: (context, state) => const FavoritesPage(),
          ),
          GoRoute(
            path: '/messages',
            builder: (context, state) => const MessagesPage(),
          ),
          GoRoute(
            path: '/profile',
            builder: (context, state) => const ProfilePage(),
          ),
        ],
      ),
      // Detail pages (no bottom nav)
      GoRoute(
        path: '/property/create',
        builder: (context, state) => const CreatePropertyPage(),
      ),
      GoRoute(
        path: '/property/:id/edit',
        builder: (context, state) {
          final id = int.parse(state.pathParameters['id']!);
          return EditPropertyPage(propertyId: id);
        },
      ),
      GoRoute(
        path: '/property/:id',
        builder: (context, state) {
          final id = int.parse(state.pathParameters['id']!);
          return PropertyDetailPage(propertyId: id);
        },
      ),
      GoRoute(
        path: '/dashboard',
        builder: (context, state) => const DashboardPage(),
      ),
      GoRoute(
        path: '/dashboard/visits',
        builder: (context, state) => const VisitsPage(),
      ),
      GoRoute(
        path: '/dashboard/analytics',
        builder: (context, state) => const AnalyticsPage(),
      ),
      GoRoute(
        path: '/chat/:userId',
        builder: (context, state) {
          final userId = int.parse(state.pathParameters['userId']!);
          final userName = state.uri.queryParameters['name'] ?? 'Chat';
          final propertyId =
              int.tryParse(state.uri.queryParameters['propertyId'] ?? '');
          final propertyTitle = state.uri.queryParameters['propertyTitle'];
          return ChatDetailPage(
            userId: userId,
            userName: userName,
            propertyId: propertyId,
            propertyTitle: propertyTitle,
          );
        },
      ),
      GoRoute(
        path: '/profile/edit',
        builder: (context, state) => const EditProfilePage(),
      ),
      GoRoute(
        path: '/admin',
        builder: (context, state) => const AdminPage(),
      ),
      GoRoute(
        path: '/chatbot',
        builder: (context, state) => const ChatbotPage(),
      ),
      GoRoute(
        path: '/ads/create',
        builder: (context, state) => const CreateAdPage(),
      ),
      GoRoute(
        path: '/forgot-password',
        builder: (context, state) => const ForgotPasswordPage(),
      ),
      GoRoute(
        path: '/reservations',
        builder: (context, state) => const MyReservationsPage(),
      ),
      GoRoute(
        path: '/tools/mortgage-calculator',
        builder: (context, state) => const MortgageCalculatorPage(),
      ),
      GoRoute(
        path: '/owners',
        builder: (context, state) => const OwnersPage(),
      ),
      GoRoute(
        path: '/owners/:id',
        builder: (context, state) {
          final id = int.parse(state.pathParameters['id']!);
          return OwnerProfilePage(ownerId: id);
        },
      ),
      GoRoute(
        path: '/cities',
        builder: (context, state) => const CitiesPage(),
      ),
      GoRoute(
        path: '/payment/cmi/callback',
        builder: (context, state) => const PaymentCallbackPage(),
      ),
      GoRoute(
        path: '/payment/cmi',
        builder: (context, state) {
          final args = state.extra as Map<String, dynamic>? ?? {};
          return CmiPaymentPage(
            amount: (args['amount'] as num?)?.toDouble() ?? 0.0,
            description: args['description'] as String? ?? '',
            orderId: args['orderId'] as String?,
            advertisementId: args['advertisementId'] as int?,
            propertyId: args['propertyId'] as int?,
            transactionType: args['transactionType'] as String?,
            email: args['email'] as String?,
          );
        },
      ),
      GoRoute(
        path: '/payment/cmi/webview',
        builder: (context, state) {
          final args = state.extra as Map<String, dynamic>? ?? {};
          final params = (args['params'] as Map<String, dynamic>? ?? {})
              .map((k, v) => MapEntry(k, v.toString()));
          return CmiWebViewPage(
            gatewayUrl: args['gatewayUrl'] as String? ??
                'https://payment.cmi.co.ma/fim/est3Dgate',
            params: params,
            orderId: args['orderId'] as String? ?? '',
          );
        },
      ),
    ],
  );
});
