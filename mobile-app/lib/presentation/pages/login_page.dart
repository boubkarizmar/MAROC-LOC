import 'package:go_router/go_router.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../generated/l10n/app_localizations.dart';
import '../../core/design_system/tokens/app_tokens.dart';
import '../../core/theme/theme_extensions.dart';
import '../../core/theme/app_theme.dart';
import '../../core/design_system/components/app_button.dart';
import '../../core/design_system/components/app_logo.dart';
import '../providers/auth_provider.dart';

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;

    final authNotifier = ref.read(authProvider.notifier);
    await authNotifier.login(
      _emailController.text.trim(),
      _passwordController.text,
    );

    if (!mounted) return;

    final authState = ref.read(authProvider);
    if (authState.isAuthenticated) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) context.go('/home');
      });
    } else if (authState.error != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(authState.error!),
          backgroundColor: AppTheme.error500,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppTokens.radiusLg)),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final authState = ref.watch(authProvider);

    return Scaffold(
      backgroundColor: context.backgroundColor,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 32),
                // Logo
                AppLogo.auth(),
                const SizedBox(height: 24),
                Text(
                  'MAROC-LOC',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w900,
                    color: context.textPrimary,
                    letterSpacing: 3,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  l10n.login_title,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 16,
                    color: context.textSecondary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 40),
                // Email
                Semantics(
                  textField: true,
                  label: l10n.login_email_label,
                  child: TextFormField(
                    controller: _emailController,
                    style: TextStyle(color: context.textPrimary),
                    keyboardType: TextInputType.emailAddress,
                    decoration: InputDecoration(
                      labelText: l10n.login_email_label,
                      labelStyle: TextStyle(color: context.textSecondary),
                      prefixIcon: const Icon(Icons.email_outlined,
                          color: AppTheme.primary500),
                      filled: true,
                      fillColor: Theme.of(context).colorScheme.surface,
                      hintStyle: TextStyle(color: context.textMuted),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(AppTokens.radiusMd),
                        borderSide: BorderSide.none,
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(AppTokens.radiusMd),
                        borderSide: BorderSide.none,
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(AppTokens.radiusMd),
                        borderSide: const BorderSide(
                            color: AppTheme.primary500, width: 2),
                      ),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return l10n.login_email_required;
                      }
                      if (!value.contains('@')) return l10n.login_email_invalid;
                      return null;
                    },
                  ),
                ),
                const SizedBox(height: 16),
                // Password
                Semantics(
                  textField: true,
                  label: l10n.login_password_label,
                  child: TextFormField(
                    controller: _passwordController,
                    style: TextStyle(color: context.textPrimary),
                    obscureText: _obscurePassword,
                    decoration: InputDecoration(
                      labelText: l10n.login_password_label,
                      labelStyle: TextStyle(color: context.textSecondary),
                      prefixIcon: const Icon(Icons.lock_outline,
                          color: AppTheme.primary500),
                      suffixIcon: Semantics(
                        button: true,
                        label: _obscurePassword
                            ? 'Afficher le mot de passe'
                            : 'Masquer le mot de passe',
                        child: IconButton(
                          icon: Icon(
                            _obscurePassword
                                ? Icons.visibility_off
                                : Icons.visibility,
                            color: context.textMuted,
                          ),
                          onPressed: () => setState(
                              () => _obscurePassword = !_obscurePassword),
                        ),
                      ),
                      filled: true,
                      fillColor: Theme.of(context).colorScheme.surface,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(AppTokens.radiusMd),
                        borderSide: BorderSide.none,
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(AppTokens.radiusMd),
                        borderSide: BorderSide.none,
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(AppTokens.radiusMd),
                        borderSide: const BorderSide(
                            color: AppTheme.primary500, width: 2),
                      ),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return l10n.login_password_required;
                      }
                      if (value.length < 6) return l10n.login_password_min;
                      return null;
                    },
                  ),
                ),
                const SizedBox(height: 8),
                Align(
                  alignment: AlignmentDirectional.centerEnd,
                  child: TextButton(
                    onPressed: () => context.push('/forgot-password'),
                    child: Text(
                      l10n.login_forgot_password,
                      style: TextStyle(
                          color: AppTheme.primary500,
                          fontWeight: FontWeight.w600),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Semantics(
                  button: true,
                  label: l10n.login_button,
                  child: AppButton(
                    label: l10n.login_button,
                    variant: AppButtonVariant.primary,
                    fullWidth: true,
                    isLoading: authState.isLoading,
                    onPressed: authState.isLoading ? null : _login,
                  ),
                ),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      l10n.login_no_account,
                      style: TextStyle(color: context.textSecondary),
                    ),
                    TextButton(
                      onPressed: () {
                        context.push('/register');
                      },
                      child: Text(
                        l10n.login_register_link,
                        style: TextStyle(
                          color: AppTheme.primary500,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
