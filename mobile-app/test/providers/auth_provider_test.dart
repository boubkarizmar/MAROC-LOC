import 'package:flutter_test/flutter_test.dart';
import 'package:marocloc_mobile/presentation/providers/auth_provider.dart';

void main() {
  group('AuthState', () {
    test('initial state is not authenticated', () {
      final state = AuthState();
      expect(state.isAuthenticated, false);
      expect(state.isLoading, false);
      expect(state.user, null);
      expect(state.error, null);
    });

    test('copyWith preserves values when null', () {
      final state = AuthState(isAuthenticated: true);
      final newState = state.copyWith();
      expect(newState.isAuthenticated, true);
    });

    test('copyWith updates values', () {
      final state = AuthState();
      final newState = state.copyWith(isLoading: true, error: 'test');
      expect(newState.isLoading, true);
      expect(newState.error, 'test');
    });

    test('clearError removes error', () {
      final state = AuthState(error: 'some error');
      final newState = state.copyWith(error: null);
      expect(newState.error, null);
    });
  });
}
