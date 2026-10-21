import 'package:flutter/material.dart';
import '../../generated/l10n/app_localizations.dart';

/// Formats a price with the localized currency label.
///
/// Example (fr): `2500 MAD`
/// Example (ar): `2500 درهم`
String formatPrice(
  BuildContext context,
  double value, {
  bool compact = false,
  int decimals = 0,
}) {
  final l10n = AppLocalizations.of(context);
  final currency = l10n.property_currency;
  final number =
      compact ? _compactNumber(value) : value.toStringAsFixed(decimals);
  return '$number $currency';
}

/// Formats a surface/area with the localized unit.
///
/// Example (fr): `120 m²`
/// Example (ar): `120 م²`
String formatArea(BuildContext context, double value) {
  final l10n = AppLocalizations.of(context);
  final unit = l10n.unit_area;
  return '${value.toStringAsFixed(0)} $unit';
}

String _compactNumber(double value) {
  if (value >= 1000000) {
    return '${(value / 1000000).toStringAsFixed(1)}M';
  } else if (value >= 1000) {
    return '${(value / 1000).toStringAsFixed(0)}K';
  }
  return value.toStringAsFixed(0);
}
