import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'core/router/app_router.dart';
import 'generated/l10n/app_localizations.dart';
import 'core/theme/app_theme.dart';
import 'presentation/providers/theme_provider.dart';
import 'presentation/providers/locale_provider.dart';
import 'presentation/providers/notification_initializer.dart';

class MarocLocApp extends ConsumerWidget {
  const MarocLocApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);
    final themeMode = ref.watch(themeProvider);
    final locale = ref.watch(localeProvider);
    final isArabic = locale.languageCode == 'ar';

    return MaterialApp.router(
      title: Localizations.of<AppLocalizations>(context, AppLocalizations)
              ?.appName ??
          'MAROC-LOC',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme(isArabic),
      darkTheme: AppTheme.darkTheme(isArabic),
      themeMode: themeMode,
      locale: locale,
      routerConfig: router,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [
        Locale('fr'),
        Locale('en'),
        Locale('ar'),
      ],
      localeResolutionCallback: (locale, supportedLocales) {
        if (locale == null) return const Locale('fr');
        for (final supported in supportedLocales) {
          if (supported.languageCode == locale.languageCode) {
            return supported;
          }
        }
        return const Locale('fr');
      },
      builder: (context, child) {
        final mediaQuery = MediaQuery.of(context);
        // Allow the system text scale up to 2.0 so users with accessibility
        // settings can read content comfortably. Values below 0.8 are still
        // clamped to avoid unreadably small text.
        final scale = mediaQuery.textScaler.clamp(
          minScaleFactor: 0.8,
          maxScaleFactor: 2.0,
        );
        final isRtl = Localizations.localeOf(context).languageCode == 'ar';
        return Directionality(
          textDirection: isRtl ? TextDirection.rtl : TextDirection.ltr,
          child: MediaQuery(
            data: mediaQuery.copyWith(textScaler: scale),
            child: NotificationInitializer(child: child!),
          ),
        );
      },
    );
  }
}
