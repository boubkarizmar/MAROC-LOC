import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
// ignore: unused_import
import 'package:dio/dio.dart';
import '../../generated/l10n/app_localizations.dart';
import '../providers/property_provider.dart';
import '../widgets/property_form_wizard.dart';

class CreatePropertyPage extends ConsumerWidget {
  const CreatePropertyPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(propertyProvider);

    return PropertyFormWizard(
      isSaving: state.isSaving,
      onSubmit: (data, images, video) async {
        await ref
            .read(propertyProvider.notifier)
            .createProperty(data, images: images, video: video);
        if (!context.mounted) return;
        final currentState = ref.read(propertyProvider);
        if (currentState.error == null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
                content:
                    Text(AppLocalizations.of(context).property_create_success)),
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
