import 'package:flutter/material.dart';

/// RTL helper utilities for multilingual support
class RtlHelper {
  RtlHelper._();

  static const List<String> rtlLanguages = ['ar'];

  static bool isRTL(String languageCode) {
    return rtlLanguages.contains(languageCode);
  }

  static TextDirection getTextDirection(String languageCode) {
    return isRTL(languageCode) ? TextDirection.rtl : TextDirection.ltr;
  }

  static TextAlign getTextAlign(String languageCode) {
    return isRTL(languageCode) ? TextAlign.right : TextAlign.left;
  }

  static EdgeInsets flipPaddingIfNeeded(
      EdgeInsets padding, String languageCode) {
    if (!isRTL(languageCode)) return padding;
    return EdgeInsets.fromLTRB(
      padding.right,
      padding.top,
      padding.left,
      padding.bottom,
    );
  }

  static Alignment getAlignment(String languageCode) {
    return isRTL(languageCode) ? Alignment.centerRight : Alignment.centerLeft;
  }

  static CrossAxisAlignment getCrossAxisAlignment(String languageCode) {
    return isRTL(languageCode)
        ? CrossAxisAlignment.end
        : CrossAxisAlignment.start;
  }
}

/// Widget that automatically adapts to RTL
class RtlAdaptive extends StatelessWidget {
  final String languageCode;
  final Widget child;

  const RtlAdaptive({
    super.key,
    required this.languageCode,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: RtlHelper.getTextDirection(languageCode),
      child: child,
    );
  }
}
