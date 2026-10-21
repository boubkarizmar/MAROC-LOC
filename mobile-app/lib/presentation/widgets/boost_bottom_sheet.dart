import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/design_system/components/app_button.dart';
import '../../core/design_system/tokens/app_tokens.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/theme_extensions.dart';
import '../../core/utils/formatters.dart';
import '../../generated/l10n/app_localizations.dart';
import '../../presentation/providers/auth_provider.dart';

class BoostBottomSheet extends ConsumerStatefulWidget {
  final int propertyId;
  final String propertyTitle;

  const BoostBottomSheet({
    super.key,
    required this.propertyId,
    required this.propertyTitle,
  });

  @override
  ConsumerState<BoostBottomSheet> createState() => _BoostBottomSheetState();
}

class _BoostBottomSheetState extends ConsumerState<BoostBottomSheet> {
  String _selectedBoostType = 'top';
  int _selectedDuration = 7;

  Map<String, Map<String, dynamic>> _boostOptions(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return {
      'featured': {
        'label': l10n.boost_type_featured,
        'icon': Icons.star,
        'basePrice': 100,
        'color': AppTheme.gold500,
      },
      'top': {
        'label': l10n.boost_type_top,
        'icon': Icons.trending_up,
        'basePrice': 50,
        'color': AppTheme.primary500,
      },
      'banner': {
        'label': l10n.boost_type_banner,
        'icon': Icons.campaign,
        'basePrice': 200,
        'color': AppTheme.terracotta500,
      },
    };
  }

  List<Map<String, dynamic>> _durations(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return [
      {'days': 7, 'label': l10n.duration_days(7), 'multiplier': 1.0},
      {'days': 14, 'label': l10n.duration_days(14), 'multiplier': 1.5},
      {'days': 30, 'label': l10n.duration_days(30), 'multiplier': 2.0},
    ];
  }

  double get _price {
    final options = _boostOptions(context);
    final durations = _durations(context);
    final option = options[_selectedBoostType]!;
    final duration =
        durations.firstWhere((d) => d['days'] == _selectedDuration);
    return (option['basePrice'] as int) * (duration['multiplier'] as double);
  }

