import 'dart:math';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/theme_extensions.dart';
import '../../core/design_system/components/app_button.dart';
import '../../core/design_system/components/app_card.dart';
import '../../core/design_system/components/app_input.dart';
import '../../core/design_system/tokens/app_tokens.dart';
import '../../core/utils/formatters.dart';
import '../../generated/l10n/app_localizations.dart';

class MortgageCalculatorPage extends StatefulWidget {
  const MortgageCalculatorPage({super.key});

  @override
  State<MortgageCalculatorPage> createState() => _MortgageCalculatorPageState();
}

class _MortgageCalculatorPageState extends State<MortgageCalculatorPage> {
  final _priceController = TextEditingController();
  final _downPaymentController = TextEditingController();
  final _rateController = TextEditingController();
  final _termController = TextEditingController();

  double? _loanAmount;
  double? _monthlyPayment;
  double? _totalInterest;
  double? _totalCost;

  @override
  void dispose() {
    _priceController.dispose();
    _downPaymentController.dispose();
    _rateController.dispose();
    _termController.dispose();
    super.dispose();
  }

  void _calculate() {
    final price =
        double.tryParse(_priceController.text.replaceAll(',', '.')) ?? 0;
    final downPayment =
        double.tryParse(_downPaymentController.text.replaceAll(',', '.')) ?? 0;
    final annualRate =
        double.tryParse(_rateController.text.replaceAll(',', '.')) ?? 0;
    final termYears = int.tryParse(_termController.text) ?? 0;

    if (price <= 0 || annualRate < 0 || termYears <= 0) return;

    final loanAmount = price - downPayment;
    if (loanAmount <= 0) return;

    final monthlyRate = annualRate / 100 / 12;
    final termMonths = termYears * 12;

    double monthlyPayment;
    if (monthlyRate == 0) {
      monthlyPayment = loanAmount / termMonths;
    } else {
      monthlyPayment =
          (loanAmount * monthlyRate) / (1 - pow(1 + monthlyRate, -termMonths));
    }

    final totalInterest = monthlyPayment * termMonths - loanAmount;
    final totalCost = price + totalInterest;

    setState(() {
      _loanAmount = loanAmount;
      _monthlyPayment = monthlyPayment;
      _totalInterest = totalInterest;
      _totalCost = totalCost;
    });
  }

  String _formatCurrency(double value) {
    return formatPrice(context, value, decimals: 2);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Scaffold(
      backgroundColor: context.backgroundColor,
      appBar: AppBar(
        title: Text(l10n.mortgage_title),
        backgroundColor: AppTheme.primary500,
        foregroundColor: AppTokens.gray50,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Inputs
              AppCard(
                child: Column(
                  children: [
                    AppInput(
                      label: l10n.mortgage_price,
                      hint: '1 000 000',
                      controller: _priceController,
                      keyboardType:
                          const TextInputType.numberWithOptions(decimal: true),
                      prefixIcon: const Icon(Icons.home_outlined,
                          color: AppTheme.primary500),
                    ),
                    const SizedBox(height: 16),
                    AppInput(
                      label: l10n.mortgage_down_payment,
                      hint: '200 000',
                      controller: _downPaymentController,
                      keyboardType:
                          const TextInputType.numberWithOptions(decimal: true),
                      prefixIcon: const Icon(Icons.savings_outlined,
                          color: AppTheme.primary500),
                    ),
                    const SizedBox(height: 16),
                    AppInput(
                      label: l10n.mortgage_rate,
                      hint: '5,5',
                      controller: _rateController,
                      keyboardType:
                          const TextInputType.numberWithOptions(decimal: true),
                      prefixIcon:
                          const Icon(Icons.percent, color: AppTheme.primary500),
                    ),
                    const SizedBox(height: 16),
                    AppInput(
                      label: l10n.mortgage_term,
                      hint: '20',
                      controller: _termController,
                      keyboardType: TextInputType.number,
                      prefixIcon: const Icon(Icons.calendar_today_outlined,
                          color: AppTheme.primary500),
                    ),
                    const SizedBox(height: 24),
                    AppButton(
                      label: l10n.mortgage_calculate,
                      variant: AppButtonVariant.primary,
                      fullWidth: true,
                      onPressed: _calculate,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              // Results
              if (_monthlyPayment != null) ...[
                Text(
                  l10n.mortgage_results,
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: context.textPrimary,
                  ),
                ),
                const SizedBox(height: 12),
                _ResultCard(
                  label: l10n.mortgage_loan_amount,
                  value: _formatCurrency(_loanAmount!),
                  icon: Icons.account_balance_outlined,
                  color: AppTheme.primary500,
                ),
                const SizedBox(height: 12),
                _ResultCard(
                  label: l10n.mortgage_monthly_payment,
                  value: _formatCurrency(_monthlyPayment!),
                  icon: Icons.payments_outlined,
                  color: AppTheme.gold500,
                ),
                const SizedBox(height: 12),
                _ResultCard(
                  label: l10n.mortgage_total_interest,
                  value: _formatCurrency(_totalInterest!),
                  icon: Icons.trending_up_outlined,
                  color: AppTheme.terracotta500,
                ),
                const SizedBox(height: 12),
                _ResultCard(
                  label: l10n.mortgage_total_cost,
                  value: _formatCurrency(_totalCost!),
                  icon: Icons.calculate_outlined,
                  color: AppTheme.atlas500,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _ResultCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  const _ResultCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(AppTokens.radiusMd),
            ),
            child: Icon(icon, color: color),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: context.textSecondary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: context.textPrimary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
