import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/user_model.dart';
import '../../services/auth_service.dart';
import '../../services/api_client.dart';
import '../../core/constants/api_constants.dart';
import '../../core/auth/auth_refresh_listenable.dart';

class AuthState {
  final bool isLoading;
  final bool isUpdating;
  final UserModel? user;
  final String? error;
  final bool isAuthenticated;

  const AuthState({
    this.isLoading = false,
    this.isUpdating = false,
    this.user,
    this.error,
    this.isAuthenticated = false,
  });

  bool get isAdmin => user?.role == 'ADMIN';
  bool get isProprietaire => user?.role == 'PROPRIETAIRE';

  AuthState copyWith({
    bool? isLoading,
    bool? isUpdating,
    UserModel? user,
    String? error,
    bool? isAuthenticated,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      isUpdating: isUpdating ?? this.isUpdating,
      user: user ?? this.user,
      error: error,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthService _authService;
  final ApiClient _apiClient;

  AuthNotifier(this._authService, this._apiClient) : super(const AuthState()) {
    authRefreshListenable.addListener(_onAuthRefreshChanged);
    _checkAuthStatus();
  }

  void _onAuthRefreshChanged() {
    // When the global listenable signals logout (e.g., token expiry),
    // reset the auth state so UI and router react immediately.
    if (!authRefreshListenable.value && state.isAuthenticated) {
      state = const AuthState();
    }
  }

  void _notifyAuthChange() {
    if (state.isAuthenticated != authRefreshListenable.value) {
      authRefreshListenable.value = state.isAuthenticated;
    }
  }

  @override
  void dispose() {
    authRefreshListenable.removeListener(_onAuthRefreshChanged);
    super.dispose();
  }

  Future<void> _checkAuthStatus() async {
    final isLoggedIn = await _authService.isLoggedIn();
    if (isLoggedIn) {
      final user = await _authService.getUser();
      if (user != null) {
        state = state.copyWith(isAuthenticated: true, user: user);
        _notifyAuthChange();
      }
    }
  }

  Future<void> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _apiClient.post(
        ApiConstants.login,
        data: {'email': email, 'password': password},
      );

      final data = response.data as Map<String, dynamic>;
      final token = data['accessToken'] as String?;
      final refreshToken = data['refreshToken'] as String?;

      if (token == null) {
        throw Exception('Réponse de connexion invalide');
      }

      await _authService.saveToken(token);
      if (refreshToken != null) {
        await _authService.saveRefreshToken(refreshToken);
      }

      // Backend returns user fields flat, not nested under 'user'
      final user = UserModel.fromJson({
        'id': data['userId'],
        'name': data['name'],
        'email': data['email'],
        'role': data['role'],
        'phoneNumber': data['phoneNumber'],
        'whatsappNumber': data['whatsappNumber'],
        'city': data['city'],
        'isVerified': data['isVerified'],
        'preferredCity': data['preferredCity'],
        'minBudget': data['minBudget'],
        'maxBudget': data['maxBudget'],
        'createdAt': data['createdAt'],
        'updatedAt': data['updatedAt'],
      });
      await _authService.saveUser(user);

      state =
          state.copyWith(isLoading: false, isAuthenticated: true, user: user);
      _notifyAuthChange();
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Erreur: ${e.toString()}',
      );
    }
  }

  Future<void> register({
    required String name,
    required String email,
    required String password,
    required String phone,
    required String role,
    String? firstName,
    String? lastName,
    String? fullName,
    String? city,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _apiClient.post(
        ApiConstants.register,
        data: {
          'name': name,
          'email': email,
          'password': password,
          'phone': phone,
          'role': role,
          if (firstName != null && firstName.isNotEmpty) 'firstName': firstName,
          if (lastName != null && lastName.isNotEmpty) 'lastName': lastName,
          if (fullName != null && fullName.isNotEmpty) 'fullName': fullName,
          if (city != null && city.isNotEmpty) 'city': city,
        },
      );
      state = state.copyWith(isLoading: false);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Erreur lors de l\'inscription. Veuillez réessayer.',
      );
    }
  }

  Future<bool> refreshToken() async {
    try {
      final refresh = await _authService.getRefreshToken();
      if (refresh == null) return false;

      final response = await _apiClient.post(
        ApiConstants.refreshToken,
        data: {'refreshToken': refresh},
      );

      final data = response.data as Map<String, dynamic>;
      final newToken = data['accessToken'] as String?;
      if (newToken != null) {
        await _authService.saveToken(newToken);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  Future<void> logout() async {
    await _authService.logout();
    state = const AuthState();
    _notifyAuthChange();
  }

  Future<void> clearError() async {
    state = state.copyWith(error: null);
  }

  Future<void> updateProfile(Map<String, dynamic> data) async {
    state = state.copyWith(isUpdating: true, error: null);
    try {
      final updatedUser = await _authService.updateProfile(data);
      if (updatedUser != null) {
        state = state.copyWith(isUpdating: false, user: updatedUser);
      } else {
        state = state.copyWith(
          isUpdating: false,
          error: 'Erreur lors de la mise à jour du profil',
        );
      }
    } catch (e) {
      state = state.copyWith(
        isUpdating: false,
        error: 'Erreur lors de la mise à jour du profil',
      );
    }
  }
}

final authServiceProvider = Provider<AuthService>((ref) => AuthService());

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final authService = ref.watch(authServiceProvider);
  final apiClient = ref.watch(apiClientProvider);
  return AuthNotifier(authService, apiClient);
});
