import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import '../../generated/l10n/app_localizations.dart';
import '../providers/auth_provider.dart';

import '../../core/design_system/tokens/app_tokens.dart';

class EditProfilePage extends ConsumerStatefulWidget {
  const EditProfilePage({super.key});

  @override
  ConsumerState<EditProfilePage> createState() => _EditProfilePageState();
}

class _EditProfilePageState extends ConsumerState<EditProfilePage> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _whatsappController = TextEditingController();
  final _cityController = TextEditingController();
  final _preferredCityController = TextEditingController();

  @override
  void initState() {
    super.initState();
    final user = ref.read(authProvider).user;
    if (user != null) {
      _nameController.text = user.name;
      _emailController.text = user.email;
      _phoneController.text = user.phoneNumber ?? '';
      _whatsappController.text = user.whatsappNumber ?? '';
      _cityController.text = user.city ?? '';
      _preferredCityController.text = user.preferredCity ?? '';
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _whatsappController.dispose();
    _cityController.dispose();
    _preferredCityController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final data = <String, dynamic>{
      'name': _nameController.text.trim(),
      'email': _emailController.text.trim(),
      if (_phoneController.text.trim().isNotEmpty)
        'phoneNumber': _phoneController.text.trim(),
      if (_whatsappController.text.trim().isNotEmpty)
        'whatsappNumber': _whatsappController.text.trim(),
      if (_cityController.text.trim().isNotEmpty)
        'city': _cityController.text.trim(),
      if (_preferredCityController.text.trim().isNotEmpty)
        'preferredCity': _preferredCityController.text.trim(),
    };

    await ref.read(authProvider.notifier).updateProfile(data);

    if (mounted && ref.read(authProvider).error == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: Text(AppLocalizations.of(context).profile_update_success)),
      );
      context.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(AppLocalizations.of(context).profile_edit_title),
        backgroundColor: AppTheme.primary500,
        foregroundColor: AppTokens.gray50,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _buildTextField(
                AppLocalizations.of(context).profile_edit_name, _nameController,
                required: true),
            const SizedBox(height: 12),
            _buildTextField(AppLocalizations.of(context).profile_edit_email,
                _emailController,
                required: true, keyboardType: TextInputType.emailAddress),
            const SizedBox(height: 12),
            _buildTextField(AppLocalizations.of(context).profile_edit_phone,
                _phoneController,
                keyboardType: TextInputType.phone),
            const SizedBox(height: 12),
            _buildTextField(AppLocalizations.of(context).profile_edit_whatsapp,
                _whatsappController,
                keyboardType: TextInputType.phone),
            const SizedBox(height: 12),
            _buildTextField(AppLocalizations.of(context).profile_edit_city,
                _cityController),
            const SizedBox(height: 12),
            _buildTextField(
                AppLocalizations.of(context).profile_edit_preferred_city,
                _preferredCityController),
            const SizedBox(height: 24),
            if (auth.error != null)
              Text(
                auth.error!,
                style: const TextStyle(color: AppTheme.error500),
              ),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: auth.isUpdating ? null : _save,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary500,
                  foregroundColor: AppTokens.gray50,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: auth.isUpdating
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: AppTokens.gray50),
                      )
                    : Text(AppLocalizations.of(context).profile_edit_save),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField(
    String label,
    TextEditingController controller, {
    bool required = false,
    TextInputType keyboardType = TextInputType.text,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      decoration: InputDecoration(
        labelText: label + (required ? ' *' : ''),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppTheme.primary500),
        ),
      ),
      validator: required
          ? (v) => v == null || v.trim().isEmpty
              ? AppLocalizations.of(context).common_required_field
              : null
          : null,
    );
  }
}
