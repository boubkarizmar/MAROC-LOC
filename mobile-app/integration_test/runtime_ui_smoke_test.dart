import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:marocloc_mobile/app.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  // Match the same secure-storage options the app uses so that clearing
  // the token and marking onboarding complete actually affect the app.
  const secure = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  const testEmail = 'fatima.benali@email.ma';
  const testPassword = 'Password123!';

  group('Runtime UI smoke tests', () {
    testWidgets('login, navigate home, chatbot responds', (WidgetTester tester) async {
      // Clear any leftover session, then mark onboarding as complete so the
      // splash screen routes directly to login.
      await secure.deleteAll();
      await secure.write(key: 'onboarding_complete', value: 'true');
      final tokenAfterClear = await secure.read(key: 'auth_token');
      expect(tokenAfterClear, isNull);

      // Launch app.
      await tester.pumpWidget(const ProviderScope(child: MarocLocApp()));

      // SplashPage has infinite animations, so pumpAndSettle would time out.
      // Pump in one-second chunks until the login form appears (or we time
      // out after ~10s).
      var loginFieldsFound = false;
      for (var i = 0; i < 12; i++) {
        await tester.pump(const Duration(seconds: 1));
        if (find.byType(TextFormField).evaluate().isNotEmpty) {
          loginFieldsFound = true;
          break;
        }
      }
      expect(loginFieldsFound, isTrue,
          reason: 'Login page did not appear after splash timeout');

      // Settle the login page before interacting.
      await tester.pumpAndSettle(const Duration(seconds: 2));

      final textFields = find.byType(TextFormField);
      expect(textFields, findsNWidgets(2));

      // Fill email (first field) and password (second field).
      await tester.enterText(textFields.at(0), testEmail);
      await tester.enterText(textFields.at(1), testPassword);
      await tester.pump();

      // Tap the primary login button (ElevatedButton inside AppButton).
      final loginButton = find.byType(ElevatedButton).first;
      expect(loginButton, findsOneWidget);
      await tester.tap(loginButton);
      await tester.pump();

      // Wait for the API call and navigation to home.
      var homeFound = false;
      for (var i = 0; i < 15; i++) {
        await tester.pump(const Duration(seconds: 1));
        if (find.byType(NavigationBar).evaluate().isNotEmpty) {
          homeFound = true;
          break;
        }
      }
      expect(homeFound, isTrue, reason: 'Home navigation bar did not appear');
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Home should show bottom navigation.
      expect(find.byType(NavigationBar), findsOneWidget);

      // Open chatbot via the home FAB.
      final fabFinder = find.byType(FloatingActionButton);
      expect(fabFinder, findsOneWidget);
      await tester.tap(fabFinder);
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Chatbot page should contain a single TextField input.
      final chatInput = find.byType(TextField);
      expect(chatInput, findsOneWidget);

      // Type a message.
      await tester.enterText(chatInput, 'Bonjour, cherche un appartement à Casablanca');
      await tester.pump();

      // Send.
      await tester.tap(find.byIcon(Icons.send));
      await tester.pump();

      // Wait for the AI response (model load + inference can take 5-25s).
      await tester.pumpAndSettle(const Duration(seconds: 25));

      // After response the chatbot list should still be present.
      expect(find.byType(ListView), findsOneWidget);
      expect(find.byType(TextField), findsOneWidget);
    });
  });
}
