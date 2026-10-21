import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('Runtime network smoke tests', () {
    testWidgets('backend platform stats is reachable from device',
        (WidgetTester tester) async {
      final dio = Dio(BaseOptions(
        baseUrl: 'http://10.0.2.2:8080/api',
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 10),
      ));
      final response = await dio.get('/v1/platform/stats');
      expect(response.statusCode, equals(200));
      expect(response.data, isNotNull);
    });

    testWidgets('AI service health is reachable from device',
        (WidgetTester tester) async {
      final dio = Dio(BaseOptions(
        baseUrl: 'http://10.0.2.2:8000',
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 10),
      ));
      final response = await dio.get('/health');
      expect(response.statusCode, equals(200));
      expect(response.data['status'], equals('healthy'));
    });

    testWidgets('backend AI proxy /v1/ai/chat is reachable from device',
        (WidgetTester tester) async {
      final dio = Dio(BaseOptions(
        baseUrl: 'http://10.0.2.2:8080/api',
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 30),
      ));
      final response = await dio.post('/v1/ai/chat', data: {
        'message': 'Bonjour',
        'session_id': 'runtime-smoke-test',
        'language': 'fr',
        'user_role': 'GUEST',
      });
      expect(response.statusCode, equals(200));
      expect(response.data, isNotNull);
    });
  });
}
