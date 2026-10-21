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

class RegisterPage extends ConsumerStatefulWidget {
  const RegisterPage({super.key});

  @override
  ConsumerState<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends ConsumerState<RegisterPage> {
  final _formKey = GlobalKey<FormState>();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _fullNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _obscurePassword = true;
  String _selectedRole = 'LOCATAIRE';
  String? _selectedCity;
  bool _fullNameEdited = false;

  static const _cities = [
    'Casablanca',
    'Rabat',
    'Marrakech',
    'Fes',
    'Tangier',
    'Agadir',
    'Meknes',
    'Oujda',
    'Kenitra',
    'Tetouan',
    'Safi',
    'El Jadida',
    'Nador',
    'Khenifra',
    'Berrechid',
    'Taza',
    'Settat',
    'Khouribga',
    'Beni Mellal',
    'Larache',
    'Inezgane',
    'Ouarzazate',
    'Tata',
    'Tan-Tan',
  ];

  @override
  void initState() {
    super.initState();
    _firstNameController.addListener(_autoGenerateFullName);
    _lastNameController.addListener(_autoGenerateFullName);
  }

  void _autoGenerateFullName() {
    if (!_fullNameEdited) {
      final first = _firstNameController.text.trim();
      final last = _lastNameController.text.trim();
      _fullNameController.text = '$first $last'.trim();
    }
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _fullNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _register() async {
    if (!_formKey.currentState!.validate()) return;
    if (_passwordController.text != _confirmPasswordController.text) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content:
              Text(AppLocalizations.of(context).register_password_mismatch),
          backgroundColor: AppTheme.error500,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppTokens.radiusLg)),
        ),
      );
      return;
    }

    final authNotifier = ref.read(authProvider.notifier);
    await authNotifier.register(
      name: _fullNameController.text.trim(),
      email: _emailController.text.trim(),
      password: _passwordController.text,
      phone: _phoneController.text.trim(),
      role: _selectedRole,
      firstName: _firstNameController.text.trim(),
      lastName: _lastNameController.text.trim(),
      fullName: _fullNameController.text.trim(),
      city: _selectedCity,
    );

    if (!mounted) return;

    final authState = ref.read(authProvider);
    if (authState.error == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(AppLocalizations.of(context).register_success)),
      );
      context.go('/login');
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(authState.error!),
          backgroundColor: AppTheme.error500,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    return Scaffold(
      backgroundColor: context.backgroundColor,
      appBar: AppBar(
        title: Text(AppLocalizations.of(context).register_title),
        backgroundColor: context.backgroundColor,
        elevation: 0,
        foregroundColor: context.textPrimary,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Logo
                AppLogo.auth(),
                const SizedBox(height: 24),
                // First Name & Last Name
                Row(
                  children: [
                    Expanded(
                      child: _buildTextField(
                        controller: _firstNameController,
                        label: AppLocalizations.of(context).register_first_name,
                        icon: Icons.person_outline,
                        validator: (v) => v == null || v.isEmpty
                            ? AppLocalizations.of(context).common_required_field
                            : null,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildTextField(
                        controller: _lastNameController,
                        label: AppLocalizations.of(context).register_last_name,
                        icon: Icons.person_outline,
                        validator: (v) => v == null || v.isEmpty
                            ? AppLocalizations.of(context).common_required_field
                            : null,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                _buildTextField(
                  controller: _fullNameController,
                  label: AppLocalizations.of(context).register_full_name_label,
                  icon: Icons.badge_outlined,
                  onChanged: (_) => _fullNameEdited = true,
                  validator: (v) =>
                      v == null || v.isEmpty ? 'Champ requis' : null,
                ),
                const SizedBox(height: 16),
                _buildTextField(
                  controller: _emailController,
                  label: AppLocalizations.of(context).register_email_label,
                  icon: Icons.email_outlined,
                  keyboardType: TextInputType.emailAddress,
                  validator: (v) {
                    if (v == null || v.isEmpty) {
                      return AppLocalizations.of(context)
                          .register_email_required;
                    }
                    if (!v.contains('@')) {
                      return AppLocalizations.of(context)
                          .register_email_invalid;
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                _buildTextField(
                  controller: _phoneController,
                  label: AppLocalizations.of(context).register_phone_label,
                  icon: Icons.phone_outlined,
                  keyboardType: TextInputType.phone,
                  hint: AppLocalizations.of(context).register_phone_hint,
                  validator: (v) => v == null || v.isEmpty
                      ? AppLocalizations.of(context).register_phone_required
                      : null,
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  value: _selectedCity,
                  decoration: _inputDecoration(
                      AppLocalizations.of(context).register_city_label,
                      Icons.location_on_outlined),
                  hint: Text(AppLocalizations.of(context).register_city_hint),
                  items: _cities
                      .map((city) =>
                          DropdownMenuItem(value: city, child: Text(city)))
                      .toList(),
                  onChanged: (value) => setState(() => _selectedCity = value),
                  validator: (v) =>
                      v == null || v.isEmpty ? 'Champ requis' : null,
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  value: _selectedRole,
                  decoration: _inputDecoration(
                      AppLocalizations.of(context).register_account_type_label,
                      Icons.badge_outlined),
                  items: [
                    DropdownMenuItem(
                        value: 'LOCATAIRE',
                        child: Text(AppLocalizations.of(context)
                            .register_account_type_tenant)),
                    DropdownMenuItem(
                        value: 'PROPRIETAIRE',
                        child: Text(AppLocalizations.of(context)
                            .register_account_type_owner)),
                  ],
                  onChanged: (value) => setState(() => _selectedRole = value!),
                ),
                const SizedBox(height: 16),
                _buildTextField(
                  controller: _passwordController,
                  label: AppLocalizations.of(context).register_password_label,
                  icon: Icons.lock_outline,
                  obscureText: _obscurePassword,
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscurePassword
                          ? Icons.visibility_off
                          : Icons.visibility,
                      color: context.textMuted,
                    ),
                    onPressed: () =>
                        setState(() => _obscurePassword = !_obscurePassword),
                  ),
                  validator: (v) => v == null || v.length < 6
                      ? AppLocalizations.of(context).register_password_min
                      : null,
                ),
                const SizedBox(height: 16),
                _buildTextField(
                  controller: _confirmPasswordController,
                  label: AppLocalizations.of(context)
                      .register_password_confirm_label,
                  icon: Icons.lock_outline,
                  obscureText: _obscurePassword,
                  validator: (v) => v == null || v.isEmpty
                      ? AppLocalizations.of(context)
                          .register_password_confirm_required
                      : null,
                ),
                const SizedBox(height: 24),
                AppButton(
                  label: AppLocalizations.of(context).register_button,
                  variant: AppButtonVariant.primary,
                  fullWidth: true,
                  isLoading: authState.isLoading,
                  onPressed: authState.isLoading ? null : _register,
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      AppLocalizations.of(context).register_has_account,
                      style: TextStyle(color: context.textSecondary),
                    ),
                    TextButton(
                      onPressed: () {
                        context.go('/login');
                      },
                      child: Text(
                        AppLocalizations.of(context).register_login_link,
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

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    TextInputType? keyboardType,
    String? hint,
    bool obscureText = false,
    Widget? suffixIcon,
    String? Function(String?)? validator,
    void Function(String)? onChanged,
  }) {
    return TextFormField(
      controller: controller,
      style: TextStyle(color: context.textPrimary),
      keyboardType: keyboardType,
      obscureText: obscureText,
      decoration: _inputDecoration(label, icon, hint: hint).copyWith(
        suffixIcon: suffixIcon,
      ),
      validator: validator,
      onChanged: onChanged,
    );
  }

  InputDecoration _inputDecoration(String label, IconData icon,
      {String? hint}) {
    return InputDecoration(
      labelText: label,
      labelStyle: TextStyle(color: context.textSecondary),
      hintText: hint,
      hintStyle: TextStyle(color: context.textMuted),
      prefixIcon: Icon(icon, color: AppTheme.primary500),
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
        borderSide: const BorderSide(color: AppTheme.primary500, width: 2),
      ),
    );
  }
}
