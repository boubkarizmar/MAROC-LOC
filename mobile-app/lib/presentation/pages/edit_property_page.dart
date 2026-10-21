import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
// ignore: unused_import
import 'package:dio/dio.dart';
import '../../core/theme/app_theme.dart';
import '../../generated/l10n/app_localizations.dart';
import '../providers/property_provider.dart';
import '../widgets/property_form_wizard.dart';

import '../../core/design_system/tokens/app_tokens.dart';

class EditPropertyPage extends ConsumerStatefulWidget {
  final int propertyId;

  const EditPropertyPage({super.key, required this.propertyId});

  @override
  ConsumerState<EditPropertyPage> createState() => _EditPropertyPageState();
}

class _EditPropertyPageState extends ConsumerState<EditPropertyPage> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(propertyProvider.notifier).loadPropertyDetail(widget.propertyId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(propertyProvider);
    final property = state.selectedProperty;

    if (state.isLoading) {
      return Scaffold(
        appBar: AppBar(
          title: Text(AppLocalizations.of(context).property_form_edit_title),
          backgroundColor: AppTheme.primary500,
          foregroundColor: AppTokens.gray50,
        ),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (property == null || property.id != widget.propertyId) {
      return Scaffold(
        appBar: AppBar(
          title: Text(AppLocalizations.of(context).property_form_edit_title),
          backgroundColor: AppTheme.primary500,
          foregroundColor: AppTokens.gray50,
        ),
        body: Center(
            child: Text(AppLocalizations.of(context).property_not_found)),
      );
    }

    return PropertyFormWizard(
      initialProperty: property,
      isSaving: state.isSaving,
      onSubmit: (data, images, video) async {
        final existingUrls = property.images ?? [];
        await ref.read(propertyProvider.notifier).updateProperty(
              widget.propertyId,
              data,
              newImages: images,
              existingImageUrls: existingUrls,
            );
        if (!context.mounted) return;
        final currentState = ref.read(propertyProvider);
        if (currentState.error == null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
                content:
                    Text(AppLocalizations.of(context).property_update_success)),
          );
          context.go('/dashboard');
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
                content: Text(currentState.error!),
                backgroundColor: Theme.of(context).colorScheme.error),
          );
        }
      },
    );
  }
}
