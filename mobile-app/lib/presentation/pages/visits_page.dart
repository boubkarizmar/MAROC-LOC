import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/theme_extensions.dart';
import '../../data/models/property_visit_model.dart';
import '../../generated/l10n/app_localizations.dart';
import '../providers/auth_provider.dart';
import '../providers/visit_provider.dart';

import '../../core/design_system/tokens/app_tokens.dart';

class VisitsPage extends ConsumerStatefulWidget {
  const VisitsPage({super.key});

  @override
  ConsumerState<VisitsPage> createState() => _VisitsPageState();
}

class _VisitsPageState extends ConsumerState<VisitsPage> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(visitProvider.notifier).loadMyVisits();
    });
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'PENDING':
        return AppLocalizations.of(context).visits_status_pending;
      case 'CONFIRMED':
        return AppLocalizations.of(context).visits_status_confirmed;
      case 'COMPLETED':
        return AppLocalizations.of(context).visits_status_completed;
      case 'CANCELLED':
        return AppLocalizations.of(context).visits_status_cancelled;
      default:
        return status;
    }
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'PENDING':
        return AppTheme.warning500;
      case 'CONFIRMED':
        return AppTheme.success500;
      case 'COMPLETED':
        return AppTheme.primary500;
      case 'CANCELLED':
        return AppTheme.error500;
      default:
        return AppTheme.gray400;
    }
  }

  @override
  Widget build(BuildContext context) {
    final visitState = ref.watch(visitProvider);
    final isOwner = ref.watch(authProvider).isProprietaire;

    return Scaffold(
      backgroundColor: context.backgroundColor,
      appBar: AppBar(
        title: Text(AppLocalizations.of(context).visits_title),
        backgroundColor: context.backgroundColor,
        foregroundColor: context.textPrimary,
        elevation: 0,
      ),
      body: _buildBody(visitState, isOwner),
    );
  }

  Widget _buildBody(VisitState visitState, bool isOwner) {
    if (visitState.isLoading && visitState.visits.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (visitState.error != null && visitState.visits.isEmpty) {
      return LayoutBuilder(
        builder: (context, constraints) {
          return SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            child: ConstrainedBox(
              constraints: BoxConstraints(minHeight: constraints.maxHeight),
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.error_outline,
                          size: 48, color: context.textMuted),
                      const SizedBox(height: 16),
                      Text(
                        visitState.error!,
                        textAlign: TextAlign.center,
                        style: TextStyle(
                            color: context.textSecondary, fontSize: 16),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () {
                          ref.read(visitProvider.notifier).loadMyVisits();
                        },
                        child: Text(AppLocalizations.of(context).retry),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      );
    }

    if (visitState.visits.isEmpty) {
      return _buildEmptyState();
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: visitState.visits.length,
      itemBuilder: (context, index) {
        final visit = visitState.visits[index];
        return _buildVisitCard(visit, isOwner);
      },
    );
  }

  Widget _buildVisitCard(PropertyVisitModel visit, bool isOwner) {
    final showActions = isOwner && visit.status == 'PENDING';

    return Card(
      color: context.cardColor,
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        visit.propertyTitle ?? 'Property',
                        style: TextStyle(
                          color: context.textPrimary,
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${visit.visitDate ?? ''} ${visit.visitTime ?? ''}',
                        style: TextStyle(
                          color: context.textSecondary,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
                Chip(
                  label: Text(
                    _statusLabel(visit.status),
                    style: const TextStyle(
                      color: AppTokens.gray50,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  backgroundColor: _statusColor(visit.status),
                  padding: EdgeInsets.zero,
                  materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
              ],
            ),
            if (showActions) ...[
              const SizedBox(height: 12),
              const Divider(height: 1),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  OutlinedButton(
                    onPressed: () {
                      ref.read(visitProvider.notifier).cancelVisit(visit.id);
                    },
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppTheme.error500,
                      side: const BorderSide(color: AppTheme.error500),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 8),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                      ),
                    ),
                    child: Text(AppLocalizations.of(context).cancel),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    onPressed: () {
                      ref.read(visitProvider.notifier).confirmVisit(visit.id);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.success500,
                      foregroundColor: AppTokens.gray50,
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 8),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                      ),
                    ),
                    child: Text(AppLocalizations.of(context).confirm),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.calendar_today, size: 64, color: context.textMuted),
          const SizedBox(height: 16),
          Text(
            AppLocalizations.of(context).visits_empty,
            style: TextStyle(color: context.textSecondary, fontSize: 16),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () {
              ref.read(visitProvider.notifier).loadMyVisits();
            },
            child: Text(AppLocalizations.of(context).visits_schedule),
          ),
        ],
      ),
    );
  }
}
