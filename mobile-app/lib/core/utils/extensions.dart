import 'package:intl/intl.dart';

extension StringExtension on String {
  String capitalize() {
    if (isEmpty) return this;
    return '${this[0].toUpperCase()}${substring(1)}';
  }
}

extension DateTimeExtension on DateTime {
  String formatDate() {
    return DateFormat('dd/MM/yyyy').format(this);
  }

  String formatDateTime() {
    return DateFormat('dd/MM/yyyy HH:mm').format(this);
  }
}

extension CurrencyExtension on num {
  String formatMAD() {
    final formatter = NumberFormat.currency(
      locale: 'fr_MA',
      symbol: 'MAD',
      decimalDigits: 0,
    );
    return formatter.format(this);
  }
}
