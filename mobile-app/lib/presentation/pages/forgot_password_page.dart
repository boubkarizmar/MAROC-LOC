import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/theme_extensions.dart';
import '../../core/design_system/components/app_button.dart';
import '../../core/design_system/components/app_input.dart';
import '../../core/design_system/tokens/app_tokens.dart';
import '../../generated/l10n/app_localizations.dart';

class ForgotPasswordPage extends StatefulWidget {
  const ForgotPasswordPage({super.key});

  @override
  State<ForgotPasswordPage> createState() => _ForgotPasswordPageState();
}

class _ForgotPasswordPageState extends State<ForgotPasswordPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _sendResetLink() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    // Simulate API call delay
    await Future.delayed(const Duration(seconds: 1));

    if (!mounted) return;

    setState(() => _isLoading = false);

    final l10n = AppLocalizations.of(context);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(l10n.forgot_password_email_sent),
        backgroundColor: AppTheme.success500,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppTokens.radiusMd),
        ),
      ),
    );

    context.pop();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Scaffold(
      backgroundColor: context.backgroundColor,
      appBar: AppBar(
        backgroundColor: context.backgroundColor,
        foregroundColor: context.textPrimary,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 16),
                Icon(
                  Icons.lock_reset_outlined,
                  size: 64,
                  color: AppTheme.primary500,
                ),
                const SizedBox(height: 24),
                Text(
                  l10n.forgot_password_title,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                    color: context.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  l10n.forgot_password_desc,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 14,
                    color: context.textSecondary,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 40),
                AppInput(
                  label: l10n.forgot_password_email_label,
                  hint: l10n.forgot_password_email_hint,
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  prefixIcon: const Icon(Icons.email_outlined,
                      color: AppTheme.primary500),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return l10n.forgot_password_email_required;
                    }
                    if (!value.contains('@')) {
                      return l10n.forgot_password_email_invalid;
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 24),
                AppButton(
                  label: l10n.forgot_password_send,
                  variant: AppButtonVariant.primary,
                  fullWidth: true,
                  isLoading: _isLoading,
                  onPressed: _isLoading ? null : _sendResetLink,
                ),
                const SizedBox(height: 16),
                AppButton(
                  label: l10n.forgot_password_back_to_login,
                  variant: AppButtonVariant.ghost,
                  fullWidth: true,
                  onPressed: () => context.pop(),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
