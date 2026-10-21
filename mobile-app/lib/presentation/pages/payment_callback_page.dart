import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/theme_extensions.dart';
import '../../core/theme/app_theme.dart';
import '../../generated/l10n/app_localizations.dart';
import '../../services/payment_service.dart';

import '../../core/design_system/tokens/app_tokens.dart';

class PaymentCallbackPage extends ConsumerStatefulWidget {
  const PaymentCallbackPage({super.key});

  @override
  ConsumerState<PaymentCallbackPage> createState() =>
      _PaymentCallbackPageState();
}

class _PaymentCallbackPageState extends ConsumerState<PaymentCallbackPage> {
  bool _isLoading = true;
  bool? _success;
  String? _message;
  String? _orderId;

  @override
  void initState() {
    super.initState();
    Future.microtask(() => _processCallback());
  }

  Future<void> _processCallback() async {
    final uri = GoRouterState.of(context).uri;
    final status = uri.queryParameters['status'];
    final orderId = uri.queryParameters['orderId'];

    setState(() => _orderId = orderId);

    if (orderId != null && orderId.isNotEmpty) {
      try {
        final result = await PaymentService().getPaymentStatus(orderId);
        final paymentStatus = result['status']?.toString().toUpperCase() ?? '';
        final isSuccess = paymentStatus == 'PAID' ||
            paymentStatus == 'SUCCESS' ||
            paymentStatus == 'COMPLETED';

        if (mounted) {
          setState(() {
            _isLoading = false;
            _success = isSuccess;
            _message = result['message']?.toString() ??
                (isSuccess
                    ? AppLocalizations.of(context).payment_success
                    : AppLocalizations.of(context).payment_failed);
          });
        }
        return;
      } catch (_) {
        // Fall back to query param status.
      }
    }

    final isSuccess = status?.toUpperCase() == 'SUCCESS' ||
        status?.toUpperCase() == 'COMPLETED';
    if (mounted) {
      setState(() {
        _isLoading = false;
        _success = isSuccess;
        _message = isSuccess
            ? AppLocalizations.of(context).payment_success
            : AppLocalizations.of(context).payment_failed;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.backgroundColor,
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: _buildContent(),
          ),
        ),
      ),
    );
  }

  Widget _buildContent() {
    final l10n = AppLocalizations.of(context);
    if (_isLoading) {
      return Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(),
          const SizedBox(height: 24),
          Text(
            l10n.payment_verifying,
            style: const TextStyle(fontSize: 16),
          ),
        ],
      );
    }

    final isSuccess = _success == true;

    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            color: isSuccess ? AppTheme.success50 : AppTheme.error50,
            shape: BoxShape.circle,
          ),
          child: Icon(
            isSuccess ? Icons.check_circle : Icons.error,
            size: 48,
            color: isSuccess ? AppTheme.success500 : AppTheme.error500,
          ),
        ),
        const SizedBox(height: 24),
        Text(
          isSuccess ? l10n.payment_success : l10n.payment_failed,
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w800,
            color: context.textPrimary,
          ),
        ),
        const SizedBox(height: 12),
        Text(
          _message ?? '',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 14,
            color: context.textSecondary,
          ),
        ),
        if (_orderId != null) ...[
          const SizedBox(height: 12),
          Text(
            l10n.payment_order_label(_orderId!),
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 12,
              color: context.textMuted,
              fontFamily: 'monospace',
            ),
          ),
        ],
        const SizedBox(height: 32),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: () => context.go('/home'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primary500,
              foregroundColor: AppTokens.gray50,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: Text(
              l10n.payment_back_home,
              style: TextStyle(fontWeight: FontWeight.w700),
            ),
          ),
        ),
        if (!isSuccess) ...[
          const SizedBox(height: 12),
          TextButton(
            onPressed: () => context.pop(),
            child: Text(l10n.retry),
          ),
        ],
      ],
    );
  }
}
