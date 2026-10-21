import 'dart:math';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/theme_extensions.dart';
import '../../generated/l10n/app_localizations.dart';
import '../../services/payment_service.dart';

/// Entry point for a CMI payment.
///
/// Initiates the payment with the backend, receives the signed CMI form
/// parameters, then hands them off to [CmiWebViewPage] which performs the
/// actual POST redirect to the CMI gateway.
class CmiPaymentPage extends StatefulWidget {
  final double amount;
  final String description;
  final String? orderId;
  final int? advertisementId;
  final int? propertyId;
  final String? transactionType;
  final String? email;

  const CmiPaymentPage({
    super.key,
    required this.amount,
    required this.description,
    this.orderId,
    this.advertisementId,
    this.propertyId,
    this.transactionType,
    this.email,
  });

  @override
  State<CmiPaymentPage> createState() => _CmiPaymentPageState();
}

class _CmiPaymentPageState extends State<CmiPaymentPage> {
  bool _isLoading = true;
  String? _error;

  static const String _gatewayUrl = 'https://payment.cmi.co.ma/fim/est3Dgate';

  @override
  void initState() {
    super.initState();
    Future.microtask(() => _initiate());
  }

  String _generateOrderId() {
    if (widget.orderId != null && widget.orderId!.isNotEmpty) {
      return widget.orderId!;
    }
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final random = Random.secure().nextInt(999999).toString().padLeft(6, '0');
    return 'MAROCLOC-$timestamp-$random';
  }

  Future<void> _initiate() async {
    final orderId = _generateOrderId();
    try {
      final locale = Localizations.localeOf(context).languageCode;
      final params = await PaymentService().initiateCmiPayment(
        orderId: orderId,
        amount: widget.amount,
        advertisementId: widget.advertisementId,
        propertyId: widget.propertyId,
        transactionType: widget.transactionType,
        email: widget.email,
        lang: locale,
        currency: '504',
      );

      if (!mounted) return;

      if (params['hash'] == null || params['hash'].toString().isEmpty) {
        setState(() {
          _isLoading = false;
          _error = AppLocalizations.of(context).payment_error_invalid_response;
        });
        return;
      }

      // Forward everything to the WebView which will auto-submit the CMI form.
      if (context.mounted) {
        context.pushReplacement(
          '/payment/cmi/webview',
          extra: <String, dynamic>{
            'gatewayUrl': _gatewayUrl,
            'params': params,
            'orderId': orderId,
          },
        );
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _error =
            '${AppLocalizations.of(context).payment_error_initiation}: ${e.toString()}';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      backgroundColor: context.backgroundColor,
      appBar: AppBar(
        title: Text(l10n.payment_cmi_title),
        backgroundColor: colorScheme.primary,
        foregroundColor: colorScheme.onPrimary,
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: _isLoading
              ? Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const CircularProgressIndicator(),
                    const SizedBox(height: 24),
                    Text(
                      l10n.payment_cmi_connecting,
                      style: TextStyle(
                        fontSize: 16,
                        color: context.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      widget.description,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 14,
                        color: context.textMuted,
                      ),
                    ),
                  ],
                )
              : _error != null
                  ? Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.error_outline,
                            size: 56, color: colorScheme.error),
                        const SizedBox(height: 16),
                        Text(
                          _error!,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 16,
                            color: context.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 24),
                        ElevatedButton(
                          onPressed: () {
                            setState(() {
                              _isLoading = true;
                              _error = null;
                            });
                            _initiate();
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: colorScheme.primary,
                            foregroundColor: colorScheme.onPrimary,
                          ),
                          child: Text(l10n.retry),
                        ),
                        const SizedBox(height: 12),
                        TextButton(
                          onPressed: () => context.pop(),
                          child: Text(l10n.cancel),
                        ),
                      ],
                    )
                  : const SizedBox.shrink(),
        ),
      ),
    );
  }
}
