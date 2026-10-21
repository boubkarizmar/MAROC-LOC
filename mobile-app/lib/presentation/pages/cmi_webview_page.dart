import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../../core/theme/theme_extensions.dart';
import '../../generated/l10n/app_localizations.dart';

/// Displays the CMI gateway in a WebView.
///
/// Because CMI expects a real HTML form POST (not a fetch/XHR call), we build
/// an invisible form with the signed parameters returned by the backend and
/// auto-submit it via JavaScript. We then intercept navigation to the backend
/// callback URLs to determine whether the payment succeeded or failed.
class CmiWebViewPage extends StatefulWidget {
  final String gatewayUrl;
  final Map<String, dynamic> params;
  final String orderId;

  const CmiWebViewPage({
    super.key,
    required this.gatewayUrl,
    required this.params,
    required this.orderId,
  });

  @override
  State<CmiWebViewPage> createState() => _CmiWebViewPageState();
}

class _CmiWebViewPageState extends State<CmiWebViewPage> {
  late final WebViewController _controller;
  bool _isLoading = true;

  static const String _successPath = '/v1/payments/cmi/callback/success';
  static const String _failPath = '/v1/payments/cmi/callback/fail';

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onNavigationRequest: (request) {
            final url = request.url;
            if (url.contains(_successPath)) {
              _finish(success: true);
              return NavigationDecision.prevent;
            }
            if (url.contains(_failPath)) {
              _finish(success: false);
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
          onPageStarted: (_) {
            if (mounted) setState(() => _isLoading = true);
          },
          onPageFinished: (_) {
            if (mounted) setState(() => _isLoading = false);
          },
        ),
      )
      ..loadHtmlString(_buildFormHtml());
  }

  void _finish({required bool success}) {
    final status = success ? 'success' : 'fail';
    if (mounted) {
      context
          .go('/payment/cmi/callback?status=$status&orderId=${widget.orderId}');
    }
  }

  String _escapeHtml(String value) {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
  }

  String _buildFormHtml() {
    final inputs = widget.params.entries.map((entry) {
      final name = _escapeHtml(entry.key);
      final value = _escapeHtml(entry.value.toString());
      return '<input type="hidden" name="$name" value="$value" />';
    }).join('\n');

    final gateway = _escapeHtml(widget.gatewayUrl);

    return '''
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Redirection CMI</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; text-align: center; padding: 40px; color: #666; }
      button { margin-top: 20px; padding: 12px 24px; background: #0A2463; color: white; border: none; border-radius: 8px; font-size: 16px; }
    </style>
  </head>
  <body onload="document.forms[0].submit();">
    <p>Redirection vers le centre de paiement CMI sécurisé...</p>
    <form action="$gateway" method="POST">
      $inputs
      <noscript>
        <p>Veuillez activer JavaScript ou cliquer sur le bouton ci-dessous.</p>
        <button type="submit">Continuer vers CMI</button>
      </noscript>
    </form>
  </body>
</html>
''';
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      backgroundColor: context.backgroundColor,
      appBar: AppBar(
        title: Text(l10n.payment_cmi_secure_title),
        backgroundColor: colorScheme.primary,
        foregroundColor: colorScheme.onPrimary,
        actions: [
          IconButton(
            icon: const Icon(Icons.close),
            onPressed: () => _finish(success: false),
            tooltip: l10n.payment_cancel,
          ),
        ],
      ),
      body: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_isLoading)
            Container(
              color: context.backgroundColor,
              child: const Center(child: CircularProgressIndicator()),
            ),
        ],
      ),
    );
  }
}
