import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:marocloc_mobile/app.dart';

void main() {
  testWidgets('App launches smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: MarocLocApp()));
    expect(find.byType(MaterialApp), findsOneWidget);
    // Let the splash screen navigation timer complete so no timer is left
    // pending when the test ends.
    await tester.pump(const Duration(seconds: 4));
  });
}
