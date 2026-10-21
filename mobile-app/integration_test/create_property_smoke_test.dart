import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:marocloc_mobile/app.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:marocloc_mobile/core/constants/api_constants.dart';
import 'package:marocloc_mobile/presentation/pages/dashboard_page.dart';
import 'package:marocloc_mobile/data/models/user_model.dart';
import 'package:marocloc_mobile/services/auth_service.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  // The app uses the *default* (plain) secure storage for onboarding_complete
  // and the encrypted storage for auth tokens. Match both namespaces.
  const onboardingStorage = FlutterSecureStorage();
  const secure = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  const ownerEmail = 'youssef.alami@email.ma';
  const ownerPassword = 'Password123!';

  group('Create property smoke tests', () {
    testWidgets('proprietaire creates a property',
        (WidgetTester tester) async {
      // 1. Clear any old session.
      await AuthService().logout();
      await secure.deleteAll();
      await onboardingStorage.deleteAll();

      // 2. Log in via the backend and persist tokens + user.
      final dio = Dio(BaseOptions(baseUrl: ApiConstants.baseUrl));
      final loginResp = await dio.post(
        ApiConstants.login,
        data: {'email': ownerEmail, 'password': ownerPassword},
      );
      final loginData = loginResp.data as Map<String, dynamic>;
      final token = loginData['accessToken'] as String;
      final refreshToken = loginData['refreshToken'] as String;

      final auth = AuthService();
      await auth.saveToken(token);
      await auth.saveRefreshToken(refreshToken);
      await auth.saveUser(UserModel(
        id: loginData['userId'] as int,
        name: loginData['name'] as String,
        email: loginData['email'] as String,
        role: loginData['role'] as String,
      ));

      // 3. Mark onboarding complete so the splash routes to home.
      await onboardingStorage.write(
          key: 'onboarding_complete', value: 'true');

      // 4. Launch app authenticated.
      await tester.pumpWidget(const ProviderScope(child: MarocLocApp()));

      // Wait for home.
      var homeFound = false;
      for (var i = 0; i < 15; i++) {
        await tester.pump(const Duration(seconds: 1));
        if (find.byType(NavigationBar).evaluate().isNotEmpty) {
          homeFound = true;
          break;
        }
      }
      expect(homeFound, isTrue, reason: 'Home did not appear');
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // 5. Navigate directly to the create-property route.
      final navContext = tester.element(find.byType(NavigationBar));
      GoRouter.of(navContext).go('/property/create');
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Step 1: basic info. TextFormFields order: Titre, Description, Prix, Ville, Adresse.
      final step1Fields = find.byType(TextFormField);
      await tester.enterText(step1Fields.at(0), 'Test Appartement Casablanca');
      await tester.enterText(step1Fields.at(1),
          'Description suffisamment longue pour passer la validation minimale de cinquante caractères obligatoire.');
      await tester.enterText(step1Fields.at(2), '2500');
      await tester.enterText(step1Fields.at(3), 'Casablanca');
      await tester.enterText(step1Fields.at(4), 'Boulevard Zerktouni');
      await tester.pump();

      // Next.
      final nextButton = find.byKey(const Key('propertyFormWizardNextButton'));
      await tester.ensureVisible(nextButton);
      await tester.tap(nextButton);
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Step 2: features. TextFormFields order: Surface, Pièces, Chambres, Salles de bain, Étage.
      final step2Fields = find.byType(TextFormField);
      await tester.enterText(step2Fields.at(0), '80');
      await tester.enterText(step2Fields.at(1), '3');
      await tester.pump();

      // Advance through steps 3, 4 and 5 (amenities / environment / media).
      for (var step = 1; step <= 3; step++) {
        final nextButton = find.byKey(const Key('propertyFormWizardNextButton'));
        await tester.ensureVisible(nextButton);
        await tester.tap(nextButton);
        await tester.pumpAndSettle(const Duration(seconds: 1));
      }

      // Final step: save.
      final saveButton = find.byKey(const Key('propertyFormWizardNextButton'));
      await tester.ensureVisible(saveButton);
      await tester.tap(saveButton);
      await tester.pump();

      // Wait for API + navigation back to dashboard.
      var dashboardFound = false;
      for (var i = 0; i < 20; i++) {
        await tester.pump(const Duration(seconds: 1));
        if (find.byType(DashboardPage).evaluate().isNotEmpty) {
          dashboardFound = true;
          break;
        }
      }
      expect(dashboardFound, isTrue,
          reason: 'Did not return to dashboard after create');
    });
  });
}