  Future<void> _onPayAndBoost() async {
    final options = _boostOptions(context);
    final label = options[_selectedBoostType]!['label'] as String;
    final orderId =
        'BOOST-${widget.propertyId}-${DateTime.now().millisecondsSinceEpoch}';
    final auth = ref.read(authProvider);

    if (!mounted) return;
    Navigator.of(context).pop();

    context.push(
      '/payment/cmi',
      extra: <String, dynamic>{
        'amount': _price,
        'description': '$label — ${widget.propertyTitle}',
        'orderId': orderId,
        'email': auth.user?.email,
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final boostOptions = _boostOptions(context);
    final durations = _durations(context);
    return Padding(
      padding: EdgeInsetsDirectional.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
        start: AppTokens.space4,
        end: AppTokens.space4,
        top: AppTokens.space4,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: AppTokens.space4),
                decoration: BoxDecoration(
                  color: context.borderColor,
                  borderRadius: BorderRadius.circular(AppTokens.radiusFull),
                ),
              ),
            ),
            Row(
              children: [
                Icon(Icons.rocket_launch, color: AppTheme.gold500, size: 28),
                const SizedBox(width: AppTokens.space3),
                Text(
                  l10n.boost_title,
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: context.textPrimary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppTokens.space2),
            Text(
              widget.propertyTitle,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 14,
                color: context.textSecondary,
              ),
            ),
            const SizedBox(height: AppTokens.space5),
            Text(
              l10n.boost_type_label,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: context.textPrimary,
              ),
            ),
            const SizedBox(height: AppTokens.space3),
            ...boostOptions.entries.map((entry) {
              final isSelected = _selectedBoostType == entry.key;
              final option = entry.value;
              return Padding(
                padding: const EdgeInsets.only(bottom: AppTokens.space2),
                child: Semantics(
                  button: true,
                  selected: isSelected,
                  label:
                      '${option['label']}, ${l10n.boost_per_week((option['basePrice'] as int).toStringAsFixed(0), l10n.property_currency)}',
                  child: InkWell(
                    onTap: () => setState(() => _selectedBoostType = entry.key),
                    borderRadius: BorderRadius.circular(AppTokens.radiusMd),
                    child: Container(
                      padding: const EdgeInsets.all(AppTokens.space3),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? (option['color'] as Color).withValues(alpha: 0.1)
                            : context.cardColor,
                        borderRadius: BorderRadius.circular(AppTokens.radiusMd),
                        border: Border.all(
                          color: isSelected
                              ? option['color'] as Color
                              : context.borderColor,
                          width: isSelected ? 2 : 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            option['icon'] as IconData,
                            color: option['color'] as Color,
                            size: 24,
                          ),
                          const SizedBox(width: AppTokens.space3),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  option['label'] as String,
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700,
                                    color: context.textPrimary,
                                  ),
                                ),
                                Text(
                                  l10n.boost_per_week(
                                      (option['basePrice'] as int)
                                          .toStringAsFixed(0),
                                      l10n.property_currency),
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: context.textMuted,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          if (isSelected)
                            Icon(Icons.check_circle,
                                color: option['color'] as Color),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            }),
            const SizedBox(height: AppTokens.space5),
            Text(
              l10n.boost_duration,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: context.textPrimary,
              ),
            ),
            const SizedBox(height: AppTokens.space3),
            Row(
              children: durations.map((duration) {
                final isSelected = _selectedDuration == duration['days'] as int;
                return Expanded(
                  child: Padding(
                    padding:
                        const EdgeInsetsDirectional.only(end: AppTokens.space2),
                    child: Semantics(
                      button: true,
                      selected: isSelected,
                      label: duration['label'] as String,
                      child: InkWell(
                        onTap: () => setState(
                            () => _selectedDuration = duration['days'] as int),
                        borderRadius: BorderRadius.circular(AppTokens.radiusMd),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            vertical: AppTokens.space3,
                          ),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? AppTheme.primary500.withValues(alpha: 0.1)
                                : context.cardColor,
                            borderRadius:
                                BorderRadius.circular(AppTokens.radiusMd),
                            border: Border.all(
                              color: isSelected
                                  ? AppTheme.primary500
                                  : context.borderColor,
                              width: isSelected ? 2 : 1,
                            ),
                          ),
                          child: Column(
                            children: [
                              Text(
                                duration['label'] as String,
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                  color: isSelected
                                      ? AppTheme.primary500
                                      : context.textPrimary,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'x${(duration['multiplier'] as double).toStringAsFixed(1)}',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: context.textMuted,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: AppTokens.space5),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(AppTokens.space4),
              decoration: BoxDecoration(
                color: AppTheme.gold50.withValues(alpha: 0.5),
                borderRadius: BorderRadius.circular(AppTokens.radiusMd),
                border: Border.all(color: AppTheme.gold200),
              ),
              child: Column(
                children: [
                  Text(
                    l10n.boost_total,
                    style: TextStyle(
                      fontSize: 14,
                      color: context.textSecondary,
                    ),
                  ),
                  const SizedBox(height: AppTokens.space1),
                  Text(
                    formatPrice(context, _price),
                    style: const TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.gold600,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppTokens.space5),
            AppButton(
              label: l10n.boost_pay_and_boost,
              variant: AppButtonVariant.gold,
              fullWidth: true,
              leading: const Icon(Icons.rocket_launch,
                  size: 18, color: AppTheme.gray900),
              onPressed: _onPayAndBoost,
            ),
            const SizedBox(height: AppTokens.space5),
          ],
        ),
      ),
    );
  }
}

/// Opens the boost bottom sheet for the given property.
void showBoostBottomSheet(
  BuildContext context, {
  required int propertyId,
  required String propertyTitle,
}) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Theme.of(context).scaffoldBackgroundColor,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(
        top: Radius.circular(AppTokens.radiusLg),
      ),
    ),
    builder: (_) => BoostBottomSheet(
      propertyId: propertyId,
      propertyTitle: propertyTitle,
    ),
  );
}
