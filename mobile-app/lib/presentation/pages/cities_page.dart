import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/theme/theme_extensions.dart';
import '../../core/theme/app_theme.dart';
import '../../core/design_system/components/app_shimmer.dart';
import '../../generated/l10n/app_localizations.dart';
import '../providers/city_provider.dart';
import '../providers/property_provider.dart';

import '../../core/design_system/tokens/app_tokens.dart';

class CitiesPage extends ConsumerStatefulWidget {
  const CitiesPage({super.key});

  @override
  ConsumerState<CitiesPage> createState() => _CitiesPageState();
}

class _CitiesPageState extends ConsumerState<CitiesPage> {
  static const _gradients = [
    [AppTokens.primary500, AppTokens.emerald600],
    [AppTokens.info500, AppTokens.indigo500],
    [AppTokens.warning500, AppTokens.orange500],
    [AppTokens.rose500, AppTokens.pink500],
    [AppTokens.violet500, AppTokens.purple500],
    [AppTokens.cyan500, AppTokens.info500],
    [AppTokens.emerald500, AppTokens.primary500],
    [AppTokens.fuchsia500, AppTokens.rose500],
  ];

  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(cityProvider.notifier).loadCities());
  }

  Future<void> _onRefresh() async {
    await ref.read(cityProvider.notifier).loadCities();
  }

  @override
  Widget build(BuildContext context) {
    final cityState = ref.watch(cityProvider);

    return Scaffold(
      backgroundColor: context.backgroundColor,
      appBar: AppBar(
        title: Text(AppLocalizations.of(context).cities_title),
        backgroundColor: context.backgroundColor,
        foregroundColor: context.textPrimary,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _onRefresh,
        color: AppTheme.primary500,
        backgroundColor: Theme.of(context).colorScheme.surface,
        child: _buildBody(cityState),
      ),
    );
  }

  Widget _buildBody(CityState cityState) {
    if (cityState.isLoading && cityState.cities.isEmpty) {
      return GridView.builder(
        padding: const EdgeInsets.all(16),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          childAspectRatio: 0.85,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
        ),
        itemCount: 6,
        itemBuilder: (_, __) => const _CityCardShimmer(),
      );
    }

    if (cityState.error != null && cityState.cities.isEmpty) {
      return LayoutBuilder(
        builder: (context, constraints) {
          return SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            child: ConstrainedBox(
              constraints: BoxConstraints(minHeight: constraints.maxHeight),
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.error_outline,
                        size: 48, color: context.textMuted),
                    const SizedBox(height: 16),
                    Text(
                      cityState.error!,
                      textAlign: TextAlign.center,
                      style:
                          TextStyle(color: context.textSecondary, fontSize: 16),
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () =>
                          ref.read(cityProvider.notifier).loadCities(),
                      child: Text(AppLocalizations.of(context).retry),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      );
    }

    if (cityState.cities.isEmpty) {
      return LayoutBuilder(
        builder: (context, constraints) {
          return SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            child: ConstrainedBox(
              constraints: BoxConstraints(minHeight: constraints.maxHeight),
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.location_city,
                        size: 64, color: context.textMuted),
                    const SizedBox(height: 16),
                    Text(
                      AppLocalizations.of(context).cities_empty,
                      style:
                          TextStyle(color: context.textSecondary, fontSize: 16),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      );
    }

    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.85,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
      ),
      itemCount: cityState.cities.length,
      itemBuilder: (context, index) {
        final city = cityState.cities[index];
        return _CityCard(
          city: city,
          gradient: _gradients[index % _gradients.length],
          onTap: () {
            ref.read(propertyProvider.notifier).search(city: city.name);
            context.go('/search');
          },
        );
      },
    );
  }
}

class _CityCard extends StatelessWidget {
  final CityStat city;
  final List<Color> gradient;
  final VoidCallback onTap;

  const _CityCard({
    required this.city,
    required this.gradient,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final initials = city.name
        .split(' ')
        .map((w) => w.isNotEmpty ? w[0] : '')
        .join('')
        .substring(0, 2)
        .toUpperCase();

    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: context.cardColor,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color:
                  Theme.of(context).colorScheme.shadow.withValues(alpha: 0.05),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              flex: 3,
              child: city.image != null && city.image!.isNotEmpty
                  ? CachedNetworkImage(
                      imageUrl: city.image!,
                      fit: BoxFit.cover,
                      width: double.infinity,
                      placeholder: (_, __) => const AppShimmer(
                          width: double.infinity,
                          height: double.infinity,
                          borderRadius: 0),
                      errorWidget: (_, __, ___) => _GradientFallback(
                          initials: initials, gradient: gradient),
                    )
                  : _GradientFallback(initials: initials, gradient: gradient),
            ),
            Expanded(
              flex: 2,
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      city.name,
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: context.textPrimary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${city.propertyCount} biens',
                      style: TextStyle(
                        fontSize: 12,
                        color: context.textSecondary,
                      ),
                    ),
                    if (city.averagePrice != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        '${city.averagePrice!.toStringAsFixed(0)} DH moy.',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.primary500,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _GradientFallback extends StatelessWidget {
  final String initials;
  final List<Color> gradient;

  const _GradientFallback({required this.initials, required this.gradient});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: gradient,
          begin: AlignmentDirectional.topStart,
          end: AlignmentDirectional.bottomEnd,
        ),
      ),
      child: Center(
        child: Text(
          initials,
          style: TextStyle(
            fontSize: 32,
            fontWeight: FontWeight.w900,
            color: AppTokens.gray50.withValues(alpha: 0.7),
          ),
        ),
      ),
    );
  }
}

class _CityCardShimmer extends StatelessWidget {
  const _CityCardShimmer();

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: context.cardColor,
        borderRadius: BorderRadius.circular(16),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          Expanded(
            flex: 3,
            child: const AppShimmer(
                width: double.infinity,
                height: double.infinity,
                borderRadius: 0),
          ),
          Expanded(
            flex: 2,
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const AppShimmer(width: 100, height: 16, borderRadius: 2),
                  const SizedBox(height: 8),
                  AppShimmer(width: 80, height: 12, borderRadius: 2),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
