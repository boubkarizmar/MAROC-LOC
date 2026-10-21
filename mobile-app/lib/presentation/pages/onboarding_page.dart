import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import '../../core/design_system/components/app_logo.dart';
import '../../generated/l10n/app_localizations.dart';

import '../../core/design_system/tokens/app_tokens.dart';

class OnboardingPage extends StatelessWidget {
  const OnboardingPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              AppLogo.onboarding(),
              const SizedBox(height: 32),
              Text(
                AppLocalizations.of(context).onboarding_welcome_title,
                style:
                    const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              Text(
                AppLocalizations.of(context).onboarding_welcome_desc,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 48),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => context.go('/home'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primary500,
                    foregroundColor: AppTokens.gray50,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: Text(AppLocalizations.of(context).onboarding_start),
                ),
              ),
              const SizedBox(height: 12),
              TextButton(
                onPressed: () => context.go('/home'),
                child: Text(AppLocalizations.of(context).onboarding_skip),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
