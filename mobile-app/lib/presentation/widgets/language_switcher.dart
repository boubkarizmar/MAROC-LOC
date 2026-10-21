import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../generated/l10n/app_localizations.dart';
import '../providers/locale_provider.dart';

class LanguageSwitcher extends ConsumerWidget {
  const LanguageSwitcher({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final locale = ref.watch(localeProvider);
    final l10n = AppLocalizations.of(context);

    return ListTile(
      leading: const Icon(Icons.language),
      title: Text(l10n.language),
      trailing: DropdownButtonHideUnderline(
        child: DropdownButton<Locale>(
          value: locale,
          icon: const Icon(Icons.arrow_drop_down),
          onChanged: (newLocale) {
            if (newLocale != null) {
              ref.read(localeProvider.notifier).setLocale(newLocale);
            }
          },
          items: [
            DropdownMenuItem(
                value: const Locale('fr'), child: Text(l10n.language_french)),
            DropdownMenuItem(
                value: const Locale('en'), child: Text(l10n.language_english)),
            DropdownMenuItem(
                value: const Locale('ar'), child: Text(l10n.language_arabic)),
          ],
        ),
      ),
    );
  }
}
