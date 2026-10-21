import 'package:flutter/material.dart';
import '../../core/design_system/components/app_card.dart';
import '../../core/design_system/tokens/app_tokens.dart';
import '../../core/theme/theme_extensions.dart';
import '../../generated/l10n/app_localizations.dart';
import '../../services/property_reservation_service.dart';

class MyReservationsPage extends StatefulWidget {
  const MyReservationsPage({super.key});

  @override
  State<MyReservationsPage> createState() => _MyReservationsPageState();
}

class _MyReservationsPageState extends State<MyReservationsPage> {
  late Future<List<dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = PropertyReservationService().getMyReservations();
  }

  Color _statusColor(String status, BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    switch (status) {
      case 'PAID':
      case 'COMPLETED':
        return Colors.green;
      case 'PENDING':
        return Colors.orange;
      case 'CANCELLED':
      case 'EXPIRED':
        return colorScheme.error;
      default:
        return context.textSecondary;
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      backgroundColor: context.backgroundColor,
      appBar: AppBar(
        title: Text(l10n.my_reservations_title),
        backgroundColor: colorScheme.primary,
        foregroundColor: colorScheme.onPrimary,
      ),
      body: FutureBuilder<List<dynamic>>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(AppTokens.space6),
                child: Text(
                  l10n.common_error_with_message(snapshot.error.toString()),
                  textAlign: TextAlign.center,
                ),
              ),
            );
          }
          final reservations = snapshot.data ?? [];
          if (reservations.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(AppTokens.space6),
                child: Text(
                  l10n.my_reservations_empty,
                  textAlign: TextAlign.center,
                  style: TextStyle(color: context.textSecondary),
                ),
              ),
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.all(AppTokens.space4),
            itemCount: reservations.length,
            itemBuilder: (context, index) {
              final r = reservations[index] as Map<String, dynamic>;
              final status = r['status']?.toString() ?? 'UNKNOWN';
              final title = r['propertyTitle']?.toString() ?? l10n.property_untitled;
              final amount = (r['amount'] as num?)?.toDouble() ?? 0.0;
              final type = r['transactionType']?.toString() ?? '';
              final createdAt = r['createdAt']?.toString() ?? '';

              return Padding(
                padding: const EdgeInsets.only(bottom: AppTokens.space4),
                child: AppCard(
                  child: Padding(
                  padding: const EdgeInsets.all(AppTokens.space4),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: context.textPrimary,
                        ),
                      ),
                      const SizedBox(height: AppTokens.space2),
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              '${amount.toStringAsFixed(0)} ${r['currency'] ?? 'MAD'}',
                              style: TextStyle(
                                fontSize: 14,
                                color: context.textSecondary,
                              ),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: AppTokens.space3,
                              vertical: AppTokens.space1,
                            ),
                            decoration: BoxDecoration(
                              color: _statusColor(status, context).withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(AppTokens.radiusSm),
                            ),
                            child: Text(
                              status,
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: _statusColor(status, context),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: AppTokens.space2),
                      Text(
                        '${l10n.my_reservations_type}: $type',
                        style: TextStyle(
                          fontSize: 12,
                          color: context.textMuted,
                        ),
                      ),
                      if (createdAt.isNotEmpty)
                        Text(
                          '${l10n.my_reservations_date}: ${createdAt.substring(0, createdAt.length > 16 ? 16 : createdAt.length)}',
                          style: TextStyle(
                            fontSize: 12,
                            color: context.textMuted,
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            );
          },
          );
        },
      ),
    );
  }
}
